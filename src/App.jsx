import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { useUser } from '@/contexts/UserContext'
import AuthGuard from '@/guards/AuthGuard'

// Main Layout (adapts based on user role)
import Layout from '@/pages/Layout'

// Pages
import Dashboard from '@/pages/Dashboard'
import Deliverables from '@/pages/Deliverables'
import DeliverableDetail from '@/pages/DeliverableDetail'
import Team from '@/pages/Team'
import Timeline from '@/pages/Timeline'
import Brandbook from '@/pages/Brandbook'
import Admin from '@/pages/Admin'
import ProjectSetup from '@/pages/ProjectSetup'
import OutofScope from '@/pages/OutofScope'

// Onboarding & Auth (to be created)
// import Onboarding from '@/pages/Onboarding'
// import InvitationAccept from '@/pages/InvitationAccept'

function App() {
  return (
    <Router>
      <AppRoutes />
      <Toaster />
    </Router>
  )
}

function AppRoutes() {
  const { user } = useUser()
  
  // Default route based on role (everyone goes to /dashboard)
  const defaultRoute = user ? '/dashboard' : '/login'

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      
      {/* Authenticated routes - same for all roles, different content */}
      <Route path="/*" element={
        <AuthGuard requireAuth={true} fallbackPath="/login">
          <Layout>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="deliverables" element={<Deliverables />} />
              <Route path="deliverables/:id" element={<DeliverableDetail />} />
              <Route path="team" element={<Team />} />
              <Route path="timeline" element={<Timeline />} />
              <Route path="brandbook" element={<Brandbook />} />
              
              {/* Admin-only routes */}
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
              <Route path="out-of-scope" element={
                <AuthGuard allowedRoles={['admin', 'agency']}>
                  <OutofScope />
                </AuthGuard>
              } />
              
              {/* Catch-all redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        </AuthGuard>
      } />
      
      {/* Public routes (no auth required) */}
      <Route path="/public/brandbook/:projectId" element={<Brandbook isPublic={true} />} />
      
      {/* Invitation & Onboarding routes (to be implemented) */}
      {/* <Route path="/invitation/:token" element={<InvitationAccept />} /> */}
      {/* <Route path="/onboarding" element={<Onboarding />} /> */}
      
      {/* Legacy route support for backward compatibility */}
      <Route path="/admin/*" element={<Navigate to="/" replace />} />
      <Route path="/client/*" element={<Navigate to="/" replace />} />
      
      {/* 404 Page */}
      <Route path="*" element={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
            <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default App 