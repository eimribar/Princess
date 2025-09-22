/**
 * Diagnose Project Isolation Issues
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

async function diagnoseProjects() {
  console.log('🔍 DIAGNOSING PROJECT ISOLATION ISSUES\n');
  console.log('=' .repeat(70));
  
  // 1. Check all projects
  console.log('\n1️⃣ CHECKING PROJECTS:');
  console.log('-'.repeat(40));
  
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('id, name, client_name, status, created_at')
    .order('created_at', { ascending: false });
  
  if (projectError) {
    console.log('❌ Error fetching projects:', projectError.message);
    return;
  }
  
  if (!projects || projects.length === 0) {
    console.log('⚠️  No projects found in database');
    return;
  }
  
  console.log(`Found ${projects.length} projects:`);
  projects.forEach(p => {
    console.log(`\n   📁 ${p.name || 'Unnamed'}`);
    console.log(`      ID: ${p.id}`);
    console.log(`      Client: ${p.client_name || 'N/A'}`);
    console.log(`      Status: ${p.status}`);
    console.log(`      Created: ${new Date(p.created_at).toLocaleDateString()}`);
  });
  
  // 2. Check stages for each project
  console.log('\n\n2️⃣ CHECKING STAGES PER PROJECT:');
  console.log('-'.repeat(40));
  
  for (const project of projects) {
    const { data: stages, error: stageError } = await supabase
      .from('stages')
      .select('id, number_index, name, status, project_id')
      .eq('project_id', project.id)
      .order('number_index');
    
    if (stageError) {
      console.log(`❌ Error fetching stages for ${project.name}:`, stageError.message);
      continue;
    }
    
    console.log(`\n   📁 ${project.name}:`);
    console.log(`      Stages: ${stages?.length || 0}`);
    
    if (stages && stages.length > 0) {
      // Check if all stages have correct project_id
      const wrongProjectStages = stages.filter(s => s.project_id !== project.id);
      if (wrongProjectStages.length > 0) {
        console.log(`      ⚠️  ${wrongProjectStages.length} stages have WRONG project_id!`);
      }
      
      // Show first 3 stages
      console.log(`      First 3 stages:`);
      stages.slice(0, 3).forEach(s => {
        console.log(`        - #${s.number_index}: ${s.name} (${s.status})`);
      });
    } else {
      console.log(`      ⚠️  NO STAGES FOUND!`);
    }
  }
  
  // 3. Check for orphaned stages
  console.log('\n\n3️⃣ CHECKING FOR ORPHANED STAGES:');
  console.log('-'.repeat(40));
  
  const projectIds = projects.map(p => p.id);
  const { data: allStages, error: allStagesError } = await supabase
    .from('stages')
    .select('id, name, project_id');
  
  if (allStages) {
    const orphanedStages = allStages.filter(s => !s.project_id || !projectIds.includes(s.project_id));
    
    if (orphanedStages.length > 0) {
      console.log(`⚠️  Found ${orphanedStages.length} orphaned stages with no valid project!`);
      orphanedStages.slice(0, 5).forEach(s => {
        console.log(`   - ${s.name} (project_id: ${s.project_id || 'NULL'})`);
      });
    } else {
      console.log('✅ No orphaned stages found');
    }
  }
  
  // 4. Check deliverables per project
  console.log('\n\n4️⃣ CHECKING DELIVERABLES PER PROJECT:');
  console.log('-'.repeat(40));
  
  for (const project of projects) {
    const { data: deliverables } = await supabase
      .from('deliverables')
      .select('id, name, project_id')
      .eq('project_id', project.id);
    
    console.log(`   📁 ${project.name}: ${deliverables?.length || 0} deliverables`);
  }
  
  // 5. Check team members
  console.log('\n\n5️⃣ CHECKING TEAM MEMBERS:');
  console.log('-'.repeat(40));
  
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name, project_id');
  
  if (teamMembers) {
    // Group by project
    const byProject = {};
    teamMembers.forEach(tm => {
      const pid = tm.project_id || 'NO_PROJECT';
      if (!byProject[pid]) byProject[pid] = [];
      byProject[pid].push(tm);
    });
    
    console.log(`Total team members: ${teamMembers.length}`);
    Object.entries(byProject).forEach(([pid, members]) => {
      const project = projects.find(p => p.id === pid);
      const projectName = project?.name || `Unknown (${pid})`;
      console.log(`   ${projectName}: ${members.length} members`);
    });
    
    if (byProject['NO_PROJECT']) {
      console.log(`   ⚠️  ${byProject['NO_PROJECT'].length} team members with NO project!`);
    }
  }
  
  // 6. DIAGNOSIS
  console.log('\n\n🔍 DIAGNOSIS SUMMARY:');
  console.log('=' .repeat(70));
  
  console.log('\n❌ IDENTIFIED ISSUES:\n');
  
  console.log('1. TEAM MEMBERS ARE NOT PROJECT-SPECIFIC');
  console.log('   - Team members table has project_id field');
  console.log('   - But many members might not have project_id set');
  console.log('   - This causes team members to appear in ALL projects\n');
  
  console.log('2. PROJECT SWITCHING MAY NOT RELOAD DATA');
  console.log('   - Dashboard might cache data from previous project');
  console.log('   - ProjectContext switchProject might not clear old data\n');
  
  console.log('3. PROJECT CREATION MIGHT NOT SET project_id');
  console.log('   - When creating stages, project_id must be set');
  console.log('   - When creating team members, project_id must be set');
  console.log('   - When creating deliverables, project_id must be set\n');
  
  console.log('4. FILTER FUNCTIONS NEED project_id');
  console.log('   - All queries must filter by project_id');
  console.log('   - Components must use filtered data, not all data\n');
  
  console.log('\n✅ SOLUTIONS NEEDED:\n');
  console.log('1. Fix ProjectContext.switchProject to clear ALL old data');
  console.log('2. Ensure project_id is set when creating ANY entity');
  console.log('3. Fix team member assignment to be project-specific');
  console.log('4. Add validation to ensure project_id is always present');
  console.log('5. Update all filter queries to use project_id');
}

// Run diagnosis
diagnoseProjects();