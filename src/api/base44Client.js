import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "688e44ada5be3be1df2d92ac", 
  requiresAuth: true // Ensure authentication is required for all operations
});
