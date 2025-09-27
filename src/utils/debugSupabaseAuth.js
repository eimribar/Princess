/**
 * Diagnostic script to understand Supabase Auth responses
 * Run this in the browser console to see exact data structures
 */

import { supabase } from '../lib/supabase';

export async function debugSupabaseAuth() {
  console.log('=== SUPABASE AUTH DEBUG ===');
  
  // Test signup response structure
  const testSignup = async () => {
    console.log('\n1. Testing signup response structure:');
    
    // Generate a unique test email
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    try {
      const response = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User',
            role: 'client'
          }
        }
      });
      
      console.log('Raw signup response:', response);
      console.log('Response keys:', Object.keys(response));
      
      if (response.data) {
        console.log('response.data structure:', response.data);
        console.log('response.data keys:', Object.keys(response.data));
        
        if (response.data.user) {
          console.log('response.data.user structure:', response.data.user);
          console.log('response.data.user keys:', Object.keys(response.data.user));
        }
        
        if (response.data.session) {
          console.log('response.data.session exists:', !!response.data.session);
        }
      }
      
      if (response.error) {
        console.log('response.error:', response.error);
      }
      
      return response;
    } catch (error) {
      console.error('Signup threw an error:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      throw error;
    }
  };
  
  // Test current session
  const testCurrentSession = async () => {
    console.log('\n2. Testing getSession response:');
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      console.log('getSession response data:', data);
      console.log('getSession response error:', error);
      
      if (data?.session) {
        console.log('Session exists');
        console.log('Session user:', data.session.user);
        console.log('Session user keys:', Object.keys(data.session.user));
      } else {
        console.log('No active session');
      }
    } catch (error) {
      console.error('getSession error:', error);
    }
  };
  
  // Test user retrieval
  const testGetUser = async () => {
    console.log('\n3. Testing getUser response:');
    
    try {
      const { data, error } = await supabase.auth.getUser();
      
      console.log('getUser response data:', data);
      console.log('getUser response error:', error);
      
      if (data?.user) {
        console.log('User structure:', data.user);
        console.log('User keys:', Object.keys(data.user));
        console.log('User metadata:', data.user.user_metadata);
      }
    } catch (error) {
      console.error('getUser error:', error);
    }
  };
  
  // Check database users table structure
  const testUsersTable = async () => {
    console.log('\n4. Testing users table structure:');
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('Users table error:', error);
      } else if (data && data.length > 0) {
        console.log('Sample user from database:', data[0]);
        console.log('User table columns:', Object.keys(data[0]));
      } else {
        console.log('No users found in database');
      }
    } catch (error) {
      console.error('Users table query error:', error);
    }
  };
  
  // Check invitations table structure
  const testInvitationsTable = async () => {
    console.log('\n5. Testing invitations table structure:');
    
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('Invitations table error:', error);
      } else if (data && data.length > 0) {
        console.log('Sample invitation from database:', data[0]);
        console.log('Invitation table columns:', Object.keys(data[0]));
      } else {
        console.log('No invitations found in database');
      }
    } catch (error) {
      console.error('Invitations table query error:', error);
    }
  };
  
  // Run all tests
  console.log('Starting diagnostic tests...');
  
  await testCurrentSession();
  await testGetUser();
  await testUsersTable();
  await testInvitationsTable();
  
  console.log('\n=== To test signup (will create a test user): ===');
  console.log('Run: window.testSupabaseSignup()');
  
  // Export test function for manual execution
  window.testSupabaseSignup = testSignup;
}

// Export for use in console
window.debugSupabaseAuth = debugSupabaseAuth;

// Auto-run on import if in development
if (import.meta.env.DEV) {
  console.log('Supabase Auth Debug loaded. Run window.debugSupabaseAuth() to start diagnostics.');
}