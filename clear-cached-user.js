// Script to clear cached admin user from localStorage
// Run this in the browser console to reset the user to client role

console.log('🧹 Clearing cached user data...');

// Check current stored user
const currentUser = localStorage.getItem('princess_user');
if (currentUser) {
  const userData = JSON.parse(currentUser);
  console.log('Current stored user role:', userData.role);
  console.log('Full user data:', userData);
}

// Clear the stored user to force reload with new defaults
localStorage.removeItem('princess_user');
console.log('✅ User data cleared. Page will reload with client role as default.');

// Force page reload to apply changes
window.location.reload();