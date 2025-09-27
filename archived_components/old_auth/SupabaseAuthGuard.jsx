import React, { useEffect } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useUser } from '../contexts/SupabaseUserContext';

export default function AuthGuard({ children, requireAuth = true, allowedRoles = [] }) {
  const { user, isLoading, isAuthenticated } = useUser();
  const location = useLocation();

  // Show loading state while checking authentication (with timeout)
  if (isLoading) {
    // Add a timeout to prevent infinite loading
    setTimeout(() => {
      if (isLoading) {
        console.warn('Auth loading timeout - check Supabase connection (15s elapsed)');
      }
    }, 15000);
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If authentication is not required but user is authenticated (for login/signup pages)
  // Exception: Allow authenticated users to access password reset pages
  const passwordResetPaths = ['/auth/reset-password', '/auth/callback'];
  const isPasswordResetPage = passwordResetPaths.some(path => location.pathname.startsWith(path));
  
  if (!requireAuth && isAuthenticated && !isPasswordResetPage) {
    // Check if we're on a password recovery flow
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      // Allow access to password reset even if authenticated
      console.log('[AuthGuard] Password recovery flow, allowing access to auth page');
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  // Check if user needs onboarding (skip if already on onboarding page or auth pages)
  const authPaths = ['/auth/reset-password', '/auth/callback', '/auth/forgot-password'];
  const isAuthPage = authPaths.some(path => location.pathname.startsWith(path));
  
  if (requireAuth && isAuthenticated && user && location.pathname !== '/onboarding' && !isAuthPage) {
    // Check if user hasn't completed onboarding
    // Check both fields to handle different states
    const needsOnboarding = user.needs_onboarding === true || 
                           (user.onboarding_completed === false && user.needs_onboarding !== false);
    
    if (needsOnboarding) {
      // Check if we're coming from a password reset link
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (type === 'recovery') {
        console.log('[AuthGuard] Password recovery detected, skipping onboarding redirect');
        // Don't redirect to onboarding during password recovery
      } else {
        console.log('[AuthGuard] User needs onboarding, redirecting from', location.pathname);
        console.log('[AuthGuard] User onboarding status:', {
          needs_onboarding: user.needs_onboarding,
          onboarding_completed: user.onboarding_completed
        });
        return <Navigate to="/onboarding" replace />;
      }
    }
  }

  // Check role-based access
  if (allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      console.log('[AuthGuard] Access denied. User role:', user.role, 'Required roles:', allowedRoles);
      console.log('[AuthGuard] Redirecting to dashboard');
      // Redirect to appropriate page based on role
      if (user.role === 'client') {
        return <Navigate to="/dashboard" replace />;
      } else if (user.role === 'viewer') {
        return <Navigate to="/brandbook" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
}