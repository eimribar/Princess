import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
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
  const { signUp, isSupabaseMode } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

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
          .select('*, organizations(name)')
          .eq('token', token)
          .eq('status', 'pending')
          .single();

        if (error || !data) {
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
      // Create account with invitation metadata
      const result = await signUp(invitation.email, formData.password, {
        full_name: formData.fullName,
        role: invitation.role,
        organization_id: invitation.organization_id,
        invitation_token: token
      });
      
      if (result.success) {
        // Accept the invitation
        if (isSupabaseMode && result.user) {
          const { error: acceptError } = await supabase.rpc('accept_invitation', {
            p_token: token
          });

          if (acceptError) {
            console.error('Error accepting invitation:', acceptError);
          }
        }

        setSuccess(true);
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (err) {
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
            <CardTitle className="text-2xl font-bold text-center text-red-600">
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'This invitation link is invalid or has expired.'}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-600 text-center">
              Please contact your administrator for a new invitation.
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/auth/login" className="w-full">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
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
            <CardTitle className="text-2xl font-bold text-center">
              Accept Your Invitation
            </CardTitle>
            <CardDescription className="text-center">
              You've been invited to join {invitation.organizations?.name || 'Princess'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Account created successfully! Redirecting to login...
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Email:</strong> {invitation.email}
              </p>
              <p className="text-sm text-blue-900">
                <strong>Role:</strong> {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10 bg-gray-50"
                    value={invitation.email}
                    disabled
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Accept Invitation & Create Account'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <div className="text-sm text-gray-600 text-center w-full">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}