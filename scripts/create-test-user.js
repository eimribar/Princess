/**
 * Script to create a test user in Supabase
 * Run with: node scripts/create-test-user.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

// Note: For creating users programmatically, we need the service role key
// Since we only have anon key, we'll create a user through sign up flow
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  console.log('🚀 Creating test user for eimribar@gmail.com...');
  
  try {
    // Step 1: Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'eimribar@gmail.com',
      password: 'Princess2024!', // Strong password for testing
      options: {
        data: {
          full_name: 'Test User',
          role: 'admin'
        }
      }
    });

    if (signUpError) {
      // Check if user already exists
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️  User already exists. Trying to sign in...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'eimribar@gmail.com',
          password: 'Princess2024!'
        });
        
        if (signInError) {
          console.error('❌ Sign in failed:', signInError.message);
          console.log('\n📝 You can reset the password at: https://orpmntxrcdongxmetbrk.supabase.co/auth/v1/user/recovery');
          return;
        }
        
        console.log('✅ Successfully signed in!');
        console.log('📧 Email: eimribar@gmail.com');
        console.log('🔑 Password: Princess2024!');
        return;
      }
      
      throw signUpError;
    }

    console.log('✅ User created successfully!');
    console.log('📧 Email: eimribar@gmail.com');
    console.log('🔑 Password: Princess2024!');
    
    // Step 2: Create user profile in the users table
    if (signUpData.user) {
      console.log('\n📝 Creating user profile...');
      
      // First, create a default organization if it doesn't exist
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();
      
      let organizationId = orgData?.id;
      
      if (!organizationId) {
        console.log('📢 Creating default organization...');
        const { data: newOrg, error: newOrgError } = await supabase
          .from('organizations')
          .insert({
            name: 'Deutsch & Co',
            subdomain: 'deutschco'
          })
          .select()
          .single();
        
        if (!newOrgError && newOrg) {
          organizationId = newOrg.id;
          console.log('✅ Organization created');
        }
      }
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: signUpData.user.id,
          email: 'eimribar@gmail.com',
          full_name: 'Test Admin User',
          role: 'admin',
          organization_id: organizationId,
          notification_preferences: {
            email: true,
            sms: false,
            level: 'all'
          },
          is_active: true
        });
      
      if (profileError) {
        console.warn('⚠️  Profile creation warning:', profileError.message);
        console.log('This is okay if the profile already exists.');
      } else {
        console.log('✅ User profile created');
      }
    }
    
    console.log('\n🎉 Setup complete! You can now log in with:');
    console.log('📧 Email: eimribar@gmail.com');
    console.log('🔑 Password: Princess2024!');
    console.log('👤 Role: Admin (full permissions)');
    console.log('\n⚠️  Note: You may need to verify your email if email confirmation is enabled in Supabase.');
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    console.error('\nFull error:', error);
    
    console.log('\n💡 Alternative: You can create the user manually:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Navigate to your project');
    console.log('3. Go to Authentication → Users');
    console.log('4. Click "Add User" → "Create new user"');
    console.log('5. Enter email: eimribar@gmail.com');
    console.log('6. Set a password');
    console.log('7. Disable "Auto Confirm User" if you want to test email verification');
  }
  
  process.exit(0);
}

// Run the script
createTestUser();