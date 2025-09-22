/**
 * Script to diagnose and fix authentication issues
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

async function diagnoseAndFix() {
  console.log('🔍 Diagnosing authentication issues...\n');
  
  // Test 1: Check if we can connect to Supabase
  console.log('1️⃣ Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.log('   ⚠️ Cannot query users table:', error.message);
    } else {
      console.log('   ✅ Supabase connection successful');
    }
  } catch (e) {
    console.log('   ❌ Supabase connection failed:', e.message);
  }
  
  // Test 2: Try to sign in with the credentials
  console.log('\n2️⃣ Testing authentication with eimribar@gmail.com...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'eimribar@gmail.com',
      password: 'Princess2024!'
    });
    
    if (error) {
      console.log('   ❌ Sign in failed:', error.message);
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n🔧 Attempting to create a new user with different approach...');
        
        // Try signing up again
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: 'eimribar@gmail.com',
          password: 'Princess2024!',
          options: {
            emailRedirectTo: 'http://localhost:5174/auth/callback',
          }
        });
        
        if (signUpError) {
          console.log('   ❌ Sign up error:', signUpError.message);
          
          // Try password reset
          console.log('\n📧 Sending password reset email...');
          const { error: resetError } = await supabase.auth.resetPasswordForEmail('eimribar@gmail.com', {
            redirectTo: 'http://localhost:5174/auth/reset-password',
          });
          
          if (resetError) {
            console.log('   ❌ Password reset failed:', resetError.message);
          } else {
            console.log('   ✅ Password reset email sent to eimribar@gmail.com');
            console.log('   📬 Check your email for the reset link');
          }
        } else {
          console.log('   ✅ User created/updated successfully');
          console.log('   📬 Check your email for confirmation link if required');
        }
      }
    } else {
      console.log('   ✅ Authentication successful!');
      console.log('   User ID:', data.user.id);
      console.log('   Session:', data.session ? 'Active' : 'None');
    }
  } catch (e) {
    console.log('   ❌ Authentication test failed:', e.message);
  }
  
  // Test 3: Check auth settings
  console.log('\n3️⃣ Checking Supabase auth configuration...');
  console.log('   Project URL:', supabaseUrl);
  console.log('   Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Go to https://app.supabase.com');
  console.log('2. Navigate to your project: orpmntxrcdongxmetbrk');
  console.log('3. Go to Authentication → Configuration');
  console.log('4. Check if "Enable email confirmations" is OFF for development');
  console.log('5. Or go to Authentication → Users and manually confirm the user');
  console.log('\n💡 Alternative: Create a user directly in Supabase dashboard:');
  console.log('   Authentication → Users → Add User → Create new user');
  console.log('   Email: eimribar@gmail.com');
  console.log('   Password: Princess2024!');
  console.log('   Auto Confirm User: YES');
}

diagnoseAndFix();