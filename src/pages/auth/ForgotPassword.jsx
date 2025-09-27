import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthLayout, { authStyles } from '@/components/auth/AuthLayout';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle={`We've sent a password reset link to ${email}`}
      >
        <div className="space-y-4">
          <div className="bg-green-950/20 border border-green-900/50 rounded-md p-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-green-400">
              Password reset link sent successfully!
            </p>
          </div>
          
          <p className="text-[12px] text-white/50 text-center">
            Please check your email and click the reset link to create a new password.
            The link will expire in 24 hours.
          </p>
          
          <p className="text-[11px] text-white/40 text-center">
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </p>

          <button
            type="button"
            onClick={() => setSuccess(false)}
            className={authStyles.buttonSecondary}
          >
            Send Again
          </button>
          
          <Link to="/auth/login">
            <button type="button" className={`${authStyles.button} mt-2`}>
              Back to Login
            </button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className={authStyles.error}>
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className={authStyles.label}>
            Email address
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
            />
          </div>
        </div>

        <button
          type="submit"
          className={authStyles.button}
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </span>
          ) : (
            'Send Reset Link'
          )}
        </button>
        
        <Link to="/auth/login">
          <button type="button" className={`${authStyles.buttonSecondary} flex items-center justify-center gap-2`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </button>
        </Link>
      </form>
    </AuthLayout>
  );
}