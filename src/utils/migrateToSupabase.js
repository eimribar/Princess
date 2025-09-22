/**
 * Migration utility to move localStorage data to Supabase
 * Run this once to migrate existing team members
 */

import supabaseService from '@/api/supabaseService';

export async function migrateTeamMembersToSupabase() {
  console.log('Starting migration of team members to Supabase...');
  
  try {
    // Check if Supabase is configured
    if (!supabaseService.isConfigured()) {
      console.error('Supabase is not configured. Cannot migrate.');
      return { success: false, error: 'Supabase not configured' };
    }

    // Get localStorage data
    const stored = localStorage.getItem('princess_data');
    if (!stored) {
      console.log('No localStorage data found to migrate');
      return { success: true, migrated: 0 };
    }

    const data = JSON.parse(stored);
    const localTeamMembers = data.teamMembers || [];

    if (localTeamMembers.length === 0) {
      console.log('No team members in localStorage to migrate');
      return { success: true, migrated: 0 };
    }

    console.log(`Found ${localTeamMembers.length} team members in localStorage`);

    // Get existing team members from Supabase to avoid duplicates
    const existingMembers = await supabaseService.getTeamMembers();
    const existingEmails = new Set(existingMembers.map(m => m.email.toLowerCase()));

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const member of localTeamMembers) {
      try {
        // Skip if email already exists
        if (existingEmails.has(member.email.toLowerCase())) {
          console.log(`Skipping ${member.name} - already exists in Supabase`);
          skipped++;
          continue;
        }

        // Prepare data for Supabase
        const memberData = {
          name: member.name,
          email: member.email,
          role: member.role || 'Team Member',
          team_type: member.team_type || 'agency',
          is_decision_maker: member.is_decision_maker || false,
          profile_image: member.profile_image || null,
          linkedin_url: member.linkedin_url || null,
          bio: member.bio || null,
          short_bio: member.shortBio || null,
          expertise: member.expertise || null,
          personal: member.personal || null,
          phone: member.phone || null,
          department: member.department || null,
          location: member.location || null
        };

        // Create in Supabase
        await supabaseService.createTeamMember(memberData);
        console.log(`✅ Migrated: ${member.name}`);
        migrated++;
      } catch (error) {
        console.error(`Failed to migrate ${member.name}:`, error);
        failed++;
      }
    }

    console.log('\nMigration Summary:');
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`⏭️  Skipped (already exists): ${skipped}`);
    console.log(`❌ Failed: ${failed}`);

    // Optionally clear localStorage after successful migration
    if (migrated > 0 && failed === 0) {
      const shouldClear = window.confirm(
        `Successfully migrated ${migrated} team members. Do you want to clear localStorage data?`
      );
      
      if (shouldClear) {
        data.teamMembers = [];
        localStorage.setItem('princess_data', JSON.stringify(data));
        console.log('localStorage cleared');
      }
    }

    return { 
      success: true, 
      migrated, 
      skipped, 
      failed,
      total: localTeamMembers.length 
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
}

// Auto-run migration check on load (only once)
export async function checkAndMigrate() {
  const MIGRATION_KEY = 'princess_team_migrated_to_supabase';
  
  // Check if we've already migrated
  if (localStorage.getItem(MIGRATION_KEY) === 'true') {
    return;
  }

  // Check if there's data to migrate
  const stored = localStorage.getItem('princess_data');
  if (!stored) return;
  
  const data = JSON.parse(stored);
  if (!data.teamMembers || data.teamMembers.length === 0) {
    // Mark as migrated since there's nothing to migrate
    localStorage.setItem(MIGRATION_KEY, 'true');
    return;
  }

  // Prompt user to migrate
  console.log('📦 Found team members in localStorage that can be migrated to Supabase');
  
  // Auto-migrate in background
  try {
    const result = await migrateTeamMembersToSupabase();
    if (result.success && result.migrated > 0) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      console.log('✅ Auto-migration completed');
    }
  } catch (error) {
    console.error('Auto-migration failed:', error);
  }
}