/**
 * Sync Stage and Deliverable Status
 * Ensures deliverable status matches stage status for proper visual display
 */

import { SupabaseStage, SupabaseDeliverable } from '@/api/supabaseEntities';

export async function syncStageDeliverables(stageNumber = null) {
  console.log('🔄 Starting stage-deliverable status sync...');
  
  try {
    // Get stages to sync
    const allStages = await SupabaseStage.list();
    let stagesToSync = allStages.filter(s => s.is_deliverable === true);
    
    // If specific stage number provided, filter to just those
    if (stageNumber !== null) {
      stagesToSync = stagesToSync.filter(s => s.number_index === stageNumber);
    }
    
    console.log(`Found ${stagesToSync.length} deliverable stages to sync`);
    
    let syncedCount = 0;
    let errors = [];
    
    for (const stage of stagesToSync) {
      try {
        // Skip if no deliverable_id
        if (!stage.deliverable_id) {
          console.log(`⚠️ Stage ${stage.number_index} has no deliverable_id`);
          continue;
        }
        
        // Get the deliverable
        const deliverable = await SupabaseDeliverable.get(stage.deliverable_id);
        if (!deliverable) {
          console.log(`⚠️ Deliverable ${stage.deliverable_id} not found for stage ${stage.number_index}`);
          continue;
        }
        
        // Map stage status to deliverable status
        const expectedDeliverableStatus = mapStageToDeliverableStatus(stage.status);
        
        // Check if sync needed
        if (deliverable.status !== expectedDeliverableStatus) {
          console.log(`Syncing stage ${stage.number_index}: ${stage.status} → deliverable: ${deliverable.status} → ${expectedDeliverableStatus}`);
          
          // Update deliverable status (without the _skipStageSync flag which isn't a DB column)
          await SupabaseDeliverable.update(deliverable.id, {
            status: expectedDeliverableStatus
          });
          
          syncedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Failed to sync stage ${stage.number_index}:`, error);
        errors.push({ stage: stage.number_index, error: error.message });
      }
    }
    
    // Summary
    console.log('\n📊 Sync Summary:');
    console.log(`✅ Synced ${syncedCount} deliverable statuses`);
    if (errors.length > 0) {
      console.log(`❌ ${errors.length} errors occurred:`);
      errors.forEach(e => console.log(`   - Stage ${e.stage}: ${e.error}`));
    }
    
    if (syncedCount > 0) {
      console.log('\n✨ Sync complete! Refresh the page to see updated colors.');
    } else {
      console.log('\n✨ All deliverables already in sync.');
    }
    
    return {
      success: true,
      synced: syncedCount,
      errors
    };
    
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function mapStageToDeliverableStatus(stageStatus) {
  switch(stageStatus) {
    case 'completed':
      return 'approved'; // Completed stages = approved deliverables
    case 'in_progress':
      return 'in_progress'; // In progress = in progress
    case 'ready':
      return 'not_started'; // Ready to start = not started
    case 'not_ready':
    case 'blocked':
    case 'not_started':
    default:
      return 'not_started'; // Default to not_started
  }
}

// Make it available globally for console execution
if (typeof window !== 'undefined') {
  window.syncStageDeliverables = syncStageDeliverables;
}