/**
 * Project Creation Service
 * Handles the complete process of creating a new project from the wizard data
 */

import { 
  SupabaseProject, 
  SupabaseStage, 
  SupabaseDeliverable,
  SupabaseNotification 
} from '@/api/supabaseEntities';
import { playbookData } from '@/components/admin/PlaybookData';
import { deliverablesByPhase } from '@/components/playbook/DeliverablesPlaybookData';
import { addDays, startOfDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

class ProjectCreationService {
  constructor() {
    this.playbookStages = playbookData;
    this.deliverablesByPhase = deliverablesByPhase;
  }

  /**
   * Create a complete project from wizard data
   * @param {Object} wizardData - Data collected from the project initiation wizard
   * @returns {Promise<Object>} - The created project with all related entities
   */
  async createProjectFromWizard(wizardData) {
    // Creating project from wizard data
    
    try {
      // Step 1: Create the project entity
      const project = await this.createProject(wizardData);
      // Project created successfully
      
      // Step 2: Create all 104 stages with proper timeline
      const stages = await this.createProjectStages(project.id, wizardData);
      // Stages created successfully
      
      // Step 3: Create deliverables for deliverable stages
      const deliverables = await this.createProjectDeliverables(project.id, stages);
      // Deliverables created successfully
      
      // Step 4: Assign team members to stages
      await this.assignTeamMembersToStages(stages, wizardData.teamMembers || []);
      // Team members assigned to stages
      
      // Step 5: Create initial notifications
      await this.createKickoffNotifications(project, wizardData.teamMembers || []);
      // Kickoff notifications created
      
      // Step 6: Mark first stage as in_progress
      if (stages.length > 0) {
        await SupabaseStage.update(stages[0].id, { status: 'in_progress' });
        // First stage marked as in_progress
      }
      
      return {
        project,
        stages,
        deliverables,
        success: true
      };
      
    } catch (error) {
      // Failed to create project
      throw new Error(`Project creation failed: ${error.message}`);
    }
  }

  /**
   * Create the main project entity
   */
  async createProject(wizardData) {
    const projectData = {
      name: wizardData.projectName || 'New Brand Development Project',
      description: wizardData.projectDescription || 'Brand development and strategy project',
      client_name: wizardData.clientOrganization || wizardData.clientName || 'Client',
      start_date: wizardData.startDate || new Date().toISOString(),
      end_date: wizardData.endDate || addDays(new Date(), 240).toISOString(), // 8 months default
      status: 'active',
      settings: {
        template: wizardData.template?.name || 'Standard',
        budget: wizardData.budget,
        projectType: wizardData.projectType,
        brandAttributes: wizardData.brandAttributes || {},
        notifications: wizardData.notificationPreferences || {
          email: true,
          slack: false,
          level: 'all'
        }
      },
      // Explicitly set organization_id to null for development
      // In production, this would come from auth context
      organization_id: null,
      created_by: null
    };
    
    return await SupabaseProject.create(projectData);
  }

  /**
   * Create all stages from the playbook template
   */
  async createProjectStages(projectId, wizardData) {
    const startDate = new Date(wizardData.startDate || new Date());
    const stagesData = [];
    const stageIdMap = {}; // Map old number_index to new UUID
    
    // First pass: Create stage data with calculated dates
    let currentDate = startOfDay(startDate);
    
    for (const stageTemplate of this.playbookStages) {
      const stageId = uuidv4();
      stageIdMap[stageTemplate.number_index] = stageId;
      
      // Calculate duration based on priority and type
      const duration = this.calculateStageDuration(stageTemplate);
      const endDate = addDays(currentDate, duration);
      
      const stageData = {
        id: stageId,
        project_id: projectId,
        number_index: stageTemplate.number_index,
        name: stageTemplate.name,
        formal_name: stageTemplate.formal_name || stageTemplate.name,
        is_deliverable: stageTemplate.is_deliverable || false,
        category: stageTemplate.category,
        status: stageTemplate.number_index === 1 ? 'in_progress' : 'not_ready', // Using not_ready consistently
        description: stageTemplate.description,
        estimated_duration: duration,
        start_date: currentDate.toISOString().split('T')[0], // DATE type expects YYYY-MM-DD
        end_date: endDate.toISOString().split('T')[0],
        blocking_priority: stageTemplate.blocking_priority || 'medium',
        resource_dependency: stageTemplate.resource_dependency || 'none',
        client_facing: stageTemplate.type !== 'Internal',
        // Dependencies will be mapped in second pass
        dependencies: []
      };
      
      stagesData.push(stageData);
      
      // Move to next date for sequential stages
      if (!stageTemplate.parallel_tracks || stageTemplate.parallel_tracks.length === 0) {
        currentDate = addDays(endDate, 1);
      }
    }
    
    // Second pass: Map dependencies to new UUIDs
    for (const stageData of stagesData) {
      const template = this.playbookStages.find(t => t.number_index === stageData.number_index);
      if (template.dependencies && template.dependencies.length > 0) {
        stageData.dependencies = template.dependencies
          .map(depIndex => stageIdMap[depIndex])
          .filter(id => id); // Filter out any unmapped dependencies
      }
    }
    
    // Create all stages with their dependencies
    return await SupabaseStage.bulkCreateWithDependencies(stagesData);
  }

  /**
   * Calculate duration for a stage based on its properties
   */
  calculateStageDuration(stage) {
    // Base duration
    let duration = 1;
    
    // Adjust based on priority
    if (stage.blocking_priority === 'critical') {
      duration = 5;
    } else if (stage.blocking_priority === 'high') {
      duration = 3;
    } else if (stage.is_deliverable) {
      duration = 3;
    } else if (stage.blocking_priority === 'medium') {
      duration = 2;
    }
    
    // Adjust for resource dependencies
    if (stage.resource_dependency === 'client_materials') {
      duration += 2;
    } else if (stage.resource_dependency === 'external_vendor') {
      duration += 3;
    }
    
    return duration;
  }

  /**
   * Create deliverables for stages marked as deliverables
   */
  async createProjectDeliverables(projectId, stages) {
    const deliverables = [];
    
    for (const stage of stages) {
      if (stage.is_deliverable) {
        // Find corresponding deliverable data from template
        const deliverableTemplate = this.findDeliverableTemplate(stage.number_index);
        
        const deliverableData = {
          project_id: projectId,
          stage_id: stage.id,
          name: deliverableTemplate?.name || stage.name,
          description: deliverableTemplate?.note || stage.description,
          category: stage.category,
          type: this.getDeliverableType(stage),
          priority: stage.blocking_priority,
          status: 'draft',
          max_iterations: this.getMaxIterations(stage.blocking_priority),
          current_iteration: 0,
          original_deadline: stage.end_date.split('T')[0], // Ensure DATE format
          adjusted_deadline: stage.end_date.split('T')[0],
          include_in_brandbook: this.shouldIncludeInBrandbook(stage),
        };
        
        const deliverable = await SupabaseDeliverable.createWithVersion(
          deliverableData,
          { notes: 'Initial version' }
        );
        
        deliverables.push(deliverable);
      }
    }
    
    return deliverables;
  }

  /**
   * Find deliverable template data
   */
  findDeliverableTemplate(stageIndex) {
    for (const phase of this.deliverablesByPhase) {
      const deliverable = phase.deliverables.find(d => d.step === stageIndex);
      if (deliverable) return deliverable;
    }
    return null;
  }

  /**
   * Determine deliverable type based on stage
   */
  getDeliverableType(stage) {
    if (stage.category === 'research') return 'research';
    if (stage.category === 'strategy') return 'strategy';
    if (stage.category === 'brand_building' || stage.category === 'brand_collaterals') return 'creative';
    return 'strategy';
  }

  /**
   * Determine max iterations based on priority
   */
  getMaxIterations(priority) {
    switch (priority) {
      case 'critical': return 5;
      case 'high': return 3;
      case 'medium': return 2;
      default: return 1;
    }
  }

  /**
   * Determine if deliverable should be in brandbook
   */
  shouldIncludeInBrandbook(stage) {
    const brandbookCategories = ['brand_building', 'brand_collaterals'];
    const brandbookKeywords = ['brand', 'logo', 'visual', 'design', 'identity', 'guidelines'];
    
    return brandbookCategories.includes(stage.category) ||
           brandbookKeywords.some(keyword => stage.name.toLowerCase().includes(keyword));
  }

  /**
   * Assign team members to appropriate stages
   */
  async assignTeamMembersToStages(stages, teamMembers) {
    if (!teamMembers || teamMembers.length === 0) return;
    
    const updates = [];
    
    for (const stage of stages) {
      // Find best team member for this stage
      const assignee = this.findBestAssignee(stage, teamMembers);
      
      if (assignee) {
        updates.push(
          SupabaseStage.update(stage.id, { 
            assigned_to: assignee.id 
          })
        );
      }
    }
    
    await Promise.all(updates);
  }

  /**
   * Find the best team member to assign to a stage
   */
  findBestAssignee(stage, teamMembers) {
    // Match based on role and expertise
    const roleMapping = {
      'onboarding': ['Project Manager', 'Account Manager'],
      'research': ['Brand Strategist', 'Researcher', 'Analyst'],
      'strategy': ['Brand Strategist', 'Creative Director'],
      'brand_building': ['Creative Director', 'Design Lead', 'Designer'],
      'brand_collaterals': ['Designer', 'Design Lead'],
      'brand_activation': ['Marketing Manager', 'Project Manager']
    };
    
    const preferredRoles = roleMapping[stage.category] || [];
    
    // First try to find exact role match
    for (const role of preferredRoles) {
      const member = teamMembers.find(m => 
        m.projectRole === role || m.role === role
      );
      if (member) return member;
    }
    
    // Fallback to project manager
    const pm = teamMembers.find(m => 
      m.projectRole === 'Project Manager' || 
      m.role === 'Project Manager'
    );
    if (pm) return pm;
    
    // Fallback to first team member
    return teamMembers[0];
  }

  /**
   * Create kickoff notifications
   */
  async createKickoffNotifications(project, teamMembers) {
    const notifications = [];
    
    // Notification for project kickoff
    const kickoffNotification = {
      project_id: project.id,
      type: 'info',
      title: 'Project Kickoff',
      message: `Welcome to ${project.name}! The project has been successfully initiated and is ready to begin.`,
      data: {
        project_id: project.id,
        project_name: project.name
      }
    };
    
    // Create notification for each team member
    for (const member of teamMembers) {
      if (member.user_id) {
        notifications.push(
          SupabaseNotification.createForUser(member.user_id, kickoffNotification)
        );
      }
    }
    
    // Additional notification for first deliverable
    const firstDeliverableNotification = {
      project_id: project.id,
      type: 'info',
      title: 'First Deliverable Ready',
      message: 'The first project deliverable is now available for review.',
      data: {
        project_id: project.id
      }
    };
    
    // Send to project lead
    const lead = teamMembers.find(m => m.projectRole === 'Project Lead' || m.is_decision_maker);
    if (lead && lead.user_id) {
      notifications.push(
        SupabaseNotification.createForUser(lead.user_id, firstDeliverableNotification)
      );
    }
    
    await Promise.all(notifications);
  }
}

// Export singleton instance
export default new ProjectCreationService();