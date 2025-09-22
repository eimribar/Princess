/**
 * Diagnose Stage Display Issues
 * Check why a specific stage isn't showing the expected color
 */

import { SupabaseStage, SupabaseDeliverable } from '@/api/supabaseEntities';

export async function diagnoseStage(stageNumber) {
  console.log(`🔍 Diagnosing stage ${stageNumber}...`);
  
  try {
    // Get all stages with this number (might be multiple due to projects)
    const allStages = await SupabaseStage.list();
    const stages = allStages.filter(s => s.number_index === stageNumber);
    
    if (stages.length === 0) {
      console.log(`❌ No stage found with number ${stageNumber}`);
      return;
    }
    
    console.log(`Found ${stages.length} stage(s) with number ${stageNumber}`);
    
    for (const stage of stages) {
      console.log(`\n📋 Stage Details:`);
      console.log(`  ID: ${stage.id}`);
      console.log(`  Name: ${stage.name}`);
      console.log(`  Project ID: ${stage.project_id}`);
      console.log(`  Status: ${stage.status}`);
      console.log(`  Is Deliverable: ${stage.is_deliverable}`);
      console.log(`  Deliverable ID: ${stage.deliverable_id || 'NOT SET'}`);
      
      if (stage.is_deliverable) {
        // Check for deliverables linked to this stage
        const deliverablesByStageId = await SupabaseDeliverable.filter({ 
          stage_id: stage.id 
        });
        
        console.log(`\n📦 Deliverables linked by stage_id: ${deliverablesByStageId.length}`);
        
        if (deliverablesByStageId.length > 0) {
          const del = deliverablesByStageId[0];
          console.log(`  Deliverable ID: ${del.id}`);
          console.log(`  Deliverable Name: ${del.name}`);
          console.log(`  Deliverable Status: ${del.status}`);
          console.log(`  Current Iteration: ${del.current_iteration}`);
          console.log(`  Max Iterations: ${del.max_iterations}`);
          
          // Check if stage.deliverable_id matches
          if (stage.deliverable_id !== del.id) {
            console.log(`\n⚠️ ISSUE FOUND: Stage.deliverable_id (${stage.deliverable_id}) doesn't match deliverable.id (${del.id})`);
            console.log(`This causes the visual to not find the deliverable!`);
          }
        }
        
        // Also check if deliverable_id points to a valid deliverable
        if (stage.deliverable_id) {
          try {
            const delById = await SupabaseDeliverable.get(stage.deliverable_id);
            if (delById) {
              console.log(`\n📦 Deliverable found by deliverable_id:`);
              console.log(`  Status: ${delById.status}`);
            } else {
              console.log(`\n❌ No deliverable found with ID ${stage.deliverable_id}`);
            }
          } catch (e) {
            console.log(`\n❌ Error fetching deliverable ${stage.deliverable_id}: ${e.message}`);
          }
        }
      }
    }
    
    console.log(`\n✅ Diagnosis complete`);
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

// Make it available globally for console execution
if (typeof window !== 'undefined') {
  window.diagnoseStage = diagnoseStage;
}