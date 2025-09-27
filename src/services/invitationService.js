/**
 * Frontend service for managing invitations through Clerk
 * This service calls backend API endpoints that handle Clerk invitation creation
 */

/**
 * Create an invitation through the backend API
 * @param {Object} params - Invitation parameters
 * @returns {Promise<Object>} Result with invitation details
 */
export async function createInvitation(params) {
  try {
    // Import Supabase client
    const { supabase } = await import('../lib/supabase');
    
    // Call the Supabase Edge Function to create Clerk invitation
    const { data, error } = await supabase.functions.invoke('create-clerk-invitation', {
      body: {
        email: params.email,
        role: params.role || 'client',
        teamType: params.teamType || params.role || 'client',
        projectId: params.projectId,
        organizationId: params.organizationId,
        isDecisionMaker: params.isDecisionMaker || false,
        invitedBy: params.invitedBy,
        metadata: params.metadata || {}
      }
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to create invitation');
    }

    return {
      success: true,
      invitationId: data.invitationId,
      invitationUrl: data.invitationUrl,
      email: data.email,
      status: data.status
    };
  } catch (error) {
    console.error('Error creating invitation:', error);
    return {
      success: false,
      error: error.message || 'Failed to create invitation'
    };
  }
}

/**
 * Check if adding a decision maker is allowed
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Result with decision makers count
 */
export async function checkDecisionMakerLimit(projectId) {
  try {
    const { supabase } = await import('../lib/supabase');
    
    const { data: existingDecisionMakers, error } = await supabase
      .from('team_members')
      .select('id, name, email')
      .eq('project_id', projectId)
      .eq('team_type', 'client')
      .eq('is_decision_maker', true);

    if (error) {
      throw error;
    }

    return {
      success: true,
      count: existingDecisionMakers?.length || 0,
      decisionMakers: existingDecisionMakers || [],
      canAdd: (existingDecisionMakers?.length || 0) < 2
    };
  } catch (error) {
    console.error('Error checking decision maker limit:', error);
    return {
      success: false,
      error: error.message,
      count: 0,
      decisionMakers: [],
      canAdd: false
    };
  }
}

/**
 * Swap decision maker role
 * @param {string} projectId - Project ID
 * @param {string} oldDecisionMakerId - Team member ID to remove decision maker role
 * @returns {Promise<Object>} Result
 */
export async function swapDecisionMaker(projectId, oldDecisionMakerId) {
  try {
    const { supabase } = await import('../lib/supabase');
    
    const { error } = await supabase
      .from('team_members')
      .update({ is_decision_maker: false })
      .eq('id', oldDecisionMakerId)
      .eq('project_id', projectId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error swapping decision maker:', error);
    return {
      success: false,
      error: error.message || 'Failed to swap decision maker'
    };
  }
}