/**
 * Debug Authentication Issues
 * Run this to diagnose auth problems
 */

import { supabase } from '@/lib/supabase';

export async function debugAuth() {
  console.log('=== AUTHENTICATION DEBUG ===');
  
  // 1. Check localStorage for auth tokens
  console.log('\n1. Checking localStorage:');
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('auth') || key.includes('supabase') || key.includes('princess')
  );
  
  authKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`  ${key}: ${value?.substring(0, 50)}...`);
  });
  
  // 2. Check Supabase client
  console.log('\n2. Supabase client status:');
  console.log(`  Configured: ${!!supabase}`);
  
  if (supabase) {
    // 3. Check current session
    console.log('\n3. Current session:');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('  Session error:', error);
      } else if (session) {
        console.log('  User ID:', session.user?.id);
        console.log('  Email:', session.user?.email);
        console.log('  Expires at:', new Date(session.expires_at * 1000).toLocaleString());
        console.log('  Token valid:', new Date(session.expires_at * 1000) > new Date());
      } else {
        console.log('  No active session');
      }
    } catch (error) {
      console.error('  Failed to get session:', error);
    }
    
    // 4. Check auth state
    console.log('\n4. Auth state:');
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('  Auth error:', error);
      } else if (user) {
        console.log('  Authenticated as:', user.email);
      } else {
        console.log('  Not authenticated');
      }
    } catch (error) {
      console.error('  Failed to get user:', error);
    }
    
    // 5. Check user profile in database
    console.log('\n5. Checking user profile in database:');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('  Profile error:', profileError);
        } else if (profile) {
          console.log('  ✅ Database role:', profile.role);
          console.log('  Email:', profile.email);
          console.log('  Organization ID:', profile.organization_id);
          console.log('  Full profile:', profile);
        } else {
          console.log('  ⚠️ No profile found in database for user');
        }
      }
    } catch (error) {
      console.error('  Profile check failed:', error);
    }
    
    // 6. Test database access
    console.log('\n6. Testing database access:');
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('  Database error:', error);
        console.log('  Error code:', error.code);
        console.log('  Error hint:', error.hint);
      } else {
        console.log('  ✅ Can access team_members table');
      }
    } catch (error) {
      console.error('  Database access failed:', error);
    }
  }
  
  console.log('\n=== END DEBUG ===');
}

// Make it globally available
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth;
  
  // Auto-run on load
  setTimeout(() => {
    console.log('Run window.debugAuth() to debug authentication');
  }, 1000);
}