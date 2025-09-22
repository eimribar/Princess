/**
 * Project Service
 * Handles all project creation and management operations with Supabase
 */

import { supabase } from '@/lib/supabase';
import { SupabaseStage, SupabaseDeliverable, SupabaseProject } from '@/api/supabaseEntities';
import { addDays, parseISO } from 'date-fns';
import { playbookData } from '@/components/admin/PlaybookData';
import { validateStages, cleanStageData } from '@/utils/validators/stageValidator';

class ProjectService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Create a new project with all initial setup
   */
  async createProject(projectData) {
    try {
      // Use SupabaseProject entity which handles both Supabase and localStorage
      const project = await SupabaseProject.create({
        name: projectData.name,
        description: projectData.description,
        client_name: projectData.client_name,
        start_date: projectData.start_date,
        status: 'active',
        settings: projectData.settings || {},
        created_by: null, // Will be set by Supabase if auth is available
        organization_id: null
      });

      return project.id;
    } catch (error) {
      console.error('Failed to create project:', error);
      // Fallback to localStorage
      return this.createLocalProject(projectData);
    }
  }

  /**
   * Clone the 104 stages template for a specific project
   */
  async cloneStagesForProject(projectId, startDate, milestoneOverrides = {}) {
    try {
      console.log(`🎯 Creating stages for new project: ${projectId}`);
      
      // Use PlaybookData as the template source - this ensures clean stages for each project
      const templateStages = playbookData.map((stage, index) => ({
        ...stage,
        id: `template_${index}`,
        project_id: projectId,
        // CRITICAL: Reset ALL status fields for new projects
        status: 'not_ready',
        completed_at: null,
        approved_by: null,
        approved_at: null,
        actual_duration: null,
        notes: null,
        // Ensure dates are fresh
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      if (!templateStages || templateStages.length === 0) {
        throw new Error('No template stages found in PlaybookData');
      }

      console.log(`Creating ${templateStages.length} stages for project ${projectId}`);

      // Fix any invalid resource_dependency values
      templateStages.forEach(stage => {
        // Map invalid values to valid ones
        if (stage.resource_dependency === 'client_input') {
          stage.resource_dependency = 'client_materials';
        } else if (stage.resource_dependency === 'roee_approval') {
          stage.resource_dependency = 'none';
        } else if (stage.resource_dependency && 
                   !['none', 'client_materials', 'external_vendor'].includes(stage.resource_dependency)) {
          console.warn(`Invalid resource_dependency value: ${stage.resource_dependency}, defaulting to 'none'`);
          stage.resource_dependency = 'none';
        }
      });

      // Calculate dates for each stage
      const startDateObj = parseISO(startDate);
      const stagesWithDates = this.calculateStageDates(templateStages, startDateObj, milestoneOverrides);

      // Prepare stages for insertion with validation
      const stagesToInsert = stagesWithDates.map(stage => {
        const stageData = {
          project_id: projectId, // CRITICAL: Ensure project_id is set
          number_index: stage.number_index,
          name: stage.name,
          formal_name: stage.formal_name,
          is_deliverable: stage.is_deliverable || false,
          category: stage.category,
          status: 'not_ready', // ALL new stages start as not_ready
          description: stage.description,
          wireframe_example: stage.wireframe_example,
          estimated_duration: stage.estimated_duration || 3,
          start_date: stage.calculatedStartDate,
          end_date: stage.calculatedEndDate,
          client_facing: stage.client_facing !== false,
          blocking_priority: stage.blocking_priority || 'medium',
          resource_dependency: stage.resource_dependency || 'none',
          // Explicitly null out any completion data
          completed_at: null,
          approved_by: null,
          actual_duration: null
        };
        
        // Clean and validate the stage data
        return cleanStageData(stageData);
      });
      
      // Validate all stages before insertion
      const validation = validateStages(stagesToInsert);
      if (!validation.valid) {
        console.error('Stage validation failed:', validation.invalidStages);
        // Continue anyway but log the issues
        validation.invalidStages.forEach(({ stage, errors }) => {
          console.warn(`Stage "${stage}" has validation issues:`, errors);
        });
      }

      // Insert stages in batches using SupabaseStage entity
      const batchSize = 20;
      const insertedStages = [];
      for (let i = 0; i < stagesToInsert.length; i += batchSize) {
        const batch = stagesToInsert.slice(i, i + batchSize);
        const results = await SupabaseStage.bulkCreate(batch);
        insertedStages.push(...results);
      }

      // Create stage map for dependencies
      if (insertedStages && insertedStages.length > 0) {
        const stageMap = new Map(insertedStages.map(s => [s.number_index, s.id]));
        
        // Create dependency records if using Supabase
        if (this.supabase) {
          const dependencies = [];
          templateStages.forEach(stage => {
            if (stage.dependencies && stage.dependencies.length > 0) {
              const stageId = stageMap.get(stage.number_index);
              stage.dependencies.forEach(depIndex => {
                // Find the dependency stage by its number_index
                const depStage = templateStages.find(s => s.number_index === depIndex);
                if (depStage) {
                  const depId = stageMap.get(depStage.number_index);
                  if (stageId && depId) {
                    dependencies.push({
                      stage_id: stageId,
                      depends_on_stage_id: depId
                    });
                  }
                }
              });
            }
          });

          // Insert dependencies directly if we have supabase
          if (dependencies.length > 0 && this.supabase) {
            const { error: depError } = await this.supabase
              .from('stage_dependencies')
              .insert(dependencies);
            
            if (depError) {
              console.error('Error creating dependencies:', depError);
            }
          }
        }
      }

      return insertedStages || stagesWithDates;
    } catch (error) {
      console.error('Failed to clone stages:', error);
      throw error;
    }
  }

  /**
   * Calculate dates for stages based on dependencies
   */
  calculateStageDates(stages, startDate, overrides = {}) {
    const stagesWithDates = [...stages];
    const stageMap = new Map(stagesWithDates.map(s => [s.id || s.number_index, s]));
    
    let currentDate = startDate;
    
    stagesWithDates.forEach(stage => {
      // Check for override
      const override = overrides[stage.id || stage.number_index];
      
      if (override?.date) {
        stage.calculatedStartDate = parseISO(override.date);
        stage.isLocked = override.locked || false;
      } else {
        // Calculate based on dependencies or sequential
        if (stage.dependencies && stage.dependencies.length > 0) {
          // Find latest dependency end date
          let latestDepDate = startDate;
          stage.dependencies.forEach(depId => {
            const depStage = stageMap.get(depId);
            if (depStage?.calculatedEndDate && depStage.calculatedEndDate > latestDepDate) {
              latestDepDate = depStage.calculatedEndDate;
            }
          });
          stage.calculatedStartDate = addDays(latestDepDate, 1);
        } else {
          stage.calculatedStartDate = currentDate;
        }
        
        // Calculate end date
        const duration = stage.estimated_duration || 3;
        stage.calculatedEndDate = addDays(stage.calculatedStartDate, duration);
        currentDate = addDays(stage.calculatedEndDate, 1);
      }
    });
    
    return stagesWithDates;
  }

  /**
   * Assign team members to the project
   */
  async assignTeamMembers(projectId, teamData) {
    try {
      const members = [];
      
      // Add project manager
      if (teamData.projectManager) {
        members.push({
          project_id: projectId,
          name: teamData.projectManager.name,
          email: teamData.projectManager.email,
          role: 'Project Manager',
          team_type: 'agency',
          is_decision_maker: false,
          profile_image: teamData.projectManager.profile_image,
          linkedin_url: teamData.projectManager.linkedin_url,
          bio: teamData.projectManager.bio,
          user_id: teamData.projectManager.user_id || null
        });
      }
      
      // Add other agency team members
      if (teamData.teamMembers) {
        teamData.teamMembers.forEach(member => {
          if (member.id !== teamData.projectManager?.id) {
            members.push({
              project_id: projectId,
              name: member.name,
              email: member.email,
              role: member.role,
              team_type: 'agency',
              is_decision_maker: false,
              profile_image: member.profile_image,
              linkedin_url: member.linkedin_url,
              bio: member.bio,
              user_id: member.user_id || null
            });
          }
        });
      }
      
      // Add decision makers
      if (teamData.decisionMakers) {
        teamData.decisionMakers.forEach(dm => {
          members.push({
            project_id: projectId,
            name: dm.name,
            email: dm.email,
            role: 'Decision Maker',
            team_type: 'client',
            is_decision_maker: true,
            user_id: dm.user_id || null
          });
        });
      }
      
      // Add client contacts
      if (teamData.clientContacts) {
        teamData.clientContacts.forEach(contact => {
          members.push({
            project_id: projectId,
            name: contact.name,
            email: contact.email,
            role: contact.role || 'Client Contact',
            team_type: 'client',
            is_decision_maker: false,
            user_id: contact.user_id || null
          });
        });
      }
      
      // Insert into database
      if (this.supabase && members.length > 0) {
        const { error } = await this.supabase
          .from('team_members')
          .insert(members);
        
        if (error) {
          console.error('Error assigning team members:', error);
          throw error;
        }
      } else {
        // localStorage fallback
        this.saveToLocalStorage(`project_${projectId}_team`, members);
      }
      
      return members;
    } catch (error) {
      console.error('Failed to assign team members:', error);
      throw error;
    }
  }

  /**
   * Setup notification preferences for the project
   */
  async setupNotifications(projectId, notificationSettings) {
    try {
      // Store notification settings in project settings
      if (this.supabase) {
        const { error } = await this.supabase
          .from('projects')
          .update({
            settings: {
              notifications: notificationSettings
            }
          })
          .eq('id', projectId);
        
        if (error) {
          console.error('Error setting up notifications:', error);
          throw error;
        }
      } else {
        // localStorage fallback
        this.saveToLocalStorage(`project_${projectId}_notifications`, notificationSettings);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to setup notifications:', error);
      throw error;
    }
  }

  /**
   * Map approval gates to decision makers
   */
  async mapApprovalGates(projectId, decisionMakers) {
    try {
      // This will be used to configure which deliverables require approval
      // and who can approve them
      
      // Get all deliverable stages for this project
      const deliverableStages = await SupabaseStage.filter({
        project_id: projectId,
        is_deliverable: true
      });
      
      if (deliverableStages && deliverableStages.length > 0) {
        // Create deliverable records with approval requirements
        const deliverables = deliverableStages.map(stage => ({
          project_id: projectId,
          stage_id: stage.id,
          name: stage.name, // Use the actual stage name as deliverable name
          status: 'draft', // Using draft as expected by deliverable enum
          max_iterations: 3,
          current_iteration: 0
        }));
        
        // Use SupabaseDeliverable entity to create deliverables
        await SupabaseDeliverable.bulkCreate(deliverables);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to map approval gates:', error);
      throw error;
    }
  }

  /**
   * Get all projects for the current user
   */
  async getProjects() {
    try {
      return await SupabaseProject.list('-created_at');
    } catch (error) {
      console.error('Failed to get projects:', error);
      throw error;
    }
  }

  /**
   * Get a specific project by ID
   */
  async getProject(projectId) {
    try {
      return await SupabaseProject.get(projectId);
    } catch (error) {
      console.error('Failed to get project:', error);
      throw error;
    }
  }

}

// Export singleton instance
const projectService = new ProjectService();
export default projectService;