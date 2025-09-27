import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthLayout, { authStyles } from '@/components/auth/AuthLayout';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Validate that we have a proper recovery session
    validateRecoverySession();
  }, []);

  const validateRecoverySession = async () => {
    try {
      console.log('[ResetPassword] Validating recovery session');
      console.log('[ResetPassword] Current URL:', window.location.href);
      console.log('[ResetPassword] Hash:', window.location.hash);
      
      // Check if we have a recovery session from the URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      const refreshToken = hashParams.get('refresh_token');
      
      console.log('[ResetPassword] Parsed params:', { type, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
      
      // First check if we already have a session (from email link click)
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        console.log('[ResetPassword] Found existing session, likely from password recovery');
        setIsValidating(false);
        return;
      }
      
      if (type !== 'recovery' || !accessToken) {
        // Also check query params for backward compatibility
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        console.log('[ResetPassword] No recovery token found in URL');
        
        if (error) {
          setError(errorDescription || 'Invalid password reset link');
        } else {
          setError('Invalid or expired password reset link. Please request a new one.');
        }
        setIsValidating(false);
        return;
      }

      // Set the session with the recovery token
      console.log('[ResetPassword] Setting session with recovery token');
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (sessionError) {
        console.error('[ResetPassword] Session error:', sessionError);
        setError('Invalid or expired password reset link. Please request a new one.');
      } else if (!data.session) {
        console.log('[ResetPassword] No session returned');
        setError('Unable to validate reset link. Please request a new one.');
      } else {
        console.log('[ResetPassword] Session set successfully');
      }
      
      setIsValidating(false);
    } catch (err) {
      console.error('[ResetPassword] Error validating recovery session:', err);
      setError('An error occurred validating your reset link.');
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      // Update the user's password
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        if (updateError.message.includes('same as the old')) {
          setError('New password must be different from your current password');
        } else {
          setError(updateError.message);
        }
        return;
      }

      // Password successfully updated
      setSuccess(true);

      // Sign out to ensure clean state and prevent onboarding redirect
      console.log('[ResetPassword] Signing out after password reset');
      await supabase.auth.signOut();
      
      // Clear the URL hash to prevent re-triggering recovery mode
      window.location.hash = '';
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/auth/login', { 
          state: { 
            message: 'Password reset successful. Please sign in with your new password.' 
          } 
        });
      }, 2000);
      
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <AuthLayout>
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#2B8CFF]" />
          <p className="text-white/60">Validating reset link...</p>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title="Password Reset Successful"
        subtitle="Your password has been successfully updated"
      >
        <div className="space-y-4">
          <div className="bg-green-950/20 border border-green-900/50 rounded-md p-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-green-400">
              Password updated successfully!
            </p>
          </div>
          
          <p className="text-[12px] text-white/50 text-center">
            Redirecting you to the login page...
          </p>
          
          <Link to="/auth/login">
            <button type="button" className={authStyles.button}>
              Go to Login
            </button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // If there's an error with the link itself, show error state
  if (error && !password && !confirmPassword) {
    return (
      <AuthLayout
        title="Reset Link Invalid"
        subtitle={error}
      >
        <div className="space-y-4">
          <div className="bg-red-950/20 border border-red-900/50 rounded-md p-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-red-400">
              This reset link is invalid or has expired
            </p>
          </div>
          
          <Link to="/auth/forgot-password">
            <button type="button" className={authStyles.button}>
              Request New Reset Link
            </button>
          </Link>
          
          <Link to="/auth/login">
            <button type="button" className={authStyles.buttonSecondary}>
              Back to Login
            </button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter your new password below"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && password && (
          <div className={authStyles.error}>
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="password" className={authStyles.label}>
            New Password
          </label>
          <div className="relative">
            <Lock className={authStyles.iconInInput} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              className={authStyles.inputWithIcon}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[11px] text-white/40">Minimum 6 characters</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className={authStyles.label}>
            Confirm Password
          </label>
          <div className="relative">
            <Lock className={authStyles.iconInInput} />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              className={authStyles.inputWithIcon}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className={authStyles.button}
          disabled={isLoading || !password || !confirmPassword}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting Password...
            </span>
          ) : (
            'Reset Password'
          )}
        </button>
        
        <Link to="/auth/login">
          <button type="button" className={authStyles.buttonSecondary}>
            Back to Login
          </button>
        </Link>
      </form>
    </AuthLayout>
  );
}