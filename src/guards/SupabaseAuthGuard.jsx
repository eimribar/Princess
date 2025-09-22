import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
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