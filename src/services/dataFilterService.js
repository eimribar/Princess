/**
 * Data Filter Service
 * 
 * Intelligent data filtering based on user roles and permissions.
 * This service ensures clients only see appropriate data while
 * agency teams have full access to all information.
 * 
 * Features:
 * - Role-based filtering
 * - Client-facing flag support
 * - Internal comment hiding
 * - Sensitive data sanitization
 * - Financial information filtering
 * - Performance optimized with caching
 */

class DataFilterService {
  constructor() {
    // Cache filtered results for performance
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5 seconds cache
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache key
   */
  getCacheKey(dataType, userRole, data) {
    return `${dataType}-${userRole}-${JSON.stringify(data).substring(0, 100)}`;
  }

  /**
   * Main filter method - filters any data based on user role
   */
  filterData(data, dataType, user) {
    if (!data || !user) return data;

    // Check cache first
    const cacheKey = this.getCacheKey(dataType, user.role, data);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    let filteredData;

    switch (dataType) {
      case 'stages':
        filteredData = this.filterStages(data, user);
        break;
      case 'deliverables':
        filteredData = this.filterDeliverables(data, user);
        break;
      case 'comments':
        filteredData = this.filterComments(data, user);
        break;
      case 'team':
        filteredData = this.filterTeamMembers(data, user);
        break;
      case 'notifications':
        filteredData = this.filterNotifications(data, user);
        break;
      case 'timeline':
        filteredData = this.filterTimeline(data, user);
        break;
      case 'financial':
        filteredData = this.filterFinancial(data, user);
        break;
      default:
        filteredData = data;
    }

    // Cache the result
    this.cache.set(cacheKey, {
      data: filteredData,
      timestamp: Date.now()
    });

    return filteredData;
  }

  /**
   * Filter stages based on user role
   */
  filterStages(stages, user) {
    if (!Array.isArray(stages)) return stages;

    if (user.role === 'client') {
      // Clients only see client-facing stages
      return stages.map(stage => {
        // Only exclude stages explicitly marked as not client-facing
        if (stage.client_facing === false) return null;
        
        // Remove sensitive information but keep the stage
        const filtered = { ...stage };
        delete filtered.internal_notes;
        delete filtered.cost_estimate;
        delete filtered.resource_allocation;
        delete filtered.risk_assessment;
        
        // Simplify status for clients
        if (filtered.status === 'blocked' && filtered.blocking_reason?.includes('internal')) {
          filtered.blocking_reason = 'Pending internal review';
        }
        
        return filtered;
      }).filter(Boolean); // Remove nulls
    }

    // Agency and admin see everything
    return stages;
  }

  /**
   * Filter deliverables based on user role
   */
  filterDeliverables(deliverables, user) {
    if (!Array.isArray(deliverables)) return deliverables;

    if (user.role === 'client') {
      return deliverables.map(deliverable => {
        const filtered = { ...deliverable };
        
        // Remove internal fields
        delete filtered.internal_notes;
        delete filtered.production_cost;
        delete filtered.time_tracking;
        delete filtered.team_comments;
        
        // Only show submitted versions to clients
        if (filtered.versions) {
          filtered.versions = filtered.versions.filter(v => 
            v.status !== 'draft' && v.status !== 'internal_review'
          );
        }
        
        // Simplify feedback history
        if (filtered.feedback_history) {
          filtered.feedback_history = filtered.feedback_history.filter(f => 
            !f.internal
          );
        }
        
        return filtered;
      });
    }

    return deliverables;
  }

  /**
   * Filter comments based on user role
   */
  filterComments(comments, user) {
    if (!Array.isArray(comments)) return comments;

    if (user.role === 'client') {
      // Filter out internal comments
      return comments.filter(comment => {
        // Remove internal-only comments
        if (comment.internal_only) return false;
        if (comment.visibility === 'internal') return false;
        if (comment.type === 'internal_note') return false;
        
        // Remove comments from internal discussions
        if (comment.thread_type === 'internal') return false;
        
        // Clean sensitive data from visible comments
        const filtered = { ...comment };
        delete filtered.internal_metadata;
        delete filtered.team_mentions;
        
        return filtered;
      });
    }

    return comments;
  }

  /**
   * Filter team members based on user role
   */
  filterTeamMembers(teamMembers, user) {
    if (!Array.isArray(teamMembers)) return teamMembers;

    if (user.role === 'client') {
      return teamMembers.map(member => {
        const filtered = { ...member };
        
        // Remove sensitive information
        delete filtered.salary;
        delete filtered.performance_rating;
        delete filtered.internal_notes;
        delete filtered.access_level;
        delete filtered.system_permissions;
        
        // Simplify availability for clients
        if (filtered.detailed_availability) {
          filtered.availability = filtered.detailed_availability.status;
          delete filtered.detailed_availability;
        }
        
        // Remove internal contact methods
        if (filtered.contact_methods) {
          filtered.contact_methods = filtered.contact_methods.filter(m => 
            !m.internal_only
          );
        }
        
        return filtered;
      });
    }

    return teamMembers;
  }

  /**
   * Filter notifications based on user role and preferences
   */
  filterNotifications(notifications, user) {
    if (!Array.isArray(notifications)) return notifications;

    // Filter based on notification level preference
    const level = user.notification_level || 3;
    
    return notifications.filter(notification => {
      // Apply role-based filtering first
      if (user.role === 'client') {
        // Don't show internal notifications to clients
        if (notification.internal_only) return false;
        if (notification.type?.includes('internal')) return false;
        if (notification.category === 'team_management') return false;
        if (notification.category === 'financial') return false;
      }
      
      // Apply notification level filtering
      switch (level) {
        case 1: // All notifications
          return true;
        case 2: // Deliverables only
          return notification.category === 'deliverable' || 
                 notification.type === 'deliverable_uploaded' ||
                 notification.type === 'deliverable_approved';
        case 3: // Action required only
          return notification.requires_action === true ||
                 notification.priority === 'high' ||
                 notification.type === 'approval_required' ||
                 notification.type === 'feedback_required';
        default:
          return true;
      }
    });
  }

  /**
   * Filter timeline data based on user role
   */
  filterTimeline(timeline, user) {
    if (!timeline) return timeline;

    if (user.role === 'client') {
      const filtered = { ...timeline };
      
      // Remove internal milestones
      if (filtered.milestones) {
        filtered.milestones = filtered.milestones.filter(m => 
          !m.internal_only && m.client_visible !== false
        );
      }
      
      // Simplify timeline entries
      if (filtered.entries) {
        filtered.entries = filtered.entries.map(entry => {
          const clean = { ...entry };
          delete clean.internal_dependencies;
          delete clean.resource_constraints;
          delete clean.cost_implications;
          return clean;
        });
      }
      
      // Remove resource allocation views
      delete filtered.resource_timeline;
      delete filtered.capacity_planning;
      
      return filtered;
    }

    return timeline;
  }

  /**
   * Filter financial data based on user role
   */
  filterFinancial(financial, user) {
    if (!financial) return financial;

    // Clients typically shouldn't see financial data at all
    if (user.role === 'client') {
      // Return only high-level budget status if needed
      return {
        budget_status: financial.budget_status || 'on_track',
        completion_percentage: financial.completion_percentage || 0
      };
    }

    // Agency members might see limited financial data
    if (user.role === 'agency' && !user.permissions?.canViewFinancials) {
      const filtered = { ...financial };
      delete filtered.detailed_costs;
      delete filtered.profit_margins;
      delete filtered.invoice_details;
      return filtered;
    }

    // Admin sees everything
    return financial;
  }

  /**
   * Apply field-level filtering to any object
   */
  filterFields(obj, fieldsToRemove) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const filtered = { ...obj };
    fieldsToRemove.forEach(field => {
      delete filtered[field];
    });
    return filtered;
  }

  /**
   * Check if user can see specific data
   */
  canUserSee(dataType, data, user) {
    switch (dataType) {
      case 'financial':
        return user.role === 'admin' || 
               (user.role === 'agency' && user.permissions?.canViewFinancials);
      
      case 'internal_comment':
        return user.role !== 'client';
      
      case 'team_management':
        return user.role === 'admin' || 
               (user.role === 'agency' && user.permissions?.canManageTeam);
      
      case 'stage_edit':
        return user.role === 'admin' || 
               (user.role === 'agency' && user.permissions?.canEdit);
      
      case 'approval':
        return user.role === 'client' || user.role === 'admin';
      
      default:
        return true;
    }
  }

  /**
   * Get filtered dashboard data for user
   */
  getDashboardData(rawData, user) {
    return {
      stages: this.filterStages(rawData.stages, user),
      deliverables: this.filterDeliverables(rawData.deliverables, user),
      timeline: this.filterTimeline(rawData.timeline, user),
      team: this.filterTeamMembers(rawData.team, user),
      notifications: this.filterNotifications(rawData.notifications, user),
      comments: this.filterComments(rawData.recentComments, user),
      // Don't show financial to clients
      ...(user.role !== 'client' && { 
        financial: this.filterFinancial(rawData.financial, user) 
      })
    };
  }

  /**
   * Get action items for user
   */
  getActionItems(allItems, user) {
    if (!Array.isArray(allItems)) return [];

    return allItems.filter(item => {
      // Filter by role
      if (user.role === 'client') {
        // Clients only see approval and feedback requests
        return item.type === 'approval_required' || 
               item.type === 'feedback_required' ||
               item.type === 'decision_required';
      }
      
      if (user.role === 'agency') {
        // Agency sees everything except financial approvals (unless permitted)
        if (item.type === 'financial_approval' && !user.permissions?.canViewFinancials) {
          return false;
        }
        return true;
      }
      
      // Admin sees everything
      return true;
    });
  }

  /**
   * Sanitize data for public access (brandbook)
   */
  sanitizeForPublic(data) {
    if (!data) return data;

    // Remove all sensitive information for public view
    const publicFields = [
      'id', 'name', 'description', 'category', 'type', 
      'format', 'size', 'thumbnail', 'preview', 'files',
      'tags', 'public_url'
    ];

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForPublic(item));
    }

    const sanitized = {};
    publicFields.forEach(field => {
      if (data[field] !== undefined) {
        sanitized[field] = data[field];
      }
    });

    return sanitized;
  }
}

// Create singleton instance
const dataFilterService = new DataFilterService();

// Export both the class and instance
export { DataFilterService };
export default dataFilterService;