/**
 * Supabase Entity Classes
 * Provides direct database operations for all entities
 */

import { supabase } from '@/lib/supabase';
import dataStore from './dataStore';
import dateService from '@/services/dateService';
import AutomationService from '@/services/automationService';

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
        console.error(`[SupabaseEntity] Error updating ${this.tableName} ${id}:`, {
          error,
          tableName: this.tableName,
          id,
          attemptedUpdates: cleanUpdates,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          errorCode: error.code
        });
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
    // Both stages and deliverables now use 'not_started' consistently
    
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
    
    // No status mapping needed - all entities use consistent status values
    
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
  
  // No status mapping needed anymore - database and frontend both use 'not_started'
  // Run the SQL migration in RUN_THIS_STATUS_FIX.sql to update the database
  
  async create(data) {
    // Create the stage first
    const stage = await super.create(data);
    
    // If stage is marked as deliverable, auto-create the deliverable
    if (stage.is_deliverable) {
      await this.createDeliverableForStage(stage);
    }
    
    return stage;
  }
  
  async update(id, updates) {
    // Get the current stage to check if is_deliverable is changing
    const currentStage = await this.get(id);
    
    // Remove the skip flag from updates if present
    const { _skipDeliverableSync, ...cleanUpdates } = updates;
    const result = await super.update(id, cleanUpdates);
    
    // If stage is newly marked as deliverable, create the deliverable
    if (cleanUpdates.is_deliverable === true && !currentStage?.is_deliverable) {
      await this.createDeliverableForStage(result);
    }
    
    // If stage has a deliverable and status changed, sync the deliverable status
    // Skip if explicitly told to (prevents infinite loop)
    if (result.deliverable_id && cleanUpdates.status && !_skipDeliverableSync) {
      await this.syncDeliverableStatus(result);
    }
    
    return result;
  }
  
  async createDeliverableForStage(stage) {
    // Use AutomationService with retry logic
    return AutomationService.createDeliverableForStage(stage);
  }
  
  async syncDeliverableStatus(stage) {
    // Check if deliverable_id field exists and has a value
    if (!stage.deliverable_id) {
      console.log('Stage does not have deliverable_id or no deliverable linked');
      return;
    }
    
    const deliverableEntity = new DeliverableEntity();
    const deliverable = await deliverableEntity.get(stage.deliverable_id);
    if (!deliverable) {
      console.warn(`Deliverable ${stage.deliverable_id} not found for stage ${stage.id}`);
      return;
    }
    
    // Use AutomationService for syncing with retry logic
    return AutomationService.syncStageDeliverableStatus(stage, deliverable);
  }
  
  determineDeliverableType(category) {
    switch(category) {
      case 'research':
        return 'research';
      case 'strategy':
        return 'strategy';
      case 'brand_building':
      case 'brand_collaterals':
      case 'brand_activation':
        return 'creative';
      default:
        return 'document';
    }
  }
  
  async createWithDependencies(stageData, dependencies = []) {
    // First create the stage (which will auto-create deliverable if needed)
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
        console.log(`Loading ${dependencies.length} dependencies for ${stages.length} stages`);
        
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
        
        // Log stages with dependencies for debugging
        const stagesWithDeps = stages.filter(s => s.dependencies && s.dependencies.length > 0);
        console.log(`${stagesWithDeps.length} stages have dependencies`);
        
        // Check if stage 1 has any dependents
        const stage1 = stages.find(s => s.number_index === 1);
        if (stage1) {
          const dependents = stages.filter(s => s.dependencies?.includes(stage1.id));
          console.log(`Stage 1 has ${dependents.length} direct dependents:`, dependents.map(s => s.number_index));
        }
      } else if (error) {
        console.error('Error loading dependencies:', error);
      }
    }
    
    return stages;
  }
}

class DeliverableEntity extends SupabaseEntity {
  constructor() {
    super('deliverables');
  }

  // Override get to include versions from separate table
  async get(id) {
    if (!this.useSupabase) {
      throw new Error('Supabase is required');
    }

    try {
      // Get the deliverable
      const deliverable = await super.get(id);
      
      if (!deliverable) return null;
      
      // Load versions from deliverable_versions table
      const { data: versions, error: versionsError } = await supabase
        .from('deliverable_versions')
        .select('*')
        .eq('deliverable_id', id)
        .order('created_at', { ascending: true });
      
      if (versionsError) {
        console.error('Error loading deliverable versions:', versionsError);
        // Return deliverable without versions rather than failing completely
        return {
          ...deliverable,
          versions: []
        };
      }
      
      // Return deliverable with versions array
      return {
        ...deliverable,
        versions: versions || []
      };
    } catch (error) {
      console.error(`Failed to get deliverable ${id}:`, error);
      throw error;
    }
  }

  // Override filter to include versions
  async filter(criteria = {}, orderBy = null) {
    if (!this.useSupabase) {
      throw new Error('Supabase is required');
    }

    try {
      // Get deliverables using parent method
      const deliverables = await super.filter(criteria, orderBy);
      
      if (!deliverables || deliverables.length === 0) {
        return deliverables;
      }
      
      // Get all deliverable IDs
      const deliverableIds = deliverables.map(d => d.id);
      
      // Load all versions for these deliverables
      const { data: allVersions, error: versionsError } = await supabase
        .from('deliverable_versions')
        .select('*')
        .in('deliverable_id', deliverableIds)
        .order('created_at', { ascending: true });
      
      if (versionsError) {
        console.error('Error loading deliverable versions:', versionsError);
        // Return deliverables without versions rather than failing
        return deliverables.map(d => ({ ...d, versions: [] }));
      }
      
      // Group versions by deliverable_id
      const versionsByDeliverable = {};
      (allVersions || []).forEach(version => {
        if (!versionsByDeliverable[version.deliverable_id]) {
          versionsByDeliverable[version.deliverable_id] = [];
        }
        versionsByDeliverable[version.deliverable_id].push(version);
      });
      
      // Attach versions to deliverables
      return deliverables.map(deliverable => ({
        ...deliverable,
        versions: versionsByDeliverable[deliverable.id] || []
      }));
    } catch (error) {
      console.error('Failed to filter deliverables:', error);
      throw error;
    }
  }
  
  async update(id, updates) {
    // Remove versions from updates if it exists (versions are in a separate table)
    const { versions, ...cleanUpdates } = updates;
    
    // Get current deliverable to check status changes (without versions to avoid issues)
    const { data: currentDeliverable, error } = await supabase
      .from('deliverables')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Failed to get current deliverable:', error);
      throw error;
    }
    
    // Update with clean data (no versions)
    const result = await super.update(id, cleanUpdates);
    
    // If deliverable was approved, use AutomationService to handle it
    if (cleanUpdates.status === 'approved' && currentDeliverable?.status !== 'approved') {
      await AutomationService.handleDeliverableApproval(result);
    }
    
    // If deliverable was declined, use AutomationService to handle it
    if (cleanUpdates.status === 'declined' && currentDeliverable?.status !== 'declined') {
      // Pass feedback and declined_by safely - these fields might not exist yet
      const feedback = cleanUpdates.feedback || '';
      const declinedBy = cleanUpdates.declined_by || cleanUpdates.declined_by_user || 'System';
      await AutomationService.handleDeliverableDecline(result, feedback, declinedBy);
    }
    
    // Return the result with versions loaded
    return await this.get(result.id);
  }
  
  // Method removed - now handled by AutomationService.handleDeliverableApproval
  
  async createWithVersion(deliverableData, initialVersion = null) {
    const deliverable = await this.create(deliverableData);
    
    // Create initial version if provided
    if (this.useSupabase && initialVersion) {
      const versionData = {
        deliverable_id: deliverable.id,
        version_number: 'V0',
        status: 'not_started',
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

  // Version CRUD Operations
  async getVersions(deliverableId) {
    if (!this.useSupabase) {
      // For localStorage, versions are stored directly on the deliverable
      const deliverable = await this.get(deliverableId);
      return deliverable?.versions || [];
    }

    try {
      const { data, error } = await supabase
        .from('deliverable_versions')
        .select('*')
        .eq('deliverable_id', deliverableId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch deliverable versions:', error);
      return [];
    }
  }

  async createVersion(deliverableId, versionData) {
    if (!this.useSupabase) {
      // For localStorage, update the deliverable with new version
      const deliverable = await this.get(deliverableId);
      if (!deliverable) throw new Error('Deliverable not found');
      
      const newVersion = {
        id: `version_${Date.now()}`,
        deliverable_id: deliverableId,
        created_at: new Date().toISOString(),
        ...versionData
      };
      
      const updatedVersions = [...(deliverable.versions || []), newVersion];
      await this.update(deliverableId, { versions: updatedVersions });
      return newVersion;
    }

    try {
      console.log('Creating version with data:', {
        deliverable_id: deliverableId,
        ...versionData
      });
      
      const { data, error } = await supabase
        .from('deliverable_versions')
        .insert({
          deliverable_id: deliverableId,
          ...versionData
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      console.log('Version created successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to create deliverable version:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      throw error;
    }
  }

  async updateVersion(versionId, updates) {
    if (!this.useSupabase) {
      // For localStorage, find and update the version in the deliverable
      const deliverables = await this.list();
      for (const deliverable of deliverables) {
        const versionIndex = (deliverable.versions || []).findIndex(v => v.id === versionId);
        if (versionIndex !== -1) {
          const updatedVersions = [...deliverable.versions];
          updatedVersions[versionIndex] = {
            ...updatedVersions[versionIndex],
            ...updates,
            updated_at: new Date().toISOString()
          };
          await this.update(deliverable.id, { versions: updatedVersions });
          return updatedVersions[versionIndex];
        }
      }
      throw new Error('Version not found');
    }

    try {
      const { data, error } = await supabase
        .from('deliverable_versions')
        .update(updates)
        .eq('id', versionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update deliverable version:', error);
      throw error;
    }
  }

  async deleteVersion(versionId) {
    if (!this.useSupabase) {
      // For localStorage, find and remove the version from the deliverable
      const deliverables = await this.list();
      for (const deliverable of deliverables) {
        const versionIndex = (deliverable.versions || []).findIndex(v => v.id === versionId);
        if (versionIndex !== -1) {
          const updatedVersions = deliverable.versions.filter(v => v.id !== versionId);
          await this.update(deliverable.id, { versions: updatedVersions });
          return true;
        }
      }
      return false;
    }

    try {
      const { error } = await supabase
        .from('deliverable_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete deliverable version:', error);
      return false;
    }
  }

  async getLatestVersion(deliverableId) {
    const versions = await this.getVersions(deliverableId);
    if (!versions || versions.length === 0) return null;
    
    // Sort by version_number (V0, V1, V2, etc.) or created_at
    const sorted = versions.sort((a, b) => {
      // Try to sort by version_number first
      if (a.version_number && b.version_number) {
        const aNum = parseInt(a.version_number.replace('V', ''));
        const bNum = parseInt(b.version_number.replace('V', ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return bNum - aNum; // Descending order (latest first)
        }
      }
      // Fall back to created_at
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    return sorted[0];
  }
}

class CommentEntity extends SupabaseEntity {
  constructor() {
    super('comments');
  }
  
  mapToDatabase(data) {
    const mapped = { ...data };
    
    // Map content to comment_text for database
    if (mapped.content !== undefined) {
      mapped.comment_text = mapped.content;
      delete mapped.content;
    }
    
    // Remove any non-existent fields
    delete mapped.log_type;
    
    return mapped;
  }
  
  mapFromDatabase(data) {
    if (!data) return data;
    
    const mapped = { ...data };
    
    // Map comment_text to content for frontend
    if (mapped.comment_text !== undefined) {
      mapped.content = mapped.comment_text;
    }
    
    return mapped;
  }
  
  async create(data) {
    const mappedData = this.mapToDatabase(data);
    const result = await super.create(mappedData);
    return this.mapFromDatabase(result);
  }
  
  async update(id, updates) {
    const mappedUpdates = this.mapToDatabase(updates);
    const result = await super.update(id, mappedUpdates);
    return this.mapFromDatabase(result);
  }
  
  async get(id) {
    const result = await super.get(id);
    return this.mapFromDatabase(result);
  }
  
  async list(orderBy) {
    const results = await super.list(orderBy);
    return results.map(item => this.mapFromDatabase(item));
  }
  
  async filter(filters, orderBy) {
    const results = await super.filter(filters, orderBy);
    return results.map(item => this.mapFromDatabase(item));
  }
}

class TemplateEntity extends SupabaseEntity {
  constructor() {
    super('playbook_templates');
  }
  
  mapToDatabase(data) {
    const mapped = { ...data };
    
    // Convert frontend template structure to database structure
    if (mapped.stages) {
      mapped.stages_data = mapped.stages;
      delete mapped.stages;
    }
    
    if (mapped.dependencies) {
      mapped.dependencies_data = mapped.dependencies;
      delete mapped.dependencies;
    }
    
    // Map frontend fields to database fields
    if (mapped.isDefault !== undefined) {
      mapped.is_active = !mapped.isDefault; // Default templates are not editable
      delete mapped.isDefault;
    }
    
    if (mapped.stageCount !== undefined) {
      if (!mapped.settings) mapped.settings = {};
      mapped.settings.stageCount = mapped.stageCount;
      delete mapped.stageCount;
    }
    
    if (mapped.phases !== undefined) {
      if (!mapped.settings) mapped.settings = {};
      mapped.settings.phases = mapped.phases;
      delete mapped.phases;
    }
    
    if (mapped.lastModified !== undefined) {
      mapped.updated_at = mapped.lastModified;
      delete mapped.lastModified;
    }
    
    if (mapped.createdBy !== undefined) {
      // For now, we'll store this in settings since we don't have user context
      if (!mapped.settings) mapped.settings = {};
      mapped.settings.createdBy = mapped.createdBy;
      delete mapped.createdBy;
    }
    
    return mapped;
  }
  
  mapFromDatabase(data) {
    if (!data) return null;
    const mapped = { ...data };
    
    // Convert database structure to frontend structure
    if (mapped.stages_data !== undefined) {
      mapped.stages = mapped.stages_data;
      delete mapped.stages_data;
    }
    
    if (mapped.dependencies_data !== undefined) {
      mapped.dependencies = mapped.dependencies_data;
      delete mapped.dependencies_data;
    }
    
    // Map database fields to frontend fields
    if (mapped.is_active !== undefined) {
      mapped.isDefault = !mapped.is_active; // If not active, it's a default template
    }
    
    if (mapped.settings) {
      if (mapped.settings.stageCount !== undefined) {
        mapped.stageCount = mapped.settings.stageCount;
      }
      if (mapped.settings.phases !== undefined) {
        mapped.phases = mapped.settings.phases;
      }
      if (mapped.settings.createdBy !== undefined) {
        mapped.createdBy = mapped.settings.createdBy;
      }
    }
    
    if (mapped.updated_at !== undefined) {
      mapped.lastModified = mapped.updated_at;
    }
    
    return mapped;
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

class PlaybookTemplateEntity extends TemplateEntity {
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