// Simple script to clear localStorage data and trigger re-initialization
console.log('Clearing localStorage data...');

// Clear all Princess app data
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.startsWith('princess_') || key.startsWith('project_') || key.startsWith('stage_') || key.startsWith('deliverable_') || key.startsWith('comment_') || key.startsWith('team_member_'))) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`Removed: ${key}`);
});

console.log(`Cleared ${keysToRemove.length} localStorage entries`);
console.log('Refresh the page to trigger re-initialization with sample files!');