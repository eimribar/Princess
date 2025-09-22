#!/usr/bin/env node

/**
 * Setup script for Team Members in Supabase
 * Run this to set up the database and test the connection
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found in environment variables');
  console.log('Please ensure your .env file contains:');
  console.log('  VITE_SUPABASE_URL=your_supabase_url');
  console.log('  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔄 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('team_members')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ team_members table does not exist');
        console.log('Please run the following SQL in Supabase SQL Editor:');
        console.log('');
        const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
        console.log(`1. Run the schema from: ${schemaPath}`);
        console.log('');
        return false;
      } else if (error.message?.includes('Row Level Security')) {
        console.log('⚠️  RLS is enabled but no policies are set');
        console.log('Please run the RLS migration:');
        const rlsPath = path.join(__dirname, '..', 'supabase', 'migrations', '002_team_members_rls.sql');
        console.log(`Run the SQL from: ${rlsPath}`);
        console.log('');
        return false;
      }
      throw error;
    }
    
    console.log('✅ Successfully connected to Supabase');
    console.log(`📊 Current team members in database: ${data?.[0]?.count || 0}`);
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function testCRUD() {
  console.log('\n🧪 Testing CRUD operations...');
  
  try {
    // Create a test team member
    console.log('Creating test team member...');
    const testMember = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      role: 'Test Role',
      team_type: 'agency',
      is_decision_maker: false,
      bio: 'This is a test team member',
      project_id: null // Will be set to default-project by the service
    };
    
    const { data: created, error: createError } = await supabase
      .from('team_members')
      .insert([testMember])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Create failed:', createError);
      return false;
    }
    
    console.log('✅ Created:', created.name);
    
    // Update the team member
    console.log('Updating test team member...');
    const { data: updated, error: updateError } = await supabase
      .from('team_members')
      .update({ bio: 'Updated bio' })
      .eq('id', created.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return false;
    }
    
    console.log('✅ Updated bio');
    
    // Delete the team member
    console.log('Deleting test team member...');
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', created.id);
    
    if (deleteError) {
      console.error('❌ Delete failed:', deleteError);
      return false;
    }
    
    console.log('✅ Deleted test member');
    console.log('\n✅ All CRUD operations working!');
    return true;
    
  } catch (error) {
    console.error('❌ CRUD test failed:', error);
    return false;
  }
}

async function main() {
  console.log('=================================');
  console.log('Team Members Database Setup Test');
  console.log('=================================\n');
  
  const connected = await testConnection();
  
  if (connected) {
    await testCRUD();
    
    console.log('\n📝 Next Steps:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the following migrations in order:');
    console.log('   - supabase/migrations/002_team_members_rls.sql');
    console.log('   - supabase/migrations/003_team_members_additional_columns.sql');
    console.log('4. Test adding team members in your app!');
  } else {
    console.log('\n⚠️  Please fix the issues above before proceeding');
  }
}

main().catch(console.error);