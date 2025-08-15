/**
 * Data Initialization Module
 * Automatically seeds the application with playbook data if empty
 */

import { Project, Stage, Deliverable, TeamMember } from './entities';
import { playbookData } from '../components/admin/PlaybookData';

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

    // Step 4: Resolve stage dependencies
    console.log('Resolving stage dependencies...');
    const createdStages = await Stage.list();
    const numberIndexToIdMap = new Map(createdStages.map(s => [s.number_index, s.id]));

    const stagesToUpdate = createdStages.map(stage => {
      const playbookItem = playbookData.find(item => item.number_index === stage.number_index);
      if (!playbookItem) return null;

      const resolvedDependencyIds = (playbookItem.dependencies || []).map(index => numberIndexToIdMap.get(index)).filter(Boolean);
      const resolvedParallelTrackIds = (playbookItem.parallel_tracks || []).map(index => numberIndexToIdMap.get(index)).filter(Boolean);

      return {
        id: stage.id,
        dependencies: resolvedDependencyIds,
        parallel_tracks: resolvedParallelTrackIds
      };
    }).filter(Boolean);

    // Process updates sequentially to avoid rate limiting
    let processedCount = 0;
    for (const updateItem of stagesToUpdate) {
      await Stage.update(updateItem.id, { 
        dependencies: updateItem.dependencies, 
        parallel_tracks: updateItem.parallel_tracks 
      });
      
      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`Linked dependencies for ${processedCount}/${stagesToUpdate.length} stages`);
      }
      
      await delay(50); // Small delay to prevent overwhelming localStorage
    }
    
    console.log('Dependencies resolved');

    // Step 5: Create deliverables for stages marked as deliverables
    console.log('Creating deliverables...');
    const deliverableStages = createdStages.filter(stage => stage.is_deliverable);
    const deliverablesToCreate = deliverableStages.map(stage => ({
      project_id: projectId,
      stage_id: stage.id,
      name: stage.name,
      type: stage.category === 'research' ? 'research' : 
            stage.category === 'strategy' ? 'strategy' : 'creative',
      include_in_brandbook: stage.category === 'brand_building' || 
                           stage.name.toLowerCase().includes('brandbook'),
      max_revisions: 2,
      status: 'not_started'
    }));
    
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