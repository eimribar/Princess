import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useUser } from '@/contexts/ClerkUserContext';
import { Loader2 } from 'lucide-react';

const ClerkAuthGuard = ({ 
  children, 
  requireAuth = true, 
  allowedRoles = [], 
  redirectTo = '/auth/login' 
}) => {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { user, loading } = useUser();
  const location = useLocation();

  // Show loading spinner while Clerk is loading or verifying session
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Double-check authentication status with userId
  const isAuthenticated = isSignedIn && userId;

  // If auth is required but user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    // Don't redirect if we're already on an auth page or callback
    if (location.pathname.startsWith('/auth/') || location.pathname === '/sso-callback') {
      return children;
    }
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  // If auth is not required and user is authenticated
  if (!requireAuth && isAuthenticated) {
    // Don't redirect if we're on the invitation accept page or SSO callback
    if (location.pathname === '/invitation/accept' || location.pathname === '/sso-callback') {
      return children;
    }
    
    // Check if user needs onboarding
    if (user && (user.needs_onboarding === true || user.onboarding_completed === false)) {
      return <Navigate to="/onboarding" replace />;
    }
    
    // Otherwise redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && user) {
    const hasAllowedRole = allowedRoles.includes(user.role);
    if (!hasAllowedRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ClerkAuthGuard;