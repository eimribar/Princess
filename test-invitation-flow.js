// Test script for invitation flow
// Run this in the browser console while on the Team page

console.log('🧪 INVITATION FLOW TEST SCRIPT');
console.log('================================\n');

// Helper function to create test invitation directly
async function createTestInvitation() {
  console.log('📧 Creating test invitation...');
  
  // Check if we're in Supabase mode
  const isSupabaseMode = localStorage.getItem('princess-auth');
  
  if (!isSupabaseMode) {
    console.log('⚠️  Running in demo mode - creating mock invitation');
    const mockToken = `demo-${Date.now()}`;
    const mockLink = `http://localhost:5173/welcome/${mockToken}`;
    
    console.log('✅ Mock invitation created!');
    console.log('📋 Invitation link:', mockLink);
    console.log('\n💡 To test the welcome page:');
    console.log('1. Copy the link above');
    console.log('2. Open in new incognito/private window');
    console.log('3. You should see the welcome page with confetti!');
    
    return mockLink;
  }
  
  // For Supabase mode - we'll use the actual function
  console.log('🔄 Creating real invitation in Supabase...');
  console.log('Note: This requires you to be logged in as admin/agency');
  
  return null;
}

// Function to test the invitation dialog
function testInvitationDialog() {
  console.log('\n📝 TESTING INVITATION DIALOG');
  console.log('----------------------------');
  
  // Check if we're on the Team page
  if (!window.location.pathname.includes('/team')) {
    console.log('❌ Please navigate to the Team page first!');
    console.log('   Go to: http://localhost:5173/team');
    return;
  }
  
  // Look for the invite button
  const inviteButton = document.querySelector('button:has(svg[class*="UserPlus"])') ||
                       document.querySelector('button:contains("Invite")') ||
                       Array.from(document.querySelectorAll('button')).find(btn => 
                         btn.textContent.includes('Invite'));
  
  if (inviteButton) {
    console.log('✅ Found "Invite Team Member" button');
    console.log('🖱️  Click it to open the enhanced dialog');
    console.log('\nWhat to test:');
    console.log('1. Enter multiple emails (comma separated)');
    console.log('2. See validation badges (X valid, Y invalid)');
    console.log('3. Click "Preview" to see email template');
    console.log('4. Send invitations');
    console.log('5. Copy invitation links from success tab');
    
    // Highlight the button
    inviteButton.style.border = '3px solid #10b981';
    inviteButton.style.animation = 'pulse 2s infinite';
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
    `;
    document.head.appendChild(style);
  } else {
    console.log('❌ Could not find "Invite Team Member" button');
    console.log('   Make sure you are logged in as admin or agency');
  }
}

// Function to test with sample emails
function getSampleEmails() {
  const emails = [
    'john.doe@example.com',
    'jane.smith@company.com',
    'mike@business.org',
    'sarah.wilson@test.com',
    'invalid-email-here',
    'another@valid.email'
  ];
  
  console.log('\n📋 SAMPLE EMAILS FOR TESTING:');
  console.log('-----------------------------');
  console.log(emails.join(', '));
  console.log('\n💡 Copy and paste these into the invitation dialog');
  console.log('   You should see 5 valid and 1 invalid');
  
  // Copy to clipboard
  navigator.clipboard.writeText(emails.join(', '));
  console.log('✅ Copied to clipboard!');
}

// Main test runner
console.log('🚀 Available test commands:\n');
console.log('1. testInvitationDialog()  - Highlights invite button and shows what to test');
console.log('2. getSampleEmails()       - Gets sample emails for batch testing');
console.log('3. createTestInvitation()  - Creates a test invitation link\n');

console.log('💡 Start by running: testInvitationDialog()');

// Auto-run the first test
testInvitationDialog();

// Make functions available globally
window.testInvitationDialog = testInvitationDialog;
window.getSampleEmails = getSampleEmails;
window.createTestInvitation = createTestInvitation;