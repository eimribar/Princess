/**
 * Fix Missing Deliverables Utility
 * One-time fix to create deliverables for stages marked as is_deliverable
 * but missing their corresponding deliverable records
 */

import { SupabaseStage, SupabaseDeliverable } from '@/api/supabaseEntities';
import AutomationService from '@/services/automationService';

export async function fixMissingDeliverables() {
  console.log('🔧 Starting fix for missing deliverables...');
  
  try {
    // Get all stages marked as deliverable
    const allStages = await SupabaseStage.list();
    const deliverableStages = allStages.filter(stage => stage.is_deliverable === true);
    
    console.log(`Found ${deliverableStages.length} stages marked as deliverable`);
    
    let fixedCount = 0;
    let alreadyLinkedCount = 0;
    let errors = [];
    
    for (const stage of deliverableStages) {
      try {
        // Check if deliverable already exists
        const existingDeliverables = await SupabaseDeliverable.filter({ 
          stage_id: stage.id 
        });
        
        if (existingDeliverables && existingDeliverables.length > 0) {
          // Deliverable exists, ensure it's linked
          if (!stage.deliverable_id) {
            console.log(`Linking existing deliverable to stage ${stage.number_index}: ${stage.name}`);
            await SupabaseStage.update(stage.id, {
              deliverable_id: existingDeliverables[0].id,
              _skipDeliverableSync: true
            });
            alreadyLinkedCount++;
          } else {
            console.log(`✓ Stage ${stage.number_index} already has deliverable`);
          }
          continue;
        }
        
        // No deliverable exists, create one
        console.log(`Creating missing deliverable for stage ${stage.number_index}: ${stage.name}`);
        
        const deliverableData = {
          project_id: stage.project_id,
          stage_id: stage.id,
          name: stage.name,
          description: stage.description || `Deliverable for ${stage.name}`,
          category: stage.category,
          type: determineDeliverableType(stage.category),
          status: mapStageStatusToDeliverableStatus(stage.status),
          max_iterations: 3,
          current_iteration: 0,
          original_deadline: stage.end_date,
          adjusted_deadline: stage.end_date,
          deadline_impact_total: 0,
          is_final: false,
          include_in_brandbook: ['brand_building', 'strategy'].includes(stage.category),
          assigned_to: stage.assigned_to
        };
        
        const deliverable = await SupabaseDeliverable.create(deliverableData);
        
        // Update stage with deliverable_id
        await SupabaseStage.update(stage.id, { 
          deliverable_id: deliverable.id,
          _skipDeliverableSync: true
        });
        
        fixedCount++;
        console.log(`✅ Created deliverable for stage ${stage.number_index}`);
        
      } catch (error) {
        console.error(`❌ Failed to fix stage ${stage.number_index}:`, error);
        errors.push({ stage: stage.number_index, error: error.message });
      }
    }
    
    // Summary
    console.log('\n📊 Fix Summary:');
    console.log(`✅ Created ${fixedCount} new deliverables`);
    console.log(`🔗 Linked ${alreadyLinkedCount} existing deliverables`);
    if (errors.length > 0) {
      console.log(`❌ ${errors.length} errors occurred:`);
      errors.forEach(e => console.log(`   - Stage ${e.stage}: ${e.error}`));
    }
    
    console.log('\n✨ Fix complete! Refresh the page to see updated colors.');
    
    return {
      success: true,
      created: fixedCount,
      linked: alreadyLinkedCount,
      errors
    };
    
  } catch (error) {
    console.error('❌ Fatal error during fix:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function determineDeliverableType(category) {
  switch(category) {
    case 'research':
      return 'research';
    case 'strategy':
      return 'strategy';
    case 'brand_building':
    case 'brand_collaterals':
    case 'brand_activation':
      return 'creative';
    default:
      return 'document';
  }
}

function mapStageStatusToDeliverableStatus(stageStatus) {
  switch(stageStatus) {
    case 'completed':
      return 'approved'; // Assume completed stages have approved deliverables
    case 'in_progress':
      return 'wip'; // Work in progress
    case 'not_started':
      return 'draft';
    case 'blocked':
      return 'draft';
    default:
      return 'draft';
  }
}

// Make it available globally for console execution
if (typeof window !== 'undefined') {
  window.fixMissingDeliverables = fixMissingDeliverables;
}