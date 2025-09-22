/**
 * Test Project Isolation
 * Script to create test projects and verify data isolation
 * 
 * Usage: Import this in main.jsx or run in console
 */

import { SupabaseProject, SupabaseStage, SupabaseDeliverable, SupabaseTeamMember } from '@/api/supabaseEntities';
import projectService from '@/services/projectService';
import { clearAllProjectData } from './clearProjectData';

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  window.testProjectIsolation = {
    createTestProjects,
    verifyProjectIsolation,
    cleanupTestProjects,
    clearAllData: clearAllProjectData
  };
}

/**
 * Create test projects with different configurations
 */
export async function createTestProjects() {
  console.log('🧪 Creating test projects for isolation testing...');
  
  try {
    // Project A: ABC Brand Development
    console.log('\n📦 Creating Project A: ABC Brand Development');
    const projectA = await projectService.createProject({
      name: 'ABC Brand Development',
      client_name: 'ABC Corporation',
      description: 'Complete brand identity development for ABC Corp',
      start_date: '2025-01-15',
      settings: {
        approvalSLA: 3,
        notifications: {
          client: 'approvals_only',
          agency: 'all'
        }
      }
    });
    
    // Create stages for Project A
    await projectService.cloneStagesForProject(projectA, '2025-01-15');
    console.log(`✅ Project A created: ${projectA}`);
    
    // Project B: XYZ Rebrand
    console.log('\n📦 Creating Project B: XYZ Rebrand');
    const projectB = await projectService.createProject({
      name: 'XYZ Company Rebrand',
      client_name: 'XYZ Industries',
      description: 'Comprehensive rebrand for XYZ Industries',
      start_date: '2025-02-01',
      settings: {
        approvalSLA: 5,
        notifications: {
          client: 'major_milestones',
          agency: 'all'
        }
      }
    });
    
    // Create stages for Project B
    await projectService.cloneStagesForProject(projectB, '2025-02-01');
    console.log(`✅ Project B created: ${projectB}`);
    
    // Project C: DEF Startup Launch
    console.log('\n📦 Creating Project C: DEF Startup Launch');
    const projectC = await projectService.createProject({
      name: 'DEF Startup Brand Launch',
      client_name: 'DEF Ventures',
      description: 'New brand creation for DEF startup',
      start_date: '2025-03-01',
      settings: {
        approvalSLA: 2,
        notifications: {
          client: 'all',
          agency: 'all'
        }
      }
    });
    
    // Create stages for Project C
    await projectService.cloneStagesForProject(projectC, '2025-03-01');
    console.log(`✅ Project C created: ${projectC}`);
    
    console.log('\n✅ All test projects created successfully!');
    console.log('Projects created:', { projectA, projectB, projectC });
    
    return { projectA, projectB, projectC };
  } catch (error) {
    console.error('❌ Failed to create test projects:', error);
    throw error;
  }
}

/**
 * Verify that projects have isolated data
 */
export async function verifyProjectIsolation() {
  console.log('\n🔍 Verifying project isolation...');
  
  try {
    // Get all projects
    const projects = await SupabaseProject.list();
    console.log(`Found ${projects.length} projects`);
    
    if (projects.length < 2) {
      console.warn('⚠️ Need at least 2 projects to test isolation');
      return false;
    }
    
    // Check each project's data
    const projectData = {};
    
    for (const project of projects) {
      console.log(`\n📊 Checking project: ${project.name} (${project.id})`);
      
      // Get stages for this project
      const stages = await SupabaseStage.filter({ project_id: project.id });
      const deliverables = await SupabaseDeliverable.filter({ project_id: project.id });
      const teamMembers = await SupabaseTeamMember.filter({ project_id: project.id });
      
      projectData[project.id] = {
        name: project.name,
        stageCount: stages.length,
        deliverableCount: deliverables.length,
        teamCount: teamMembers.length,
        startDate: project.start_date,
        firstStage: stages[0]?.name,
        firstStageStatus: stages[0]?.status
      };
      
      console.log(`  - Stages: ${stages.length}`);
      console.log(`  - Deliverables: ${deliverables.length}`);
      console.log(`  - Team Members: ${teamMembers.length}`);
      console.log(`  - Start Date: ${project.start_date}`);
      console.log(`  - First Stage: ${stages[0]?.name} (${stages[0]?.status})`);
    }
    
    // Verify isolation
    console.log('\n🔬 Isolation Check:');
    const projectIds = Object.keys(projectData);
    let isIsolated = true;
    
    // Check that each project has unique data
    for (let i = 0; i < projectIds.length; i++) {
      for (let j = i + 1; j < projectIds.length; j++) {
        const p1 = projectData[projectIds[i]];
        const p2 = projectData[projectIds[j]];
        
        if (p1.startDate === p2.startDate) {
          console.warn(`⚠️ Projects have same start date: ${p1.name} and ${p2.name}`);
          isIsolated = false;
        }
        
        if (p1.stageCount !== 104) {
          console.warn(`⚠️ Project ${p1.name} has ${p1.stageCount} stages instead of 104`);
          isIsolated = false;
        }
      }
    }
    
    if (isIsolated) {
      console.log('✅ Projects are properly isolated!');
    } else {
      console.log('❌ Project isolation issues detected');
    }
    
    return isIsolated;
  } catch (error) {
    console.error('❌ Failed to verify isolation:', error);
    return false;
  }
}

/**
 * Update a stage in one project and verify it doesn't affect others
 */
export async function testStageUpdate(projectId) {
  console.log(`\n🔧 Testing stage update for project ${projectId}`);
  
  try {
    // Get first stage of the project
    const stages = await SupabaseStage.filter({ project_id: projectId });
    if (stages.length === 0) {
      console.error('No stages found for project');
      return false;
    }
    
    const firstStage = stages[0];
    console.log(`Original stage status: ${firstStage.status}`);
    
    // Update the stage
    await SupabaseStage.update(firstStage.id, {
      status: 'in_progress',
      notes: `Updated at ${new Date().toISOString()}`
    });
    
    console.log('✅ Stage updated to in_progress');
    
    // Verify other projects weren't affected
    const otherProjects = await SupabaseProject.list();
    for (const project of otherProjects) {
      if (project.id !== projectId) {
        const otherStages = await SupabaseStage.filter({ project_id: project.id });
        const otherFirstStage = otherStages[0];
        
        if (otherFirstStage?.status === 'in_progress') {
          console.error(`❌ Stage in project ${project.name} was incorrectly updated!`);
          return false;
        }
      }
    }
    
    console.log('✅ Other projects were not affected');
    return true;
  } catch (error) {
    console.error('❌ Failed to test stage update:', error);
    return false;
  }
}

/**
 * Clean up test projects
 */
export async function cleanupTestProjects() {
  console.log('\n🧹 Cleaning up test projects...');
  
  try {
    const projects = await SupabaseProject.list();
    const testProjects = projects.filter(p => 
      p.name.includes('Test Project') || 
      p.name.includes('ABC Brand') || 
      p.name.includes('XYZ') || 
      p.name.includes('DEF Startup')
    );
    
    for (const project of testProjects) {
      console.log(`Deleting: ${project.name}`);
      await SupabaseProject.delete(project.id);
    }
    
    console.log('✅ Test projects cleaned up');
  } catch (error) {
    console.error('❌ Failed to cleanup:', error);
  }
}

// Export test suite
export default {
  createTestProjects,
  verifyProjectIsolation,
  testStageUpdate,
  cleanupTestProjects,
  clearAllData: clearAllProjectData
};