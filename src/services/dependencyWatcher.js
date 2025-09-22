/**
 * Dependency Watcher Service
 * Real-time monitoring and automatic status updates based on dependency changes
 */

import { 
  getDependencyStatus, 
  getAllDependentStages,
  autoUpdateStageStatuses,
  evaluateCascadeImpact
} from '../components/dashboard/DependencyUtils';
import stageManager from '../api/stageManager';

class DependencyWatcher {
  constructor() {
    this.watchInterval = null;
    this.lastSnapshot = new Map();
    this.subscribers = new Set();
    this.isWatching = false;
  }

  /**
   * Start watching for dependency changes
   */
  startWatching(projectId, interval = 5000) {
    if (this.isWatching) return;
    
    this.isWatching = true;
    this.projectId = projectId;
    
    // Initial check
    this.checkDependencies();
    
    // Set up periodic checking
    this.watchInterval = setInterval(() => {
      this.checkDependencies();
    }, interval);
  }

  /**
   * Stop watching
   */
  stopWatching() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    this.isWatching = false;
    this.lastSnapshot.clear();
  }

  /**
   * Check dependencies and update statuses
   */
  async checkDependencies() {
    if (!this.projectId) return;
    
    try {
      const stages = await stageManager.getAllStages(this.projectId);
      const changes = [];
      
      // Check each stage for status changes
      for (const stage of stages) {
        const lastStatus = this.lastSnapshot.get(stage.id);
        const currentDependencyStatus = getDependencyStatus(stage, stages);
        
        // Determine what the status should be
        let expectedStatus = stage.status;
        
        // Auto-manage blocked status
        if (stage.status === 'not_started' || stage.status === 'not_ready') {
          if (currentDependencyStatus === 'blocked') {
            expectedStatus = 'blocked';
          } else if (currentDependencyStatus === 'ready' && stage.status === 'blocked') {
            expectedStatus = 'not_started';
          }
        }
        
        // Check if status needs to change
        if (expectedStatus !== stage.status) {
          changes.push({
            stage,
            oldStatus: stage.status,
            newStatus: expectedStatus,
            reason: currentDependencyStatus === 'blocked' 
              ? 'Dependencies not met' 
              : 'Dependencies completed'
          });
        }
        
        // Update snapshot
        this.lastSnapshot.set(stage.id, stage.status);
      }
      
      // Apply changes if any
      if (changes.length > 0) {
        await this.applyStatusChanges(changes);
      }
      
      // Check for auto-unblocking opportunities
      await this.checkAutoUnblocking(stages);
      
    } catch (error) {
      console.error('Dependency watcher error:', error);
    }
  }

  /**
   * Apply detected status changes
   */
  async applyStatusChanges(changes) {
    for (const change of changes) {
      try {
        // Use the comprehensive status change handler
        const result = await stageManager.changeStageStatus(
          change.stage.id, 
          change.newStatus,
          {
            skipValidation: false,
            skipCascade: false,
            forceChange: false,
            changedBy: 'System',
            reason: change.reason
          }
        );
        
        // Notify subscribers
        if (result.changed) {
          this.notifySubscribers({
            type: 'status_auto_updated',
            stage: change.stage,
            oldStatus: change.oldStatus,
            newStatus: change.newStatus,
            reason: change.reason
          });
        }
      } catch (error) {
        console.error(`Failed to auto-update stage ${change.stage.name}:`, error);
      }
    }
  }

  /**
   * Check for stages that can be automatically unblocked
   */
  async checkAutoUnblocking(stages) {
    const blockedStages = stages.filter(s => s.status === 'blocked');
    
    for (const stage of blockedStages) {
      const depStatus = getDependencyStatus(stage, stages);
      
      if (depStatus === 'ready') {
        try {
          // Check if this stage has a pre-assignment
          const hasPreAssignment = stage.assigned_to !== null && stage.assigned_to !== undefined;
          
          // Unblock the stage
          await stageManager.changeStageStatus(
            stage.id,
            'not_started',
            {
              skipValidation: true,
              skipCascade: false,
              forceChange: true,
              changedBy: 'System',
              reason: 'All dependencies completed - automatically unblocked'
            }
          );
          
          // Enhanced notification for pre-assigned stages
          if (hasPreAssignment) {
            // Get team member details if available
            const assignedMember = stages.teamMembers?.find(m => m.id === stage.assigned_to);
            
            this.notifySubscribers({
              type: 'pre_assigned_stage_ready',
              stage,
              assignedTo: assignedMember,
              reason: 'Dependencies completed - pre-assigned stage is now ready',
              priority: 'high'
            });
          } else {
            // Standard notification
            this.notifySubscribers({
              type: 'stage_unblocked',
              stage,
              reason: 'Dependencies completed'
            });
          }
          
        } catch (error) {
          console.error(`Failed to unblock stage ${stage.name}:`, error);
        }
      }
    }
  }

  /**
   * Subscribe to watcher events
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers
   */
  notifySubscribers(event) {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Subscriber notification error:', error);
      }
    });
  }

  /**
   * Get dependency chain for a stage
   */
  getDependencyChain(stageId, stages) {
    const chain = [];
    const visited = new Set();
    
    const traverse = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const stage = stages.find(s => s.id === id);
      if (!stage) return;
      
      chain.push(stage);
      
      if (stage.dependencies) {
        stage.dependencies.forEach(depId => traverse(depId));
      }
    };
    
    traverse(stageId);
    return chain.reverse(); // Return in dependency order
  }

  /**
   * Analyze potential impact of a status change
   */
  async analyzeImpact(stageId, newStatus) {
    if (!this.projectId) return null;
    
    const stages = await stageManager.getAllStages(this.projectId);
    return evaluateCascadeImpact(stageId, newStatus, stages);
  }

  /**
   * Get all blocked stages and their blocking reasons
   */
  async getBlockedStagesWithReasons() {
    if (!this.projectId) return [];
    
    const stages = await stageManager.getAllStages(this.projectId);
    const blocked = [];
    
    for (const stage of stages) {
      if (stage.status === 'blocked' || getDependencyStatus(stage, stages) === 'blocked') {
        const incompleteDeps = stage.dependencies
          ? stage.dependencies
              .map(depId => stages.find(s => s.id === depId))
              .filter(dep => dep && dep.status !== 'completed')
          : [];
        
        blocked.push({
          stage,
          blockingStages: incompleteDeps,
          reason: incompleteDeps.length > 0 
            ? `Waiting for: ${incompleteDeps.map(d => d.name).join(', ')}`
            : 'Dependencies not met'
        });
      }
    }
    
    return blocked;
  }

  /**
   * Get all pre-assigned stages (blocked but assigned)
   */
  async getPreAssignedStages() {
    if (!this.projectId) return [];
    
    const stages = await stageManager.getAllStages(this.projectId);
    const preAssigned = [];
    
    for (const stage of stages) {
      const depStatus = getDependencyStatus(stage, stages);
      
      // Check if stage is blocked but has an assignment
      if ((stage.status === 'blocked' || depStatus === 'blocked') && stage.assigned_to) {
        const incompleteDeps = stage.dependencies
          ? stage.dependencies
              .map(depId => stages.find(s => s.id === depId))
              .filter(dep => dep && dep.status !== 'completed')
          : [];
        
        preAssigned.push({
          stage,
          assignedTo: stage.assigned_to,
          blockingDependencies: incompleteDeps,
          estimatedReadyDate: null, // Could be calculated based on dependency timelines
          type: 'pre_assignment'
        });
      }
    }
    
    return preAssigned;
  }
  
  /**
   * Notify team member about pre-assignment becoming ready
   */
  notifyPreAssignmentReady(stage, assignedMember) {
    // This could integrate with email/SMS notifications in production
    this.notifySubscribers({
      type: 'urgent_notification',
      title: `Your pre-assigned stage "${stage.name}" is now ready!`,
      message: `All dependencies have been completed. You can now begin work on ${stage.name}.`,
      assignedTo: assignedMember,
      stage,
      priority: 'high',
      actionRequired: true
    });
  }
  
  /**
   * Force refresh and check all dependencies
   */
  async forceRefresh() {
    if (this.projectId) {
      await this.checkDependencies();
    }
  }
}

// Create singleton instance
const dependencyWatcher = new DependencyWatcher();

// Export for use
export default dependencyWatcher;