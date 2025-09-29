import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useSignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Loader2, Mail, ArrowLeft, CheckCircle, Lock, KeyRound } from 'lucide-react';
import AuthLayout, { authStyles } from '@/components/auth/AuthLayout';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Step 1: Send the password reset code to the user's email
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!signIn) return;
    
    setError('');
    setIsLoading(true);

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      
      setSuccessfulCreation(true);
      setError('');
    } catch (err) {
      console.error('Error sending reset code:', err);
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Failed to send reset code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Reset the user's password with the code
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!signIn) return;
    
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password: password,
      });

      if (result.status === 'complete') {
        // Password reset successful, set the active session
        await setActive({ session: result.createdSessionId });
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else if (result.status === 'needs_second_factor') {
        setError('Two-factor authentication is required. Please complete 2FA setup.');
      } else {
        console.log('Unexpected status:', result);
        setError('An unexpected error occurred. Please try again.');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid code or password';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show success message and reset form
  if (successfulCreation) {
    return (
      <AuthLayout
        title="Reset Your Password"
        subtitle={
          <>
            We've sent a reset code to {email}.{" "}
            <button 
              onClick={() => {
                setSuccessfulCreation(false);
                setCode('');
                setPassword('');
                setError('');
              }}
              className={authStyles.link}
            >
              Use different email
            </button>
          </>
        }
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          {error && (
            <div className={authStyles.error}>
              {error}
            </div>
          )}

          <div className="bg-green-950/20 border border-green-900/50 rounded-md p-4">
            <CheckCircle className="h-5 w-5 text-green-500 mb-2" />
            <p className="text-sm text-green-400">
              Check your email for the reset code
            </p>
            <p className="text-xs text-green-400/70 mt-1">
              It may take a few minutes to arrive
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="code" className={authStyles.label}>
              Reset Code
            </label>
            <div className="relative">
              <KeyRound className={authStyles.iconInInput} />
              <input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                className={authStyles.inputWithIcon}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter the code we sent to your email
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className={authStyles.label}>
              New Password
            </label>
            <div className="relative">
              <Lock className={authStyles.iconInInput} />
              <input
                id="password"
                type="password"
                placeholder="Enter your new password"
                className={authStyles.inputWithIcon}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <p className="text-xs text-gray-500">
              Must be at least 8 characters
            </p>
          </div>

          <button
            type="submit"
            className={authStyles.button}
            disabled={isLoading || !code || !password}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>

          <div className="text-center">
            <Link to="/auth/login" className={authStyles.link}>
              <ArrowLeft className="inline h-3 w-3 mr-1" />
              Back to login
            </Link>
          </div>
        </form>
      </AuthLayout>
    );
  }

  // Initial form to request reset code
  return (
    <AuthLayout
      title="Forgot Your Password?"
      subtitle={
        <>
          Remember your password?{" "}
          <Link to="/auth/login" className={authStyles.link}>
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSendCode} className="space-y-4">
        {error && (
          <div className={authStyles.error}>
            {error}
          </div>
        )}

        <p className="text-sm text-gray-400">
          Enter your email address and we'll send you a code to reset your password.
        </p>

        <div className="space-y-2">
          <label htmlFor="email" className={authStyles.label}>
            Email Address
          </label>
          <div className="relative">
            <Mail className={authStyles.iconInInput} />
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              className={authStyles.inputWithIcon}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </div>
        </div>

        <button
          type="submit"
          className={authStyles.button}
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending code...
            </>
          ) : (
            'Send Reset Code'
          )}
        </button>

        <div className="text-center">
          <Link to="/auth/login" className={authStyles.link}>
            <ArrowLeft className="inline h-3 w-3 mr-1" />
            Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}