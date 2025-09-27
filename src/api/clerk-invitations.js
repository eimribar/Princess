/**
 * Clerk Invitation API Service
 * This service should be called from a backend endpoint in production
 * For development, we'll use a proxy or serverless function
 */

// IMPORTANT: In production, this should be an environment variable on the backend
// NEVER expose your secret key in frontend code
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

/**
 * Create an invitation using Clerk Backend API
 * NOTE: This function should be called from a backend endpoint
 * @param {Object} params - Invitation parameters
 */
export async function createClerkInvitation({
  email,
  publicMetadata,
  redirectUrl,
  notify = true,
  expiresInDays = 30
}) {
  if (!CLERK_SECRET_KEY) {
    console.error('CLERK_SECRET_KEY is not configured');
    throw new Error('Server configuration error');
  }

  try {
    const response = await fetch('https://api.clerk.com/v1/invitations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: email,
        public_metadata: publicMetadata,
        redirect_url: redirectUrl,
        notify: notify,
        expires_in_days: expiresInDays
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || 'Failed to create invitation');
    }

    const invitation = await response.json();
    return {
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email_address,
        status: invitation.status,
        url: invitation.url,
        publicMetadata: invitation.public_metadata,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at
      }
    };
  } catch (error) {
    console.error('Error creating Clerk invitation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Revoke an invitation
 * @param {string} invitationId - The invitation ID to revoke
 */
export async function revokeClerkInvitation(invitationId) {
  if (!CLERK_SECRET_KEY) {
    console.error('CLERK_SECRET_KEY is not configured');
    throw new Error('Server configuration error');
  }

  try {
    const response = await fetch(`https://api.clerk.com/v1/invitations/${invitationId}/revoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || 'Failed to revoke invitation');
    }

    const invitation = await response.json();
    return {
      success: true,
      invitation
    };
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get invitation details
 * @param {string} invitationId - The invitation ID
 */
export async function getClerkInvitation(invitationId) {
  if (!CLERK_SECRET_KEY) {
    console.error('CLERK_SECRET_KEY is not configured');
    throw new Error('Server configuration error');
  }

  try {
    const response = await fetch(`https://api.clerk.com/v1/invitations/${invitationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || 'Failed to get invitation');
    }

    const invitation = await response.json();
    return {
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email_address,
        status: invitation.status,
        url: invitation.url,
        publicMetadata: invitation.public_metadata,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at
      }
    };
  } catch (error) {
    console.error('Error getting invitation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * List all invitations
 * @param {Object} params - Query parameters
 */
export async function listClerkInvitations({ status, limit = 10, offset = 0 } = {}) {
  if (!CLERK_SECRET_KEY) {
    console.error('CLERK_SECRET_KEY is not configured');
    throw new Error('Server configuration error');
  }

  try {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);

    const response = await fetch(`https://api.clerk.com/v1/invitations?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || 'Failed to list invitations');
    }

    const data = await response.json();
    return {
      success: true,
      invitations: data.data || [],
      totalCount: data.total_count
    };
  } catch (error) {
    console.error('Error listing invitations:', error);
    return {
      success: false,
      error: error.message,
      invitations: []
    };
  }
}