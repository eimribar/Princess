/**
 * Automation Service
 * Handles all automated workflows for deliverables and stages
 */

// Import will be dynamic to avoid circular dependency
import NotificationService from './notificationService';
import { addDays } from 'date-fns';

class AutomationService {
  // Retry configuration
  static MAX_RETRIES = 3;
  static RETRY_DELAY = 1000; // Start with 1 second

  /**
   * Execute a function with retry logic
   */
  static async withRetry(fn, context = 'operation') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await fn();
        
        // Log successful automation
        this.logAutomation({
          event: context,
          success: true,
          attempt,
          timestamp: new Date().toISOString()
        });
        
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed for ${context}:`, error);
        
        if (attempt < this.MAX_RETRIES) {
          // Exponential backoff
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Log failed automation
    this.logAutomation({
      event: context,
      success: false,
      error: lastError?.message,
      attempts: this.MAX_RETRIES,
      timestamp: new Date().toISOString()
    });
    
    throw lastError;
  }

  /**
   * Create deliverable for stage with enhanced error handling
   */
  static async createDeliverableForStage(stage) {
    // Dynamically import to avoid circular dependency
    const { SupabaseStage, SupabaseDeliverable } = await import('@/api/supabaseEntities');
    
    return this.withRetry(async () => {
      // Check if deliverable already exists
      const existingDeliverables = await SupabaseDeliverable.filter({ 
        stage_id: stage.id 
      });
      
      if (existingDeliverables?.length > 0) {
        console.log(`Deliverable already exists for stage ${stage.id}`);
        return existingDeliverables[0];
      }

      // Create new deliverable
      const deliverableData = {
        project_id: stage.project_id,
        stage_id: stage.id,
        name: stage.name,
        description: stage.description || `Deliverable for ${stage.name}`,
        category: stage.category,
        type: this.determineDeliverableType(stage.category),
        status: 'draft',
        max_iterations: 3,
        current_iteration: 0,
        original_deadline: stage.end_date,
        adjusted_deadline: stage.end_date,
        deadline_impact_total: 0,
        is_final: false,
        include_in_brandbook: ['brand_building', 'strategy'].includes(stage.category),
        assigned_to: stage.assigned_to
      };

      const deliverable = await SupabaseDeliverable.create(deliverableData);
      
      // Update stage with deliverable_id
      await SupabaseStage.update(stage.id, { 
        deliverable_id: deliverable.id,
        _skipDeliverableSync: true // Prevent sync loop
      });
      
      // Notify team of new deliverable
      await this.notifyDeliverableCreated(stage, deliverable);
      
      return deliverable;
    }, 'createDeliverableForStage');
  }

  /**
   * Sync status between stage and deliverable with conflict resolution
   */
  static async syncStageDeliverableStatus(stage, deliverable) {
    const { SupabaseStage, SupabaseDeliverable } = await import('@/api/supabaseEntities');
    
    return this.withRetry(async () => {
      // Get latest versions to handle conflicts
      const latestStage = await SupabaseStage.get(stage.id);
      const latestDeliverable = await SupabaseDeliverable.get(deliverable.id);
      
      // Determine which status should take precedence
      const stageUpdatedAt = new Date(latestStage.updated_at);
      const deliverableUpdatedAt = new Date(latestDeliverable.updated_at);
      
      // More recent update takes precedence
      if (stageUpdatedAt > deliverableUpdatedAt) {
        // Sync stage status to deliverable
        const newDeliverableStatus = this.mapStageToDeliverableStatus(latestStage.status);
        if (newDeliverableStatus !== latestDeliverable.status) {
          await SupabaseDeliverable.update(deliverable.id, { 
            status: newDeliverableStatus
          });
        }
      } else if (deliverableUpdatedAt > stageUpdatedAt) {
        // Sync deliverable status to stage
        const newStageStatus = this.mapDeliverableToStageStatus(latestDeliverable.status);
        if (newStageStatus !== latestStage.status) {
          await SupabaseStage.update(stage.id, { 
            status: newStageStatus,
            _skipDeliverableSync: true
          });
        }
      }
      
      return { stage: latestStage, deliverable: latestDeliverable };
    }, 'syncStageDeliverableStatus');
  }

  /**
   * Handle deliverable approval with stage completion
   */
  static async handleDeliverableApproval(deliverable) {
    const { SupabaseStage, SupabaseDeliverable } = await import('@/api/supabaseEntities');
    
    return this.withRetry(async () => {
      // Update deliverable status
      const updatedDeliverable = await SupabaseDeliverable.update(deliverable.id, {
        status: 'approved',
        is_final: true,
        approved_at: new Date().toISOString()
      });
      
      // Complete associated stage
      if (deliverable.stage_id) {
        const stage = await SupabaseStage.get(deliverable.stage_id);
        if (stage && stage.status !== 'completed') {
          await SupabaseStage.update(stage.id, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            _skipDeliverableSync: true
          });
          
          // Notify team of completion
          await this.notifyStageCompleted(stage, deliverable);
        }
      }
      
      return updatedDeliverable;
    }, 'handleDeliverableApproval');
  }

  /**
   * Handle deliverable decline with notifications
   */
  static async handleDeliverableDecline(deliverable, feedback, declinedBy) {
    const { SupabaseStage, SupabaseDeliverable } = await import('@/api/supabaseEntities');
    
    return this.withRetry(async () => {
      // Update deliverable
      const updatedDeliverable = await SupabaseDeliverable.update(deliverable.id, {
        status: 'declined',
        current_iteration: (deliverable.current_iteration || 0) + 1,
        deadline_impact_total: (deliverable.deadline_impact_total || 0) + 3,
        adjusted_deadline: addDays(new Date(deliverable.adjusted_deadline || deliverable.original_deadline), 3)
      });
      
      // Keep stage in progress
      if (deliverable.stage_id) {
        await SupabaseStage.update(deliverable.stage_id, {
          status: 'in_progress',
          _skipDeliverableSync: true
        });
      }
      
      // Notify assigned team member
      await this.notifyRevisionNeeded(deliverable, feedback, declinedBy);
      
      return updatedDeliverable;
    }, 'handleDeliverableDecline');
  }

  /**
   * Notification Methods
   */
  static async notifyDeliverableCreated(stage, deliverable) {
    const { SupabaseTeamMember } = await import('@/api/supabaseEntities');
    
    // Get assigned team member
    const assignee = stage.assigned_to ? 
      await SupabaseTeamMember.get(stage.assigned_to) : null;
    
    await NotificationService.create({
      type: 'info',
      title: 'New Deliverable Created',
      message: `Deliverable "${deliverable.name}" has been created for stage ${stage.number_index}`,
      recipient: assignee?.email || 'team',
      data: {
        stage_id: stage.id,
        deliverable_id: deliverable.id,
        action_url: `/deliverables/${deliverable.id}`
      },
      priority: 'normal'
    });
  }

  static async notifyRevisionNeeded(deliverable, feedback, declinedBy) {
    const { SupabaseTeamMember } = await import('@/api/supabaseEntities');
    
    // Get assigned team member
    const assignee = deliverable.assigned_to ? 
      await SupabaseTeamMember.get(deliverable.assigned_to) : null;
    
    // Check if approaching iteration limit
    const iterationsRemaining = (deliverable.max_iterations || 3) - (deliverable.current_iteration || 0);
    const priority = iterationsRemaining <= 1 ? 'high' : 'normal';
    
    await NotificationService.create({
      type: iterationsRemaining <= 1 ? 'warning' : 'info',
      title: 'Revision Required',
      message: `"${deliverable.name}" needs revision. ${iterationsRemaining} iteration${iterationsRemaining !== 1 ? 's' : ''} remaining.`,
      recipient: assignee?.email || 'team',
      data: {
        deliverable_id: deliverable.id,
        feedback,
        declined_by: declinedBy,
        iterations_remaining: iterationsRemaining,
        action_url: `/deliverables/${deliverable.id}`,
        action_label: 'Upload Revision'
      },
      priority
    });
    
    // Notify PM if last iteration
    if (iterationsRemaining <= 1) {
      await NotificationService.create({
        type: 'warning',
        title: 'Deliverable at Iteration Limit',
        message: `"${deliverable.name}" has only ${iterationsRemaining} iteration${iterationsRemaining !== 1 ? 's' : ''} remaining`,
        recipient: 'pm',
        data: {
          deliverable_id: deliverable.id,
          assignee: assignee?.name,
          action_url: `/deliverables/${deliverable.id}`
        },
        priority: 'high'
      });
    }
  }

  static async notifyStageCompleted(stage, deliverable) {
    await NotificationService.create({
      type: 'success',
      title: 'Stage Completed',
      message: `Stage ${stage.number_index}: "${stage.name}" has been completed`,
      recipient: 'all',
      data: {
        stage_id: stage.id,
        deliverable_id: deliverable.id,
        completed_at: new Date().toISOString()
      },
      priority: 'normal'
    });
  }

  /**
   * Helper Methods
   */
  static determineDeliverableType(category) {
    const typeMap = {
      'research': 'research',
      'strategy': 'strategy',
      'brand_building': 'creative',
      'brand_collaterals': 'creative',
      'brand_activation': 'creative',
      'onboarding': 'document',
      'project_closure': 'document'
    };
    return typeMap[category] || 'document';
  }

  static mapStageToDeliverableStatus(stageStatus) {
    const statusMap = {
      'not_started': 'draft',
      'not_ready': 'draft',
      'in_progress': 'wip',
      'blocked': 'draft',
      'completed': 'approved'
    };
    return statusMap[stageStatus] || 'draft';
  }

  static mapDeliverableToStageStatus(deliverableStatus) {
    const statusMap = {
      'draft': 'not_started',
      'wip': 'in_progress',
      'submitted': 'in_progress',
      'pending_approval': 'in_progress',
      'declined': 'in_progress',
      'approved': 'completed'
    };
    return statusMap[deliverableStatus] || 'not_started';
  }

  /**
   * Automation Logging
   */
  static logAutomation(logEntry) {
    // In production, this would write to a database or logging service
    const logs = JSON.parse(localStorage.getItem('automation_logs') || '[]');
    logs.push(logEntry);
    
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('automation_logs', JSON.stringify(logs));
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Automation]', logEntry);
    }
  }

  /**
   * Get automation logs for monitoring
   */
  static getAutomationLogs(limit = 50) {
    const logs = JSON.parse(localStorage.getItem('automation_logs') || '[]');
    return logs.slice(-limit).reverse();
  }

  /**
   * Check automation health
   */
  static async checkHealth() {
    const logs = this.getAutomationLogs(100);
    const recentLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return logTime > hourAgo;
    });
    
    const successRate = recentLogs.length > 0
      ? recentLogs.filter(log => log.success).length / recentLogs.length
      : 1;
    
    const failedLogs = recentLogs.filter(log => !log.success);
    
    return {
      healthy: successRate >= 0.95,
      successRate: Math.round(successRate * 100),
      totalLogs: recentLogs.length,
      failedCount: failedLogs.length,
      recentFailures: failedLogs.slice(0, 5)
    };
  }
}

export default AutomationService;