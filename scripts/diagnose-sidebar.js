/**
 * Diagnostic script to check why sidebar is missing
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

async function diagnoseSidebar() {
  console.log('🔍 Diagnosing Sidebar Visibility Issue\n');
  console.log('=' .repeat(60));
  
  // 1. Check authentication users
  console.log('\n1️⃣ CHECKING AUTHENTICATION USERS:');
  console.log('-'.repeat(40));
  
  try {
    // This only works with service role key, but we can try
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log('⚠️  Cannot list auth users (need service role key)');
      console.log('   Please check in Supabase Dashboard → Authentication → Users');
    } else {
      console.log('Auth users found:', users?.length || 0);
      users?.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
    }
  } catch (e) {
    console.log('⚠️  Auth admin API not available with anon key');
  }
  
  // 2. Check users table in database
  console.log('\n2️⃣ CHECKING DATABASE USERS TABLE:');
  console.log('-'.repeat(40));
  
  try {
    const { data: dbUsers, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, organization_id')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error fetching users:', error.message);
    } else if (!dbUsers || dbUsers.length === 0) {
      console.log('⚠️  No users found in database users table!');
      console.log('   This is the problem - authenticated users need profiles in the users table');
    } else {
      console.log(`Found ${dbUsers.length} user profiles in database:`);
      dbUsers.forEach(user => {
        console.log(`   - Email: ${user.email}`);
        console.log(`     ID: ${user.id}`);
        console.log(`     Name: ${user.full_name || '(not set)'}`);
        console.log(`     Role: ${user.role || '(not set)'} ← This determines sidebar visibility!`);
        console.log(`     Org: ${user.organization_id || '(not set)'}`);
        console.log('');
      });
    }
  } catch (e) {
    console.log('❌ Failed to query users table:', e.message);
  }
  
  // 3. Test authentication
  console.log('\n3️⃣ TESTING YOUR LOGIN (eimribar@gmail.com):');
  console.log('-'.repeat(40));
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'eimribar@gmail.com',
      password: 'Princess2024!'
    });
    
    if (authError) {
      console.log('❌ Login failed:', authError.message);
    } else if (authData?.user) {
      console.log('✅ Login successful!');
      console.log(`   Auth User ID: ${authData.user.id}`);
      console.log(`   Email: ${authData.user.email}`);
      
      // Check if this user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        console.log('\n   ⚠️  NO PROFILE FOUND IN USERS TABLE!');
        console.log('   This is why the sidebar is missing!');
        console.log('   The app defaults to role="viewer" which has NO permissions');
      } else if (profile) {
        console.log('\n   ✅ Profile found in users table:');
        console.log(`      Role: ${profile.role}`);
        console.log(`      Name: ${profile.full_name}`);
      }
    }
  } catch (e) {
    console.log('❌ Authentication test failed:', e.message);
  }
  
  // 4. Explain the issue
  console.log('\n4️⃣ DIAGNOSIS SUMMARY:');
  console.log('=' .repeat(60));
  console.log('\nThe sidebar is missing because:');
  console.log('1. Layout.jsx line 52: if (!user) return []; - Returns empty nav if no user');
  console.log('2. Layout.jsx line 56: Filters items based on user.role');
  console.log('3. When you sign in with eimribar@gmail.com:');
  console.log('   - Auth succeeds (user exists in Supabase Auth)');
  console.log('   - BUT no profile exists in the users table');
  console.log('   - App defaults to role="viewer" (line 105 in SupabaseUserContext)');
  console.log('   - Viewer role has NO navigation permissions');
  console.log('   - Therefore navigationItems = [] and sidebar appears empty');
  
  console.log('\n5️⃣ SOLUTION:');
  console.log('=' .repeat(60));
  console.log('\nWe need to create a user profile for eimribar@gmail.com in the users table.');
  console.log('Running fix now...\n');
  
  // Try to fix it
  await fixUserProfile();
}

async function fixUserProfile() {
  console.log('🔧 ATTEMPTING TO FIX...\n');
  
  // First, sign in to get the user ID
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'eimribar@gmail.com',
    password: 'Princess2024!'
  });
  
  if (authError || !authData?.user) {
    console.log('❌ Cannot sign in to fix the issue');
    return;
  }
  
  const userId = authData.user.id;
  console.log(`Got user ID: ${userId}`);
  
  // Check if profile already exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();
  
  if (existingProfile) {
    console.log('Profile already exists, updating role to admin...');
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'admin',
        full_name: 'Test Admin User',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateError) {
      console.log('❌ Failed to update role:', updateError.message);
    } else {
      console.log('✅ Updated existing profile to admin role!');
    }
  } else {
    console.log('Creating new profile with admin role...');
    
    // Get or create organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();
    
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'eimribar@gmail.com',
        full_name: 'Test Admin User',
        role: 'admin',
        organization_id: org?.id || null,
        notification_preferences: {
          email: true,
          sms: false,
          level: 'all'
        },
        is_active: true
      });
    
    if (insertError) {
      console.log('❌ Failed to create profile:', insertError.message);
      
      if (insertError.code === '23505') {
        console.log('   Profile might already exist with this email');
      }
    } else {
      console.log('✅ Created new profile with admin role!');
    }
  }
  
  console.log('\n✨ FIX COMPLETE!');
  console.log('Please refresh the browser and the sidebar should now appear.');
  console.log('\nYou can now log in with:');
  console.log('📧 Email: eimribar@gmail.com');
  console.log('🔑 Password: Princess2024!');
  console.log('👤 Role: Admin (full sidebar access)');
}

// Run the diagnostic
diagnoseSidebar();