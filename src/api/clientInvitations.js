// Client-side invitation functions that work in the browser
import { supabase } from '../lib/supabase';

/**
 * Get invitation details from the tracking table
 * This is safe to use from the browser as it only queries the database
 */
export async function getInvitationDetails(invitationToken) {
  try {
    // Query the invitation tracking table
    const { data, error } = await supabase
      .from('invitation_tracking')
      .select(`
        *,
        projects (
          id,
          name,
          client_name
        ),
        users (
          id,
          email,
          full_name
        )
      `)
      .eq('clerk_invitation_id', invitationToken)
      .single();

    if (error) {
      console.error('Error fetching invitation:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Invitation not found' };
    }

    return {
      success: true,
      invitation: data
    };
  } catch (error) {
    console.error('Error in getInvitationDetails:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch invitation details'
    };
  }
}