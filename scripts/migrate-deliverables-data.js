#!/usr/bin/env node

/**
 * Data Migration Script for Deliverables System
 * 
 * Purpose: Migrate existing stages with is_deliverable=true to have proper deliverables
 * This script should be run after applying the SQL migration 009_deliverables_system_fixes.sql
 * 
 * Usage: node scripts/migrate-deliverables-data.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_')) {
  console.error('❌ Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function migrateDeliverables() {
  log('\n🚀 Starting Deliverables Data Migration', 'bright');
  log('=' .repeat(50), 'cyan');

  try {
    // Step 1: Get all stages with is_deliverable = true
    log('\n📋 Fetching stages with is_deliverable = true...', 'yellow');
    const { data: stages, error: stagesError } = await supabase
      .from('stages')
      .select('*')
      .eq('is_deliverable', true);

    if (stagesError) {
      throw new Error(`Failed to fetch stages: ${stagesError.message}`);
    }

    log(`Found ${stages.length} deliverable stages`, 'green');

    // Step 2: Check existing deliverables
    log('\n🔍 Checking for existing deliverables...', 'yellow');
    const { data: existingDeliverables, error: deliverablesError } = await supabase
      .from('deliverables')
      .select('id, stage_id, name');

    if (deliverablesError) {
      throw new Error(`Failed to fetch deliverables: ${deliverablesError.message}`);
    }

    const deliverablesByStageId = new Map(
      existingDeliverables.map(d => [d.stage_id, d])
    );

    // Step 3: Process each stage
    let created = 0;
    let linked = 0;
    let skipped = 0;
    let errors = 0;

    for (const stage of stages) {
      const existingDeliverable = deliverablesByStageId.get(stage.id);

      if (stage.deliverable_id && existingDeliverable) {
        // Already properly linked
        log(`✓ Stage "${stage.name}" already linked to deliverable`, 'green');
        skipped++;
        continue;
      }

      if (existingDeliverable) {
        // Deliverable exists but not linked bidirectionally
        log(`🔗 Linking existing deliverable for stage "${stage.name}"`, 'cyan');
        
        // Update stage with deliverable_id
        const { error: updateError } = await supabase
          .from('stages')
          .update({ deliverable_id: existingDeliverable.id })
          .eq('id', stage.id);

        if (updateError) {
          log(`  ❌ Failed to link: ${updateError.message}`, 'red');
          errors++;
        } else {
          linked++;
          log(`  ✓ Linked successfully`, 'green');
        }
      } else {
        // Need to create new deliverable
        log(`➕ Creating deliverable for stage "${stage.name}"`, 'magenta');

        // Map stage status to deliverable status
        const deliverableStatus = mapStageToDeliverableStatus(stage.status);

        // Create deliverable
        const deliverableData = {
          project_id: stage.project_id,
          stage_id: stage.id,
          name: stage.name,
          description: stage.description,
          category: stage.category,
          status: deliverableStatus,
          priority: stage.blocking_priority || 'medium',
          assigned_to: stage.assigned_to,
          original_deadline: stage.end_date,
          adjusted_deadline: stage.end_date,
          max_iterations: 3,
          current_iteration: 0,
          created_at: stage.created_at,
          updated_at: stage.updated_at
        };

        const { data: newDeliverable, error: createError } = await supabase
          .from('deliverables')
          .insert(deliverableData)
          .select()
          .single();

        if (createError) {
          log(`  ❌ Failed to create: ${createError.message}`, 'red');
          errors++;
          continue;
        }

        // Update stage with deliverable_id
        const { error: updateError } = await supabase
          .from('stages')
          .update({ deliverable_id: newDeliverable.id })
          .eq('id', stage.id);

        if (updateError) {
          log(`  ❌ Failed to link: ${updateError.message}`, 'red');
          errors++;
          continue;
        }

        // Create initial version
        const versionData = {
          deliverable_id: newDeliverable.id,
          version_number: 'V0',
          status: deliverableStatus,
          created_at: stage.created_at,
          updated_at: stage.updated_at
        };

        const { error: versionError } = await supabase
          .from('deliverable_versions')
          .insert(versionData);

        if (versionError) {
          log(`  ⚠️ Warning: Failed to create version: ${versionError.message}`, 'yellow');
        }

        created++;
        log(`  ✓ Created and linked successfully`, 'green');
      }
    }

    // Step 4: Update approval/decline metadata
    log('\n📝 Updating approval/decline metadata...', 'yellow');
    
    // Update approved deliverables
    const { error: approvedError } = await supabase
      .from('deliverables')
      .update({ 
        approved_at: new Date().toISOString()
      })
      .eq('status', 'approved')
      .is('approved_at', null);

    if (approvedError) {
      log(`  ⚠️ Warning: Failed to update approved_at: ${approvedError.message}`, 'yellow');
    }

    // Update declined deliverables
    const { error: declinedError } = await supabase
      .from('deliverables')
      .update({ 
        declined_at: new Date().toISOString()
      })
      .eq('status', 'declined')
      .is('declined_at', null);

    if (declinedError) {
      log(`  ⚠️ Warning: Failed to update declined_at: ${declinedError.message}`, 'yellow');
    }

    // Step 5: Run consistency check
    log('\n🔍 Running consistency check...', 'yellow');
    const issues = await runConsistencyCheck();
    
    if (issues.length > 0) {
      log(`⚠️ Found ${issues.length} consistency issues:`, 'yellow');
      issues.forEach(issue => {
        log(`  - ${issue.issue_type}: ${issue.details}`, 'yellow');
      });
    } else {
      log('✓ No consistency issues found', 'green');
    }

    // Step 6: Summary
    log('\n' + '=' .repeat(50), 'cyan');
    log('📊 Migration Summary:', 'bright');
    log(`  ✓ Created: ${created} deliverables`, 'green');
    log(`  🔗 Linked: ${linked} existing deliverables`, 'cyan');
    log(`  ⏭️ Skipped: ${skipped} already linked`, 'yellow');
    if (errors > 0) {
      log(`  ❌ Errors: ${errors}`, 'red');
    }
    log('=' .repeat(50), 'cyan');
    log('✨ Migration Complete!', 'bright');

  } catch (error) {
    log(`\n❌ Migration failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

function mapStageToDeliverableStatus(stageStatus) {
  const statusMap = {
    'completed': 'approved',
    'in_progress': 'pending_approval',
    'blocked': 'declined',
    'not_ready': 'draft'
  };
  return statusMap[stageStatus] || 'draft';
}

async function runConsistencyCheck() {
  const issues = [];

  // Check for stages with is_deliverable=true but no deliverable_id
  const { data: orphanedStages } = await supabase
    .from('stages')
    .select('id, name, number_index')
    .eq('is_deliverable', true)
    .is('deliverable_id', null);

  if (orphanedStages && orphanedStages.length > 0) {
    orphanedStages.forEach(stage => {
      issues.push({
        issue_type: 'Missing deliverable',
        stage_id: stage.id,
        details: `Stage ${stage.number_index}: ${stage.name} has is_deliverable=true but no deliverable`
      });
    });
  }

  // Check for deliverables without stage connection
  const { data: orphanedDeliverables } = await supabase
    .from('deliverables')
    .select('id, name')
    .is('stage_id', null);

  if (orphanedDeliverables && orphanedDeliverables.length > 0) {
    orphanedDeliverables.forEach(deliverable => {
      issues.push({
        issue_type: 'Orphaned deliverable',
        deliverable_id: deliverable.id,
        details: `Deliverable "${deliverable.name}" has no stage connection`
      });
    });
  }

  // Check for status mismatches
  const { data: stages } = await supabase
    .from('stages')
    .select(`
      id,
      name,
      status,
      deliverable_id,
      deliverables!stages_deliverable_id_fkey(
        id,
        status
      )
    `)
    .not('deliverable_id', 'is', null);

  if (stages) {
    stages.forEach(stage => {
      const deliverable = stage.deliverables;
      if (deliverable) {
        const expectedStatus = mapStageToDeliverableStatus(stage.status);
        if (deliverable.status !== expectedStatus) {
          issues.push({
            issue_type: 'Status mismatch',
            stage_id: stage.id,
            deliverable_id: deliverable.id,
            details: `Stage status: ${stage.status}, Deliverable status: ${deliverable.status} (expected: ${expectedStatus})`
          });
        }
      }
    });
  }

  return issues;
}

// Run the migration
migrateDeliverables().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});