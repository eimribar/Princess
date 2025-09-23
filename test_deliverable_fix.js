#!/usr/bin/env node

/**
 * Test script to verify the deliverable status fix
 * Run this in your browser console after loading the app
 */

async function testDeliverableFix() {
  console.log("🔍 Testing Deliverable Status Fix...\n");
  
  // Get the Deliverable entity
  const Deliverable = window.SupabaseDeliverable || window.Deliverable;
  
  if (!Deliverable) {
    console.error("❌ Could not find Deliverable entity. Make sure the app is loaded.");
    return;
  }
  
  console.log("1️⃣ Testing filter() method - should load versions automatically...");
  try {
    const deliverables = await Deliverable.filter({ project_id: 'test-project' });
    console.log(`✅ Found ${deliverables.length} deliverables`);
    
    if (deliverables.length > 0) {
      const firstDeliverable = deliverables[0];
      console.log(`   - First deliverable: ${firstDeliverable.name}`);
      console.log(`   - Has versions: ${firstDeliverable.versions ? firstDeliverable.versions.length : 0}`);
      console.log(`   - Status: ${firstDeliverable.status}`);
    }
  } catch (error) {
    console.error("❌ Error in filter():", error);
  }
  
  console.log("\n2️⃣ Testing get() method - should load versions for single deliverable...");
  try {
    // Use a known deliverable ID if you have one
    const testId = 'bc1e0b0b-a158-4c3d-8183-28521a86a75d';
    const deliverable = await Deliverable.get(testId);
    
    if (deliverable) {
      console.log(`✅ Loaded deliverable: ${deliverable.name}`);
      console.log(`   - Has versions: ${deliverable.versions ? deliverable.versions.length : 0}`);
      console.log(`   - Status: ${deliverable.status}`);
      
      if (deliverable.versions && deliverable.versions.length > 0) {
        console.log("   - Version details:");
        deliverable.versions.forEach(v => {
          console.log(`     • ${v.version_number}: ${v.status}`);
        });
      }
    } else {
      console.log("⚠️  Deliverable not found with ID:", testId);
    }
  } catch (error) {
    console.error("❌ Error in get():", error);
  }
  
  console.log("\n3️⃣ Testing update() method - should NOT try to update versions field...");
  try {
    const deliverables = await Deliverable.list();
    if (deliverables.length > 0) {
      const testDeliverable = deliverables[0];
      
      // Try to update status
      console.log(`   Updating deliverable ${testDeliverable.id} status to 'in_progress'...`);
      const updated = await Deliverable.update(testDeliverable.id, {
        status: 'in_progress'
      });
      
      console.log("✅ Update successful - no errors!");
      console.log(`   - New status: ${updated.status}`);
    } else {
      console.log("⚠️  No deliverables found to test update");
    }
  } catch (error) {
    console.error("❌ Error in update():", error);
  }
  
  console.log("\n4️⃣ Testing version CRUD operations...");
  try {
    const deliverables = await Deliverable.list();
    if (deliverables.length > 0) {
      const testDeliverable = deliverables[0];
      
      // Test getVersions
      console.log("   Getting versions...");
      const versions = await Deliverable.getVersions(testDeliverable.id);
      console.log(`   ✅ Found ${versions.length} versions`);
      
      // Test createVersion
      console.log("   Creating test version...");
      const newVersion = await Deliverable.createVersion(testDeliverable.id, {
        version_number: `V${Date.now()}`,
        status: 'not_started',
        notes: 'Test version created by fix script'
      });
      console.log(`   ✅ Created version: ${newVersion.version_number}`);
      
      // Test updateVersion
      if (newVersion.id) {
        console.log("   Updating test version...");
        const updatedVersion = await Deliverable.updateVersion(newVersion.id, {
          status: 'submitted'
        });
        console.log(`   ✅ Updated version status to: ${updatedVersion.status}`);
      }
      
      // Test getLatestVersion
      console.log("   Getting latest version...");
      const latest = await Deliverable.getLatestVersion(testDeliverable.id);
      if (latest) {
        console.log(`   ✅ Latest version: ${latest.version_number} (${latest.status})`);
      }
    } else {
      console.log("⚠️  No deliverables found to test version operations");
    }
  } catch (error) {
    console.error("❌ Error in version operations:", error);
  }
  
  console.log("\n✨ Test complete!");
  console.log("If all tests passed, the fix is working correctly.");
  console.log("You should now be able to update deliverable status without errors.");
}

// Make function available globally
window.testDeliverableFix = testDeliverableFix;

console.log("📋 Test script loaded!");
console.log("Run 'testDeliverableFix()' in your browser console to test the fix.");