import { NotificationEntity } from '@/components/notifications/NotificationCenter';

class NotificationService {
  // Version-related notifications
  static async notifyVersionUpload(deliverable, version, uploadedBy = 'Current User') {
    return await NotificationEntity.create({
      type: 'version_upload',
      title: 'New Version Uploaded',
      message: `New version ${version.version_number} uploaded for "${deliverable.name}"`,
      data: {
        deliverable_id: deliverable.id,
        deliverable_name: deliverable.name,
        version_number: version.version_number,
        version_id: version.id,
        uploaded_by: uploadedBy
      },
      recipient: 'all', // Could be specific users in the future
      priority: 'normal'
    });
  }

  static async notifyApprovalRequest(deliverable, version, requestedBy = 'Current User') {
    return await NotificationEntity.create({
      type: 'approval_request',
      title: 'Approval Requested',
      message: `Approval requested for version ${version.version_number} of "${deliverable.name}"`,
      data: {
        deliverable_id: deliverable.id,
        deliverable_name: deliverable.name,
        version_number: version.version_number,
        version_id: version.id,
        requested_by: requestedBy
      },
      recipient: 'approvers',
      priority: 'high'
    });
  }

  static async notifyVersionApproved(deliverable, version, approvedBy = 'Current User') {
    return await NotificationEntity.create({
      type: 'version_approved',
      title: 'Version Approved',
      message: `Version ${version.version_number} approved for "${deliverable.name}"`,
      data: {
        deliverable_id: deliverable.id,
        deliverable_name: deliverable.name,
        version_number: version.version_number,
        version_id: version.id,
        approved_by: approvedBy
      },
      recipient: 'team',
      priority: 'normal'
    });
  }

  static async notifyVersionDeclined(deliverable, version, declinedBy = 'Current User', feedback = '') {
    return await NotificationEntity.create({
      type: 'version_declined',
      title: 'Version Declined',
      message: `Version ${version.version_number} declined for "${deliverable.name}"`,
      data: {
        deliverable_id: deliverable.id,
        deliverable_name: deliverable.name,
        version_number: version.version_number,
        version_id: version.id,
        declined_by: declinedBy,
        feedback: feedback
      },
      recipient: 'uploader',
      priority: 'high'
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
}

export default NotificationService;