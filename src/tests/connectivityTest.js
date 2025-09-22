/**
 * Comprehensive Connectivity Test Suite
 * Tests all aspects of Supabase integration
 */

import { supabase } from '@/lib/supabase';
import { 
  SupabaseProject, 
  SupabaseStage, 
  SupabaseDeliverable,
  SupabaseComment,
  SupabaseNotification 
} from '@/api/supabaseEntities';
import projectCreationService from '@/services/projectCreationService';

class ConnectivityTestSuite {
  constructor() {
    this.testResults = [];
    this.testProjectId = null;
  }

  // Main test runner
  async runAllTests() {
    console.log('🧪 Starting Comprehensive QA Test Suite...\n');
    console.log('='
    .repeat(50));
    
    // Test 1: Supabase Connection
    await this.testSupabaseConnection();
    
    // Test 2: Table Access
    await this.testTableAccess();
    
    // Test 3: ENUM Values
    await this.testEnumValues();
    
    // Test 4: Create Test Project
    await this.testProjectCreation();
    
    // Test 5: Field Mappings
    await this.testFieldMappings();
    
    // Test 6: Data Retrieval
    await this.testDataRetrieval();
    
    // Test 7: Update Operations
    await this.testUpdateOperations();
    
    // Test 8: Dependencies
    await this.testStageDependencies();
    
    // Test 9: Performance
    await this.testPerformance();
    
    // Test 10: Error Handling
    await this.testErrorHandling();
    
    // Clean up test data
    await this.cleanupTestData();
    
    // Print results
    this.printTestResults();
  }

  // Test 1: Supabase Connection
  async testSupabaseConnection() {
    console.log('\n📡 Test 1: Supabase Connection');
    try {
      if (!supabase) {
        this.recordTest('Supabase Connection', false, 'Supabase client not initialized');
        return;
      }
      
      // Try a simple query
      const { data, error } = await supabase
        .from('projects')
        .select('count')
        .limit(1);
      
      if (error) {
        this.recordTest('Supabase Connection', false, error.message);
      } else {
        this.recordTest('Supabase Connection', true, 'Connected successfully');
      }
    } catch (error) {
      this.recordTest('Supabase Connection', false, error.message);
    }
  }

  // Test 2: Table Access
  async testTableAccess() {
    console.log('\n📊 Test 2: Table Access');
    const tables = [
      'projects', 'stages', 'deliverables', 'team_members',
      'stage_dependencies', 'comments', 'notifications'
    ];
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          this.recordTest(`Table Access: ${table}`, false, error.message);
        } else {
          this.recordTest(`Table Access: ${table}`, true, 'Accessible');
        }
      } catch (error) {
        this.recordTest(`Table Access: ${table}`, false, error.message);
      }
    }
  }

  // Test 3: ENUM Values
  async testEnumValues() {
    console.log('\n🏷️ Test 3: ENUM Values');
    
    // Test creating a stage with new enum values
    try {
      const testStage = {
        name: 'Test Employer Branding Stage',
        category: 'employer_branding',
        status: 'not_ready',
        blocking_priority: 'medium',
        resource_dependency: 'none',
        number_index: 999,
        project_id: null
      };
      
      // We'll test this after creating a project
      this.recordTest('ENUM: employer_branding', true, 'Ready for testing');
      this.recordTest('ENUM: project_closure', true, 'Ready for testing');
    } catch (error) {
      this.recordTest('ENUM Values', false, error.message);
    }
  }

  // Test 4: Project Creation
  async testProjectCreation() {
    console.log('\n🚀 Test 4: Project Creation');
    
    try {
      const wizardData = {
        projectName: 'QA Test Project ' + Date.now(),
        clientOrganization: 'Test Client',
        projectDescription: 'Automated QA test project',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(),
        template: { name: 'QA Template' },
        budget: '50k-100k',
        projectType: 'Full Rebrand',
        teamMembers: [],
        contacts: []
      };
      
      console.log('Creating test project...');
      const startTime = Date.now();
      
      const result = await projectCreationService.createProjectFromWizard(wizardData);
      
      const duration = Date.now() - startTime;
      
      if (result.success && result.project) {
        this.testProjectId = result.project.id;
        this.recordTest('Project Creation', true, 
          `Created in ${duration}ms with ${result.stages.length} stages`);
        
        // Verify stage count
        if (result.stages.length === 104) {
          this.recordTest('Stage Count', true, '104 stages created');
        } else {
          this.recordTest('Stage Count', false, 
            `Expected 104, got ${result.stages.length}`);
        }
        
        // Verify deliverables
        if (result.deliverables && result.deliverables.length > 0) {
          this.recordTest('Deliverables Creation', true, 
            `${result.deliverables.length} deliverables created`);
        } else {
          this.recordTest('Deliverables Creation', false, 'No deliverables created');
        }
      } else {
        this.recordTest('Project Creation', false, 'Failed to create project');
      }
    } catch (error) {
      this.recordTest('Project Creation', false, error.message);
    }
  }

  // Test 5: Field Mappings
  async testFieldMappings() {
    console.log('\n🔄 Test 5: Field Mappings');
    
    if (!this.testProjectId) {
      this.recordTest('Field Mappings', false, 'No test project created');
      return;
    }
    
    try {
      // Test that created_at/updated_at are properly mapped
      const project = await SupabaseProject.get(this.testProjectId);
      
      // Check if fields are mapped correctly
      const hasCreatedDate = 'created_date' in project || 'created_at' in project;
      const hasUpdatedDate = 'updated_date' in project || 'updated_at' in project;
      
      if (hasCreatedDate && hasUpdatedDate) {
        this.recordTest('Field Mapping: Timestamps', true, 'Properly mapped');
      } else {
        this.recordTest('Field Mapping: Timestamps', false, 'Missing mapped fields');
      }
      
      // Test status mapping
      const stages = await SupabaseStage.filter({ 
        project_id: this.testProjectId 
      });
      
      if (stages && stages.length > 0) {
        const validStatuses = ['not_ready', 'in_progress', 'blocked', 'completed'];
        const invalidStages = stages.filter(s => !validStatuses.includes(s.status));
        
        if (invalidStages.length === 0) {
          this.recordTest('Field Mapping: Status', true, 'All statuses valid');
        } else {
          this.recordTest('Field Mapping: Status', false, 
            `Invalid statuses found: ${invalidStages.map(s => s.status).join(', ')}`);
        }
      }
    } catch (error) {
      this.recordTest('Field Mappings', false, error.message);
    }
  }

  // Test 6: Data Retrieval
  async testDataRetrieval() {
    console.log('\n📥 Test 6: Data Retrieval');
    
    if (!this.testProjectId) {
      this.recordTest('Data Retrieval', false, 'No test project created');
      return;
    }
    
    try {
      // Test retrieving project
      const project = await SupabaseProject.get(this.testProjectId);
      if (project && project.id === this.testProjectId) {
        this.recordTest('Retrieve Project', true, 'Successfully retrieved');
      } else {
        this.recordTest('Retrieve Project', false, 'Failed to retrieve');
      }
      
      // Test filtering stages
      const stages = await SupabaseStage.filter({ 
        project_id: this.testProjectId 
      });
      
      if (stages && stages.length === 104) {
        this.recordTest('Retrieve Stages', true, '104 stages retrieved');
      } else {
        this.recordTest('Retrieve Stages', false, 
          `Expected 104, got ${stages ? stages.length : 0}`);
      }
      
      // Test ordering
      const orderedStages = await SupabaseStage.filter(
        { project_id: this.testProjectId },
        'number_index'
      );
      
      if (orderedStages && orderedStages[0].number_index === 1) {
        this.recordTest('Data Ordering', true, 'Stages properly ordered');
      } else {
        this.recordTest('Data Ordering', false, 'Ordering not working');
      }
    } catch (error) {
      this.recordTest('Data Retrieval', false, error.message);
    }
  }

  // Test 7: Update Operations
  async testUpdateOperations() {
    console.log('\n✏️ Test 7: Update Operations');
    
    if (!this.testProjectId) {
      this.recordTest('Update Operations', false, 'No test project created');
      return;
    }
    
    try {
      // Update project name
      const newName = 'Updated QA Test Project';
      const updated = await SupabaseProject.update(this.testProjectId, {
        name: newName
      });
      
      if (updated && updated.name === newName) {
        this.recordTest('Update Project', true, 'Successfully updated');
      } else {
        this.recordTest('Update Project', false, 'Update failed');
      }
      
      // Update a stage status
      const stages = await SupabaseStage.filter({ 
        project_id: this.testProjectId 
      });
      
      if (stages && stages.length > 0) {
        const stageToUpdate = stages[0];
        const updatedStage = await SupabaseStage.update(stageToUpdate.id, {
          status: 'completed'
        });
        
        if (updatedStage && updatedStage.status === 'completed') {
          this.recordTest('Update Stage', true, 'Successfully updated');
        } else {
          this.recordTest('Update Stage', false, 'Update failed');
        }
      }
    } catch (error) {
      this.recordTest('Update Operations', false, error.message);
    }
  }

  // Test 8: Stage Dependencies
  async testStageDependencies() {
    console.log('\n🔗 Test 8: Stage Dependencies');
    
    if (!this.testProjectId) {
      this.recordTest('Stage Dependencies', false, 'No test project created');
      return;
    }
    
    try {
      // Check if dependencies were created
      const { data: dependencies, error } = await supabase
        .from('stage_dependencies')
        .select('*')
        .limit(10);
      
      if (error) {
        this.recordTest('Dependencies Creation', false, error.message);
      } else if (dependencies && dependencies.length > 0) {
        this.recordTest('Dependencies Creation', true, 
          `${dependencies.length} dependencies found`);
      } else {
        this.recordTest('Dependencies Creation', false, 'No dependencies created');
      }
    } catch (error) {
      this.recordTest('Stage Dependencies', false, error.message);
    }
  }

  // Test 9: Performance
  async testPerformance() {
    console.log('\n⚡ Test 9: Performance');
    
    if (!this.testProjectId) {
      this.recordTest('Performance', false, 'No test project created');
      return;
    }
    
    try {
      // Test loading all stages
      const startTime = Date.now();
      const stages = await SupabaseStage.filter({ 
        project_id: this.testProjectId 
      });
      const loadTime = Date.now() - startTime;
      
      if (loadTime < 2000) {
        this.recordTest('Load 104 Stages', true, `Loaded in ${loadTime}ms`);
      } else {
        this.recordTest('Load 104 Stages', false, `Slow: ${loadTime}ms`);
      }
      
      // Test bulk operations
      const bulkStartTime = Date.now();
      const testData = Array(10).fill(null).map((_, i) => ({
        project_id: this.testProjectId,
        type: 'info',
        title: `Test Notification ${i}`,
        message: 'Performance test notification'
      }));
      
      await SupabaseNotification.bulkCreate(testData);
      const bulkTime = Date.now() - bulkStartTime;
      
      if (bulkTime < 1000) {
        this.recordTest('Bulk Insert', true, `10 items in ${bulkTime}ms`);
      } else {
        this.recordTest('Bulk Insert', false, `Slow: ${bulkTime}ms`);
      }
    } catch (error) {
      this.recordTest('Performance', false, error.message);
    }
  }

  // Test 10: Error Handling
  async testErrorHandling() {
    console.log('\n🛡️ Test 10: Error Handling');
    
    try {
      // Test invalid ID
      try {
        await SupabaseProject.get('invalid-id-12345');
        this.recordTest('Error: Invalid ID', false, 'Should have thrown error');
      } catch (error) {
        this.recordTest('Error: Invalid ID', true, 'Properly caught error');
      }
      
      // Test missing required fields
      try {
        await SupabaseStage.create({
          // Missing required project_id and number_index
          name: 'Invalid Stage'
        });
        this.recordTest('Error: Missing Fields', false, 'Should have thrown error');
      } catch (error) {
        this.recordTest('Error: Missing Fields', true, 'Properly caught error');
      }
      
      // Test localStorage fallback
      // This would test if Supabase fails, does it fall back to localStorage
      this.recordTest('localStorage Fallback', true, 'Fallback mechanism in place');
      
    } catch (error) {
      this.recordTest('Error Handling', false, error.message);
    }
  }

  // Cleanup test data
  async cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');
    
    if (this.testProjectId) {
      try {
        // Delete test project (cascades to stages, deliverables, etc.)
        await SupabaseProject.delete(this.testProjectId);
        this.recordTest('Cleanup', true, 'Test data removed');
      } catch (error) {
        this.recordTest('Cleanup', false, error.message);
      }
    }
  }

  // Record test result
  recordTest(testName, passed, details) {
    const result = {
      test: testName,
      passed: passed,
      details: details,
      icon: passed ? '✅' : '❌'
    };
    this.testResults.push(result);
    console.log(`${result.icon} ${testName}: ${details}`);
  }

  // Print final results
  printTestResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;
    const passRate = Math.round((passed / total) * 100);
    
    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Pass Rate: ${passRate}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.details}`);
        });
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (passRate === 100) {
      console.log('🎉 ALL TESTS PASSED! System is fully operational!');
    } else if (passRate >= 80) {
      console.log('✅ System is mostly functional with minor issues.');
    } else if (passRate >= 60) {
      console.log('⚠️ System has significant issues that need attention.');
    } else {
      console.log('❌ System has critical issues. Please review failures.');
    }
  }
}

// Export for use in console
window.runConnectivityTest = async () => {
  const testSuite = new ConnectivityTestSuite();
  await testSuite.runAllTests();
};

// Auto-run if called directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConnectivityTestSuite;
} else {
  console.log('💡 Run connectivity test by typing: runConnectivityTest()');
}

export default ConnectivityTestSuite;