/**
 * Stage Status Management Engine
 * Core system for managing the 104-step dependency-driven workflow
 */

import { Stage, Comment, Project } from './entities';
import { 
  getDependencyStatus, 
  getCriticalPath, 
  validateDependencyChain,
  CRITICAL_DEPENDENCIES,
  MASTER_UNLOCKS
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

  // Get all stages with current status
  async getAllStages() {
    try {
      const stages = await Stage.list();
      return stages.sort((a, b) => a.number_index - b.number_index);
    } catch (error) {
      console.error('Failed to load stages:', error);
      return [];
    }
  }

  // Calculate real progress based on dependencies and priorities
  async calculateRealProgress() {
    const stages = await this.getAllStages();
    
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

    return Math.round((completedWeight / totalWeight) * 100);
  }

  // Get stages that are ready to start (all dependencies met)
  async getReadyStages() {
    const stages = await this.getAllStages();
    return stages.filter(stage => {
      const status = getDependencyStatus(stage, stages);
      return status === 'ready' && stage.status === 'not_started';
    });
  }

  // Get stages that are blocked by dependencies
  async getBlockedStages() {
    const stages = await this.getAllStages();
    return stages.filter(stage => {
      const status = getDependencyStatus(stage, stages);
      return status === 'blocked' && stage.status === 'not_started';
    });
  }

  // Get stages currently in progress
  async getInProgressStages() {
    const stages = await this.getAllStages();
    return stages.filter(stage => stage.status === 'in_progress');
  }

  // Get stages that are completed
  async getCompletedStages() {
    const stages = await this.getAllStages();
    return stages.filter(stage => stage.status === 'completed');
  }

  // Find bottlenecks - stages that block many others
  async getBottlenecks() {
    const stages = await this.getAllStages();
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
      const stages = await this.getAllStages();
      const stage = stages.find(s => s.id === stageId);
      
      if (!stage) {
        throw new Error(`Stage ${stageId} not found`);
      }

      // Validate stage can be completed
      const dependencyStatus = getDependencyStatus(stage, stages);
      if (dependencyStatus === 'blocked') {
        const incompleteDeps = this.getIncompleteDependencies(stage, stages);
        throw new Error(`Cannot complete stage: ${incompleteDeps.length} dependencies not met`);
      }

      // Update stage status
      await Stage.update(stageId, { 
        status: 'completed',
        completed_date: new Date().toISOString(),
        completed_by: completedBy
      });

      // Log completion
      await Comment.create({
        stage_id: stageId,
        project_id: stage.project_id,
        content: `✅ Stage completed by ${completedBy}`,
        author_name: completedBy,
        author_email: 'system@agency.com',
        log_type: 'status_update'
      });

      // Update dependent stages
      const updatedStages = await this.updateDependentStages(stageId);

      // Calculate new progress
      const newProgress = await this.calculateRealProgress();
      
      // Update project progress
      if (stage.project_id) {
        await Project.update(stage.project_id, { 
          progress_percentage: newProgress,
          updated_date: new Date().toISOString()
        });
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
      const stages = await this.getAllStages();
      const stage = stages.find(s => s.id === stageId);
      
      if (!stage) {
        throw new Error(`Stage ${stageId} not found`);
      }

      // Validate stage can be started
      const dependencyStatus = getDependencyStatus(stage, stages);
      if (dependencyStatus === 'blocked') {
        throw new Error('Cannot start stage: dependencies not met');
      }

      if (stage.status !== 'not_started') {
        throw new Error(`Stage is already ${stage.status}`);
      }

      // Update stage status
      await Stage.update(stageId, { 
        status: 'in_progress',
        started_date: new Date().toISOString(),
        assigned_to: assignedTo
      });

      // Log start
      await Comment.create({
        stage_id: stageId,
        project_id: stage.project_id,
        content: `🚀 Stage started by ${assignedTo}`,
        author_name: assignedTo,
        author_email: 'system@agency.com',
        log_type: 'status_update'
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
    const stages = await this.getAllStages();
    const updatedStages = [];

    for (const stage of stages) {
      if (stage.dependencies && stage.dependencies.includes(completedStageId)) {
        const newStatus = getDependencyStatus(stage, stages);
        
        // If stage becomes ready and was not_started, it's now available
        if (newStatus === 'ready' && stage.status === 'not_started') {
          await Comment.create({
            stage_id: stage.id,
            project_id: stage.project_id,
            content: `🔓 Stage is now ready to start (dependencies completed)`,
            author_name: 'System',
            author_email: 'system@agency.com',
            log_type: 'dependency_update'
          });
          
          updatedStages.push(stage);
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

  // Validate entire project workflow integrity
  async validateWorkflow() {
    const stages = await this.getAllStages();
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
  async getWorkflowStats() {
    const [ready, blocked, inProgress, completed] = await Promise.all([
      this.getReadyStages(),
      this.getBlockedStages(),
      this.getInProgressStages(),
      this.getCompletedStages()
    ]);

    const progress = await this.calculateRealProgress();
    const bottlenecks = await this.getBottlenecks();

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
  async resetStage(stageId, reason = 'Manual reset') {
    try {
      const stage = await Stage.get(stageId);
      if (!stage) {
        throw new Error(`Stage ${stageId} not found`);
      }

      // Update stage status
      await Stage.update(stageId, { 
        status: 'not_started',
        started_date: null,
        completed_date: null,
        completed_by: null
      });

      // Log reset
      await Comment.create({
        stage_id: stageId,
        project_id: stage.project_id,
        content: `🔄 Stage reset to not started. Reason: ${reason}`,
        author_name: 'System',
        author_email: 'system@agency.com',
        log_type: 'status_update'
      });

      // Recalculate progress
      const newProgress = await this.calculateRealProgress();
      if (stage.project_id) {
        await Project.update(stage.project_id, { 
          progress_percentage: newProgress,
          updated_date: new Date().toISOString()
        });
      }

      // Notify listeners
      this.notifyListeners({
        type: 'stage_reset',
        stage,
        newProgress
      });

      return stage;

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