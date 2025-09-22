/**
 * Authentication Helpers
 * Utilities for managing Supabase authentication
 */

import { supabase } from '@/lib/supabase';
import { sessionManager } from '@/services/sessionManager';

/**
 * Refresh the current session
 */
export async function refreshSession() {
  console.log('[AUTH] refreshSession called');
  // Delegate to session manager
  return sessionManager.refreshSession();
}

/**
 * Check if current session is valid
 */
export async function isSessionValid() {
  console.log('[AUTH] isSessionValid called');
  
  if (!supabase) {
    console.log('[AUTH] Supabase not configured');
    return false;
  }
  
  try {
    console.log('[AUTH] Getting session via SessionManager...');
    const { data: { session }, error } = await sessionManager.getSession();
    console.log('[AUTH] Got session:', !!session, 'Error:', error);
    
    if (error || !session) return false;
    
    // Check if token is expired
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    
    if (expiresAt <= now) {
      console.log('[AUTH] Session expired, attempting refresh...');
      const { success } = await refreshSession();
      console.log('[AUTH] Refresh result:', success);
      return success;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking session:', error);
    return false;
  }
}

/**
 * Ensure user is authenticated before performing an action
 */
export async function ensureAuthenticated() {
  console.log('[AUTH] ensureAuthenticated called');
  const valid = await isSessionValid();
  console.log('[AUTH] Session valid:', valid);
  
  if (!valid) {
    console.error('[AUTH] User is not authenticated or session is invalid');
    // You could redirect to login here
    // window.location.href = '/login';
    return false;
  }
  
  return true;
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.refreshSession = refreshSession;
  window.isSessionValid = isSessionValid;
}