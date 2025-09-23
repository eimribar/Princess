// Quick test - paste this in browser console after running the SQL fix

async function quickFixTest() {
  console.log("🔍 Quick Fix Test...\n");
  
  // Get the Deliverable entity from the window
  const testFunc = window.testDeliverableFix;
  
  if (testFunc) {
    console.log("✅ Test function found, running full test...");
    await testFunc();
  } else {
    console.log("⚠️  Test function not found. Trying direct test...");
    
    // Try to import and test directly
    try {
      const { SupabaseDeliverable } = await import('/src/api/supabaseEntities.js');
      
      console.log("Testing status update...");
      const deliverables = await SupabaseDeliverable.list();
      
      if (deliverables.length > 0) {
        const first = deliverables[0];
        console.log(`Found deliverable: ${first.name} (${first.status})`);
        
        // Try updating status
        const newStatus = first.status === 'not_started' ? 'in_progress' : 'not_started';
        console.log(`Updating to: ${newStatus}`);
        
        const updated = await SupabaseDeliverable.update(first.id, {
          status: newStatus
        });
        
        console.log(`✅ Update successful! New status: ${updated.status}`);
      }
    } catch (e) {
      console.error("❌ Test failed:", e.message);
    }
  }
}

quickFixTest();