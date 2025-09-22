/**
 * Stage Status Management Engine
 * Core system for managing the 104-step dependency-driven workflow
 */

import { SupabaseStage as Stage, SupabaseComment as Comment, SupabaseProject as Project } from './supabaseEntities';
import { 
  getDependencyStatus, 
  getCriticalPath, 
  validateDependencyChain,
  CRITICAL_DEPENDENCIES,
  MASTER_UNLOCKS,
  evaluateCascadeImpact,
  cascadeBlockDependents,
  canTransitionToStatus,
  autoUpdateStageStatuses,
  getAllDependentStages
} from '../components/dashboard/DependencyUtils';

class StageManager {
  constructor() {
    this.stageCache = new Map();
    this.listeners = new Set();
  }

  // Subscribe to stage status changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of stage changes
  notifyListeners(changes) {
    this.listeners.forEach(callback => callback(changes));
  }

  // Get all stages with current status for a specific project
  async getAllStages(projectId) {
    try {
      if (!projectId) {
        console.warn('getAllStages called without projectId');
        return [];
      }
      const stages = await Stage.filter({ project_id: projectId });
      return stages.sort((a, b) => a.number_index - b.number_index);
    } catch (error) {
      console.error('Failed to load stages:', error);
      return [];
    }
  }

  // Calculate real progress based on dependencies and priorities
  async calculateRealProgress(projectId) {
    const stages = await this.getAllStages(projectId);
    
    if (stages.length === 0) return 0;

    let totalWeight = 0;
    let completedWeight = 0;

    stages.forEach(stage => {
      // Weight stages by blocking priority
      let weight = 1;
      switch (stage.blocking_priority) {
        case 'critical': weight = 4; break;
        case 'high': weight = 3; break;
        case 'medium': weight = 2; break;
        case 'low': weight = 1; break;
        default: weight = 1;
      }

      // Master unlock stages get extra weight
      if (Object.keys(MASTER_UNLOCKS).includes(stage.number_index.toString())) {
        weight *= 2;
      }

      totalWeight += weight;
      
      if (stage.status === 'completed') {
        completedWeight += weight;
      } else if (stage.status === 'in_progress') {
        // Count in-progress as 50% complete
        completedWeight += (weight * 0.5);
      }
    });

    // Calculate percentage and ensure it's within 0-100 range
    const percentage = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
    return Math.max(0, Math.min(100, Math.round(percentage)));
  }

  // Get stages that are ready to start (all dependencies met)
  async getReadyStages(projectId) {
    const stages = await this.getAllStages(projectId);
    return stages.filter(stage => {
      const status = getDependencyStatus(stage, stages);
      return status === 'ready' && stage.status === 'not_started';
    });
  }

  // Get stages that are blocked by dependencies
  async getBlockedStages(projectId) {
    const stages = await this.getAllStages(projectId);
    return stages.filter(stage => {
      const status = getDependencyStatus(stage, stages);
      return status === 'blocked' && stage.status === 'not_started';
    });
  }

  // Get stages currently in progress
  async getInProgressStages(projectId) {
    const stages = await this.getAllStages(projectId);
    return stages.filter(stage => stage.status === 'in_progress');
  }

  // Get stages that are completed
  async getCompletedStages(projectId) {
    const stages = await this.getAllStages(projectId);
    return stages.filter(stage => stage.status === 'completed');
  }

  // Find bottlenecks - stages that block many others
  async getBottlenecks(projectId) {
    const stages = await this.getAllStages(projectId);
    const bottlenecks = [];

    stages.forEach(stage => {
      if (stage.status !== 'completed') {
        // Count how many stages this one blocks
        const blockedStages = stages.filter(s => 
          s.dependencies && s.dependencies.includes(stage.id) && s.status === 'not_started'
        );

        if (blockedStages.length >= 3) {
          bottlenecks.push({
            stage,
            blockedCount: blockedStages.length,
            blockedStages: blockedStages,
            severity: blockedStages.length >= 10 ? 'critical' : 
                     blockedStages.length >= 5 ? 'high' : 'medium'
          });
        }
      }
    });

    return bottlenecks.sort((a, b) => b.blockedCount - a.blockedCount);
  }

  // Mark a stage as complete and cascade updates
  async completeStage(stageId, completedBy = 'Current User') {
    try {
      // First get the stage to find its project
      const stage = await Stage.get(stageId);
      if (!stage) {
        throw new Error(`Stage ${stageId} not found`);
      }
      const stages = await this.getAllStages(stage.project_id);
      
      // Validate transition
      const validation = canTransitionToStatus(stage, 'completed', stages);
      if (!validation.allowed) {
        throw new Error(validation.reason);
      }

      // Validate stage can be completed
      const dependencyStatus = getDependencyStatus(stage, stages);
      if (dependencyStatus === 'blocked') {
        const incompleteDeps = this.getIncompleteDependencies(stage, stages);
        throw new Error(`Cannot complete stage: ${incompleteDeps.length} dependencies not met`);
      }

      // Update stage status
      await Stage.update(stageId, { 
        status: 'completed'
      });

      // Log completion
      await Comment.create({
        stage_id: stageId,
        project_id: stage.project_id,
        comment_text: `✅ Stage completed by ${completedBy}`,
        content: `✅ Stage completed by ${completedBy}`,
        author_name: 'System',
        author_email: 'system@princess.app',
        user_id: null, // System comment - no specific user
        is_internal: false,
        created_date: new Date().toISOString()
      });

      // Update dependent stages
      const updatedStages = await this.updateDependentStages(stageId);
      
      // Reload stages to get fresh data after the update
      const freshStages = await this.getAllStages(stage.project_id);
      
      // Auto-update any stages that should be unblocked using fresh data
      const autoUpdates = await autoUpdateStageStatuses(freshStages, async (sid, updates) => {
        await Stage.update(sid, updates);
      });

      // Calculate new progress
      const newProgress = await this.calculateRealProgress(stage.project_id);
      
      // Update project progress with validation
      if (stage.project_id) {
        // Ensure progress is within valid range (0-100)
        const validProgress = Math.max(0, Math.min(100, newProgress));
        
        try {
          await Project.update(stage.project_id, { 
            progress_percentage: validProgress,
            updated_at: new Date().toISOString()
          });
        } catch (error) {
          console.error('Failed to update project progress:', error);
          // Don't throw - progress update is non-critical
        }
      }

      // Notify listeners
      this.notifyListeners({
        type: 'stage_completed',
        stage,
        dependentStages: updatedStages,
        newProgress
      });

      return {
        completed: stage,
        dependentStagesUpdated: updatedStages,
        newProgress
      };

    } catch (error) {
      console.error('Failed to complete stage:', error);
      throw error;
    }
  }

  // Start working on a stage
  async startStage(stageId, assignedTo = 'Current User') {
    try {
      // First get the stage to find its project
      const stage = await Stage.get(stageId);
      if (!stage) {
        throw new Error(`Stage ${stageId} not found`);
      }
      const stages = await this.getAllStages(stage.project_id);
      
      if (!stage) {
        throw new Error(`Stage ${stageId} not found`);
      }

      // Validate stage can be started
      const dependencyStatus = getDependencyStatus(stage, stages);
      if (dependencyStatus === 'blocked') {
        throw new Error('Cannot start stage: dependencies not met');
      }

      if (stage.status !== 'not_started' && stage.status !== 'not_ready') {
        throw new Error(`Stage is already ${stage.status}`);
      }

      // Update stage status
      await Stage.update(stageId, { 
        status: 'in_progress',
        start_date: new Date().toISOString()
        // Don't change assigned_to here - it should be a UUID, not 'Current User' string
      });

      // Log start
      await Comment.create({
        stage_id: stageId,
        project_id: stage.project_id,
        comment_text: `🚀 Stage started by ${assignedTo}`,
        content: `🚀 Stage started by ${assignedTo}`,
        author_name: 'System',
        author_email: 'system@princess.app',
        user_id: null, // System comment
        is_internal: false,
        created_date: new Date().toISOString()
      });

      // Notify listeners
      this.notifyListeners({
        type: 'stage_started',
        stage
      });

      return stage;

    } catch (error) {
      console.error('Failed to start stage:', error);
      throw error;
    }
  }

  // Update stages that become ready when dependencies are met
  async updateDependentStages(completedStageId) {
    // Get the completed stage first to find project
    const completedStage = await Stage.get(completedStageId);
    if (!completedStage) return [];
    const stages = await this.getAllStages(completedStage.project_id);
    const updatedStages = [];

    for (const stage of stages) {
      if (stage.dependencies && stage.dependencies.includes(completedStageId)) {
        // Create a copy of stages with the completed stage marked as completed
        const updatedStagesArray = stages.map(s => 
          s.id === completedStageId ? { ...s, status: 'completed' } : s
        );
        const newStatus = getDependencyStatus(stage, updatedStagesArray);
        
        // If stage becomes ready and was blocked or not_started, update it
        if (newStatus === 'ready' && (stage.status === 'not_started' || stage.status === 'blocked')) {
          // Update the stage status to not_started (unblocked)
          await Stage.update(stage.id, { status: 'not_started' });
          
          await Comment.create({
            stage_id: stage.id,
            project_id: stage.project_id,
            comment_text: `🔓 Stage is now ready to start (dependencies completed)`,
            content: `🔓 Stage is now ready to start (dependencies completed)`,
            author_name: 'System',
            author_email: 'system@princess.app',
            user_id: null, // System comment
            is_internal: false,
            created_date: new Date().toISOString()
          });
          
          updatedStages.push({ ...stage, status: 'not_started' });
        }
      }
    }

    return updatedStages;
  }

  // Get incomplete dependencies for a stage
  getIncompleteDependencies(stage, allStages) {
    if (!stage.dependencies) return [];
    
    return stage.dependencies
      .map(depId => allStages.find(s => s.id === depId))
      .filter(dep => dep && dep.status !== 'completed');
  }

  // Comprehensive status change handler with validation and cascade
  async changeStageStatus(stageId, newStatus, options = {}) {
    const { 
      skipValidation = false, 
      skipCascade = false, 
      forceChange = false,
      changedBy = 'Current User',
      reason = null 
    } = options;
    
    try {
      // Get stage and all stages for dependency checking
      const stage = await Stage.get(stageId);
      if (!stage) {
        throw new Error(`Stage ${stageId} not found`);
      }
      
      const stages = await this.getAllStages(stage.project_id);
      const oldStatus = stage.status;
      
      // Skip if no change
      if (oldStatus === newStatus) {
        return { stage, changed: false };
      }
      
      // Validate transition unless skipped
      if (!skipValidation && !forceChange) {
        const validation = canTransitionToStatus(stage, newStatus, stages);
        if (!validation.allowed) {
          throw new Error(validation.reason);
        }
      }
      
      // Evaluate cascade impact
      const impact = evaluateCascadeImpact(stageId, newStatus, stages);
      
      // If there are conflicts and not forcing, return for confirmation
      if (!forceChange && impact.requiresConfirmation) {
        return {
          requiresConfirmation: true,
          impact,
          stage,
          newStatus,
          message: 'This change will affect other stages'
        };
      }
      
      // Handle specific status transitions
      switch (newStatus) {
        case 'completed':
          return await this.completeStage(stageId, changedBy);
          
        case 'in_progress':
          return await this.startStage(stageId, changedBy);
          
        case 'not_started':
        case 'not_ready':
          return await this.resetStage(stageId, reason || `Changed to ${newStatus} by ${changedBy}`, skipCascade);
          
        case 'blocked':
          // Update to blocked status
          await Stage.update(stageId, { status: 'blocked' });
          
          // Log blocking
          await Comment.create({
            stage_id: stageId,
            project_id: stage.project_id,
            comment_text: `🚫 Stage blocked: ${reason || 'Dependencies not met'}`,
            content: `🚫 Stage blocked: ${reason || 'Dependencies not met'}`,
            author_name: 'System',
            author_email: 'system@princess.app',
            user_id: null,
            is_internal: false,
            created_date: new Date().toISOString()
          });
          
          // Apply cascade if needed
          if (!skipCascade) {
            await cascadeBlockDependents(stageId, stages, async (sid, updates) => {
              await Stage.update(sid, updates);
            });
          }
          
          break;
          
        default:
          // Generic status update
          await Stage.update(stageId, { status: newStatus });
      }
      
      // Auto-update stage statuses across the board
      if (!skipCascade) {
        await autoUpdateStageStatuses(stages, async (sid, updates) => {
          await Stage.update(sid, updates);
        });
      }
      
      // Recalculate progress
      const newProgress = await this.calculateRealProgress(stage.project_id);
      
      // Update project progress
      if (stage.project_id) {
        const validProgress = Math.max(0, Math.min(100, newProgress));
        try {
          await Project.update(stage.project_id, { 
            progress_percentage: validProgress,
            updated_at: new Date().toISOString()
          });
        } catch (error) {
          console.error('Failed to update project progress:', error);
        }
      }
      
      // Notify listeners
      this.notifyListeners({
        type: 'stage_status_changed',
        stage,
        oldStatus,
        newStatus,
        impact,
        newProgress
      });
      
      return {
        stage: { ...stage, status: newStatus },
        changed: true,
        impact,
        newProgress
      };
      
    } catch (error) {
      console.error('Failed to change stage status:', error);
      throw error;
    }
  }

  // Validate entire project workflow integrity
  async validateWorkflow(projectId) {
    const stages = await this.getAllStages(projectId);
    const issues = validateDependencyChain(stages);
    
    // Additional validations
    const criticalPath = getCriticalPath(stages);
    const bottlenecks = await this.getBottlenecks();
    
    return {
      dependencyIssues: issues,
      criticalPath,
      bottlenecks,
      totalStages: stages.length,
      readyStages: (await this.getReadyStages()).length,
      blockedStages: (await this.getBlockedStages()).length,
      inProgressStages: (await this.getInProgressStages()).length,
      completedStages: (await this.getCompletedStages()).length
    };
  }

  // Get workflow statistics
  async getWorkflowStats(projectId) {
    const [ready, blocked, inProgress, completed] = await Promise.all([
      this.getReadyStages(projectId),
      this.getBlockedStages(projectId),
      this.getInProgressStages(projectId),
      this.getCompletedStages(projectId)
    ]);

    const progress = await this.calculateRealProgress(projectId);
    const bottlenecks = await this.getBottlenecks(projectId);

    return {
      ready: ready.length,
      blocked: blocked.length,
      inProgress: inProgress.length,
      completed: completed.length,
      total: ready.length + blocked.length + inProgress.length + completed.length,
      progress,
      bottlenecks: bottlenecks.length,
      criticalBottlenecks: bottlenecks.filter(b => b.severity === 'critical').length
    };
  }

  // Reset a stage back to not_started (rollback)
  async resetStage(stageId, reason = 'Manual reset', skipCascade = false) {
    try {
      const stage = await Stage.get(stageId);
      if (!stage) {
        throw new Error(`Stage ${stageId} not found`);
      }
      
      const stages = await this.getAllStages(stage.project_id);
      
      // Evaluate cascade impact
      const impact = evaluateCascadeImpact(stageId, 'not_started', stages);
      
      // If there are conflicts or warnings and cascade is not skipped, return impact for confirmation
      if (!skipCascade && (impact.conflicts.length > 0 || impact.warnings.length > 0)) {
        return {
          requiresConfirmation: true,
          impact,
          message: 'This change will affect dependent stages'
        };
      }

      // Update stage status
      await Stage.update(stageId, { 
        status: 'not_started',
        start_date: null,
      });
      
      // Apply cascade blocking if not skipped
      if (!skipCascade) {
        const cascadeUpdates = await cascadeBlockDependents(stageId, stages, async (sid, updates) => {
          await Stage.update(sid, updates);
          
          // Log blocking
          const blockedStage = stages.find(s => s.id === sid);
          if (blockedStage) {
            await Comment.create({
              stage_id: sid,
              project_id: stage.project_id,
              comment_text: `🚫 Stage blocked: dependency ${stage.name} was reset`,
              content: `🚫 Stage blocked: dependency ${stage.name} was reset`,
              author_name: 'System',
              author_email: 'system@princess.app',
              user_id: null,
              is_internal: false,
              created_date: new Date().toISOString()
            });
          }
        });
      }

      // Log reset
      await Comment.create({
        stage_id: stageId,
        project_id: stage.project_id,
        comment_text: `🔄 Stage reset to not started. Reason: ${reason}`,
        content: `🔄 Stage reset to not started. Reason: ${reason}`,
        author_name: 'System',
        author_email: 'system@princess.app',
        user_id: null, // System comment
        is_internal: false,
        created_date: new Date().toISOString()
      });

      // Recalculate progress
      const newProgress = await this.calculateRealProgress(stage.project_id);
      if (stage.project_id) {
        // Ensure progress is within valid range (0-100)
        const validProgress = Math.max(0, Math.min(100, newProgress));
        
        try {
          await Project.update(stage.project_id, { 
            progress_percentage: validProgress,
            updated_at: new Date().toISOString()
          });
        } catch (error) {
          console.error('Failed to update project progress:', error);
          // Don't throw - progress update is non-critical
        }
      }

      // Notify listeners with cascade information
      this.notifyListeners({
        type: 'stage_reset',
        stage,
        newProgress,
        cascadeImpact: impact
      });

      return {
        stage,
        impact,
        newProgress
      };

    } catch (error) {
      console.error('Failed to reset stage:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const stageManager = new StageManager();

// Export for direct use
export default stageManager;