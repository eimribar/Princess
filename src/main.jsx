import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { UserProvider } from '@/contexts/ClerkUserContext'
import { ProjectProvider } from '@/contexts/ProjectContext'
import ErrorBoundary from '@/components/ErrorBoundary'

// Import Clerk Publishable Key
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key - Add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file')
}

// Clear any demo data on startup
import { clearAllPrincessData } from '@/utils/clearAllData';
// Import fix utility for missing deliverables
import { fixMissingDeliverables } from '@/utils/fixMissingDeliverables';
// Import diagnostic utility
import { diagnoseStage } from '@/utils/diagnoseStage';
// Import sync utility
import { syncStageDeliverables } from '@/utils/syncStageDeliverables';
// Import specific stages fix
import { fixSpecificStages } from '@/utils/fixSpecificStages';
// Import invitation flow test utility
import { testInvitationFlow } from '@/utils/testInvitationFlow';
// Import fix for missing team members
import { fixMissingTeamMembers } from '@/utils/fixMissingTeamMembers';

// Check and clear demo data if it exists
const checkAndClearDemoData = () => {
  const stored = localStorage.getItem('princess_data');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (data.projects && data.projects.some(p => 
        p.name?.includes('Deutsch') || 
        p.client_name?.includes('Deutsch'))) {
        console.log('Demo data detected, clearing...');
        clearAllPrincessData();
      }
    } catch (e) {
      console.error('Error checking demo data:', e);
    }
  }
};

// Run on startup
checkAndClearDemoData();

// Import test utilities in development mode
if (import.meta.env.DEV) {
  import('@/utils/testTeamOperations').catch(console.error);
  import('@/utils/setUserRole').catch(console.error);
  import('@/utils/testProjectIsolation').catch(console.error);
  import('@/utils/debugSupabaseAuth').catch(console.error);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
      signInUrl="/auth/login"
      signUpUrl="/auth/signup"
    >
      <UserProvider>
        <ProjectProvider>
          <App />
        </ProjectProvider>
      </UserProvider>
    </ClerkProvider>
  </ErrorBoundary>
) 