/**
 * Supabase Entity Classes
 * Provides direct database operations for all entities
 */

import { supabase } from '@/lib/supabase';
import dataStore from './dataStore';
import dateService from '@/services/dateService';

// Base Supabase Entity class with common functionality
class SupabaseEntity {
  constructor(tableName) {
    this.tableName = tableName;
    this.useSupabase = !!supabase;
  }

  async list(orderBy = null) {
    if (!this.useSupabase) {
      throw new Error('Supabase is required. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }

    try {
      let query = supabase.from(this.tableName).select('*');
      
      if (orderBy) {
        const isDescending = orderBy.startsWith('-');
        const column = isDescending ? orderBy.substring(1) : orderBy;
        query = query.order(column, { ascending: !isDescending });
      }

      const { data, error } = await query;
      
      if (error) {
        console.error(`Error fetching ${this.tableName}:`, error);
        throw error;
      }
      
      // Map fields from Supabase convention back to app convention
      const mappedData = (data || []).map(item => this.mapFieldsFromSupabase(item));
      return mappedData;
    } catch (error) {
      console.error(`Failed to list ${this.tableName}:`, error);
      throw error;
    }
  }

  async get(id) {
    if (!this.useSupabase) {
      throw new Error('Supabase is required. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Error fetching ${this.tableName} ${id}:`, error);
        throw error;
      }
      
      // Map fields from Supabase convention back to app convention
      return this.mapFieldsFromSupabase(data);
    } catch (error) {
      console.error(`Failed to get ${this.tableName} ${id}:`, error);
      throw error;
    }
  }

  async create(data) {
    if (!this.useSupabase) {
      throw new Error('Supabase is required. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }

    try {
      // Map field names from localStorage convention to Supabase convention
      const mappedData = this.mapFieldsToSupabase(data);
      // Remove any local-only fields and let Supabase generate them
      const { id, created_date, updated_date, created_at, updated_at, ...cleanData } = mappedData;
      
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(cleanData)
        .select()
        .single();
      
      if (error) {
        console.error(`Error creating ${this.tableName}:`, error);
        throw error;
      }
      
      // Map result back
      const mappedResult = this.mapFieldsFromSupabase(result);
      // DO NOT duplicate in localStorage - single source of truth
      
      return mappedResult;
    } catch (error) {
      console.error(`Failed to create ${this.tableName}:`, error);
      throw error;
    }
  }

  async update(id, updates) {
    if (!this.useSupabase) {
      throw new Error('Supabase is required. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }

    try {
      // Map field names and remove any local-only fields
      const mappedUpdates = this.mapFieldsToSupabase(updates);
      const { created_date, updated_date, created_at, updated_at, ...cleanUpdates } = mappedUpdates;
      
      const { data, error } = await supabase
        .from(this.tableName)
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating ${this.tableName} ${id}:`, error);
        throw error;
      }
      
      // Map result back
      const mappedResult = this.mapFieldsFromSupabase(data);
      // DO NOT duplicate in localStorage - single source of truth
      
      return mappedResult;
    } catch (error) {
      console.error(`Failed to update ${this.tableName} ${id}:`, error);
      throw error;
    }
  }

  async delete(id) {
    if (!this.useSupabase) {
      throw new Error('Supabase is required. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }

    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Error deleting ${this.tableName} ${id}:`, error);
        throw error;
      }
      
      // DO NOT duplicate delete in localStorage - single source of truth
      
      return true;
    } catch (error) {
      console.error(`Failed to delete ${this.tableName} ${id}:`, error);
      throw error;
    }
  }

  async filter(criteria = {}, orderBy = null) {
    if (!this.useSupabase) {
      throw new Error('Supabase is required. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }

    try {
      let query = supabase.from(this.tableName).select('*');
      
      // Apply filters
      for (const [key, value] of Object.entries(criteria)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
      
      // Apply ordering
      if (orderBy) {
        const isDescending = orderBy.startsWith('-');
        const column = isDescending ? orderBy.substring(1) : orderBy;
        query = query.order(column, { ascending: !isDescending });
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`Error filtering ${this.tableName}:`, error);
        throw error;
      }
      
      // Map fields from Supabase convention back to app convention
      const mappedData = (data || []).map(item => this.mapFieldsFromSupabase(item));
      return mappedData;
    } catch (error) {
      console.error(`Failed to filter ${this.tableName}:`, error);
      throw error;
    }
  }

  async bulkCreate(items) {
    if (!this.useSupabase) {
      throw new Error('Supabase is required. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }

    try {
      // Map field names and clean items
      const cleanItems = items.map(item => {
        const mappedItem = this.mapFieldsToSupabase(item);
        const { id, created_date, updated_date, created_at, updated_at, ...cleanItem } = mappedItem;
        return cleanItem;
      });
      
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(cleanItems)
        .select();
      
      if (error) {
        console.error(`Error bulk creating ${this.tableName}:`, error);
        throw error;
      }
      
      // Map results back
      const mappedResults = data.map(item => this.mapFieldsFromSupabase(item));
      // DO NOT duplicate in localStorage - single source of truth
      
      return mappedResults;
    } catch (error) {
      console.error(`Failed to bulk create ${this.tableName}:`, error);
      throw error;
    }
  }
  
  // Map field names from localStorage convention to Supabase convention
  mapFieldsToSupabase(data) {
    if (!data) return data;
    
    const mapped = { ...data };
    
    // Field name mappings
    if ('created_date' in mapped && !('created_at' in mapped)) {
      mapped.created_at = mapped.created_date;
    }
    if ('updated_date' in mapped && !('updated_at' in mapped)) {
      mapped.updated_at = mapped.updated_date;
    }
    if ('order_index' in mapped && !('number_index' in mapped)) {
      mapped.number_index = mapped.order_index;
    }
    
    // Status value mappings
    if (mapped.status === 'not_started') {
      mapped.status = 'not_ready';
    }
    
    // Use centralized date service for consistent date handling
    // Tables with DATE columns (not TIMESTAMP)
    const dateOnlyTables = ['stages', 'projects', 'deliverables'];
    const dateOnlyFields = ['start_date', 'end_date', 'original_deadline', 'adjusted_deadline'];
    
    if (dateOnlyTables.includes(this.tableName)) {
      dateOnlyFields.forEach(field => {
        if (mapped[field]) {
          mapped[field] = dateService.toDatabaseDate(mapped[field]);
        }
      });
    }
    
    // Preserve timezone for timestamp fields
    if (mapped.created_at && typeof mapped.created_at === 'string') {
      // Ensure it's a valid ISO string with timezone
      if (!mapped.created_at.includes('Z') && !mapped.created_at.includes('+')) {
        // Add UTC timezone if missing
        mapped.created_at = new Date(mapped.created_at).toISOString();
      }
    }
    if (mapped.updated_at && typeof mapped.updated_at === 'string') {
      if (!mapped.updated_at.includes('Z') && !mapped.updated_at.includes('+')) {
        mapped.updated_at = new Date(mapped.updated_at).toISOString();
      }
    }
    
    return mapped;
  }
  
  // Map field names from Supabase convention back to localStorage convention
  mapFieldsFromSupabase(data) {
    if (!data) return data;
    
    const mapped = { ...data };
    
    // Field name mappings
    if ('created_at' in mapped && !('created_date' in mapped)) {
      mapped.created_date = mapped.created_at;
    }
    if ('updated_at' in mapped && !('updated_date' in mapped)) {
      mapped.updated_date = mapped.updated_at;
    }
    if ('number_index' in mapped && !('order_index' in mapped)) {
      mapped.order_index = mapped.number_index;
    }
    
    // Status value mappings
    if (mapped.status === 'not_ready') {
      // Keep as not_ready for consistency with new convention
      // The app should use not_ready going forward
    }
    
    return mapped;
  }
}

// Specialized entity classes

class ProjectEntity extends SupabaseEntity {
  constructor() {
    super('projects');
  }
  
  async createWithFullData(projectData) {
    // Special method for creating a project with all related data
    // This will be used by ProjectCreationService
    return this.create(projectData);
  }
}

class StageEntity extends SupabaseEntity {
  constructor() {
    super('stages');
  }
  
  async createWithDependencies(stageData, dependencies = []) {
    // First create the stage
    const stage = await this.create(stageData);
    
    // Then create dependencies if Supabase is available
    if (this.useSupabase && dependencies.length > 0) {
      const dependencyRecords = dependencies.map(depId => ({
        stage_id: stage.id,
        depends_on_stage_id: depId
      }));
      
      const { error } = await supabase
        .from('stage_dependencies')
        .insert(dependencyRecords);
      
      if (error) {
        // console.error('Error creating stage dependencies:', error);
      }
    }
    
    return stage;
  }
  
  async bulkCreateWithDependencies(stagesData) {
    const createdStages = await this.bulkCreate(stagesData);
    
    // Create dependencies if Supabase is available
    if (this.useSupabase) {
      const allDependencies = [];
      
      for (const stage of stagesData) {
        if (stage.dependencies && stage.dependencies.length > 0) {
          const createdStage = createdStages.find(s => s.number_index === stage.number_index);
          if (createdStage) {
            for (const depIndex of stage.dependencies) {
              const depStage = createdStages.find(s => s.number_index === depIndex);
              if (depStage) {
                allDependencies.push({
                  stage_id: createdStage.id,
                  depends_on_stage_id: depStage.id
                });
              }
            }
          }
        }
      }
      
      if (allDependencies.length > 0) {
        const { error } = await supabase
          .from('stage_dependencies')
          .insert(allDependencies);
        
        if (error) {
          // console.error('Error creating stage dependencies:', error);
        }
      }
    }
    
    return createdStages;
  }
  
  // Override filter to include dependencies
  async filter(criteria = {}, orderBy = null) {
    // First get the stages
    const stages = await super.filter(criteria, orderBy);
    
    // If we have stages and Supabase is available, load dependencies
    if (stages && stages.length > 0 && this.useSupabase) {
      // Get all stage IDs
      const stageIds = stages.map(s => s.id);
      
      // Load all dependencies for these stages
      const { data: dependencies, error } = await supabase
        .from('stage_dependencies')
        .select('stage_id, depends_on_stage_id')
        .in('stage_id', stageIds);
      
      if (!error && dependencies) {
        // Group dependencies by stage_id
        const depMap = {};
        dependencies.forEach(dep => {
          if (!depMap[dep.stage_id]) {
            depMap[dep.stage_id] = [];
          }
          depMap[dep.stage_id].push(dep.depends_on_stage_id);
        });
        
        // Attach dependencies to stages
        stages.forEach(stage => {
          stage.dependencies = depMap[stage.id] || [];
        });
      }
    }
    
    return stages;
  }
}

class DeliverableEntity extends SupabaseEntity {
  constructor() {
    super('deliverables');
  }
  
  async createWithVersion(deliverableData, initialVersion = null) {
    const deliverable = await this.create(deliverableData);
    
    // Create initial version if provided
    if (this.useSupabase && initialVersion) {
      const versionData = {
        deliverable_id: deliverable.id,
        version_number: 'V0',
        status: 'draft',
        ...initialVersion
      };
      
      const { error } = await supabase
        .from('deliverable_versions')
        .insert(versionData);
      
      if (error) {
        // console.error('Error creating deliverable version:', error);
      }
    }
    
    return deliverable;
  }
}

class CommentEntity extends SupabaseEntity {
  constructor() {
    super('comments');
  }
}

class NotificationEntity extends SupabaseEntity {
  constructor() {
    super('notifications');
  }
  
  async createForUser(userId, notification) {
    return this.create({
      ...notification,
      user_id: userId
    });
  }
  
  async markAsRead(id) {
    return this.update(id, { is_read: true });
  }
}

class OutOfScopeRequestEntity extends SupabaseEntity {
  constructor() {
    super('out_of_scope_requests');
  }
}

class PlaybookTemplateEntity extends SupabaseEntity {
  constructor() {
    super('playbook_templates');
  }
  
  async getDefaultTemplate() {
    const templates = await this.filter({ is_active: true });
    return templates[0] || null;
  }
}

class TeamMemberEntity extends SupabaseEntity {
  constructor() {
    super('team_members');
  }
}

// Export new Supabase-connected entities
export const SupabaseProject = new ProjectEntity();
export const SupabaseStage = new StageEntity();
export const SupabaseDeliverable = new DeliverableEntity();
export const SupabaseComment = new CommentEntity();
export const SupabaseNotification = new NotificationEntity();
export const SupabaseOutOfScopeRequest = new OutOfScopeRequestEntity();
export const SupabasePlaybookTemplate = new PlaybookTemplateEntity();
export const SupabaseTeamMember = new TeamMemberEntity();

// Export the base class for extension
export { SupabaseEntity };