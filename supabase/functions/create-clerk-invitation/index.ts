// Supabase Edge Function to create Clerk invitations
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get request body
    const {
      email,
      role,
      teamType,
      projectId,
      organizationId,
      isDecisionMaker,
      invitedBy,
      metadata,
      revokeExisting = true // Option to revoke existing invitations
    } = await req.json();

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Clerk secret key from environment
    const clerkSecretKey = Deno.env.get('CLERK_SECRET_KEY');
    if (!clerkSecretKey) {
      console.error('CLERK_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get app URL for redirect
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5174';

    // Create Clerk invitation using their API
    console.log('Creating Clerk invitation for:', email);
    
    const clerkResponse = await fetch('https://api.clerk.com/v1/invitations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        public_metadata: {
          role: role || 'client',
          team_type: teamType || role || 'client',
          project_id: projectId,
          organization_id: organizationId,
          is_decision_maker: isDecisionMaker || false,
          invited_by: invitedBy,
          ...metadata
        },
        redirect_url: `${appUrl}/invitation/accept`, // Handle invitation acceptance properly
        notify: true, // Send invitation email through Clerk
        expires_in_days: 30
      }),
    });

    const clerkData = await clerkResponse.json();

    if (!clerkResponse.ok) {
      console.error('Clerk API error:', clerkData);
      
      // Handle specific Clerk errors
      if (clerkData.errors) {
        const clerkError = clerkData.errors[0];
        if (clerkError.code === 'email_address_exists') {
          return new Response(
            JSON.stringify({ error: 'A user with this email address already exists' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        if (clerkError.code === 'invitation_exists' || clerkError.message?.includes('duplicate')) {
          console.log('Invitation exists for email, attempting to handle');
          
          if (revokeExisting) {
            // Try to revoke existing invitations and create a new one
            try {
              // First, get the existing invitation
              const listResponse = await fetch(`https://api.clerk.com/v1/invitations?email_address=${email}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${clerkSecretKey}`,
                },
              });
              
              const invitations = await listResponse.json();
              
              if (invitations.data && invitations.data.length > 0) {
                // Revoke all existing invitations for this email
                for (const invitation of invitations.data) {
                  if (invitation.status === 'pending') {
                    console.log(`Revoking existing invitation: ${invitation.id}`);
                    await fetch(`https://api.clerk.com/v1/invitations/${invitation.id}/revoke`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${clerkSecretKey}`,
                      },
                    });
                  }
                }
                
                // Now try to create a new invitation
                console.log('Retrying invitation creation after revoking existing ones');
                const retryResponse = await fetch('https://api.clerk.com/v1/invitations', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${clerkSecretKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email_address: email,
                    public_metadata: {
                      role: role || 'client',
                      team_type: teamType || role || 'client',
                      project_id: projectId,
                      organization_id: organizationId,
                      is_decision_maker: isDecisionMaker || false,
                      invited_by: invitedBy,
                      ...metadata
                    },
                    redirect_url: `${appUrl}/invitation/accept`, // Handle invitation acceptance properly
                    notify: true,
                    expires_in_days: 30
                  }),
                });
                
                const retryData = await retryResponse.json();
                
                if (retryResponse.ok) {
                  // Store in database
                  await supabaseClient
                    .from('invitation_tracking')
                    .insert({
                      clerk_invitation_id: retryData.id,
                      email: retryData.email_address,
                      role: role || 'client',
                      is_decision_maker: isDecisionMaker || false,
                      project_id: projectId,
                      organization_id: organizationId,
                      invited_by: invitedBy,
                      status: 'pending',
                      metadata: metadata || {}
                    });
                  
                  return new Response(
                    JSON.stringify({
                      success: true,
                      invitationId: retryData.id,
                      invitationUrl: retryData.url || `${appUrl}/welcome/${retryData.id}`,
                      email: retryData.email_address,
                      status: retryData.status,
                      revoked_existing: true
                    }),
                    {
                      status: 200,
                      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    }
                  );
                }
              }
            } catch (handleError) {
              console.error('Error handling existing invitation:', handleError);
            }
          }
          
          // If we couldn't revoke or don't want to, return existing invitation
          try {
            const listResponse = await fetch(`https://api.clerk.com/v1/invitations?email_address=${email}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${clerkSecretKey}`,
              },
            });
            
            const invitations = await listResponse.json();
            
            if (invitations.data && invitations.data.length > 0) {
              const existingInvitation = invitations.data[0];
              console.log('Returning existing invitation:', existingInvitation.id);
              return new Response(
                JSON.stringify({
                  success: true,
                  invitationId: existingInvitation.id,
                  invitationUrl: existingInvitation.url || `${appUrl}/welcome/${existingInvitation.id}`,
                  email: existingInvitation.email_address,
                  status: existingInvitation.status,
                  existing: true
                }),
                {
                  status: 200,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
              );
            }
          } catch (listError) {
            console.error('Error fetching existing invitation:', listError);
          }
          
          return new Response(
            JSON.stringify({ 
              error: 'An invitation for this email already exists. The user should check their email.',
              code: 'invitation_exists'
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
      
      return new Response(
        JSON.stringify({ error: clerkData.errors?.[0]?.message || 'Failed to create invitation' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Store invitation tracking in database
    const { error: trackingError } = await supabaseClient
      .from('invitation_tracking')
      .insert({
        clerk_invitation_id: clerkData.id,
        email: clerkData.email_address,
        role: role || 'client',
        is_decision_maker: isDecisionMaker || false,
        project_id: projectId,
        organization_id: organizationId,
        invited_by: invitedBy,
        status: 'pending',
        metadata: metadata || {}
      });

    if (trackingError) {
      console.error('Error storing invitation tracking:', trackingError);
      // Don't fail the request, tracking is secondary
    }

    // Return success response
    console.log('Invitation created successfully:', clerkData.id);
    return new Response(
      JSON.stringify({
        success: true,
        invitationId: clerkData.id,
        invitationUrl: clerkData.url || `${appUrl}/welcome/${clerkData.id}`,
        email: clerkData.email_address,
        status: clerkData.status
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});