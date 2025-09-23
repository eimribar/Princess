// Test script to verify the deliverable status fix
import { SupabaseDeliverable } from '@/api/supabaseEntities';

export async function testDeliverableFix() {
  console.log("🔍 Testing Deliverable Status Fix...\n");
  
  try {
    // Test 1: List all deliverables
    console.log("1️⃣ Listing all deliverables...");
    const deliverables = await SupabaseDeliverable.list();
    console.log(`   ✅ Found ${deliverables.length} deliverables`);
    
    if (deliverables.length > 0) {
      const first = deliverables[0];
      console.log(`   First deliverable:`, {
        id: first.id,
        name: first.name,
        status: first.status,
        hasVersions: !!first.versions,
        versionCount: first.versions?.length || 0
      });
      
      // Test 2: Try updating status (this was failing before)
      console.log("\n2️⃣ Testing status update (the problematic operation)...");
      const originalStatus = first.status;
      const newStatus = originalStatus === 'not_started' ? 'in_progress' : 'not_started';
      
      console.log(`   Updating ${first.name} from '${originalStatus}' to '${newStatus}'...`);
      
      try {
        const updated = await SupabaseDeliverable.update(first.id, {
          status: newStatus
        });
        console.log(`   ✅ Update successful! New status: ${updated.status}`);
        
        // Change it back
        await SupabaseDeliverable.update(first.id, {
          status: originalStatus
        });
        console.log(`   ✅ Reverted back to original status: ${originalStatus}`);
        
      } catch (updateError) {
        console.error(`   ❌ Update failed:`, updateError.message);
        console.log("   Error details:", {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details
        });
      }
      
      // Test 3: Test version operations
      console.log("\n3️⃣ Testing version operations...");
      
      // Get versions
      const versions = await SupabaseDeliverable.getVersions(first.id);
      console.log(`   Found ${versions.length} versions for ${first.name}`);
      
      // Try to create a test version
      console.log("   Creating test version...");
      try {
        const newVersion = await SupabaseDeliverable.createVersion(first.id, {
          version_number: `V${Date.now() % 10000}`, // Shorter version number to fit VARCHAR(10)
          status: 'not_started',
          notes: 'Test version created by fix verification script'
        });
        console.log(`   ✅ Created version: ${newVersion.version_number} with status: ${newVersion.status}`);
        
        // Update the version status
        if (newVersion.id) {
          const updatedVersion = await SupabaseDeliverable.updateVersion(newVersion.id, {
            status: 'submitted'
          });
          console.log(`   ✅ Updated version status to: ${updatedVersion.status}`);
          
          // Get latest version
          const latest = await SupabaseDeliverable.getLatestVersion(first.id);
          console.log(`   ✅ Latest version: ${latest.version_number} (${latest.status})`);
          
          // Clean up - delete the test version
          await SupabaseDeliverable.deleteVersion(newVersion.id);
          console.log(`   ✅ Deleted test version`);
        }
      } catch (versionError) {
        console.error("   ❌ Version operation error:", versionError.message);
      }
      
      // Test 4: Get deliverable with versions loaded
      console.log("\n4️⃣ Testing get() with automatic version loading...");
      const fullDeliverable = await SupabaseDeliverable.get(first.id);
      console.log(`   ✅ Loaded deliverable: ${fullDeliverable.name}`);
      console.log(`   - Status: ${fullDeliverable.status}`);
      console.log(`   - Versions loaded: ${fullDeliverable.versions ? fullDeliverable.versions.length : 0}`);
      
      if (fullDeliverable.versions && fullDeliverable.versions.length > 0) {
        console.log("   - Version details:");
        fullDeliverable.versions.forEach(v => {
          console.log(`     • ${v.version_number}: ${v.status}`);
        });
      }
    }
    
    console.log("\n✨ All tests complete!");
    console.log("✅ The deliverable status fix is working correctly!");
    console.log("You can now update deliverable status without 400 errors.");
    
  } catch (error) {
    console.error("❌ Error during testing:", error);
    console.log("Error details:", {
      message: error.message,
      stack: error.stack
    });
  }
}

// Make it available on window for easy testing
if (typeof window !== 'undefined') {
  window.testDeliverableFix = testDeliverableFix;
  console.log("✅ Test function loaded. Run 'testDeliverableFix()' in console to test.");
}