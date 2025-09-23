/**
 * Fix Specific Stages Display Issue
 * Targeted fix for stages that are showing incorrect colors
 */

import { SupabaseStage, SupabaseDeliverable } from '@/api/supabaseEntities';

export async function fixSpecificStages(...stageNumbers) {
  console.log(`🔧 Fixing specific stages: ${stageNumbers.join(', ')}`);
  
  try {
    const allStages = await SupabaseStage.list();
    const stagesToFix = stageNumbers.length > 0 
      ? allStages.filter(s => stageNumbers.includes(s.number_index))
      : [];
    
    if (stagesToFix.length === 0) {
      console.log('❌ No stages found with those numbers');
      return;
    }
    
    console.log(`Found ${stagesToFix.length} stages to examine`);
    
    for (const stage of stagesToFix) {
      console.log(`\n📋 Stage ${stage.number_index}: ${stage.name}`);
      console.log(`  Stage Status: ${stage.status}`);
      console.log(`  Is Deliverable: ${stage.is_deliverable}`);
      
      if (!stage.is_deliverable) {
        console.log('  ⚠️ Not a deliverable stage, skipping');
        continue;
      }
      
      // Find the deliverable
      let deliverable = null;
      
      // First try by deliverable_id
      if (stage.deliverable_id) {
        try {
          deliverable = await SupabaseDeliverable.get(stage.deliverable_id);
        } catch (e) {
          console.log(`  ⚠️ Could not find deliverable by ID: ${stage.deliverable_id}`);
        }
      }
      
      // Fallback to stage_id
      if (!deliverable) {
        const deliverablesByStageId = await SupabaseDeliverable.filter({ 
          stage_id: stage.id 
        });
        if (deliverablesByStageId && deliverablesByStageId.length > 0) {
          deliverable = deliverablesByStageId[0];
        }
      }
      
      if (!deliverable) {
        console.log('  ❌ No deliverable found for this stage');
        continue;
      }
      
      console.log(`  Deliverable Status: ${deliverable.status}`);
      
      // Determine what the deliverable status should be based on stage status
      let targetDeliverableStatus = deliverable.status;
      
      switch(stage.status) {
        case 'completed':
          targetDeliverableStatus = 'approved';
          break;
        case 'in_progress':
          targetDeliverableStatus = 'in_progress';
          break;
        case 'ready':
          // If stage is ready, deliverable should be at least in_progress, not not_started
          if (deliverable.status === 'not_started') {
            targetDeliverableStatus = 'in_progress';
          }
          break;
        case 'blocked':
        case 'not_ready':
        case 'not_started':
        default:
          // These should be not_started
          targetDeliverableStatus = 'not_started';
          break;
      }
      
      // If deliverable status doesn't match what it should be based on stage
      if (deliverable.status === 'draft' && targetDeliverableStatus !== 'draft') {
        console.log(`  🔄 Updating deliverable status from ${deliverable.status} to ${targetDeliverableStatus}`);
        
        await SupabaseDeliverable.update(deliverable.id, {
          status: targetDeliverableStatus
        });
        
        console.log('  ✅ Updated successfully');
      } else if (deliverable.status !== targetDeliverableStatus) {
        console.log(`  🔄 Updating deliverable status from ${deliverable.status} to ${targetDeliverableStatus}`);
        
        await SupabaseDeliverable.update(deliverable.id, {
          status: targetDeliverableStatus
        });
        
        console.log('  ✅ Updated successfully');
      } else {
        console.log('  ✓ Status already correct');
      }
      
      // Also ensure stage.deliverable_id is set correctly
      if (!stage.deliverable_id && deliverable) {
        console.log(`  🔗 Linking deliverable_id to stage`);
        await SupabaseStage.update(stage.id, {
          deliverable_id: deliverable.id
        });
      }
    }
    
    console.log('\n✨ Fix complete! Refresh the page to see updated colors.');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
}

// Make it available globally for console execution
if (typeof window !== 'undefined') {
  window.fixSpecificStages = fixSpecificStages;
}