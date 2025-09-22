import { NotificationEntity } from '@/components/notifications/NotificationCenter';

class NotificationService {
  // Role-based notification routing rules
  static notificationRules = {
    'version_upload': ['all'],
    'approval_request': ['client', 'pm', 'decision_maker'],
    'version_approved': ['agency', 'uploader'],
    'version_declined': ['uploader', 'assigned'],
    'comment_added': ['team', 'watchers'],
    'feedback_received': ['uploader', 'assigned'],
    'status_change': ['team', 'watchers'],
    'assignment': ['assigned'],
    'deadline_warning': ['assigned', 'pm'],
    'bulk_action': ['team'],
    'system_update': ['all'],
    'deliverable_created': ['assigned', 'pm'],
    'revision_needed': ['assigned', 'uploader'],
    'stage_completed': ['all'],
    'iteration_limit_warning': ['pm', 'decision_maker']
  };

  /**
   * Smart routing based on user role and notification type
   */
  static getRecipientsForNotification(type, context = {}) {
    const rules = this.notificationRules[type] || ['all'];
    const recipients = new Set();

    rules.forEach(rule => {
      switch (rule) {
        case 'all':
          recipients.add('all');
          break;
        case 'client':
          // Add all client team members
          recipients.add('role:client');
          break;
        case 'agency':
          // Add all agency team members
          recipients.add('role:agency');
          break;
        case 'pm':
          // Add project manager
          recipients.add('role:pm');
          break;
        case 'decision_maker':
          // Add decision makers
          recipients.add('role:decision_maker');
          break;
        case 'uploader':
          // Add the person who uploaded the file
          if (context.uploadedBy) {
            recipients.add(`user:${context.uploadedBy}`);
          }
          break;
        case 'assigned':
          // Add the assigned team member
          if (context.assignedTo) {
            recipients.add(`user:${context.assignedTo}`);
          }
          break;
        case 'team':
          // Add all team members on the project
          recipients.add('team:project');
          break;
        case 'watchers':
          // Add users watching this item
          if (context.watchers) {
            context.watchers.forEach(w => recipients.add(`user:${w}`));
          }
          break;
      }
    });

    return Array.from(recipients);
  }

  /**
   * Create notification with smart routing
   */
  static async createSmartNotification(type, data, context = {}) {
    const recipients = this.getRecipientsForNotification(type, context);
    
    // Create notification for each recipient group
    const notifications = [];
    for (const recipient of recipients) {
      const notification = await NotificationEntity.create({
        type,
        recipient,
        priority: this.getPriorityForType(type, context),
        ...data
      });
      notifications.push(notification);
    }
    
    return notifications;
  }

  /**
   * Determine priority based on type and context
   */
  static getPriorityForType(type, context = {}) {
    // Critical priority for iteration limits
    if (type === 'iteration_limit_warning' || 
        (type === 'revision_needed' && context.iterationsRemaining <= 1)) {
      return 'critical';
    }
    
    // High priority for approvals and deadlines
    if (['approval_request', 'deadline_warning', 'version_declined'].includes(type)) {
      return 'high';
    }
    
    // Low priority for informational updates
    if (['comment_added', 'status_change', 'bulk_action'].includes(type)) {
      return 'low';
    }
    
    // Default to normal
    return 'normal';
  }
  // Version-related notifications
  static async notifyVersionUpload(deliverable, version, uploadedBy = 'Current User') {
    return await this.createSmartNotification('version_upload', {
      title: 'New Version Uploaded',
      message: `New version ${version.version_number} uploaded for "${deliverable.name}"`,
      data: {
        deliverable_id: deliverable.id,
        deliverable_name: deliverable.name,
        version_number: version.version_number,
        version_id: version.id,
        uploaded_by: uploadedBy
      }
    }, {
      uploadedBy,
      assignedTo: deliverable.assigned_to
    });
  }

  static async notifyApprovalRequest(deliverable, version, requestedBy = 'Current User') {
    return await this.createSmartNotification('approval_request', {
      title: 'Approval Requested',
      message: `Approval requested for version ${version.version_number} of "${deliverable.name}"`,
      data: {
        deliverable_id: deliverable.id,
        deliverable_name: deliverable.name,
        version_number: version.version_number,
        version_id: version.id,
        requested_by: requestedBy,
        action_url: `/deliverables/${deliverable.id}`,
        action_label: 'Review & Approve'
      }
    }, {
      requestedBy
    });
  }

  static async notifyVersionApproved(deliverable, version, approvedBy = 'Current User') {
    return await this.createSmartNotification('version_approved', {
      title: 'Version Approved ✅',
      message: `Version ${version.version_number} approved for "${deliverable.name}"`,
      data: {
        deliverable_id: deliverable.id,
        deliverable_name: deliverable.name,
        version_number: version.version_number,
        version_id: version.id,
        approved_by: approvedBy
      }
    }, {
      uploadedBy: deliverable.uploaded_by,
      assignedTo: deliverable.assigned_to
    });
  }

  static async notifyVersionDeclined(deliverable, version, declinedBy = 'Current User', feedback = '') {
    const iterationsRemaining = (deliverable.max_iterations || 3) - (deliverable.current_iteration || 0);
    
    return await this.createSmartNotification('version_declined', {
      title: 'Revision Required ⚠️',
      message: `Version ${version.version_number} needs revision for "${deliverable.name}"`,
      data: {
        deliverable_id: deliverable.id,
        deliverable_name: deliverable.name,
        version_number: version.version_number,
        version_id: version.id,
        declined_by: declinedBy,
        feedback: feedback,
        iterations_remaining: iterationsRemaining,
        action_url: `/deliverables/${deliverable.id}`,
        action_label: 'Upload Revision'
      }
    }, {
      uploadedBy: deliverable.uploaded_by,
      assignedTo: deliverable.assigned_to,
      iterationsRemaining
    });
  }

  // Comment-related notifications
  static async notifyCommentAdded(deliverable, comment, commentBy = 'Current User') {
    return await NotificationEntity.create({
      type: 'comment_added',
      title: 'New Comment',
      message: `New comment added to "${deliverable.name}"`,
      data: {
        deliverable_id: deliverable.id,
        deliverable_name: deliverable.name,
        comment_id: comment.id,
        comment_content: comment.content,
        comment_by: commentBy
      },
      recipient: 'team',
      priority: 'low'
    });
  }

  static async notifyFeedbackReceived(deliverable, version, feedback, feedbackBy = 'Current User') {
    return await NotificationEntity.create({
      type: 'feedback_received',
      title: 'Feedback Received',
      message: `Feedback received for version ${version.version_number} of "${deliverable.name}"`,
      data: {
        deliverable_id: deliverable.id,
        deliverable_name: deliverable.name,
        version_number: version.version_number,
        version_id: version.id,
        feedback: feedback,
        feedback_by: feedbackBy
      },
      recipient: 'uploader',
      priority: 'normal'
    });
  }

  // Status change notifications
  static async notifyStatusChange(deliverable, oldStatus, newStatus, changedBy = 'Current User') {
    return await NotificationEntity.create({
      type: 'status_change',
      title: 'Status Updated',
      message: `"${deliverable.name}" status changed from ${oldStatus} to ${newStatus}`,
      data: {
        deliverable_id: deliverable.id,
        deliverable_name: deliverable.name,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: changedBy
      },
      recipient: 'team',
      priority: 'low'
    });
  }

  // Assignment notifications
  static async notifyAssignment(deliverable, assignedTo, assignedBy = 'Current User') {
    return await NotificationEntity.create({
      type: 'assignment',
      title: 'New Assignment',
      message: `You have been assigned to "${deliverable.name}"`,
      data: {
        deliverable_id: deliverable.id,
        deliverable_name: deliverable.name,
        assigned_to: assignedTo,
        assigned_by: assignedBy
      },
      recipient: assignedTo,
      priority: 'normal'
    });
  }

  // Deadline notifications
  static async notifyDeadlineApproaching(deliverable, daysRemaining) {
    return await NotificationEntity.create({
      type: 'deadline_warning',
      title: 'Deadline Approaching',
      message: `"${deliverable.name}" deadline is in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
      data: {
        deliverable_id: deliverable.id,
        deliverable_name: deliverable.name,
        days_remaining: daysRemaining
      },
      recipient: 'assigned',
      priority: 'high'
    });
  }

  // Bulk notifications
  static async notifyBulkAction(action, count, actionBy = 'Current User') {
    return await NotificationEntity.create({
      type: 'bulk_action',
      title: 'Bulk Action Completed',
      message: `${action} completed on ${count} item${count !== 1 ? 's' : ''}`,
      data: {
        action: action,
        count: count,
        action_by: actionBy
      },
      recipient: 'team',
      priority: 'low'
    });
  }

  // System notifications
  static async notifySystemUpdate(message, priority = 'normal') {
    return await NotificationEntity.create({
      type: 'system_update',
      title: 'System Update',
      message: message,
      data: {
        update_time: new Date().toISOString()
      },
      recipient: 'all',
      priority: priority
    });
  }

  // Get notification statistics
  static async getNotificationStats() {
    const notifications = await NotificationEntity.list();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      today: notifications.filter(n => new Date(n.created_date) >= today).length,
      thisWeek: notifications.filter(n => new Date(n.created_date) >= week).length,
      byType: notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * Batch notification system for sending multiple notifications efficiently
   */
  static batchNotifications = [];
  static batchTimer = null;
  static BATCH_DELAY = 500; // 500ms delay to batch notifications

  /**
   * Add notification to batch queue
   */
  static queueNotification(type, data, context = {}) {
    this.batchNotifications.push({ type, data, context });
    
    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // Set new timer to process batch
    this.batchTimer = setTimeout(() => {
      this.processBatchNotifications();
    }, this.BATCH_DELAY);
  }

  /**
   * Process all batched notifications
   */
  static async processBatchNotifications() {
    if (this.batchNotifications.length === 0) return;
    
    const batch = [...this.batchNotifications];
    this.batchNotifications = [];
    
    // Group notifications by type and recipient
    const grouped = {};
    
    batch.forEach(({ type, data, context }) => {
      const recipients = this.getRecipientsForNotification(type, context);
      recipients.forEach(recipient => {
        const key = `${type}:${recipient}`;
        if (!grouped[key]) {
          grouped[key] = {
            type,
            recipient,
            items: [],
            priority: this.getPriorityForType(type, context)
          };
        }
        grouped[key].items.push(data);
      });
    });
    
    // Create consolidated notifications
    const notifications = [];
    for (const group of Object.values(grouped)) {
      if (group.items.length === 1) {
        // Single notification
        const notification = await NotificationEntity.create({
          type: group.type,
          recipient: group.recipient,
          priority: group.priority,
          ...group.items[0]
        });
        notifications.push(notification);
      } else {
        // Batch notification
        const notification = await NotificationEntity.create({
          type: `batch_${group.type}`,
          recipient: group.recipient,
          priority: group.priority,
          title: `${group.items.length} ${this.getTypeLabel(group.type)}`,
          message: this.getBatchMessage(group.type, group.items),
          data: {
            batch: true,
            items: group.items
          }
        });
        notifications.push(notification);
      }
    }
    
    return notifications;
  }

  /**
   * Get human-readable label for notification type
   */
  static getTypeLabel(type) {
    const labels = {
      'version_upload': 'new versions',
      'approval_request': 'approval requests',
      'version_approved': 'approvals',
      'version_declined': 'revisions needed',
      'comment_added': 'new comments',
      'status_change': 'status updates',
      'deadline_warning': 'deadline warnings'
    };
    return labels[type] || 'notifications';
  }

  /**
   * Generate message for batch notifications
   */
  static getBatchMessage(type, items) {
    switch (type) {
      case 'version_upload':
        return `${items.length} new versions uploaded across multiple deliverables`;
      case 'approval_request':
        return `${items.length} deliverables require your approval`;
      case 'version_declined':
        return `${items.length} deliverables need revision`;
      case 'comment_added':
        return `${items.length} new comments across deliverables`;
      case 'deadline_warning':
        const urgent = items.filter(i => i.data?.days_remaining <= 1).length;
        return urgent > 0 
          ? `${urgent} urgent deadline${urgent !== 1 ? 's' : ''} and ${items.length - urgent} approaching`
          : `${items.length} deadlines approaching`;
      default:
        return `${items.length} ${this.getTypeLabel(type)}`;
    }
  }

  /**
   * Clear batch queue
   */
  static clearBatchQueue() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.batchNotifications = [];
  }
}

export default NotificationService;