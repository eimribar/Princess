/**
 * Test utility to verify the invitation flow and team member creation
 */

import { supabase } from '@/lib/supabase';

export async function testInvitationFlow() {
  console.log('=== Testing Invitation Flow ===');
  
  try {
    // 1. Check current project ID
    console.log('\n1. Getting current project...');
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectError) {
      console.error('Error fetching project:', projectError);
      return;
    }
    
    const currentProject = projects?.[0];
    if (!currentProject) {
      console.error('No projects found');
      return;
    }
    
    console.log('Current project:', {
      id: currentProject.id,
      name: currentProject.name
    });
    
    // 2. Check existing team members
    console.log('\n2. Checking existing team members...');
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('*')
      .eq('project_id', currentProject.id);
    
    if (teamError) {
      console.error('Error fetching team members:', teamError);
    } else {
      console.log(`Found ${teamMembers?.length || 0} team members for this project`);
      teamMembers?.forEach(tm => {
        console.log(`  - ${tm.name || tm.email} (${tm.team_type}${tm.is_decision_maker ? ' - Decision Maker' : ''})`);
      });
    }
    
    // 3. Check users table
    console.log('\n3. Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      console.log(`Recent users (${users?.length || 0}):`);
      users?.forEach(user => {
        console.log(`  - ${user.full_name || user.email} (created: ${user.created_at})`);
      });
    }
    
    // 4. Check invitation tracking
    console.log('\n4. Checking invitation tracking...');
    const { data: invitations, error: invError } = await supabase
      .from('invitation_tracking')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (invError) {
      console.error('Error fetching invitations:', invError);
    } else {
      console.log(`Recent invitations for project (${invitations?.length || 0}):`);
      invitations?.forEach(inv => {
        console.log(`  - ${inv.email} (${inv.status}) - Created: ${inv.created_at}`);
      });
    }
    
    // 5. Check for orphaned users (users without team_members)
    console.log('\n5. Checking for orphaned users...');
    const { data: orphanedUsers, error: orphanError } = await supabase
      .rpc('find_orphaned_users', { p_project_id: currentProject.id });
    
    if (orphanError) {
      console.log('Note: find_orphaned_users function may not exist');
      
      // Manual check
      if (users && teamMembers) {
        const teamMemberUserIds = teamMembers.map(tm => tm.user_id);
        const orphaned = users.filter(u => !teamMemberUserIds.includes(u.id));
        
        if (orphaned.length > 0) {
          console.log(`Found ${orphaned.length} users without team_member records:`);
          orphaned.forEach(u => {
            console.log(`  - ${u.full_name || u.email} (ID: ${u.id})`);
          });
        } else {
          console.log('All users have corresponding team_member records');
        }
      }
    } else {
      console.log(`Orphaned users: ${orphanedUsers?.length || 0}`);
    }
    
    console.log('\n=== Test Complete ===');
    
    return {
      projectId: currentProject.id,
      teamMembersCount: teamMembers?.length || 0,
      usersCount: users?.length || 0,
      invitationsCount: invitations?.length || 0
    };
    
  } catch (error) {
    console.error('Test failed:', error);
    return null;
  }
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  window.testInvitationFlow = testInvitationFlow;
}