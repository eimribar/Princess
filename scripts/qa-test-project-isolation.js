/**
 * COMPREHENSIVE QA TEST FOR PROJECT ISOLATION
 * This script will create multiple projects and thoroughly test data isolation
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { addDays, format } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test data for multiple projects
const TEST_PROJECTS = [
  {
    name: 'Tesla Rebranding',
    client_name: 'Tesla Motors',
    description: 'Complete brand refresh for Tesla including new visual identity',
    start_date: '2025-10-01',
    settings: {
      approvalSLA: 2,
      notifications: { client: 'high', agency: 'all' }
    }
  },
  {
    name: 'Nike Campaign 2025',
    client_name: 'Nike Inc',
    description: 'Spring 2025 global campaign development',
    start_date: '2025-11-15',
    settings: {
      approvalSLA: 5,
      notifications: { client: 'deliverables_only', agency: 'high' }
    }
  },
  {
    name: 'Spotify Rebrand',
    client_name: 'Spotify AB',
    description: 'Audio streaming platform visual identity evolution',
    start_date: '2025-09-25',
    settings: {
      approvalSLA: 3,
      notifications: { client: 'all', agency: 'all' }
    }
  }
];

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toTimeString().slice(0, 8);
  const prefix = {
    info: `${colors.blue}ℹ️`,
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    test: `${colors.magenta}🧪`,
    data: `${colors.cyan}📊`
  }[type] || '';
  
  console.log(`[${timestamp}] ${prefix} ${message}${colors.reset}`);
}

async function createTestProject(projectData, index) {
  log(`Creating project: ${projectData.name}`, 'test');
  
  try {
    // Step 1: Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (projectError) {
      log(`Failed to create project: ${projectError.message}`, 'error');
      return null;
    }
    
    log(`Project created with ID: ${project.id}`, 'success');
    
    // Step 2: Create stages with varying configurations
    const stages = [];
    const stageCount = 104;
    // Fixed: Using only valid categories from database enum
    const categories = ['onboarding', 'research', 'strategy', 'brand_building', 'brand_collaterals', 'brand_activation'];
    
    for (let i = 1; i <= stageCount; i++) {
      const category = categories[Math.floor((i - 1) / 15) % categories.length];
      const startDateOffset = (i - 1) * 3 + (index * 7); // Different timeline for each project
      
      stages.push({
        project_id: project.id,
        number_index: i,
        name: `Stage ${i} - ${projectData.client_name}`,
        formal_name: `Formal Stage ${i}`,
        is_deliverable: i % 5 === 0, // Every 5th stage is a deliverable
        category: category,
        status: i === 1 ? 'in_progress' : 'not_ready',
        description: `Description for stage ${i} of ${projectData.name}`,
        estimated_duration: 3 + (i % 4), // Varying durations
        start_date: format(addDays(new Date(projectData.start_date), startDateOffset), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(projectData.start_date), startDateOffset + 3 + (i % 4)), 'yyyy-MM-dd'),
        client_facing: i % 3 !== 0,
        blocking_priority: ['low', 'medium', 'high', 'critical'][i % 4],
        resource_dependency: ['none', 'client_materials', 'external_vendor'][i % 3]
      });
    }
    
    // Insert stages in batches
    const batchSize = 20;
    for (let i = 0; i < stages.length; i += batchSize) {
      const batch = stages.slice(i, i + batchSize);
      const { error: stageError } = await supabase
        .from('stages')
        .insert(batch);
      
      if (stageError) {
        log(`Error inserting stages batch ${i / batchSize + 1}: ${stageError.message}`, 'error');
      }
    }
    
    log(`Created ${stages.length} stages for ${projectData.name}`, 'success');
    
    // Step 3: Create team members specific to this project
    const teamMembers = [
      {
        project_id: project.id,
        name: `PM ${index + 1} - ${projectData.client_name}`,
        email: `pm${index + 1}@${projectData.client_name.toLowerCase().replace(/\s+/g, '')}.com`,
        role: 'Project Manager',
        team_type: 'agency',
        is_decision_maker: false,
        bio: `Project Manager for ${projectData.name}`
      },
      {
        project_id: project.id,
        name: `Designer ${index + 1} - ${projectData.client_name}`,
        email: `designer${index + 1}@agency.com`,
        role: 'Lead Designer',
        team_type: 'agency',
        is_decision_maker: false,
        bio: `Lead Designer for ${projectData.name}`
      },
      {
        project_id: project.id,
        name: `Client Lead ${index + 1}`,
        email: `lead${index + 1}@${projectData.client_name.toLowerCase().replace(/\s+/g, '')}.com`,
        role: 'Decision Maker',
        team_type: 'client',
        is_decision_maker: true,
        bio: `Primary decision maker for ${projectData.client_name}`
      },
      {
        project_id: project.id,
        name: `Client Contact ${index + 1}`,
        email: `contact${index + 1}@${projectData.client_name.toLowerCase().replace(/\s+/g, '')}.com`,
        role: 'Marketing Director',
        team_type: 'client',
        is_decision_maker: false,
        bio: `Marketing Director at ${projectData.client_name}`
      }
    ];
    
    const { error: teamError } = await supabase
      .from('team_members')
      .insert(teamMembers);
    
    if (teamError) {
      log(`Error creating team members: ${teamError.message}`, 'error');
    } else {
      log(`Created ${teamMembers.length} team members for ${projectData.name}`, 'success');
    }
    
    // Step 4: Create project-specific deliverables
    const deliverables = [];
    for (let i = 1; i <= 20; i++) {
      deliverables.push({
        project_id: project.id,
        stage_id: null, // We'd need to fetch stage IDs for proper linking
        name: `Deliverable ${i} - ${projectData.client_name}`,
        description: `Deliverable for ${projectData.name} - Item ${i}`,
        category: ['research', 'strategy', 'creative', 'documentation'][i % 4],
        type: ['document', 'presentation', 'design', 'video'][i % 4],
        priority: ['low', 'medium', 'high', 'critical'][i % 4],
        status: i === 1 ? 'submitted' : 'draft',
        max_iterations: 3,
        current_iteration: i === 1 ? 1 : 0,
        include_in_brandbook: i % 3 === 0
      });
    }
    
    const { error: deliverableError } = await supabase
      .from('deliverables')
      .insert(deliverables);
    
    if (deliverableError) {
      log(`Error creating deliverables: ${deliverableError.message}`, 'error');
    } else {
      log(`Created ${deliverables.length} deliverables for ${projectData.name}`, 'success');
    }
    
    // Step 5: Create project-specific comments
    const comments = [];
    for (let i = 1; i <= 10; i++) {
      comments.push({
        project_id: project.id,
        comment_text: `Test comment ${i} for ${projectData.name}`,
        is_internal: i % 2 === 0
      });
    }
    
    const { error: commentError } = await supabase
      .from('comments')
      .insert(comments);
    
    if (commentError) {
      log(`Error creating comments: ${commentError.message}`, 'error');
    } else {
      log(`Created ${comments.length} comments for ${projectData.name}`, 'success');
    }
    
    return project;
    
  } catch (error) {
    log(`Unexpected error creating project: ${error.message}`, 'error');
    return null;
  }
}

async function verifyProjectIsolation(projects) {
  log('\n' + '='.repeat(70), 'info');
  log('VERIFYING PROJECT ISOLATION', 'test');
  log('='.repeat(70), 'info');
  
  const issues = [];
  
  for (const project of projects) {
    if (!project) continue;
    
    log(`\nVerifying project: ${project.name}`, 'test');
    
    // 1. Verify stages are isolated
    const { data: stages, error: stageError } = await supabase
      .from('stages')
      .select('*')
      .eq('project_id', project.id);
    
    if (stageError) {
      issues.push(`Cannot fetch stages for ${project.name}: ${stageError.message}`);
    } else {
      log(`  Stages: ${stages.length} (Expected: 104)`, stages.length === 104 ? 'success' : 'error');
      
      // Check if any stage name contains wrong client name
      const wrongStages = stages.filter(s => {
        return projects.some(p => p.id !== project.id && s.name.includes(p.client_name));
      });
      
      if (wrongStages.length > 0) {
        issues.push(`${wrongStages.length} stages contain wrong client name in ${project.name}`);
        log(`  ❌ Found ${wrongStages.length} stages with wrong client names`, 'error');
      } else {
        log(`  ✅ All stages correctly isolated`, 'success');
      }
    }
    
    // 2. Verify team members are isolated
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('*')
      .eq('project_id', project.id);
    
    if (teamError) {
      issues.push(`Cannot fetch team members for ${project.name}: ${teamError.message}`);
    } else {
      log(`  Team Members: ${teamMembers.length} (Expected: 4)`, teamMembers.length === 4 ? 'success' : 'error');
      
      // Verify team members have correct project association
      const wrongTeamMembers = teamMembers.filter(tm => {
        return !tm.email.includes(project.client_name.toLowerCase().replace(/\s+/g, '')) && 
               !tm.email.includes('agency.com');
      });
      
      if (wrongTeamMembers.length > 0) {
        issues.push(`${wrongTeamMembers.length} team members with wrong email domain in ${project.name}`);
        log(`  ❌ Found ${wrongTeamMembers.length} team members with wrong associations`, 'error');
      } else {
        log(`  ✅ All team members correctly isolated`, 'success');
      }
    }
    
    // 3. Verify deliverables are isolated
    const { data: deliverables, error: deliverableError } = await supabase
      .from('deliverables')
      .select('*')
      .eq('project_id', project.id);
    
    if (deliverableError) {
      issues.push(`Cannot fetch deliverables for ${project.name}: ${deliverableError.message}`);
    } else {
      log(`  Deliverables: ${deliverables.length} (Expected: 20)`, deliverables.length === 20 ? 'success' : 'error');
      
      // Check deliverable names
      const wrongDeliverables = deliverables.filter(d => {
        return !d.name.includes(project.client_name);
      });
      
      if (wrongDeliverables.length > 0) {
        issues.push(`${wrongDeliverables.length} deliverables with wrong client name in ${project.name}`);
        log(`  ❌ Found ${wrongDeliverables.length} deliverables with wrong names`, 'error');
      } else {
        log(`  ✅ All deliverables correctly isolated`, 'success');
      }
    }
    
    // 4. Verify comments are isolated
    const { data: comments, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', project.id);
    
    if (commentError) {
      issues.push(`Cannot fetch comments for ${project.name}: ${commentError.message}`);
    } else {
      log(`  Comments: ${comments.length} (Expected: 10)`, comments.length === 10 ? 'success' : 'error');
      
      // Check comment content
      const wrongComments = comments.filter(c => {
        return !c.comment_text.includes(project.name);
      });
      
      if (wrongComments.length > 0) {
        issues.push(`${wrongComments.length} comments with wrong content in ${project.name}`);
        log(`  ❌ Found ${wrongComments.length} comments with wrong content`, 'error');
      } else {
        log(`  ✅ All comments correctly isolated`, 'success');
      }
    }
  }
  
  return issues;
}

async function testCrossProjectContamination(projects) {
  log('\n' + '='.repeat(70), 'info');
  log('TESTING CROSS-PROJECT CONTAMINATION', 'test');
  log('='.repeat(70), 'info');
  
  const issues = [];
  
  // For each project, check if data from other projects appears
  for (let i = 0; i < projects.length; i++) {
    const currentProject = projects[i];
    if (!currentProject) continue;
    
    log(`\nChecking contamination for: ${currentProject.name}`, 'test');
    
    for (let j = 0; j < projects.length; j++) {
      if (i === j || !projects[j]) continue;
      
      const otherProject = projects[j];
      
      // Check if stages from other project appear
      const { data: contaminatedStages } = await supabase
        .from('stages')
        .select('*')
        .eq('project_id', currentProject.id)
        .like('name', `%${otherProject.client_name}%`);
      
      if (contaminatedStages && contaminatedStages.length > 0) {
        issues.push(`Found ${contaminatedStages.length} stages from ${otherProject.name} in ${currentProject.name}`);
        log(`  ❌ Contamination: ${contaminatedStages.length} stages from ${otherProject.name}`, 'error');
      }
      
      // Check team members
      const { data: contaminatedTeam } = await supabase
        .from('team_members')
        .select('*')
        .eq('project_id', currentProject.id)
        .like('email', `%${otherProject.client_name.toLowerCase().replace(/\s+/g, '')}%`);
      
      if (contaminatedTeam && contaminatedTeam.length > 0) {
        issues.push(`Found ${contaminatedTeam.length} team members from ${otherProject.name} in ${currentProject.name}`);
        log(`  ❌ Contamination: ${contaminatedTeam.length} team members from ${otherProject.name}`, 'error');
      }
    }
    
    if (issues.length === 0) {
      log(`  ✅ No cross-contamination detected`, 'success');
    }
  }
  
  return issues;
}

async function testTimelineConfiguration(projects) {
  log('\n' + '='.repeat(70), 'info');
  log('TESTING TIMELINE AUTO-POPULATION', 'test');
  log('='.repeat(70), 'info');
  
  const issues = [];
  
  for (const project of projects) {
    if (!project) continue;
    
    log(`\nVerifying timeline for: ${project.name}`, 'test');
    log(`  Project start date: ${project.start_date}`, 'data');
    
    // Get first 10 stages to verify timeline
    const { data: stages } = await supabase
      .from('stages')
      .select('*')
      .eq('project_id', project.id)
      .order('number_index')
      .limit(10);
    
    if (stages) {
      for (const stage of stages) {
        const startDate = new Date(stage.start_date);
        const endDate = new Date(stage.end_date);
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        log(`  Stage ${stage.number_index}: ${format(startDate, 'MM/dd/yyyy')} - ${format(endDate, 'MM/dd/yyyy')} (${duration} days)`, 'data');
        
        // Verify dates are after project start
        if (startDate < new Date(project.start_date)) {
          issues.push(`Stage ${stage.number_index} in ${project.name} starts before project start date`);
          log(`    ❌ Stage starts before project start date`, 'error');
        }
        
        // Verify end date is after start date
        if (endDate <= startDate) {
          issues.push(`Stage ${stage.number_index} in ${project.name} has invalid date range`);
          log(`    ❌ End date is not after start date`, 'error');
        }
      }
    }
  }
  
  return issues;
}

async function testDataCounts() {
  log('\n' + '='.repeat(70), 'info');
  log('DATA COUNT VERIFICATION', 'test');
  log('='.repeat(70), 'info');
  
  // Get total counts
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });
  
  const { count: stageCount } = await supabase
    .from('stages')
    .select('*', { count: 'exact', head: true });
  
  const { count: teamCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true });
  
  const { count: deliverableCount } = await supabase
    .from('deliverables')
    .select('*', { count: 'exact', head: true });
  
  const { count: commentCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true });
  
  log(`Total Projects: ${projectCount}`, 'data');
  log(`Total Stages: ${stageCount} (Expected: ${projectCount * 104})`, stageCount === projectCount * 104 ? 'success' : 'warning');
  log(`Total Team Members: ${teamCount} (Expected minimum: ${projectCount * 4})`, teamCount >= projectCount * 4 ? 'success' : 'warning');
  log(`Total Deliverables: ${deliverableCount}`, 'data');
  log(`Total Comments: ${commentCount}`, 'data');
  
  // Check for orphaned data
  const { data: orphanedStages } = await supabase
    .from('stages')
    .select('id')
    .is('project_id', null);
  
  const { data: orphanedTeam } = await supabase
    .from('team_members')
    .select('id')
    .is('project_id', null);
  
  if (orphanedStages && orphanedStages.length > 0) {
    log(`⚠️  Found ${orphanedStages.length} orphaned stages`, 'warning');
  } else {
    log(`✅ No orphaned stages`, 'success');
  }
  
  if (orphanedTeam && orphanedTeam.length > 0) {
    log(`⚠️  Found ${orphanedTeam.length} orphaned team members`, 'warning');
  } else {
    log(`✅ No orphaned team members`, 'success');
  }
}

async function cleanupTestProjects(projects) {
  log('\n' + '='.repeat(70), 'info');
  log('CLEANUP TEST PROJECTS', 'test');
  log('='.repeat(70), 'info');
  
  for (const project of projects) {
    if (!project) continue;
    
    log(`Cleaning up: ${project.name}`, 'info');
    
    // Delete project (cascade will handle related data)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id);
    
    if (error) {
      log(`  ❌ Failed to delete: ${error.message}`, 'error');
    } else {
      log(`  ✅ Deleted successfully`, 'success');
    }
  }
}

async function runComprehensiveQA() {
  console.log('\n' + colors.bright + colors.magenta);
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE QA TEST FOR PROJECT ISOLATION SYSTEM              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  const startTime = Date.now();
  const allIssues = [];
  const createdProjects = [];
  
  try {
    // Phase 1: Create test projects
    log('\n📋 PHASE 1: CREATING TEST PROJECTS', 'test');
    log('='.repeat(70), 'info');
    
    for (let i = 0; i < TEST_PROJECTS.length; i++) {
      const project = await createTestProject(TEST_PROJECTS[i], i);
      createdProjects.push(project);
      
      if (project) {
        log(`\n✅ Successfully created project ${i + 1}/${TEST_PROJECTS.length}: ${project.name}`, 'success');
      } else {
        log(`\n❌ Failed to create project ${i + 1}/${TEST_PROJECTS.length}`, 'error');
      }
      
      // Add delay between projects to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Phase 2: Verify isolation
    log('\n📋 PHASE 2: VERIFYING PROJECT ISOLATION', 'test');
    const isolationIssues = await verifyProjectIsolation(createdProjects);
    allIssues.push(...isolationIssues);
    
    // Phase 3: Test cross-contamination
    log('\n📋 PHASE 3: TESTING CROSS-CONTAMINATION', 'test');
    const contaminationIssues = await testCrossProjectContamination(createdProjects);
    allIssues.push(...contaminationIssues);
    
    // Phase 4: Test timeline configuration
    log('\n📋 PHASE 4: TESTING TIMELINE CONFIGURATION', 'test');
    const timelineIssues = await testTimelineConfiguration(createdProjects);
    allIssues.push(...timelineIssues);
    
    // Phase 5: Verify data counts
    log('\n📋 PHASE 5: VERIFYING DATA COUNTS', 'test');
    await testDataCounts();
    
    // Final Report
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n' + colors.bright + colors.cyan);
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║                        QA TEST COMPLETE                              ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    
    log(`\nTest Duration: ${duration} seconds`, 'info');
    log(`Projects Created: ${createdProjects.filter(p => p).length}/${TEST_PROJECTS.length}`, 'info');
    log(`Total Issues Found: ${allIssues.length}`, allIssues.length === 0 ? 'success' : 'error');
    
    if (allIssues.length > 0) {
      log('\n❌ ISSUES FOUND:', 'error');
      allIssues.forEach((issue, i) => {
        log(`  ${i + 1}. ${issue}`, 'error');
      });
    } else {
      console.log('\n' + colors.green + colors.bright);
      console.log('✅ ✅ ✅  ALL TESTS PASSED - PROJECT ISOLATION WORKING PERFECTLY  ✅ ✅ ✅');
      console.log(colors.reset);
    }
    
    // Cleanup prompt
    console.log('\n' + colors.yellow);
    console.log('Do you want to keep the test projects for manual inspection?');
    console.log('If not, uncomment the cleanup line below and run again.');
    console.log(colors.reset);
    
    // Uncomment to cleanup test projects
    // await cleanupTestProjects(createdProjects);
    
  } catch (error) {
    log(`\n❌ CRITICAL ERROR: ${error.message}`, 'error');
    console.error(error);
  }
}

// Run the comprehensive QA test
runComprehensiveQA();