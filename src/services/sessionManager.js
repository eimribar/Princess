/**
 * SessionManager - Singleton service for managing Supabase sessions
 * Prevents concurrent auth requests and caches sessions for performance
 */

import { supabase } from '@/lib/supabase';

class SessionManager {
  constructor() {
    this.pendingRequest = null;
    this.pendingRequestTime = 0; // Track when pending request was created
    this.lastSession = null;
    this.lastFetchTime = 0;
    this.SESSION_CACHE_TIME = 10000; // Cache for 10 seconds
    this.STALE_REQUEST_TIME = 30000; // Consider request stale after 30 seconds
    this.refreshPromise = null;
  }

  /**
   * Get current session with caching and request deduplication
   */
  async getSession() {
    console.log('[SessionManager] getSession called');
    
    // If we have a recent session, return it
    if (this.lastSession && Date.now() - this.lastFetchTime < this.SESSION_CACHE_TIME) {
      console.log('[SessionManager] Returning cached session');
      return { data: { session: this.lastSession }, error: null };
    }

    // Check for stale pending request
    if (this.pendingRequest) {
      const requestAge = Date.now() - this.pendingRequestTime;
      if (requestAge > this.STALE_REQUEST_TIME) {
        console.warn('[SessionManager] Clearing stale pending request (age: ' + requestAge + 'ms)');
        this.pendingRequest = null;
        this.pendingRequestTime = 0;
      } else {
        console.log('[SessionManager] Waiting for pending request (age: ' + requestAge + 'ms)');
        try {
          return await this.pendingRequest;
        } catch (error) {
          // If the pending request fails, clear it so next call can retry
          this.pendingRequest = null;
          this.pendingRequestTime = 0;
          throw error;
        }
      }
    }

    // Create new request
    console.log('[SessionManager] Creating new session request');
    this.pendingRequestTime = Date.now();
    this.pendingRequest = this._fetchSession();
    
    try {
      const result = await this.pendingRequest;
      return result;
    } catch (error) {
      // Clear on error to allow retry
      console.error('[SessionManager] getSession error, clearing pending request');
      throw error;
    } finally {
      this.pendingRequest = null;
      this.pendingRequestTime = 0;
    }
  }

  /**
   * Internal method to fetch session from Supabase with retry logic
   */
  async _fetchSession() {
    const maxRetries = 2;
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let timeoutId = null;
      
      try {
        if (attempt > 0) {
          console.log(`[SessionManager] Retry attempt ${attempt} of ${maxRetries}`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        
        console.log('[SessionManager] Fetching session from Supabase');
        
        if (!supabase) {
          console.error('[SessionManager] Supabase not configured');
          return { data: { session: null }, error: new Error('Supabase not configured') };
        }
        
        // Add timeout wrapper with proper cleanup
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Session fetch timeout after 15 seconds'));
          }, 15000);
        });
        
        console.log('[SessionManager] Calling supabase.auth.getSession()...');
        
        const result = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);
        
        // Clear timeout on success
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (result.data?.session) {
          console.log('[SessionManager] Session fetched successfully');
          this.lastSession = result.data.session;
          this.lastFetchTime = Date.now();
        } else {
          console.log('[SessionManager] No session found');
        }
        
        return result;
      } catch (error) {
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        console.error(`[SessionManager] Session fetch failed (attempt ${attempt + 1}):`, error.message);
        lastError = error;
        
        if (attempt === maxRetries) {
          console.error('[SessionManager] All retry attempts exhausted');
          return { data: { session: null }, error: lastError };
        }
      }
    }
    
    return { data: { session: null }, error: lastError };
  }

  /**
   * Refresh the current session
   */
  async refreshSession() {
    console.log('[SessionManager] refreshSession called');
    
    // Prevent concurrent refresh attempts
    if (this.refreshPromise) {
      console.log('[SessionManager] Refresh already in progress');
      return this.refreshPromise;
    }
    
    this.refreshPromise = this._doRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Internal method to refresh session with retry logic
   */
  async _doRefresh() {
    const maxRetries = 2;
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let timeoutId = null;
      
      try {
        if (attempt > 0) {
          console.log(`[SessionManager] Refresh retry attempt ${attempt} of ${maxRetries}`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        
        console.log('[SessionManager] Refreshing session');
        
        if (!supabase) {
          return { success: false, error: 'Supabase not configured' };
        }
        
        // Add timeout wrapper with proper cleanup
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Session refresh timeout after 15 seconds'));
          }, 15000);
        });
        
        const result = await Promise.race([
          supabase.auth.refreshSession(),
          timeoutPromise
        ]);
        
        // Clear timeout on success
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        const { data: { session }, error } = result;
        
        if (error) {
          throw error;
        }
        
        if (session) {
          console.log('[SessionManager] Session refreshed successfully');
          this.lastSession = session;
          this.lastFetchTime = Date.now();
          return { success: true, session };
        }
        
        return { success: false, error: 'No session to refresh' };
      } catch (error) {
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        console.error(`[SessionManager] Refresh failed (attempt ${attempt + 1}):`, error.message);
        lastError = error;
        
        if (attempt === maxRetries) {
          console.error('[SessionManager] All refresh retry attempts exhausted');
          return { success: false, error: lastError };
        }
      }
    }
    
    return { success: false, error: lastError };
  }

  /**
   * Clear cached session
   */
  clearCache() {
    console.log('[SessionManager] Clearing cache');
    this.lastSession = null;
    this.lastFetchTime = 0;
    this.pendingRequest = null;
    this.pendingRequestTime = 0;
    this.refreshPromise = null;
  }
  
  /**
   * Force reset all state - use when session gets into bad state
   */
  reset() {
    console.log('[SessionManager] Resetting all state');
    this.clearCache();
    // Also clear the session cache time to force refresh
    this.lastFetchTime = 0;
  }

  /**
   * Get cached session without fetching
   */
  getCachedSession() {
    if (this.lastSession && Date.now() - this.lastFetchTime < this.SESSION_CACHE_TIME) {
      return this.lastSession;
    }
    return null;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.sessionManager = sessionManager;
}