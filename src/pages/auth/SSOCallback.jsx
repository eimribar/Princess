import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useUser } from '@/contexts/ClerkUserContext';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

export default function SSOCallback() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { user, loading } = useUser();

  useEffect(() => {
    // After Clerk handles the callback, check where to redirect
    if (isLoaded && !loading && isSignedIn && user) {
      // Check if user needs onboarding
      if (user.needs_onboarding === true || user.onboarding_completed === false) {
        console.log('User needs onboarding, redirecting...');
        navigate('/onboarding', { replace: true });
      } else {
        console.log('User onboarding complete, redirecting to dashboard...');
        // For client users, we could check for their specific project here
        // But ProjectRedirect component will handle that
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isLoaded, loading, isSignedIn, user, navigate]);

  return (
    <>
      {/* Let Clerk handle the OAuth callback automatically */}
      <AuthenticateWithRedirectCallback 
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/onboarding"
      />
      
      {/* Show loading while processing */}
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Completing sign in...</h2>
          <p className="text-gray-400">Please wait while we redirect you</p>
        </div>
      </div>
    </>
  );
}