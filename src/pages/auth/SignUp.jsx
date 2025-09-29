import React, { useState } from 'react';
import { useSignUp, useAuth } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import AuthLayout, { authStyles } from '@/components/auth/AuthLayout';

// Google icon from Nexus design
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.8-.07-1.6-.2-2.38H12.24v4.53h5.93a5.1 5.1 0 0 1-2.26 3.46v2.45h3.6c2.0-1.82 3.09-4.68 3.09-8.06z" fill="#4285F4"/>
    <path d="M12.24 23c2.87 0 5.31-.91 7.27-2.69l-3.6-2.45c-.98.66-2.23 1.1-3.67 1.1-2.81 0-5.21-1.86-6.11-4.26H2.42V17.2C4.38 20.73 8.01 23 12.24 23z" fill="#34A853"/>
    <path d="M6.13 14.7a7.58 7.58 0 0 1 0-4.5V7.7H2.42a11.97 11.97 0 0 0 0 7.5l3.71-2.5z" fill="#FBBC05"/>
    <path d="M12.24 5.94c1.54 0 2.91.54 3.99 1.55l3.36-3.29C17.55 2.34 15.11 1 12.24 1 8.01 1 4.38 3.27 2.42 7.7l3.71 2.5c.9-2.4 3.3-4.26 6.11-4.26z" fill="#EA4335"/>
  </svg>
);

export default function SignUpPage() {
  const { signUp, setActive, isLoaded: signUpLoaded } = useSignUp() || {};
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle sign up
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signUp) return;
    
    setError('');
    setIsLoading(true);

    try {
      // Create the sign-up
      const result = await signUp.create({
        firstName: firstName,
        lastName: lastName,
        emailAddress: email,
        password: password,
      });

      if (result.status === 'complete') {
        // Sign-up successful, set the session as active
        await setActive({ session: result.createdSessionId });
        
        // Navigate to onboarding
        navigate('/onboarding');
      } else if (result.status === 'missing_requirements') {
        // Email verification might be needed
        setError('Please verify your email to continue');
      } else {
        console.log('Sign-up status:', result.status);
        setError('Additional steps required. Please check your email.');
      }
    } catch (err) {
      console.error('Sign-up error:', err);
      
      // Handle specific error types
      if (err.errors) {
        const errorMessage = err.errors[0]?.message || 'Failed to create account';
        setError(errorMessage);
      } else {
        setError('An error occurred during sign up. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleSignUp = async () => {
    if (!signUp) return;
    
    setIsLoading(true);
    try {
      // Let Clerk handle the redirect URLs automatically
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/onboarding'
      });
    } catch (err) {
      console.error('Google sign-up error:', err);
      setError('Failed to sign up with Google. Please try again.');
      setIsLoading(false);
    }
  };

  // Show loading while Clerk is initializing
  if (!authLoaded || !signUpLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If already signed in, the AuthGuard will handle redirect
  // Don't do manual redirect here to avoid loops

  return (
    <AuthLayout 
      title="Create an account"
      subtitle={
        <>
          Already have an account?{" "}
          <Link to="/auth/login" className={authStyles.link}>
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className={authStyles.error}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="firstName" className={authStyles.label}>
              First name
            </label>
            <div className="relative">
              <User className={authStyles.iconInInput} />
              <input
                id="firstName"
                type="text"
                placeholder="John"
                className={authStyles.inputWithIcon}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="given-name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="lastName" className={authStyles.label}>
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Doe"
              className={authStyles.input}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className={authStyles.label}>
            Email address
          </label>
          <div className="relative">
            <Mail className={authStyles.iconInInput} />
            <input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              className={authStyles.inputWithIcon}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className={authStyles.label}>
            Password
          </label>
          <div className="relative">
            <Lock className={authStyles.iconInInput} />
            <input
              id="password"
              type="password"
              placeholder="Create a strong password"
              className={authStyles.inputWithIcon}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <p className="text-[11px] text-white/40">
            Must be at least 8 characters
          </p>
        </div>

        <button
          type="submit"
          className={authStyles.button}
          disabled={isLoading || !email || !password || !firstName || !lastName}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </span>
          ) : (
            'Sign up'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className={authStyles.divider}>
        <div className={authStyles.dividerLine} />
        <span className={authStyles.dividerText}>OR</span>
        <div className={authStyles.dividerLine} />
      </div>

      {/* Social login - Google only */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        className={`${authStyles.buttonSecondary} flex items-center justify-center gap-2`}
        disabled={isLoading}
      >
        <GoogleIcon />
        <span>Continue with Google</span>
      </button>

      {/* Terms text */}
      <p className="text-[11px] text-white/40 text-center mt-6">
        By signing up, you agree to our{" "}
        <Link to="/terms" className={authStyles.link}>
          Terms of Service
        </Link>
        {" "}and{" "}
        <Link to="/privacy" className={authStyles.link}>
          Privacy Policy
        </Link>
      </p>
    </AuthLayout>
  );
}