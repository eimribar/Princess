import React from 'react';
import { SignUp, SignIn } from '@clerk/clerk-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function InvitationSignUp() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  
  const ticket = searchParams.get('__clerk_ticket');
  const status = searchParams.get('__clerk_status');
  
  // If no ticket, show error
  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
            <CardDescription>
              This invitation link is invalid or has expired. Please request a new invitation from your administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Handle sign_in status (existing user accepting invitation)
  if (status === 'sign_in' || status === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <SignIn 
          routing="path"
          path="/invitation/accept"
          fallbackRedirectUrl="/dashboard"
          initialValues={{
            ticket: ticket
          }}
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-xl',
              headerTitle: 'text-2xl font-bold',
              headerSubtitle: 'text-gray-600',
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
              footerAction: 'text-blue-600 hover:text-blue-700',
              identityPreviewEditButton: 'text-blue-600 hover:text-blue-700',
              formFieldInput: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
              formFieldLabel: 'text-gray-700',
              dividerText: 'text-gray-500',
              alertText: 'text-sm',
              alert: 'mb-4'
            },
            layout: {
              socialButtonsPlacement: 'bottom',
              socialButtonsVariant: 'iconButton'
            }
          }}
        />
      </div>
    );
  }
  
  // Default: show sign_up for new users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <SignUp 
        routing="path"
        path="/invitation/accept"
        fallbackRedirectUrl="/onboarding"  // This ensures new users go to onboarding
        signInUrl="/auth/login"
        initialValues={{
          ticket: ticket  // Pass the invitation ticket to Clerk
        }}
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-xl',
            headerTitle: 'text-2xl font-bold',
            headerSubtitle: 'text-gray-600',
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
            footerAction: 'text-blue-600 hover:text-blue-700',
            identityPreviewEditButton: 'text-blue-600 hover:text-blue-700',
            formFieldInput: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            formFieldLabel: 'text-gray-700',
            dividerText: 'text-gray-500',
            alertText: 'text-sm',
            alert: 'mb-4'
          },
          layout: {
            socialButtonsPlacement: 'bottom',
            socialButtonsVariant: 'iconButton'
          }
        }}
      />
    </div>
  );
}