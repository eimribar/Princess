/**
 * Data Initialization Module
 * Automatically seeds the application with playbook data if empty
 */

import { Project, Stage, Deliverable, TeamMember } from './entities';
import { playbookData } from '../components/admin/PlaybookData';
import dateCalculationService from '../services/dateCalculationService';

// Helper function to add a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function initializeAppData() {
  try {
    // Check if data already exists
    const existingStages = await Stage.list();
    console.log('Existing stages check:', existingStages);
    if (existingStages && existingStages.length > 0) {
      console.log('Data already exists, skipping initialization. Stage count:', existingStages.length);
      return true;
    }

    console.log('No data found, initializing application data...');

    // Step 1: Create a default project
    const projects = await Project.list();
    let projectId;
    
    if (!projects || projects.length === 0) {
      const defaultProject = await Project.create({
        name: 'Princess Brand Development',
        client_name: 'Princess',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        description: 'Complete brand development and management project'
      });
      projectId = defaultProject.id;
      console.log('Created default project');
    } else {
      projectId = projects[0].id;
    }

    // Step 2: Create default team members
    const teamMembers = await TeamMember.list();
    if (!teamMembers || teamMembers.length === 0) {
      const defaultTeamMembers = [
        {
          name: 'John Smith',
          email: 'john.smith@deutschco.com',
          role: 'project_manager',
          avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=john'
        },
        {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@deutschco.com',
          role: 'designer',
          avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=sarah'
        },
        {
          name: 'Mike Chen',
          email: 'mike.chen@deutschco.com',
          role: 'developer',
          avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=mike'
        },
        {
          name: 'Emma Davis',
          email: 'emma.davis@deutschco.com',
          role: 'strategist',
          avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=emma'
        },
        {
          name: 'Alex Thompson',
          email: 'alex.thompson@deutschco.com',
          role: 'copywriter',
          avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=alex'
        }
      ];
      
      await TeamMember.bulkCreate(defaultTeamMembers);
      console.log('Created default team members');
    }

    // Step 3: Create stages from playbook data
    console.log('Creating 104 project stages...');
    const stagesToCreate = playbookData.map(item => ({
      project_id: projectId,
      name: item.name,
      number_index: item.number_index,
      order_index: item.number_index,
      category: item.category,
      is_deliverable: item.is_deliverable,
      description: item.description || `Step ${item.number_index}: ${item.name}`,
      formal_name: item.formal_name || null,
      is_optional: false,
      status: 'not_started',
      dependencies: [],
      dependency_type: item.dependency_type || 'sequential',
      blocking_priority: item.blocking_priority || 'low',
      resource_dependency: item.resource_dependency || 'none',
      parallel_tracks: [],
    }));
    
    await Stage.bulkCreate(stagesToCreate);
    console.log('Created stages');

    // Step 4: Resolve stage dependencies and calculate dates
    console.log('Resolving stage dependencies and calculating dates...');
    const createdStages = await Stage.list();
    const numberIndexToIdMap = new Map(createdStages.map(s => [s.number_index, s.id]));

    // First, update all dependencies
    const stagesWithDependencies = createdStages.map(stage => {
      const playbookItem = playbookData.find(item => item.number_index === stage.number_index);
      if (!playbookItem) return stage;

      const resolvedDependencyIds = (playbookItem.dependencies || []).map(index => numberIndexToIdMap.get(index)).filter(Boolean);
      const resolvedParallelTrackIds = (playbookItem.parallel_tracks || []).map(index => numberIndexToIdMap.get(index)).filter(Boolean);

      return {
        ...stage,
        dependencies: resolvedDependencyIds,
        parallel_tracks: resolvedParallelTrackIds,
        estimated_duration: playbookItem.estimated_duration || null
      };
    });

    // Calculate dates based on dependencies
    const projectStart = projects && projects.length > 0 
      ? new Date(projects[0].start_date) 
      : new Date();
    
    const scheduledStages = dateCalculationService.calculateProjectSchedule(
      stagesWithDependencies,
      projectStart
    );

    // Update all stages with dependencies and calculated dates
    let processedCount = 0;
    for (const stage of scheduledStages) {
      await Stage.update(stage.id, { 
        dependencies: stage.dependencies, 
        parallel_tracks: stage.parallel_tracks,
        start_date: stage.start_date,
        end_date: stage.end_date,
        estimated_duration: stage.estimated_duration || dateCalculationService.getDefaultDuration(stage)
      });
      
      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`Updated ${processedCount}/${scheduledStages.length} stages with dependencies and dates`);
      }
      
      await delay(50); // Small delay to prevent overwhelming localStorage
    }
    
    console.log('Dependencies and dates calculated');

    // Step 5: Create deliverables for stages marked as deliverables
    console.log('Creating deliverables...');
    const deliverableStages = createdStages.filter(stage => stage.is_deliverable);
    
    // Sample file URLs for demo purposes
    const sampleFiles = [
      { 
        name: 'brand_strategy_v1.pdf', 
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        type: 'application/pdf',
        size: 245760
      },
      { 
        name: 'logo_concepts.png', 
        url: 'https://picsum.photos/800/600?random=1',
        type: 'image/png',
        size: 512000
      },
      { 
        name: 'color_palette.jpg', 
        url: 'https://picsum.photos/800/600?random=2',
        type: 'image/jpeg',
        size: 384000
      },
      { 
        name: 'brand_presentation.pdf', 
        url: 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf',
        type: 'application/pdf',
        size: 1048576
      },
      { 
        name: 'mood_board.jpg', 
        url: 'https://picsum.photos/1200/800?random=3',
        type: 'image/jpeg',
        size: 768000
      }
    ];

    const deliverablesToCreate = deliverableStages.map((stage, index) => {
      // Add sample versions for some deliverables to demonstrate functionality
      const shouldHaveVersions = index < 5; // First 5 deliverables get sample versions
      let versions = [];
      let currentVersion = null;
      
      if (shouldHaveVersions) {
        const file = sampleFiles[index % sampleFiles.length];
        const baseDate = new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000); // Days ago
        
        versions = [
          {
            id: `v${stage.id}_1`,
            version_number: 'V0',
            status: 'draft',
            file_name: file.name,
            file_url: file.url,
            file_size: file.size,
            file_type: file.type,
            uploaded_date: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours before base
            uploaded_by: 'Sarah Johnson',
            changes_summary: 'Initial draft version for client review',
            iteration_count: 1
          }
        ];
        
        // Add different status versions for testing
        if (index < 3) {
          // First 3 get approved V1
          versions.push({
            id: `v${stage.id}_2`,
            version_number: 'V1',
            status: 'approved',
            file_name: file.name.replace(/\.(pdf|png|jpg)$/, '_v1.$1'),
            file_url: file.url,
            file_size: file.size + 50000,
            file_type: file.type,
            uploaded_date: baseDate.toISOString(),
            uploaded_by: 'Sarah Johnson',
            approval_date: new Date(baseDate.getTime() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour after upload
            approved_by: 'John Smith',
            changes_summary: 'Incorporated client feedback and refined design',
            feedback: 'Great improvements! The color palette works well with our brand vision.',
            feedback_date: new Date(baseDate.getTime() + 1 * 60 * 60 * 1000).toISOString(),
            feedback_by: 'John Smith',
            iteration_count: 2
          });
          currentVersion = 'V1';
        } else if (index === 3) {
          // 4th deliverable gets submitted status (pending approval)
          versions[0].status = 'submitted';
          currentVersion = 'V0';
        } else if (index === 4) {
          // 5th deliverable gets pending_approval status
          versions[0].status = 'pending_approval';
          currentVersion = 'V0';
        } else {
          // Others stay as draft
          currentVersion = 'V0';
        }
      }

      return {
        project_id: projectId,
        stage_id: stage.id,
        name: stage.name,
        type: stage.category === 'research' ? 'research' : 
              stage.category === 'strategy' ? 'strategy' : 'creative',
        include_in_brandbook: stage.category === 'brand_building' || 
                             stage.name.toLowerCase().includes('brandbook'),
        max_revisions: 2,
        status: shouldHaveVersions ? (currentVersion === 'V1' ? 'completed' : 'wip') : 'not_started',
        versions: versions,
        current_version: currentVersion,
        max_iterations: 3,
        approval_required_from: ['client@deutschco.com'],
        approval_deadline: null,
        priority: 'medium'
      };
    });
    
    if (deliverablesToCreate.length > 0) {
      await Deliverable.bulkCreate(deliverablesToCreate);
      console.log(`Created ${deliverablesToCreate.length} deliverables`);
    }

    console.log('Application data initialization complete!');
    return true;

  } catch (error) {
    console.error('Failed to initialize application data:', error);
    return false;
  }
}

// Check if initialization is needed
export async function checkAndInitialize() {
  const stages = await Stage.list();
  if (!stages || stages.length === 0) {
    console.log('No stages found, triggering automatic initialization...');
    return await initializeAppData();
  }
  return true;
}