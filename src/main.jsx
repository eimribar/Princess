import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { UserProvider } from '@/contexts/SupabaseUserContext'
import { ProjectProvider } from '@/contexts/ProjectContext'
import ErrorBoundary from '@/components/ErrorBoundary'

// Clear any demo data on startup
import { clearAllPrincessData } from '@/utils/clearAllData';

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
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <UserProvider>
      <ProjectProvider>
        <App />
      </ProjectProvider>
    </UserProvider>
  </ErrorBoundary>
) 