/**
 * Create profile for eimri@webloom.ai with the correct ID
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

async function createProfile() {
  console.log('🚀 Creating profile for eimri@webloom.ai...\n');
  console.log('=' .repeat(60));
  
  const userId = '767de741-5c00-4440-9d34-d08e45bf3334';
  const email = 'eimri@webloom.ai';
  
  console.log(`User ID: ${userId}`);
  console.log(`Email: ${email}`);
  console.log('Role: admin (full access)\n');
  
  // First, check if profile already exists
  console.log('1️⃣ Checking if profile already exists...');
  const { data: existing, error: checkError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (existing) {
    console.log('✅ Profile already exists!');
    console.log(`   Current role: ${existing.role}`);
    
    if (existing.role !== 'admin') {
      console.log('⚠️  Updating role to admin...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role: 'admin',
          full_name: 'Admin User',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.log('❌ Failed to update:', updateError.message);
      } else {
        console.log('✅ Updated to admin role!');
      }
    } else {
      console.log('✅ Already has admin role - all good!');
    }
    
    console.log('\n✨ DONE! Refresh your browser and the sidebar will appear.');
    return;
  }
  
  // Check if there's a profile with wrong ID but same email
  console.log('\n2️⃣ Checking for profile with wrong ID...');
  const { data: wrongIdProfile, error: wrongIdError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email);
  
  if (wrongIdProfile && wrongIdProfile.length > 0) {
    console.log('⚠️  Found profile with wrong ID. Updating...');
    
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', email);
    
    if (deleteError) {
      console.log('Warning: Could not delete old profile:', deleteError.message);
    }
  }
  
  // Get or create organization
  console.log('\n3️⃣ Getting organization...');
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);
  
  let orgId = null;
  if (orgs && orgs.length > 0) {
    orgId = orgs[0].id;
    console.log(`Using organization: ${orgs[0].name} (${orgId})`);
  } else {
    // Create organization if none exists
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Webloom',
        subdomain: 'webloom'
      })
      .select()
      .single();
    
    if (newOrg) {
      orgId = newOrg.id;
      console.log(`Created organization: Webloom (${orgId})`);
    }
  }
  
  // Create the profile
  console.log('\n4️⃣ Creating user profile with admin role...');
  const { data: newProfile, error: insertError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: email,
      full_name: 'Admin User',
      role: 'admin',  // THIS IS THE KEY!
      organization_id: orgId,
      notification_preferences: {
        email: true,
        sms: false,
        level: 'all'
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (insertError) {
    console.log('❌ Failed to create profile:', insertError.message);
    console.log('\nError details:', insertError);
    
    if (insertError.code === '23505') {
      console.log('\n💡 This usually means the profile already exists.');
      console.log('Try refreshing your browser - it might already be working!');
    }
  } else {
    console.log('✅ Profile created successfully!');
    console.log('\nCreated profile:');
    console.log(`   ID: ${newProfile.id}`);
    console.log(`   Email: ${newProfile.email}`);
    console.log(`   Role: ${newProfile.role}`);
    console.log(`   Name: ${newProfile.full_name}`);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✨ SETUP COMPLETE!\n');
  console.log('Next steps:');
  console.log('1. Go back to your browser');
  console.log('2. Refresh the page (Cmd+R or F5)');
  console.log('3. The sidebar should now appear with full navigation!');
  console.log('\nIf the sidebar still doesn\'t appear:');
  console.log('1. Try logging out and logging back in');
  console.log('2. Clear browser cache (Cmd+Shift+R)');
  console.log('3. Check browser console for any errors');
}

// Run it
createProfile();