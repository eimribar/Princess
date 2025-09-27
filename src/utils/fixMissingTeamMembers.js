/**
 * Utility to create missing team member records for existing users
 * This helps fix users who were created but don't have team member records
 */

import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/clerk-react';

export async function fixMissingTeamMembers(projectId = null) {
  console.log('=== Fixing Missing Team Members ===');
  
  try {
    // 1. Get current project if not provided
    if (!projectId) {
      console.log('Getting current project...');
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .limit(1);
      
      if (projectError || !projects?.[0]) {
        console.error('Could not get project:', projectError);
        return { success: false, error: 'No project found' };
      }
      
      projectId = projects[0].id;
      console.log('Using project:', projects[0].name);
    }
    
    // 2. Get all users
    console.log('\nFetching all users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return { success: false, error: usersError.message };
    }
    
    console.log(`Found ${users?.length || 0} users`);
    
    // 3. Get existing team members for this project
    console.log('\nFetching existing team members...');
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('*')
      .eq('project_id', projectId);
    
    if (teamError) {
      console.error('Error fetching team members:', teamError);
      return { success: false, error: teamError.message };
    }
    
    const existingUserIds = new Set(teamMembers?.map(tm => tm.user_id) || []);
    console.log(`Found ${teamMembers?.length || 0} existing team members`);
    
    // 4. Find users without team member records
    const missingUsers = users?.filter(user => !existingUserIds.has(user.id)) || [];
    console.log(`\nFound ${missingUsers.length} users without team member records`);
    
    if (missingUsers.length === 0) {
      console.log('All users have team member records!');
      return { success: true, fixed: 0 };
    }
    
    // 5. Create team member records for missing users
    const results = [];
    
    for (const user of missingUsers) {
      console.log(`\nCreating team member for: ${user.full_name || user.email}`);
      
      // Determine team type based on role
      const teamType = user.role === 'client' ? 'client' : 'agency';
      
      const teamMemberData = {
        project_id: projectId,
        user_id: user.id,
        name: user.full_name || user.email?.split('@')[0] || 'Unknown',
        email: user.email,
        role: user.role || 'client',
        team_type: teamType,
        is_decision_maker: false, // Default to false, can be updated later
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Creating with data:', teamMemberData);
      
      const { data: newTeamMember, error: createError } = await supabase
        .from('team_members')
        .insert([teamMemberData])
        .select()
        .single();
      
      if (createError) {
        console.error(`Failed to create team member for ${user.email}:`, createError);
        results.push({ 
          user: user.email, 
          success: false, 
          error: createError.message 
        });
      } else {
        console.log(`✅ Successfully created team member for ${user.email}`);
        results.push({ 
          user: user.email, 
          success: true, 
          teamMemberId: newTeamMember.id 
        });
      }
    }
    
    // 6. Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n=== Summary ===');
    console.log(`Total processed: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed users:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.user}: ${r.error}`);
      });
    }
    
    return {
      success: true,
      fixed: successful,
      failed: failed,
      results: results
    };
    
  } catch (error) {
    console.error('Fix failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  window.fixMissingTeamMembers = fixMissingTeamMembers;
}