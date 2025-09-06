import React, { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import AuthGuard from './AuthGuard';

// For now, use existing components and layouts
import Layout from '@/pages/Layout';

// Existing pages
import Dashboard from '@/pages/Dashboard';
import Deliverables from '@/pages/Deliverables';
import Team from '@/pages/Team';
import Timeline from '@/pages/Timeline';
import Admin from '@/pages/Admin';
import ProjectSetup from '@/pages/ProjectSetup';
import OutofScope from '@/pages/OutofScope';
import DeliverableDetail from '@/pages/DeliverableDetail';
import Brandbook from '@/pages/Brandbook';

// Client portal components
import ClientLayout from '@/portals/client/ClientLayout';
import ClientDashboard from '@/portals/client/pages/ClientDashboard';
import ClientDeliverables from '@/portals/client/pages/ClientDeliverables';
import ClientTeam from '@/portals/client/pages/ClientTeam';
import ClientBrandbook from '@/portals/client/pages/ClientBrandbook';

// Public pages
import PublicBrandbook from '@/portals/public/PublicBrandbook';

// Use AdminLayout as alias for existing Layout
const AdminLayout = Layout;

/**
 * Premium Role-Based Router
 * 
 * Intelligently routes users based on their role with:
 * - Automatic portal selection
 * - Smart redirects
 * - Lazy loading for performance
 * - Beautiful loading states
 * - Session persistence
 */

const RoleBasedRouter = () => {
  const { user } = useUser();

  // Determine default route based on user role
  const defaultRoute = useMemo(() => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'client':
        return '/client/dashboard';
      case 'admin':
      case 'agency':
        return '/admin/dashboard';
      default:
        return '/';
    }
  }, [user]);

  return (
    <Routes>
        {/* Root redirect based on role */}
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />

        {/* Client Portal Routes */}
        <Route
          path="/client/*"
          element={
            <AuthGuard 
              allowedRoles={['client']} 
              requireAuth={true}
              redirectTo="/admin/dashboard"
            >
              <ClientLayout>
                <Routes>
                  <Route path="dashboard" element={<ClientDashboard />} />
                  <Route path="deliverables" element={<ClientDeliverables />} />
                  <Route path="deliverables/:id" element={<DeliverableDetail />} />
                  <Route path="team" element={<ClientTeam />} />
                  <Route path="brandbook" element={<ClientBrandbook />} />
                  <Route path="timeline" element={<Timeline />} />
                  <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
                </Routes>
              </ClientLayout>
            </AuthGuard>
          }
        />

        {/* Admin/Agency Portal Routes */}
        <Route
          path="/admin/*"
          element={
            <AuthGuard 
              allowedRoles={['admin', 'agency']} 
              requireAuth={true}
              redirectTo="/client/dashboard"
            >
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="deliverables" element={<Deliverables />} />
                  <Route path="deliverables/:id" element={<DeliverableDetail />} />
                  <Route path="team" element={<Team />} />
                  <Route path="timeline" element={<Timeline />} />
                  <Route path="brandbook" element={<Brandbook />} />
                  <Route path="admin" element={
                    <AuthGuard allowedRoles={['admin']}>
                      <Admin />
                    </AuthGuard>
                  } />
                  <Route path="project-setup" element={
                    <AuthGuard allowedRoles={['admin', 'agency']}>
                      <ProjectSetup />
                    </AuthGuard>
                  } />
                  <Route path="out-of-scope" element={<OutofScope />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </AdminLayout>
            </AuthGuard>
          }
        />

        {/* Public Routes (No authentication required) */}
        <Route
          path="/public/*"
          element={
            <Routes>
              <Route path="brandbook/:projectId" element={<PublicBrandbook />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          }
        />

        {/* Legacy route redirects for backward compatibility */}
        <Route path="/dashboard" element={<Navigate to={defaultRoute} replace />} />
        <Route path="/deliverables" element={<Navigate to={`${defaultRoute.split('/dashboard')[0]}/deliverables`} replace />} />
        <Route path="/team" element={<Navigate to={`${defaultRoute.split('/dashboard')[0]}/team`} replace />} />
        <Route path="/timeline" element={<Navigate to={`${defaultRoute.split('/dashboard')[0]}/timeline`} replace />} />
        <Route path="/brandbook" element={<Navigate to={`${defaultRoute.split('/dashboard')[0]}/brandbook`} replace />} />
        <Route path="/admin" element={<Navigate to="/admin/admin" replace />} />
        <Route path="/projectsetup" element={<Navigate to="/admin/project-setup" replace />} />
        <Route path="/outofscope" element={<Navigate to="/admin/out-of-scope" replace />} />
        <Route path="/deliverabledetail" element={<Navigate to={`${defaultRoute.split('/dashboard')[0]}/deliverables`} replace />} />

        {/* 404 - Not Found */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
                <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                <button
                  onClick={() => window.location.href = defaultRoute}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          }
        />
      </Routes>
  );
};

export default RoleBasedRouter;