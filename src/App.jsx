import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { useUser } from '@/contexts/SupabaseUserContext'
import AuthGuard from '@/guards/SupabaseAuthGuard'

// Main Layout (adapts based on user role)
import Layout from '@/pages/Layout'

// Components
import ProjectRedirect from '@/components/ProjectRedirect'

// Pages
import Dashboard from '@/pages/Dashboard'
import Deliverables from '@/pages/Deliverables'
import DeliverableDetailV2 from '@/pages/DeliverableDetailV2'
import Team from '@/pages/Team'
import Timeline from '@/pages/Timeline'
import Brandbook from '@/pages/Brandbook'
import Admin from '@/pages/Admin'
import ProjectInitiation from '@/pages/ProjectInitiation'
import OutofScope from '@/pages/OutofScope'
import TestPage from '@/pages/TestPage'

// Auth pages
import Login from '@/pages/auth/Login'
import InvitationSignup from '@/pages/auth/InvitationSignup'

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
  const { user, isAuthenticated } = useUser()
  
  // Default route based on authentication
  const defaultRoute = isAuthenticated ? '/dashboard' : '/auth/login'

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      
      {/* Auth routes */}
      <Route path="/auth/login" element={
        <AuthGuard requireAuth={false}>
          <Login />
        </AuthGuard>
      } />
      <Route path="/invitation" element={
        <AuthGuard requireAuth={false}>
          <InvitationSignup />
        </AuthGuard>
      } />
      
      {/* Authenticated routes - same for all roles, different content */}
      <Route path="/*" element={
        <AuthGuard requireAuth={true}>
          <Layout>
            <Routes>
              {/* Dashboard without projectId redirects to first project or creation */}
              <Route path="dashboard" element={<ProjectRedirect />} />
              <Route path="dashboard/:projectId" element={<Dashboard />} />
              <Route path="deliverables" element={<Deliverables />} />
              <Route path="deliverables/:id" element={<DeliverableDetailV2 />} />
              <Route path="team" element={<Team />} />
              <Route path="timeline" element={<Timeline />} />
              <Route path="brandbook" element={<Brandbook />} />
              
              {/* Admin routes - accessible by admin and agency */}
              <Route path="admin" element={
                <AuthGuard allowedRoles={['admin', 'agency']}>
                  <Admin />
                </AuthGuard>
              } />
              <Route path="project-initiation" element={
                <AuthGuard allowedRoles={['admin', 'agency']}>
                  <ProjectInitiation />
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
      
      
      {/* Test Page - for QA testing */}
      <Route path="/test" element={
        <AuthGuard requireAuth={false}>
          <TestPage />
        </AuthGuard>
      } />
      
      {/* Public routes (no auth required) */}
      <Route path="/public/brandbook/:projectId" element={<Brandbook isPublic={true} />} />
      
      {/* Invitation & Onboarding routes (to be implemented) */}
      {/* <Route path="/invitation/:token" element={<InvitationAccept />} /> */}
      {/* <Route path="/onboarding" element={<Onboarding />} /> */}
      
      {/* Legacy route support for backward compatibility */}
      {/* Removed /admin/* redirect that was blocking admin access */}
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