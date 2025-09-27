import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LogIn } from 'lucide-react';
import { GradientButton } from '@/components/ui/gradient-button';
import { ShaderAnimation } from '@/components/ui/shader-animation';
import { useAuth } from '@clerk/clerk-react';
import Logo from '@/components/ui/Logo';

export default function Welcome() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/dashboard');
    } else {
      navigate('/auth/login');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Shader Animation Background */}
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
      </div>
      
      {/* Logo in top-left corner */}
      <div className="absolute top-6 left-6 z-20">
        <Logo linkTo="/" />
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl w-full">
          <h1 className='text-6xl font-bold text-white mb-6'>
            Welcome to Princess
          </h1>
          
          <p className='text-lg md:text-xl text-gray-300 mb-12'>
            Track your brand development in real-time. Review deliverables, provide feedback, and see exactly where your project stands.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <GradientButton onClick={handleGetStarted}>
              {isSignedIn ? (
                <>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Sign In
                  <LogIn className="ml-2 h-4 w-4" />
                </>
              )}
            </GradientButton>
            
            {!isSignedIn && (
              <GradientButton
                variant="variant"
                onClick={() => navigate('/auth/signup')}
              >
                Request Access
              </GradientButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}