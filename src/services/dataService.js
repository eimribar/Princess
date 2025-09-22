/**
 * Unified Data Service
 * Single source of truth for all data operations
 * Automatically uses Supabase when available, falls back to localStorage
 */

import { 
  SupabaseProject, 
  SupabaseStage, 
  SupabaseDeliverable,
  SupabaseComment,
  SupabaseNotification,
  SupabaseTeamMember,
  SupabaseOutOfScopeRequest
} from '@/api/supabaseEntities';
import { sanitizeData, sanitizeEmail, sanitizeUrl } from '@/utils/sanitization';

class DataService {
  constructor() {
    // All entities use the Supabase classes which have built-in fallback
    this.entities = {
      projects: SupabaseProject,
      stages: SupabaseStage,
      deliverables: SupabaseDeliverable,
      comments: SupabaseComment,
      notifications: SupabaseNotification,
      teamMembers: SupabaseTeamMember,
      outOfScopeRequests: SupabaseOutOfScopeRequest
    };
  }

  // Projects
  async getProjects(orderBy = null) {
    return SupabaseProject.list(orderBy);
  }

  async getProject(id) {
    return SupabaseProject.get(id);
  }

  async createProject(data) {
    const sanitized = sanitizeData(data);
    return SupabaseProject.create(sanitized);
  }

  async updateProject(id, updates) {
    const sanitized = sanitizeData(updates);
    return SupabaseProject.update(id, sanitized);
  }

  async deleteProject(id) {
    return SupabaseProject.delete(id);
  }

  // Stages
  async getStages(orderBy = 'number_index') {
    return SupabaseStage.list(orderBy);
  }

  async getStage(id) {
    return SupabaseStage.get(id);
  }

  async getProjectStages(projectId, orderBy = 'number_index') {
    return SupabaseStage.filter({ project_id: projectId }, orderBy);
  }

  async createStage(data) {
    const sanitized = sanitizeData(data);
    return SupabaseStage.create(sanitized);
  }

  async updateStage(id, updates) {
    const sanitized = sanitizeData(updates);
    return SupabaseStage.update(id, sanitized);
  }

  async deleteStage(id) {
    return SupabaseStage.delete(id);
  }

  async bulkCreateStages(stages) {
    return SupabaseStage.bulkCreate(stages);
  }

  // Deliverables
  async getDeliverables(orderBy = '-created_at') {
    return SupabaseDeliverable.list(orderBy);
  }

  async getDeliverable(id) {
    return SupabaseDeliverable.get(id);
  }

  async getProjectDeliverables(projectId, orderBy = '-created_at') {
    return SupabaseDeliverable.filter({ project_id: projectId }, orderBy);
  }

  async createDeliverable(data) {
    const sanitized = sanitizeData(data);
    return SupabaseDeliverable.create(sanitized);
  }

  async updateDeliverable(id, updates) {
    const sanitized = sanitizeData(updates);
    return SupabaseDeliverable.update(id, sanitized);
  }

  async deleteDeliverable(id) {
    return SupabaseDeliverable.delete(id);
  }

  // Comments
  async getComments(orderBy = '-created_at') {
    return SupabaseComment.list(orderBy);
  }

  async getComment(id) {
    return SupabaseComment.get(id);
  }

  async getStageComments(stageId, orderBy = '-created_at') {
    return SupabaseComment.filter({ stage_id: stageId }, orderBy);
  }

  async getProjectComments(projectId, orderBy = '-created_at') {
    return SupabaseComment.filter({ project_id: projectId }, orderBy);
  }

  async createComment(data) {
    const sanitized = sanitizeData(data);
    // Also sanitize email if present
    if (sanitized.author_email) {
      sanitized.author_email = sanitizeEmail(sanitized.author_email) || sanitized.author_email;
    }
    return SupabaseComment.create(sanitized);
  }

  async updateComment(id, updates) {
    return SupabaseComment.update(id, updates);
  }

  async deleteComment(id) {
    return SupabaseComment.delete(id);
  }

  // Notifications
  async getNotifications(orderBy = '-created_at') {
    return SupabaseNotification.list(orderBy);
  }

  async getNotification(id) {
    return SupabaseNotification.get(id);
  }

  async getUserNotifications(userId, orderBy = '-created_at') {
    return SupabaseNotification.filter({ user_id: userId }, orderBy);
  }

  async createNotification(data) {
    return SupabaseNotification.create(data);
  }

  async updateNotification(id, updates) {
    return SupabaseNotification.update(id, updates);
  }

  async markNotificationRead(id) {
    return SupabaseNotification.update(id, { read: true });
  }

  async deleteNotification(id) {
    return SupabaseNotification.delete(id);
  }

  // Team Members
  async getTeamMembers(orderBy = 'name') {
    return SupabaseTeamMember.list(orderBy);
  }

  async getTeamMember(id) {
    return SupabaseTeamMember.get(id);
  }

  async getProjectTeamMembers(projectId, orderBy = 'name') {
    return SupabaseTeamMember.filter({ project_id: projectId }, orderBy);
  }

  async createTeamMember(data) {
    const sanitized = sanitizeData(data);
    // Sanitize email and URLs
    if (sanitized.email) {
      sanitized.email = sanitizeEmail(sanitized.email) || sanitized.email;
    }
    if (sanitized.linkedin_url) {
      sanitized.linkedin_url = sanitizeUrl(sanitized.linkedin_url) || sanitized.linkedin_url;
    }
    return SupabaseTeamMember.create(sanitized);
  }

  async updateTeamMember(id, updates) {
    const sanitized = sanitizeData(updates);
    // Sanitize email and URLs
    if (sanitized.email) {
      sanitized.email = sanitizeEmail(sanitized.email) || sanitized.email;
    }
    if (sanitized.linkedin_url) {
      sanitized.linkedin_url = sanitizeUrl(sanitized.linkedin_url) || sanitized.linkedin_url;
    }
    return SupabaseTeamMember.update(id, sanitized);
  }

  async deleteTeamMember(id) {
    return SupabaseTeamMember.delete(id);
  }

  // Out of Scope Requests
  async getOutOfScopeRequests(orderBy = '-created_at') {
    return SupabaseOutOfScopeRequest.list(orderBy);
  }

  async getOutOfScopeRequest(id) {
    return SupabaseOutOfScopeRequest.get(id);
  }

  async getProjectOutOfScopeRequests(projectId, orderBy = '-created_at') {
    return SupabaseOutOfScopeRequest.filter({ project_id: projectId }, orderBy);
  }

  async createOutOfScopeRequest(data) {
    return SupabaseOutOfScopeRequest.create(data);
  }

  async updateOutOfScopeRequest(id, updates) {
    return SupabaseOutOfScopeRequest.update(id, updates);
  }

  async deleteOutOfScopeRequest(id) {
    return SupabaseOutOfScopeRequest.delete(id);
  }

  // Utility methods
  async loadProjectData(projectId) {
    // Load all data for a specific project in parallel
    const [project, stages, deliverables, comments, teamMembers, outOfScopeRequests] = await Promise.all([
      this.getProject(projectId),
      this.getProjectStages(projectId),
      this.getProjectDeliverables(projectId),
      this.getProjectComments(projectId),
      this.getProjectTeamMembers(projectId),
      this.getProjectOutOfScopeRequests(projectId)
    ]);

    return {
      project,
      stages,
      deliverables,
      comments,
      teamMembers,
      outOfScopeRequests
    };
  }

  async loadDashboardData(projectId = null) {
    if (projectId) {
      return this.loadProjectData(projectId);
    }

    // Load general dashboard data - but use first project if available
    const projects = await this.getProjects();
    const firstProject = projects[0];
    
    if (!firstProject) {
      // No projects exist, return empty data
      return {
        projects: [],
        stages: [],
        deliverables: [],
        notifications: [],
        teamMembers: [],
        project: null
      };
    }

    // Load data for the first project
    const [stages, deliverables, notifications, teamMembers] = await Promise.all([
      this.getProjectStages(firstProject.id),
      this.getProjectDeliverables(firstProject.id),
      this.getNotifications(),
      this.getProjectTeamMembers(firstProject.id)
    ]);

    return {
      projects,
      stages,
      deliverables,
      notifications,
      teamMembers,
      project: firstProject
    };
  }
}

// Export singleton instance
const dataService = new DataService();
export default dataService;

// Export individual entity methods for backward compatibility
export const {
  // Projects
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  // Stages
  getStages,
  getStage,
  getProjectStages,
  createStage,
  updateStage,
  deleteStage,
  bulkCreateStages,
  // Deliverables
  getDeliverables,
  getDeliverable,
  getProjectDeliverables,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
  // Comments
  getComments,
  getComment,
  getStageComments,
  getProjectComments,
  createComment,
  updateComment,
  deleteComment,
  // Notifications
  getNotifications,
  getNotification,
  getUserNotifications,
  createNotification,
  updateNotification,
  markNotificationRead,
  deleteNotification,
  // Team Members
  getTeamMembers,
  getTeamMember,
  getProjectTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  // Out of Scope
  getOutOfScopeRequests,
  getOutOfScopeRequest,
  getProjectOutOfScopeRequests,
  createOutOfScopeRequest,
  updateOutOfScopeRequest,
  deleteOutOfScopeRequest,
  // Utility
  loadProjectData,
  loadDashboardData
} = dataService;