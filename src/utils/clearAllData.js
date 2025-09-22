/**
 * Clear All Data Utility
 * Completely removes all Princess project data from all storage locations
 */

export function clearAllPrincessData() {
  console.log('🧹 Clearing all Princess data...');
  
  // 1. Clear main data store
  localStorage.removeItem('princess_data');
  console.log('✅ Cleared princess_data from localStorage');
  
  // 2. Clear legacy project storage
  localStorage.removeItem('princess_projects');
  console.log('✅ Cleared princess_projects from localStorage');
  
  // 3. Clear any project-specific keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('project_') || 
      key.startsWith('princess_') ||
      key.includes('deutsch') ||
      key.includes('Deutsch')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Removed ${key}`);
  });
  
  // 4. Clear session storage
  sessionStorage.clear();
  console.log('✅ Cleared sessionStorage');
  
  // 5. Clear IndexedDB if it exists
  if (window.indexedDB) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        indexedDB.deleteDatabase(db.name);
        console.log(`✅ Deleted IndexedDB: ${db.name}`);
      });
    }).catch(err => {
      console.warn('Could not clear IndexedDB:', err);
    });
  }
  
  // 6. Clear cache storage if available
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log(`✅ Deleted cache: ${name}`);
      });
    }).catch(err => {
      console.warn('Could not clear caches:', err);
    });
  }
  
  console.log('✨ All Princess data cleared successfully!');
  console.log('🔄 Reloading page to apply changes...');
  
  // Force reload after a short delay
  setTimeout(() => {
    window.location.reload(true);
  }, 500);
}

// Auto-execute if running directly (for testing)
if (typeof window !== 'undefined' && window.location.search.includes('clearData=true')) {
  clearAllPrincessData();
}