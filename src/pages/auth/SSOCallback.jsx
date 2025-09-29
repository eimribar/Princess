import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

export default function SSOCallback() {
  const navigate = useNavigate();
  const { handleRedirectCallback } = useClerk();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle the redirect callback from Clerk
        const result = await handleRedirectCallback({
          afterSignInUrl: '/dashboard',
          afterSignUpUrl: '/onboarding',
        });

        // Check the result and navigate accordingly
        if (result?.createdSessionId) {
          console.log('Session created successfully');
          // The session is established, navigate based on the result
          if (result.signUp) {
            navigate('/onboarding', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else {
          // If no session was created, redirect to login
          console.log('No session created, redirecting to login');
          navigate('/auth/login', { replace: true });
        }
      } catch (error) {
        console.error('Error handling SSO callback:', error);
        
        // If it's a known Clerk error about missing __clerk_db_jwt, it means we're not in a callback flow
        if (error?.errors?.[0]?.code === 'cookie_invalid') {
          // Check if user is already signed in via regular flow
          const isSignedIn = window.Clerk?.user;
          if (isSignedIn) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/auth/login', { replace: true });
          }
        } else {
          // For other errors, redirect to login
          navigate('/auth/login', { replace: true });
        }
      }
    };

    handleCallback();
  }, [handleRedirectCallback, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Completing sign in...</h2>
        <p className="text-gray-400">Please wait while we redirect you</p>
      </div>
    </div>
  );
}