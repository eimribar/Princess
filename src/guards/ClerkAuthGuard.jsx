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
  const { isSignedIn, isLoaded } = useAuth();
  const { user, loading } = useUser();
  const location = useLocation();

  // Show loading spinner while Clerk is loading
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // If auth is required but user is not signed in, redirect to login
  if (requireAuth && !isSignedIn) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
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