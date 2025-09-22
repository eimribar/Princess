/**
 * DEEP QA TEST - PROJECT SWITCHING & UI SIMULATION
 * This test simulates what happens when users switch between projects
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Color codes
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
  const prefix = {
    info: `${colors.cyan}INFO`,
    success: `${colors.green}PASS`,
    error: `${colors.red}FAIL`,
    warning: `${colors.yellow}WARN`,
    test: `${colors.magenta}TEST`,
    data: `${colors.blue}DATA`
  }[type] || '';
  
  console.log(`[${prefix}${colors.reset}] ${message}`);
}

async function simulateProjectSwitch(fromProjectId, toProjectId) {
  log(`\n${'='.repeat(70)}`, 'info');
  log(`SIMULATING PROJECT SWITCH`, 'test');
  log(`From: ${fromProjectId}`, 'data');
  log(`To: ${toProjectId}`, 'data');
  log(`${'='.repeat(70)}`, 'info');
  
  const issues = [];
  
  // 1. Load data for "from" project
  log('\n1️⃣ Loading initial project data...', 'test');
  
  const { data: fromProject } = await supabase
    .from('projects')
    .select('*')
    .eq('id', fromProjectId)
    .single();
  
  const { data: fromStages } = await supabase
    .from('stages')
    .select('*')
    .eq('project_id', fromProjectId)
    .order('number_index');
  
  const { data: fromTeam } = await supabase
    .from('team_members')
    .select('*')
    .eq('project_id', fromProjectId);
  
  const { data: fromDeliverables } = await supabase
    .from('deliverables')
    .select('*')
    .eq('project_id', fromProjectId);
  
  const { data: fromComments } = await supabase
    .from('comments')
    .select('*')
    .eq('project_id', fromProjectId);
  
  log(`  Initial project: ${fromProject?.name}`, 'data');
  log(`  Stages: ${fromStages?.length || 0}`, 'data');
  log(`  Team: ${fromTeam?.length || 0}`, 'data');
  log(`  Deliverables: ${fromDeliverables?.length || 0}`, 'data');
  log(`  Comments: ${fromComments?.length || 0}`, 'data');
  
  // 2. Simulate switching to new project
  log('\n2️⃣ Switching to new project...', 'test');
  
  const { data: toProject } = await supabase
    .from('projects')
    .select('*')
    .eq('id', toProjectId)
    .single();
  
  const { data: toStages } = await supabase
    .from('stages')
    .select('*')
    .eq('project_id', toProjectId)
    .order('number_index');
  
  const { data: toTeam } = await supabase
    .from('team_members')
    .select('*')
    .eq('project_id', toProjectId);
  
  const { data: toDeliverables } = await supabase
    .from('deliverables')
    .select('*')
    .eq('project_id', toProjectId);
  
  const { data: toComments } = await supabase
    .from('comments')
    .select('*')
    .eq('project_id', toProjectId);
  
  log(`  New project: ${toProject?.name}`, 'data');
  log(`  Stages: ${toStages?.length || 0}`, 'data');
  log(`  Team: ${toTeam?.length || 0}`, 'data');
  log(`  Deliverables: ${toDeliverables?.length || 0}`, 'data');
  log(`  Comments: ${toComments?.length || 0}`, 'data');
  
  // 3. Verify data is completely different
  log('\n3️⃣ Verifying data isolation...', 'test');
  
  // Check stages
  if (fromStages && toStages) {
    const commonStages = fromStages.filter(fs => 
      toStages.some(ts => ts.id === fs.id)
    );
    
    if (commonStages.length > 0) {
      issues.push(`Found ${commonStages.length} shared stages between projects`);
      log(`  ❌ Found ${commonStages.length} shared stages!`, 'error');
    } else {
      log(`  ✅ No shared stages`, 'success');
    }
    
    // Check stage names don't contain wrong client
    const wrongClientStages = toStages.filter(s => 
      s.name.includes(fromProject?.client_name)
    );
    
    if (wrongClientStages.length > 0) {
      issues.push(`${wrongClientStages.length} stages contain wrong client name`);
      log(`  ❌ ${wrongClientStages.length} stages have wrong client name`, 'error');
    } else {
      log(`  ✅ All stages have correct client references`, 'success');
    }
  }
  
  // Check team members
  if (fromTeam && toTeam) {
    const commonTeam = fromTeam.filter(ft => 
      toTeam.some(tt => tt.id === ft.id && ft.project_id === fromProjectId)
    );
    
    if (commonTeam.length > 0) {
      issues.push(`Found ${commonTeam.length} incorrectly shared team members`);
      log(`  ❌ Found ${commonTeam.length} incorrectly shared team members!`, 'error');
    } else {
      log(`  ✅ No incorrectly shared team members`, 'success');
    }
  }
  
  // Check deliverables
  if (fromDeliverables && toDeliverables) {
    const commonDeliverables = fromDeliverables.filter(fd => 
      toDeliverables.some(td => td.id === fd.id)
    );
    
    if (commonDeliverables.length > 0) {
      issues.push(`Found ${commonDeliverables.length} shared deliverables`);
      log(`  ❌ Found ${commonDeliverables.length} shared deliverables!`, 'error');
    } else {
      log(`  ✅ No shared deliverables`, 'success');
    }
  }
  
  // Check comments
  if (fromComments && toComments) {
    const commonComments = fromComments.filter(fc => 
      toComments.some(tc => tc.id === fc.id)
    );
    
    if (commonComments.length > 0) {
      issues.push(`Found ${commonComments.length} shared comments`);
      log(`  ❌ Found ${commonComments.length} shared comments!`, 'error');
    } else {
      log(`  ✅ No shared comments`, 'success');
    }
  }
  
  return issues;
}

async function testProjectOperations(projectId) {
  log(`\n${'='.repeat(70)}`, 'info');
  log(`TESTING CRUD OPERATIONS FOR PROJECT`, 'test');
  log(`${'='.repeat(70)}`, 'info');
  
  const issues = [];
  
  // 1. Test Stage Update
  log('\n1️⃣ Testing Stage Update...', 'test');
  
  const { data: stages } = await supabase
    .from('stages')
    .select('*')
    .eq('project_id', projectId)
    .limit(1);
  
  if (stages && stages[0]) {
    const stageId = stages[0].id;
    const originalStatus = stages[0].status;
    const newStatus = originalStatus === 'not_ready' ? 'in_progress' : 'completed';
    
    const { error: updateError } = await supabase
      .from('stages')
      .update({ status: newStatus })
      .eq('id', stageId);
    
    if (updateError) {
      issues.push(`Failed to update stage: ${updateError.message}`);
      log(`  ❌ Failed to update stage`, 'error');
    } else {
      // Verify update worked
      const { data: updatedStage } = await supabase
        .from('stages')
        .select('*')
        .eq('id', stageId)
        .single();
      
      if (updatedStage?.status === newStatus) {
        log(`  ✅ Stage update successful (${originalStatus} → ${newStatus})`, 'success');
        
        // Revert the change
        await supabase
          .from('stages')
          .update({ status: originalStatus })
          .eq('id', stageId);
      } else {
        issues.push('Stage update did not persist');
        log(`  ❌ Stage update did not persist`, 'error');
      }
    }
  }
  
  // 2. Test Adding Comment
  log('\n2️⃣ Testing Comment Creation...', 'test');
  
  const testComment = {
    project_id: projectId,
    comment_text: `Test comment at ${new Date().toISOString()}`,
    is_internal: false
  };
  
  const { data: newComment, error: commentError } = await supabase
    .from('comments')
    .insert(testComment)
    .select()
    .single();
  
  if (commentError) {
    issues.push(`Failed to create comment: ${commentError.message}`);
    log(`  ❌ Failed to create comment`, 'error');
  } else {
    log(`  ✅ Comment created successfully`, 'success');
    
    // Clean up
    await supabase
      .from('comments')
      .delete()
      .eq('id', newComment.id);
  }
  
  // 3. Test Team Member Addition
  log('\n3️⃣ Testing Team Member Addition...', 'test');
  
  const testMember = {
    project_id: projectId,
    name: 'Test QA Member',
    email: 'qa.test@example.com',
    role: 'QA Tester',
    team_type: 'agency',
    is_decision_maker: false
  };
  
  const { data: newMember, error: memberError } = await supabase
    .from('team_members')
    .insert(testMember)
    .select()
    .single();
  
  if (memberError) {
    issues.push(`Failed to add team member: ${memberError.message}`);
    log(`  ❌ Failed to add team member`, 'error');
  } else {
    log(`  ✅ Team member added successfully`, 'success');
    
    // Verify it's only visible in this project
    const { data: memberCheck } = await supabase
      .from('team_members')
      .select('*')
      .eq('email', 'qa.test@example.com');
    
    if (memberCheck && memberCheck.length === 1 && memberCheck[0].project_id === projectId) {
      log(`  ✅ Team member correctly isolated to project`, 'success');
    } else {
      issues.push('Team member not properly isolated');
      log(`  ❌ Team member not properly isolated`, 'error');
    }
    
    // Clean up
    await supabase
      .from('team_members')
      .delete()
      .eq('id', newMember.id);
  }
  
  return issues;
}

async function verifyDataIntegrity() {
  log(`\n${'='.repeat(70)}`, 'info');
  log(`VERIFYING DATA INTEGRITY`, 'test');
  log(`${'='.repeat(70)}`, 'info');
  
  const issues = [];
  
  // 1. Check for stages without projects
  const { data: orphanedStages } = await supabase
    .from('stages')
    .select('id, name')
    .is('project_id', null);
  
  if (orphanedStages && orphanedStages.length > 0) {
    issues.push(`Found ${orphanedStages.length} orphaned stages`);
    log(`  ❌ Found ${orphanedStages.length} orphaned stages`, 'error');
  } else {
    log(`  ✅ No orphaned stages`, 'success');
  }
  
  // 2. Check for team members without projects
  const { data: orphanedTeam } = await supabase
    .from('team_members')
    .select('id, name')
    .is('project_id', null);
  
  if (orphanedTeam && orphanedTeam.length > 0) {
    issues.push(`Found ${orphanedTeam.length} orphaned team members`);
    log(`  ❌ Found ${orphanedTeam.length} orphaned team members`, 'error');
  } else {
    log(`  ✅ No orphaned team members`, 'success');
  }
  
  // 3. Check for deliverables without projects
  const { data: orphanedDeliverables } = await supabase
    .from('deliverables')
    .select('id, name')
    .is('project_id', null);
  
  if (orphanedDeliverables && orphanedDeliverables.length > 0) {
    issues.push(`Found ${orphanedDeliverables.length} orphaned deliverables`);
    log(`  ❌ Found ${orphanedDeliverables.length} orphaned deliverables`, 'error');
  } else {
    log(`  ✅ No orphaned deliverables`, 'success');
  }
  
  // 4. Verify project counts match
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });
  
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name');
  
  log(`\n  Total projects: ${projectCount}`, 'data');
  
  for (const project of projects || []) {
    const { count: stageCount } = await supabase
      .from('stages')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project.id);
    
    const { count: teamCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project.id);
    
    log(`  ${project.name}: ${stageCount} stages, ${teamCount} team members`, 'data');
  }
  
  return issues;
}

async function runDeepQATest() {
  console.log('\n' + colors.bright + colors.magenta);
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║          DEEP QA TEST - PROJECT SWITCHING & OPERATIONS              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  const allIssues = [];
  
  try {
    // Get all projects
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .order('created_at');
    
    if (!projects || projects.length < 2) {
      log('⚠️  Need at least 2 projects to test switching', 'warning');
      return;
    }
    
    log(`Found ${projects.length} projects to test`, 'info');
    projects.forEach(p => {
      log(`  • ${p.name} (${p.id})`, 'data');
    });
    
    // Test 1: Project Switching
    for (let i = 0; i < Math.min(projects.length - 1, 3); i++) {
      const issues = await simulateProjectSwitch(projects[i].id, projects[i + 1].id);
      allIssues.push(...issues);
    }
    
    // Test 2: CRUD Operations
    for (let i = 0; i < Math.min(projects.length, 2); i++) {
      const issues = await testProjectOperations(projects[i].id);
      allIssues.push(...issues);
    }
    
    // Test 3: Data Integrity
    const integrityIssues = await verifyDataIntegrity();
    allIssues.push(...integrityIssues);
    
    // Final Report
    console.log('\n' + colors.bright + colors.cyan);
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║                    DEEP QA TEST RESULTS                             ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    
    if (allIssues.length === 0) {
      console.log('\n' + colors.green + colors.bright);
      console.log('🎉 🎉 🎉  PERFECT! ALL DEEP TESTS PASSED  🎉 🎉 🎉');
      console.log('\nProject isolation is working flawlessly:');
      console.log('  ✅ Projects are completely isolated');
      console.log('  ✅ Switching preserves isolation');
      console.log('  ✅ CRUD operations are project-specific');
      console.log('  ✅ No data leakage between projects');
      console.log('  ✅ No orphaned records');
      console.log(colors.reset);
    } else {
      log(`\n❌ Found ${allIssues.length} issues:`, 'error');
      allIssues.forEach((issue, i) => {
        log(`  ${i + 1}. ${issue}`, 'error');
      });
    }
    
  } catch (error) {
    log(`\n❌ CRITICAL ERROR: ${error.message}`, 'error');
    console.error(error);
  }
}

// Run the deep QA test
runDeepQATest();