/**
 * Fix orphaned team members by assigning them to projects
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

async function fixTeamMembers() {
  console.log('🔧 FIXING ORPHANED TEAM MEMBERS\n');
  console.log('=' .repeat(60));
  
  // 1. Get all team members without project_id
  console.log('1️⃣ Finding orphaned team members...');
  const { data: orphaned, error: orphanedError } = await supabase
    .from('team_members')
    .select('*')
    .is('project_id', null);
  
  if (orphanedError) {
    console.log('❌ Error fetching orphaned team members:', orphanedError.message);
    return;
  }
  
  if (!orphaned || orphaned.length === 0) {
    console.log('✅ No orphaned team members found!');
    return;
  }
  
  console.log(`Found ${orphaned.length} orphaned team members:`);
  orphaned.forEach(tm => {
    console.log(`   - ${tm.name} (${tm.email})`);
  });
  
  // 2. Get the first project (Apple)
  console.log('\n2️⃣ Getting project to assign members to...');
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('id, name')
    .order('created_at');
  
  if (projectError || !projects || projects.length === 0) {
    console.log('❌ No projects found to assign team members to');
    return;
  }
  
  const targetProject = projects[0];
  console.log(`Will assign to: ${targetProject.name} (${targetProject.id})`);
  
  // 3. Update orphaned team members
  console.log('\n3️⃣ Assigning orphaned team members to project...');
  const { error: updateError } = await supabase
    .from('team_members')
    .update({ 
      project_id: targetProject.id,
      updated_at: new Date().toISOString()
    })
    .is('project_id', null);
  
  if (updateError) {
    console.log('❌ Error updating team members:', updateError.message);
    return;
  }
  
  console.log(`✅ Successfully assigned ${orphaned.length} team members to ${targetProject.name}`);
  
  // 4. Verify the fix
  console.log('\n4️⃣ Verifying fix...');
  const { data: remaining, error: remainingError } = await supabase
    .from('team_members')
    .select('id')
    .is('project_id', null);
  
  if (remaining && remaining.length > 0) {
    console.log(`⚠️  Still ${remaining.length} team members without project_id`);
  } else {
    console.log('✅ All team members now have project_id assigned!');
  }
  
  // 5. Show team member distribution
  console.log('\n5️⃣ Team member distribution:');
  const { data: allTeamMembers } = await supabase
    .from('team_members')
    .select('project_id, name');
  
  if (allTeamMembers) {
    const byProject = {};
    allTeamMembers.forEach(tm => {
      const pid = tm.project_id || 'NO_PROJECT';
      if (!byProject[pid]) byProject[pid] = 0;
      byProject[pid]++;
    });
    
    for (const [pid, count] of Object.entries(byProject)) {
      const project = projects.find(p => p.id === pid);
      const projectName = project?.name || `Unknown (${pid})`;
      console.log(`   ${projectName}: ${count} members`);
    }
  }
  
  console.log('\n✨ Fix complete! Projects should now have isolated team members.');
  console.log('Refresh your browser to see the changes.');
}

// Run the fix
fixTeamMembers();