/**
 * Clear Project Data Utility
 * Safely clears all project-related data from localStorage
 * Preserves auth and user preferences
 */

export function clearAllProjectData() {
  console.log('🧹 Clearing all project data from localStorage...');
  
  // List of keys to preserve (auth, user settings)
  const preserveKeys = [
    'princess-auth',
    'user-preferences',
    'theme-settings'
  ];
  
  // Get all localStorage keys
  const allKeys = Object.keys(localStorage);
  
  // Remove project-related keys
  allKeys.forEach(key => {
    if (!preserveKeys.includes(key)) {
      console.log(`  Removing: ${key}`);
      localStorage.removeItem(key);
    } else {
      console.log(`  Preserving: ${key}`);
    }
  });
  
  console.log('✅ Project data cleared successfully');
}

export function clearProjectSpecificData(projectId) {
  console.log(`🧹 Clearing data for project: ${projectId}`);
  
  // Keys that might contain project-specific data
  const projectKeys = [
    `project_${projectId}`,
    `stages_${projectId}`,
    `deliverables_${projectId}`,
    `comments_${projectId}`,
    `team_${projectId}`,
    `notifications_${projectId}`
  ];
  
  projectKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`  Removing: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // Also clear generic princess_data if it exists
  if (localStorage.getItem('princess_data')) {
    console.log('  Removing: princess_data (legacy)');
    localStorage.removeItem('princess_data');
  }
  
  console.log('✅ Project-specific data cleared');
}

// Auto-clear on first load to ensure clean state
if (typeof window !== 'undefined') {
  // Check if we should clear data (can be controlled by a flag)
  const shouldClear = localStorage.getItem('should_clear_project_data');
  if (shouldClear === 'true') {
    clearAllProjectData();
    localStorage.removeItem('should_clear_project_data');
  }
}