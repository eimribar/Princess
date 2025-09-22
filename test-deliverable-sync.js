// Test script for deliverable-stage synchronization
import { SupabaseStage, SupabaseDeliverable } from './src/api/supabaseEntities.js';

async function testDeliverableSync() {
  console.log('🧪 Testing Deliverable-Stage Synchronization\n');
  
  try {
    // Test 1: Create a stage marked as deliverable
    console.log('Test 1: Creating stage with is_deliverable=true');
    const testStage = {
      project_id: 'test-project-123',
      number_index: 999,
      name: 'Test Deliverable Stage',
      is_deliverable: true,
      category: 'research',
      status: 'not_started',
      description: 'Testing auto-deliverable creation'
    };
    
    const createdStage = await SupabaseStage.create(testStage);
    console.log('✓ Stage created:', createdStage.id);
    
    // Check if deliverable was auto-created
    const deliverables = await SupabaseDeliverable.filter({ stage_id: createdStage.id });
    if (deliverables.length > 0) {
      console.log('✓ Deliverable auto-created:', deliverables[0].id);
    } else {
      console.log('✗ Deliverable was NOT auto-created');
    }
    
    // Test 2: Update stage status and check sync
    console.log('\nTest 2: Updating stage status to in_progress');
    await SupabaseStage.update(createdStage.id, { status: 'in_progress' });
    
    const updatedDeliverable = await SupabaseDeliverable.get(deliverables[0].id);
    console.log('Deliverable status after stage update:', updatedDeliverable.status);
    
    // Test 3: Approve deliverable and check stage completion
    console.log('\nTest 3: Approving deliverable');
    await SupabaseDeliverable.update(deliverables[0].id, { status: 'approved' });
    
    const finalStage = await SupabaseStage.get(createdStage.id);
    console.log('Stage status after deliverable approval:', finalStage.status);
    
    if (finalStage.status === 'completed') {
      console.log('✓ Stage auto-completed when deliverable approved!');
    } else {
      console.log('✗ Stage was NOT auto-completed');
    }
    
    // Clean up test data
    console.log('\nCleaning up test data...');
    await SupabaseDeliverable.delete(deliverables[0].id);
    await SupabaseStage.delete(createdStage.id);
    console.log('✓ Test data cleaned up');
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run tests
testDeliverableSync();