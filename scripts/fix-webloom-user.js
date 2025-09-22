/**
 * Fix sidebar for eimri@webloom.ai user
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

async function fixWebloomUser() {
  console.log('🔍 Checking eimri@webloom.ai user status...\n');
  console.log('=' .repeat(60));
  
  // 1. Get the current session to find the user ID
  console.log('\n1️⃣ GETTING CURRENT SESSION:');
  console.log('-'.repeat(40));
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.log('❌ Error getting session:', sessionError.message);
    console.log('\nTrying to get user by email instead...');
  }
  
  let userId = session?.user?.id;
  
  if (!userId) {
    console.log('No active session found. User must be logged in for this to work.');
    console.log('\n💡 Manual Fix Instructions:');
    console.log('1. Log into the app with eimri@webloom.ai');
    console.log('2. Open browser console');
    console.log('3. Run: localStorage.getItem("princess-auth")');
    console.log('4. Look for the user ID in the response');
    console.log('5. Use that ID to create the profile manually');
    
    // Try to find if user profile already exists
    console.log('\n2️⃣ CHECKING IF PROFILE EXISTS IN USERS TABLE:');
    console.log('-'.repeat(40));
    
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'eimri@webloom.ai');
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Profile already exists in users table!');
      existingUsers.forEach(user => {
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Name: ${user.full_name}`);
      });
      
      if (existingUsers[0].role !== 'admin') {
        console.log('\n⚠️  User exists but role is not admin. Updating...');
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            role: 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('email', 'eimri@webloom.ai');
        
        if (updateError) {
          console.log('❌ Failed to update role:', updateError.message);
        } else {
          console.log('✅ Updated role to admin!');
        }
      }
    } else {
      console.log('⚠️  No profile found for eimri@webloom.ai');
      console.log('   This is why the sidebar is missing!');
      
      // We need the Auth user ID to create the profile
      console.log('\n3️⃣ ATTEMPTING TO CREATE PROFILE:');
      console.log('-'.repeat(40));
      console.log('❌ Cannot create profile without the Auth user ID');
      console.log('   The user needs to be logged in first');
    }
    
    return;
  }
  
  // If we have a user ID, proceed with the fix
  console.log(`Found user ID: ${userId}`);
  
  // 2. Check if profile exists
  console.log('\n2️⃣ CHECKING USER PROFILE:');
  console.log('-'.repeat(40));
  
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (profileError && profileError.code === 'PGRST116') {
    console.log('❌ No profile found in users table!');
    console.log('   Creating profile with admin role...');
    
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
        email: 'eimri@webloom.ai',
        full_name: 'Admin User',
        role: 'admin',
        organization_id: org?.id || null,
        notification_preferences: {
          email: true,
          sms: false,
          level: 'all'
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.log('❌ Failed to create profile:', insertError.message);
      
      if (insertError.code === '23505') {
        console.log('   Duplicate key - profile might already exist');
        
        // Try updating by email instead
        const { error: updateError } = await supabase
          .from('users')
          .update({
            id: userId,
            role: 'admin',
            full_name: 'Admin User',
            updated_at: new Date().toISOString()
          })
          .eq('email', 'eimri@webloom.ai');
        
        if (updateError) {
          console.log('❌ Failed to update existing profile:', updateError.message);
        } else {
          console.log('✅ Updated existing profile with correct ID and admin role!');
        }
      }
    } else {
      console.log('✅ Created profile with admin role!');
    }
  } else if (profile) {
    console.log('✅ Profile exists:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Name: ${profile.full_name}`);
    
    if (profile.role !== 'admin') {
      console.log('\n⚠️  Role is not admin. Updating...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.log('❌ Failed to update role:', updateError.message);
      } else {
        console.log('✅ Updated role to admin!');
      }
    } else {
      console.log('✅ User already has admin role!');
    }
  }
  
  console.log('\n4️⃣ DIAGNOSIS:');
  console.log('=' .repeat(60));
  console.log('\nThe sidebar visibility depends on:');
  console.log('1. Being logged in (Auth user exists)');
  console.log('2. Having a profile in the users table with matching ID');
  console.log('3. Profile having a valid role (admin/agency/client)');
  console.log('\nFor eimri@webloom.ai:');
  console.log('- If profile was just created/updated: ✅ Refresh browser');
  console.log('- If no session found: ⚠️  Log in first, then run this script again');
  
  console.log('\n✨ NEXT STEPS:');
  console.log('1. Refresh your browser (Cmd+R or F5)');
  console.log('2. The sidebar should now appear with full admin access');
  console.log('3. If not, log out and log back in');
}

// Run the fix
fixWebloomUser();