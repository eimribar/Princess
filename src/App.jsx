import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { useUser } from '@/contexts/ClerkUserContext'
import AuthGuard from '@/guards/ClerkAuthGuard'

// Main Layout (adapts based on user role)
import Layout from '@/pages/Layout'

// Components
import ProjectRedirect from '@/components/ProjectRedirect'

// Pages
import Dashboard from '@/pages/Dashboard'
import Stages from '@/pages/Stages'
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
import Login from '@/pages/auth/Login.jsx'
import SignUp from '@/pages/auth/SignUp.jsx'
import Welcome from '@/pages/auth/Welcome.jsx'
import ForgotPassword from '@/pages/auth/ForgotPassword.jsx'
import InvitationAccept from '@/pages/auth/InvitationAccept.jsx'
import SSOCallback from '@/pages/auth/SSOCallback.jsx'

// Onboarding
import Onboarding from '@/pages/Onboarding'

function App() {
  return (
    <Router>
      <AppRoutes />
      <Toaster />
    </Router>
  )
}

function AppRoutes() {
  const { user, isAuthenticated, loading } = useUser()
  
  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <Routes>
      {/* Root route - Welcome landing page */}
      <Route path="/" element={
        <AuthGuard requireAuth={false}>
          <Welcome />
        </AuthGuard>
      } />
      
      {/* Invitation acceptance route - using custom component for password setup */}
      <Route path="/invitation/accept" element={<InvitationAccept />} />
      
      {/* SSO Callback route for OAuth */}
      <Route path="/sso-callback" element={<SSOCallback />} />
      
      {/* Auth routes */}
      <Route path="/auth/login" element={
        <AuthGuard requireAuth={false}>
          <Login />
        </AuthGuard>
      } />
      <Route path="/auth/signup" element={
        <AuthGuard requireAuth={false}>
          <SignUp />
        </AuthGuard>
      } />
      <Route path="/auth/forgot-password" element={
        <AuthGuard requireAuth={false}>
          <ForgotPassword />
        </AuthGuard>
      } />
      
      {/* Onboarding route - requires auth but no specific role */}
      <Route path="/onboarding" element={
        <AuthGuard requireAuth={true}>
          <Onboarding />
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
              
              {/* Stages routes (visual timeline view) */}
              <Route path="stages" element={<ProjectRedirect />} />
              <Route path="stages/:projectId" element={<Stages />} />
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
              Go to Home
            </button>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default App 