/**
 * Cleanup test projects created during QA
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

async function cleanupTestProjects() {
  console.log('🧹 CLEANING UP TEST PROJECTS\n');
  console.log('=' .repeat(60));
  
  // Test project names to clean up
  const testProjectNames = [
    'Tesla Rebranding',
    'Nike Campaign 2025', 
    'Spotify Rebrand'
  ];
  
  for (const name of testProjectNames) {
    console.log(`\nCleaning up: ${name}`);
    
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('name', name)
      .single();
    
    if (project) {
      // Delete project (cascade will handle related data)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);
      
      if (error) {
        console.log(`  ❌ Failed to delete: ${error.message}`);
      } else {
        console.log(`  ✅ Deleted successfully`);
      }
    } else {
      console.log(`  ⏭️  Project not found (already deleted?)`);
    }
  }
  
  console.log('\n✅ Cleanup complete!');
}

// Run cleanup
cleanupTestProjects();