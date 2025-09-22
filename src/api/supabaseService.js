/**
 * Supabase Service - Database Operations
 * Provides CRUD operations directly with Supabase
 */

import { supabase } from '@/lib/supabase';
import { ensureAuthenticated, refreshSession } from '@/utils/authHelpers';
import { sessionManager } from '@/services/sessionManager';

class SupabaseService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Check if Supabase is configured
   */
  isConfigured() {
    return !!this.supabase;
  }

  /**
   * Get current user's organization/project context
   */
  async getCurrentContext() {
    if (!this.isConfigured()) return null;
    
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) {
        console.warn('Auth error in getCurrentContext:', error);
        // Return default context without user
        return {
          userId: null,
          projectId: null,
          organizationId: null
        };
      }
      
      if (!user) {
        // No user logged in, return default context
        return {
          userId: null,
          projectId: null,
          organizationId: null
        };
      }

      // Return context with user
      return {
        userId: user.id,
        projectId: null, // Will be replaced with actual project selection
        organizationId: null
      };
    } catch (error) {
      console.error('Error getting current context:', error);
      return {
        userId: null,
        projectId: null,
        organizationId: null
      };
    }
  }

  /**
   * Team Members Operations
   */
  async getTeamMembers(orderBy = 'name') {
    if (!this.isConfigured()) {
      // Fallback to localStorage
      return this.getLocalData('teamMembers', orderBy);
    }

    try {
      // Ensure we have a valid session (will refresh if needed)
      const isAuthenticated = await ensureAuthenticated();
      
      if (!isAuthenticated) {
        console.log('Not authenticated or session invalid for read.');
        console.log('Attempting to refresh session...');
        
        const { success } = await refreshSession();
        if (!success) {
          console.log('Could not refresh session. Using localStorage for read.');
          return this.getLocalData('teamMembers', orderBy);
        }
      }

      let query = this.supabase
        .from('team_members')
        .select('*');

      // Add ordering
      if (orderBy) {
        const isDescending = orderBy.startsWith('-');
        const column = isDescending ? orderBy.substring(1) : orderBy;
        query = query.order(column, { ascending: !isDescending });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching team members:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details
        });
        
        if (error.code === 'PGRST301') {
          console.log('JWT error - session may be expired, attempting refresh');
          const { success } = await refreshSession();
          if (success) {
            console.log('Session refreshed, retrying fetch');
            // Retry once after refresh
            const retryQuery = this.supabase.from('team_members').select('*');
            if (orderBy) {
              const isDescending = orderBy.startsWith('-');
              const column = isDescending ? orderBy.substring(1) : orderBy;
              retryQuery.order(column, { ascending: !isDescending });
            }
            const { data: retryData, error: retryError } = await retryQuery;
            if (!retryError) {
              return retryData || [];
            }
          }
        }
        // Fallback to localStorage
        return this.getLocalData('teamMembers', orderBy);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTeamMembers:', error);
      return this.getLocalData('teamMembers', orderBy);
    }
  }

  async getTeamMember(id) {
    if (!this.isConfigured()) {
      return this.getLocalDataById('teamMembers', id);
    }

    try {
      // Ensure we have a valid session (will refresh if needed)
      const isAuthenticated = await ensureAuthenticated();
      
      if (!isAuthenticated) {
        console.log('Not authenticated or session invalid for read by id.');
        console.log('Attempting to refresh session...');
        
        const { success } = await refreshSession();
        if (!success) {
          console.log('Could not refresh session. Using localStorage for read by id.');
          return this.getLocalDataById('teamMembers', id);
        }
      }
      
      const { data, error } = await this.supabase
        .from('team_members')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching team member:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details,
          memberId: id
        });
        
        if (error.code === 'PGRST301') {
          console.log('JWT error - session may be expired, attempting refresh');
          const { success } = await refreshSession();
          if (success) {
            console.log('Session refreshed, retrying fetch');
            // Retry once after refresh
            const { data: retryData, error: retryError } = await this.supabase
              .from('team_members')
              .select('*')
              .eq('id', id)
              .single();
            if (!retryError) {
              return retryData;
            }
          }
        }
        
        return this.getLocalDataById('teamMembers', id);
      }

      return data;
    } catch (error) {
      console.error('Error in getTeamMember:', error);
      return this.getLocalDataById('teamMembers', id);
    }
  }

  async createTeamMember(memberData) {
    console.log('[CREATE] Starting createTeamMember with data:', memberData.name);
    
    if (!this.isConfigured()) {
      throw new Error('Supabase not configured. Please check your environment variables.');
    }
    
    // First check if there's any auth data in localStorage
    const authData = localStorage.getItem('princess-auth');
    console.log('[CREATE] Auth data in localStorage:', !!authData);
    
    if (!authData) {
      console.error('[CREATE] No auth data found in localStorage');
      throw new Error('Not logged in. Please sign in first to create team members.');
    }

    console.log('[CREATE] Getting session from SessionManager...');
    
    try {
      // Get session ONCE from SessionManager
      const { data: { session }, error: sessionError } = await sessionManager.getSession();
      
      if (sessionError) {
        console.error('[CREATE] Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        console.error('[CREATE] No valid session found');
        throw new Error('No valid session. Please log in again.');
      }
      
      console.log('[CREATE] Using session for:', session.user.email);
      console.log('[CREATE] Session expires at:', session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'unknown');
      
      // Add required fields
      const dataToInsert = {
        ...memberData,
        project_id: null, // Nullable, so we can set to null
        team_type: memberData.team_type || 'agency', // Ensure team_type is set
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('[CREATE] Creating team member in Supabase:', dataToInsert.name);
      console.log('[CREATE] Data to insert:', JSON.stringify(dataToInsert));

      console.log('[CREATE] Calling Supabase insert...');
      
      // Add timeout to Supabase insert
      const insertTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase insert timeout')), 10000)
      );
      
      const insertResult = await Promise.race([
        this.supabase
          .from('team_members')
          .insert([dataToInsert])
          .select()
          .single(),
        insertTimeout
      ]);
      
      const { data, error } = insertResult;
      
      console.log('[CREATE] Supabase insert completed');

      if (error) {
        console.error('Supabase error creating team member:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details
        });
        
        if (error.code === 'PGRST301') {
          console.log('JWT/Authentication error - token may be expired');
        } else if (error.code === '42501') {
          console.log('Permission denied - check RLS policies');
        }
        
        console.log('Falling back to localStorage');
        return this.createLocalData('teamMembers', memberData);
      }

      console.log('[CREATE] Successfully created team member in Supabase:', data);
      
      // Clear session cache after successful operation to ensure fresh state
      sessionManager.clearCache();
      console.log('[CREATE] Cleared session cache for fresh state');
      
      return data;
    } catch (error) {
      console.error('[CREATE] Error in createTeamMember:', error);
      console.error('[CREATE] Error stack:', error.stack);
      
      // For production, throw the error instead of falling back to localStorage
      throw error;
    } finally {
      console.log('[CREATE] createTeamMember completed');
    }
  }

  async updateTeamMember(id, updates) {
    if (!this.isConfigured()) {
      console.log('Supabase not configured, using localStorage');
      return this.updateLocalData('teamMembers', id, updates);
    }

    try {
      // Ensure we have a valid session (will refresh if needed)
      const isAuthenticated = await ensureAuthenticated();
      
      if (!isAuthenticated) {
        console.log('Not authenticated or session invalid for update.');
        console.log('Attempting to refresh session...');
        
        const { success } = await refreshSession();
        if (!success) {
          console.log('Could not refresh session. Using localStorage for update.');
          return this.updateLocalData('teamMembers', id, updates);
        }
      }
      
      // Session already verified by ensureAuthenticated, no need to fetch again
      console.log('Proceeding with update operation');
      
      const dataToUpdate = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Remove fields that shouldn't be updated
      delete dataToUpdate.id;
      delete dataToUpdate.created_at;
      
      console.log('Updating team member in Supabase:', id);

      const { data, error } = await this.supabase
        .from('team_members')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating team member:', error);
        console.error('Update error details:', {
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details
        });
        
        if (error.code === 'PGRST301') {
          console.log('JWT/Authentication error during update - token may be expired');
        } else if (error.code === '42501') {
          console.log('Permission denied during update - check RLS policies');
        } else if (error.code === 'PGRST116') {
          console.log('No rows found to update - member may have been deleted');
        }
        
        console.log('Falling back to localStorage for update');
        return this.updateLocalData('teamMembers', id, updates);
      }

      console.log('Successfully updated team member in Supabase:', data);
      return data;
    } catch (error) {
      console.error('Error in updateTeamMember:', error);
      console.log('Falling back to localStorage due to error');
      return this.updateLocalData('teamMembers', id, updates);
    }
  }

  async deleteTeamMember(id) {
    if (!this.isConfigured()) {
      console.log('Supabase not configured, using localStorage');
      return this.deleteLocalData('teamMembers', id);
    }

    try {
      // Ensure we have a valid session (will refresh if needed)
      const isAuthenticated = await ensureAuthenticated();
      
      if (!isAuthenticated) {
        console.log('Not authenticated or session invalid for delete.');
        console.log('Attempting to refresh session...');
        
        const { success } = await refreshSession();
        if (!success) {
          console.log('Could not refresh session. Using localStorage for delete.');
          return this.deleteLocalData('teamMembers', id);
        }
      }
      
      // Session already verified by ensureAuthenticated, no need to fetch again
      console.log('Proceeding with delete operation');
      
      console.log('Deleting team member from Supabase:', id);
      
      const { error } = await this.supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting team member:', error);
        console.error('Delete error details:', {
          code: error.code,
          message: error.message,
          hint: error.hint
        });
        
        console.log('Falling back to localStorage for delete');
        return this.deleteLocalData('teamMembers', id);
      }

      console.log('Successfully deleted team member from Supabase');
      return { success: true };
    } catch (error) {
      console.error('Error in deleteTeamMember:', error);
      console.log('Falling back to localStorage due to error');
      return this.deleteLocalData('teamMembers', id);
    }
  }

  /**
   * Local Storage Fallback Methods
   */
  getLocalData(entityType, orderBy = null) {
    const stored = localStorage.getItem('princess_data');
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    const items = data[entityType] || [];
    
    if (orderBy) {
      return [...items].sort((a, b) => {
        if (orderBy.startsWith('-')) {
          const field = orderBy.substring(1);
          return b[field] > a[field] ? 1 : -1;
        } else {
          return a[orderBy] > b[orderBy] ? 1 : -1;
        }
      });
    }
    
    return [...items];
  }

  getLocalDataById(entityType, id) {
    const items = this.getLocalData(entityType);
    return items.find(item => item.id === id);
  }

  createLocalData(entityType, data) {
    const stored = localStorage.getItem('princess_data');
    const storageData = stored ? JSON.parse(stored) : { teamMembers: [] };
    
    if (!storageData[entityType]) {
      storageData[entityType] = [];
    }
    
    const newItem = {
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    };
    
    storageData[entityType].push(newItem);
    localStorage.setItem('princess_data', JSON.stringify(storageData));
    
    return newItem;
  }

  updateLocalData(entityType, id, updates) {
    const stored = localStorage.getItem('princess_data');
    const storageData = stored ? JSON.parse(stored) : { teamMembers: [] };
    
    const items = storageData[entityType] || [];
    const index = items.findIndex(item => item.id === id);
    
    if (index >= 0) {
      items[index] = {
        ...items[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      storageData[entityType] = items;
      localStorage.setItem('princess_data', JSON.stringify(storageData));
      
      return items[index];
    }
    
    throw new Error(`${entityType} with id ${id} not found`);
  }

  deleteLocalData(entityType, id) {
    const stored = localStorage.getItem('princess_data');
    const storageData = stored ? JSON.parse(stored) : { teamMembers: [] };
    
    const items = storageData[entityType] || [];
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === items.length) {
      throw new Error(`${entityType} with id ${id} not found`);
    }
    
    storageData[entityType] = filteredItems;
    localStorage.setItem('princess_data', JSON.stringify(storageData));
    
    return { success: true };
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Migration helper - move localStorage data to Supabase
   */
  async migrateLocalDataToSupabase() {
    if (!this.isConfigured()) {
      console.warn('Supabase not configured, cannot migrate');
      return;
    }

    const stored = localStorage.getItem('princess_data');
    if (!stored) return;

    const data = JSON.parse(stored);
    const results = { success: 0, failed: 0 };

    // Migrate team members
    if (data.teamMembers && data.teamMembers.length > 0) {
      console.log(`Migrating ${data.teamMembers.length} team members to Supabase...`);
      
      for (const member of data.teamMembers) {
        try {
          // Check if member already exists by email
          const { data: existing } = await this.supabase
            .from('team_members')
            .select('id')
            .eq('email', member.email)
            .single();

          if (!existing) {
            await this.createTeamMember(member);
            results.success++;
          }
        } catch (error) {
          console.error('Failed to migrate team member:', member.email, error);
          results.failed++;
        }
      }
    }

    console.log(`Migration complete: ${results.success} succeeded, ${results.failed} failed`);
    return results;
  }
}

// Export singleton instance
const supabaseService = new SupabaseService();
export default supabaseService;