import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { useUser } from '../../contexts/SupabaseUserContext';
import { supabase } from '../../lib/supabase';

export default function InvitationSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signIn, isSupabaseMode } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token');

  // Validate invitation token on mount
  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        setError('No invitation token provided');
        setIsValidating(false);
        return;
      }

      if (!isSupabaseMode) {
        // Mock invitation for demo mode
        setInvitation({
          email: 'invited@example.com',
          role: 'client',
          organization_name: 'Demo Organization'
        });
        setFormData(prev => ({ ...prev, email: 'invited@example.com' }));
        setIsValidating(false);
        return;
      }

      try {
        // Fetch invitation details
        const { data, error } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', token)
          .single();

        if (error || !data) {
          console.error('Invitation validation error:', error);
          setError('Invalid or expired invitation');
        } else if (new Date(data.expires_at) < new Date()) {
          setError('This invitation has expired');
        } else {
          setInvitation(data);
          setFormData(prev => ({ ...prev, email: data.email }));
        }
      } catch (err) {
        setError('Failed to validate invitation');
      } finally {
        setIsValidating(false);
      }
    };

    validateInvitation();
  }, [token, isSupabaseMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Using direct user creation for:', invitation.email);
      
      // Prepare metadata
      const metadata = {
        full_name: invitation.metadata?.firstName && invitation.metadata?.lastName 
          ? `${invitation.metadata.firstName} ${invitation.metadata.lastName}`
          : invitation.email.split('@')[0],
        role: invitation.role,
        organization_id: invitation.organization_id,
        project_id: invitation.project_id,
        needs_onboarding: true
      };
      
      // STEP 1: Use our direct creation function to bypass Supabase signUp bug
      console.log('Creating user directly in database...');
      const { data: createResult, error: createError } = await supabase.rpc('create_user_directly', {
        p_email: invitation.email,
        p_password: formData.password,
        p_token: token,
        p_metadata: metadata
      });
      
      console.log('Direct creation result:', createResult);
      
      if (createError) {
        console.error('Direct creation error:', createError);
        setError('Failed to create account. Please try again.');
        return;
      }
      
      if (!createResult?.success) {
        setError(createResult?.error || 'Failed to create account');
        return;
      }
      
      // Handle case where user already exists
      if (createResult.user_exists) {
        console.log('User already exists, attempting sign in...');
        const signInResult = await signIn(invitation.email, formData.password);
        
        if (signInResult.success) {
          console.log('Sign in successful for existing user');
          setSuccess(true);
          setTimeout(() => {
            navigate('/onboarding');
          }, 1000);
        } else {
          setError('This email is already registered with a different password. Please sign in with your existing password.');
          setTimeout(() => {
            navigate('/auth/login', {
              state: { email: invitation.email }
            });
          }, 3000);
        }
        return;
      }
      
      // STEP 2: Now sign in with the newly created user
      console.log('User created successfully, signing in...');
      const signInResult = await signIn(invitation.email, formData.password);
      
      if (signInResult.success) {
        console.log('Sign in successful! Redirecting to onboarding...');
        setSuccess(true);
        setTimeout(() => {
          navigate('/onboarding');
        }, 1000);
      } else {
        // This shouldn't happen with direct creation, but handle it
        console.warn('Sign in failed after direct creation');
        setSuccess(true);
        setError('Account created! Please sign in manually.');
        setTimeout(() => {
          navigate('/auth/login', {
            state: { 
              email: invitation.email,
              message: 'Account created successfully! Please sign in.'
            }
          });
        }, 2000);
      }
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="shadow-xl max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'This invitation is invalid or has expired'}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/auth/login">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Complete Your Account</CardTitle>
            <CardDescription className="text-center">
              Set a password for your Princess account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={invitation.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  You're joining as a <strong>{invitation.role}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant={error.includes('created') ? 'default' : 'destructive'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {error || 'Account created successfully! Redirecting...'}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || success}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Creating Account...' : 'Create Account & Continue'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-blue-600 hover:underline">
                Sign in instead
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}