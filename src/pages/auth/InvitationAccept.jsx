import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSignUp, useSignIn, useClerk } from '@clerk/clerk-react';
import { Loader2, CheckCircle, AlertCircle, User, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import AuthLayout, { authStyles } from '@/components/auth/AuthLayout';

export default function InvitationAccept() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const clerk = useClerk();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [invitationStatus, setInvitationStatus] = useState(null); // 'sign_up', 'sign_in', or 'error'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const ticket = searchParams.get('__clerk_ticket');
  const status = searchParams.get('__clerk_status');

  useEffect(() => {
    checkInvitationStatus();
  }, [ticket]);

  const checkInvitationStatus = async () => {
    if (!ticket) {
      setError('Invalid invitation link. Please use the link from your invitation email.');
      setLoading(false);
      return;
    }

    try {
      // Check the status parameter if provided by Clerk
      if (status) {
        setInvitationStatus(status);
        setLoading(false);
        return;
      }

      // Try to determine if user needs to sign up or sign in
      // First, attempt sign-in with ticket to see if user exists
      try {
        const signInAttempt = await signIn.create({
          strategy: 'ticket',
          ticket: ticket
        });

        if (signInAttempt.status === 'complete') {
          // User exists and was signed in successfully
          await setActiveSignIn({ session: signInAttempt.createdSessionId });
          navigate('/dashboard');
          return;
        }
      } catch (signInError) {
        // User doesn't exist, needs to sign up
        console.log('User needs to sign up');
        setInvitationStatus('sign_up');
      }
    } catch (error) {
      console.error('Error checking invitation:', error);
      setError('Failed to process invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate form
    if (!formData.firstName || !formData.lastName) {
      setError('Please enter your first and last name');
      setIsSubmitting(false);
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      // Create sign-up with ticket strategy
      const signUpAttempt = await signUp.create({
        strategy: 'ticket',
        ticket: ticket,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password
      });

      if (signUpAttempt.status === 'complete') {
        // Sign-up successful, set active session
        await setActiveSignUp({ session: signUpAttempt.createdSessionId });
        
        toast({
          title: "Welcome to Princess!",
          description: "Your account has been created successfully.",
        });

        // Navigate to onboarding
        navigate('/onboarding');
      } else {
        setError('Unable to complete sign-up. Please try again.');
      }
    } catch (error) {
      console.error('Sign-up error:', error);
      setError(error.errors?.[0]?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const signInAttempt = await signIn.create({
        strategy: 'ticket',
        ticket: ticket
      });

      if (signInAttempt.status === 'complete') {
        await setActiveSignIn({ session: signInAttempt.createdSessionId });
        
        toast({
          title: "Welcome back!",
          description: "You've been added to the project.",
        });

        navigate('/dashboard');
      } else {
        setError('Unable to complete sign-in. Please try again.');
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setError(error.errors?.[0]?.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#2B8CFF] mx-auto mb-4" />
          <p className="text-white/60">Processing your invitation...</p>
        </div>
      </AuthLayout>
    );
  }

  if (error && !invitationStatus) {
    return (
      <AuthLayout
        title="Invalid Invitation"
        subtitle={error}
      >
        <div className="space-y-4">
          <div className="bg-red-950/20 border border-red-900/50 rounded-md p-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-red-400">
              This invitation link is invalid or has expired
            </p>
          </div>
          
          <button
            onClick={() => navigate('/auth/login')}
            className={authStyles.button}
          >
            Go to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (invitationStatus === 'sign_up') {
    return (
      <AuthLayout
        title="Accept Your Invitation"
        subtitle="Create your account to join the Princess team"
      >
        <form onSubmit={handleSignUp} className="space-y-4">
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
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  className={authStyles.inputWithIcon}
                  disabled={isSubmitting}
                  required
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
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                className={authStyles.input}
                disabled={isSubmitting}
                required
                autoComplete="family-name"
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a strong password"
                className={authStyles.inputWithIcon}
                disabled={isSubmitting}
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <p className="text-[11px] text-white/40">Must be at least 8 characters</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className={authStyles.label}>
              Confirm Password
            </label>
            <div className="relative">
              <Lock className={authStyles.iconInInput} />
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                className={authStyles.inputWithIcon}
                disabled={isSubmitting}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className={authStyles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <User className="mr-2 h-4 w-4" />
                Create Account & Join
              </span>
            )}
          </button>
        </form>
      </AuthLayout>
    );
  }

  if (invitationStatus === 'sign_in' || invitationStatus === 'complete') {
    return (
      <AuthLayout
        title="Welcome Back!"
        subtitle="Click below to accept your invitation and join the project"
      >
        <div className="space-y-4">
          {error && (
            <div className={authStyles.error}>
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            className={authStyles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting Invitation...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Accept Invitation & Continue
              </span>
            )}
          </button>
        </div>
      </AuthLayout>
    );
  }

  // Default fallback
  return (
    <AuthLayout>
      <div className="text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-white/50 mx-auto" />
        <p className="text-white/60">Unable to process invitation</p>
        <button
          onClick={() => navigate('/auth/login')}
          className={authStyles.button}
        >
          Go to Login
        </button>
      </div>
    </AuthLayout>
  );
}