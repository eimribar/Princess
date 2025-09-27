/**
 * API endpoint for creating Clerk invitations
 * This should be deployed as a serverless function or API route
 * 
 * For local development with Vite, you can use this with a proxy
 * Add to vite.config.js:
 * server: {
 *   proxy: {
 *     '/api': 'http://localhost:3001' // Your backend server
 *   }
 * }
 */

import { createClerkClient } from '@clerk/backend';

// Initialize Clerk client with secret key
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      email,
      role,
      projectId,
      organizationId,
      isDecisionMaker,
      invitedBy,
      metadata
    } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Create the invitation with Clerk
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        role: role || 'client',
        project_id: projectId,
        organization_id: organizationId,
        is_decision_maker: isDecisionMaker || false,
        invited_by: invitedBy,
        ...metadata
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || req.headers.origin}/welcome/__invitation_token__`,
      notify: true, // Send invitation email
      expiresInDays: 30
    });

    // Store in our tracking database
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      await supabase
        .from('invitation_tracking')
        .insert({
          clerk_invitation_id: invitation.id,
          email: invitation.emailAddress,
          role: role || 'client',
          is_decision_maker: isDecisionMaker || false,
          project_id: projectId,
          organization_id: organizationId,
          invited_by: invitedBy,
          status: 'pending',
          metadata: metadata || {}
        });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      invitationId: invitation.id,
      invitationUrl: invitation.url,
      email: invitation.emailAddress,
      status: invitation.status
    });

  } catch (error) {
    console.error('Error creating invitation:', error);
    
    // Handle specific Clerk errors
    if (error.errors) {
      const clerkError = error.errors[0];
      if (clerkError.code === 'email_address_exists') {
        return res.status(400).json({
          error: 'A user with this email address already exists'
        });
      }
      if (clerkError.code === 'invitation_exists') {
        return res.status(400).json({
          error: 'An invitation for this email address already exists'
        });
      }
    }

    return res.status(500).json({
      error: error.message || 'Failed to create invitation'
    });
  }
}

// For Next.js API routes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};