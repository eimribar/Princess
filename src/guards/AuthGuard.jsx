import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { Loader2, Shield, Lock, Users, Briefcase } from 'lucide-react';

/**
 * Premium AuthGuard Component
 * 
 * Provides sophisticated route protection with smooth transitions,
 * intelligent redirects, and beautiful loading states.
 * 
 * Features:
 * - Role-based access control
 * - Smooth transition animations
 * - Intelligent redirect logic
 * - Session persistence
 * - Loading skeleton screens
 */

const AuthGuard = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  redirectTo = null,
  fallbackPath = '/login',
  showLoadingState = true
}) => {
  const { user, isLoading } = useUser();
  const location = useLocation();
  const [isAuthorizing, setIsAuthorizing] = useState(true);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    // Simulate authorization check with smooth transition
    const checkAuthorization = async () => {
      setAuthMessage('Verifying permissions...');
      
      // Add a small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!isLoading) {
        if (requireAuth && !user) {
          setAuthMessage('Redirecting to login...');
          await new Promise(resolve => setTimeout(resolve, 200));
        } else if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
          setAuthMessage('Checking access rights...');
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        setIsAuthorizing(false);
      }
    };

    checkAuthorization();
  }, [user, isLoading, requireAuth, allowedRoles]);

  // Determine the appropriate redirect path based on user role
  const getRedirectPath = () => {
    if (redirectTo) return redirectTo;
    
    if (!user) return fallbackPath;
    
    // Intelligent role-based redirects
    switch (user.role) {
      case 'client':
        return '/client/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'agency':
        return '/agency/dashboard';
      default:
        return '/';
    }
  };

  // Show loading state with premium skeleton screen
  if (isLoading || isAuthorizing) {
    if (!showLoadingState) return null;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="text-center"
        >
          <div className="relative">
            {/* Animated shield icon */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <Shield className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
            </motion.div>
            
            {/* Pulsing dot */}
            <motion.div
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 space-y-2"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Securing Your Session
            </h3>
            <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {authMessage || 'Preparing your workspace...'}
            </p>
          </motion.div>

          {/* Loading progress bar */}
          <motion.div
            className="mt-6 w-48 h-1 bg-gray-200 rounded-full overflow-hidden mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (requireAuth && !user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // User doesn't have required role - show access denied or redirect
  if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const redirectPath = getRedirectPath();
    
    // If we have a redirect path, use it
    if (redirectPath !== location.pathname) {
      return <Navigate to={redirectPath} replace />;
    }
    
    // Otherwise show access denied screen
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6"
          >
            <Lock className="w-10 h-10 text-red-600" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this area. 
            {user.role === 'client' && " This section is for agency team members only."}
            {user.role === 'agency' && " This section requires administrator privileges."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.history.back()}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Go Back
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = getRedirectPath()}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              Go to {user.role === 'client' ? 'Client' : 'Admin'} Portal
            </motion.button>
          </div>

          {/* Role indicator */}
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
            {user.role === 'client' ? (
              <Users className="w-4 h-4 text-green-600" />
            ) : (
              <Briefcase className="w-4 h-4 text-blue-600" />
            )}
            <span className="text-sm text-gray-600">
              Logged in as <span className="font-semibold">{user.role === 'client' ? 'Client' : 'Agency'} User</span>
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  // User is authorized - render children with smooth transition
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthGuard;