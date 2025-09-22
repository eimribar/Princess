/**
 * Test script for verifying all team member operations
 * Run this in browser console to test CRUD operations
 */

import { TeamMember } from '@/api/entities';
import supabaseService from '@/api/supabaseService';

export async function testTeamOperations() {
  console.log('========================================');
  console.log('Starting Team Member Operations Test');
  console.log('========================================');
  
  const results = {
    read: false,
    create: false,
    update: false,
    delete: false,
    sessionRefresh: false
  };
  
  try {
    // Test 1: Read operations
    console.log('\n📖 Test 1: Reading team members...');
    const members = await TeamMember.list();
    console.log(`✅ Successfully fetched ${members.length} team members`);
    results.read = true;
    
    // Test 2: Create operation
    console.log('\n➕ Test 2: Creating test team member...');
    const testMember = {
      name: 'Test User ' + Date.now(),
      email: `test${Date.now()}@example.com`,
      role: 'QA Engineer',
      team_type: 'agency',
      phone: '+1 555-0100',
      department: 'Quality Assurance',
      location: 'Remote',
      bio: 'Test user for verifying operations'
    };
    
    const created = await TeamMember.create(testMember);
    if (created && created.id) {
      console.log('✅ Successfully created team member:', created.name);
      console.log('   ID:', created.id);
      results.create = true;
      
      // Test 3: Update operation
      console.log('\n✏️ Test 3: Updating team member...');
      const updateData = {
        role: 'Senior QA Engineer',
        bio: 'Updated bio for test user',
        is_decision_maker: true
      };
      
      const updated = await TeamMember.update(created.id, updateData);
      if (updated) {
        console.log('✅ Successfully updated team member');
        console.log('   New role:', updated.role);
        console.log('   Decision maker:', updated.is_decision_maker);
        results.update = true;
      }
      
      // Test 4: Read single member
      console.log('\n📖 Test 4: Reading single team member...');
      const single = await TeamMember.get(created.id);
      if (single) {
        console.log('✅ Successfully fetched single member:', single.name);
      }
      
      // Test 5: Delete operation
      console.log('\n🗑️ Test 5: Deleting test team member...');
      const deleteResult = await TeamMember.delete(created.id);
      if (deleteResult && deleteResult.success) {
        console.log('✅ Successfully deleted team member');
        results.delete = true;
      }
    }
    
    // Test 6: Session refresh
    console.log('\n🔄 Test 6: Testing session refresh...');
    const isConfigured = supabaseService.isConfigured();
    console.log('   Supabase configured:', isConfigured);
    
    if (isConfigured) {
      const context = await supabaseService.getCurrentContext();
      console.log('   Current user ID:', context?.userId || 'Not authenticated');
      
      if (context?.userId) {
        results.sessionRefresh = true;
        console.log('✅ Session is active');
      } else {
        console.log('⚠️ No active session - operations will use localStorage');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
  
  // Summary
  console.log('\n========================================');
  console.log('Test Results Summary:');
  console.log('========================================');
  console.log('Read Operations:', results.read ? '✅ PASS' : '❌ FAIL');
  console.log('Create Operation:', results.create ? '✅ PASS' : '❌ FAIL');
  console.log('Update Operation:', results.update ? '✅ PASS' : '❌ FAIL');
  console.log('Delete Operation:', results.delete ? '✅ PASS' : '❌ FAIL');
  console.log('Session Active:', results.sessionRefresh ? '✅ YES' : '⚠️ NO (using localStorage)');
  
  const allPassed = Object.values(results).filter(v => v).length;
  console.log(`\nOverall: ${allPassed}/5 tests passed`);
  
  return results;
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  window.testTeamOperations = testTeamOperations;
  console.log('💡 Team operations test ready. Run: testTeamOperations()');
}