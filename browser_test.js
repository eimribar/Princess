// Run this in your browser console to test the deliverable functionality

async function testDeliverableOperations() {
  console.log("🔍 Testing Deliverable Operations...\n");
  
  // Get the entity classes from the window
  const Deliverable = window.SupabaseDeliverable;
  const Stage = window.SupabaseStage;
  
  if (!Deliverable) {
    console.error("❌ Deliverable entity not found. Make sure the app is loaded.");
    return;
  }
  
  try {
    // Test 1: List all deliverables
    console.log("1️⃣ Listing all deliverables...");
    const allDeliverables = await Deliverable.list();
    console.log(`   ✅ Found ${allDeliverables.length} deliverables`);
    
    if (allDeliverables.length > 0) {
      const first = allDeliverables[0];
      console.log(`   First deliverable:`, {
        id: first.id,
        name: first.name,
        status: first.status,
        hasVersions: !!first.versions,
        versionCount: first.versions?.length || 0
      });
    }
    
    // Test 2: Get specific deliverable with versions
    console.log("\n2️⃣ Testing get() with versions...");
    if (allDeliverables.length > 0) {
      const testId = allDeliverables[0].id;
      const deliverable = await Deliverable.get(testId);
      console.log(`   ✅ Loaded deliverable:`, {
        id: deliverable.id,
        name: deliverable.name,
        status: deliverable.status,
        versions: deliverable.versions?.map(v => ({
          id: v.id,
          version: v.version_number,
          status: v.status
        }))
      });
    }
    
    // Test 3: Update deliverable status (the operation that was failing)
    console.log("\n3️⃣ Testing status update (the problematic operation)...");
    if (allDeliverables.length > 0) {
      const testDeliverable = allDeliverables[0];
      const originalStatus = testDeliverable.status;
      
      // Try to update to a valid status
      const newStatus = originalStatus === 'not_started' ? 'in_progress' : 'not_started';
      
      console.log(`   Updating ${testDeliverable.id} from '${originalStatus}' to '${newStatus}'...`);
      
      try {
        const updated = await Deliverable.update(testDeliverable.id, {
          status: newStatus
        });
        console.log(`   ✅ Update successful! New status: ${updated.status}`);
        
        // Change it back
        await Deliverable.update(testDeliverable.id, {
          status: originalStatus
        });
        console.log(`   ✅ Reverted back to original status: ${originalStatus}`);
        
      } catch (updateError) {
        console.error(`   ❌ Update failed:`, updateError);
        console.log("   Error details:", {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details
        });
      }
    }
    
    // Test 4: Version operations
    console.log("\n4️⃣ Testing version operations...");
    if (allDeliverables.length > 0) {
      const testDeliverable = allDeliverables[0];
      
      // Get versions
      const versions = await Deliverable.getVersions(testDeliverable.id);
      console.log(`   Found ${versions.length} versions for ${testDeliverable.name}`);
      
      // Try to create a test version
      console.log("   Creating test version...");
      try {
        const newVersion = await Deliverable.createVersion(testDeliverable.id, {
          version_number: `V_TEST_${Date.now()}`,
          status: 'not_started',
          notes: 'Test version created by browser test script'
        });
        console.log(`   ✅ Created version: ${newVersion.version_number}`);
        
        // Update the version
        if (newVersion.id) {
          const updatedVersion = await Deliverable.updateVersion(newVersion.id, {
            status: 'submitted'
          });
          console.log(`   ✅ Updated version status to: ${updatedVersion.status}`);
          
          // Delete the test version
          await Deliverable.deleteVersion(newVersion.id);
          console.log(`   ✅ Deleted test version`);
        }
      } catch (versionError) {
        console.log("   ⚠️  Version operations may not be supported in localStorage mode");
      }
    }
    
    console.log("\n✨ All tests complete!");
    console.log("If you see ✅ for test 3 (status update), the fix is working!");
    
  } catch (error) {
    console.error("❌ Error during testing:", error);
  }
}

// Run the test
testDeliverableOperations();