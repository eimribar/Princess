/**
 * Test Supabase Connection
 * Run this in the browser console to test if Supabase is working
 */

import { supabase } from '@/lib/supabase';

export async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  // 1. Check if Supabase client exists
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return false;
  }
  
  console.log('✅ Supabase client exists');
  
  // 2. Test basic query
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Query error:', error);
      return false;
    }
    
    console.log('✅ Can query team_members table');
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error);
    return false;
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  window.testSupabaseConnection = testSupabaseConnection;
}