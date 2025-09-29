import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useSignIn, useSignUp } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

export default function SSOCallback() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { signIn, setActive: setActiveSignIn } = useSignIn() || {};
  const { signUp, setActive: setActiveSignUp } = useSignUp() || {};

  useEffect(() => {
    const handleCallback = async () => {
      // Wait for Clerk to be loaded
      if (!isLoaded) return;

      // If already signed in, redirect to dashboard
      if (isSignedIn) {
        console.log('User is signed in, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
        return;
      }

      try {
        // Check if we have a sign-in or sign-up in progress
        if (signIn?.status === 'complete') {
          console.log('Sign-in complete, setting active session');
          await setActiveSignIn({ session: signIn.createdSessionId });
          navigate('/dashboard', { replace: true });
        } else if (signUp?.status === 'complete') {
          console.log('Sign-up complete, setting active session');
          await setActiveSignUp({ session: signUp.createdSessionId });
          navigate('/onboarding', { replace: true });
        } else {
          // If no active auth flow, check if we need to redirect back to login
          console.log('No active auth flow detected');
          
          // Give Clerk a moment to establish session
          setTimeout(() => {
            if (!isSignedIn) {
              console.log('No session established, redirecting to login');
              navigate('/auth/login', { replace: true });
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error handling SSO callback:', error);
        navigate('/auth/login', { replace: true });
      }
    };

    handleCallback();
  }, [isLoaded, isSignedIn, signIn, signUp, navigate, setActiveSignIn, setActiveSignUp]);

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