import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Camera,
  Briefcase,
  Phone,
  FileText,
  ArrowRight,
  Check,
  Upload,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/ClerkUserContext';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import { UploadFile } from '@/api/integrations';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';

const STEPS = [
  { id: 'profile-picture', title: 'Profile Picture', icon: Camera },
  { id: 'professional-info', title: 'Professional Info', icon: Briefcase },
  { id: 'contact', title: 'Contact Info', icon: Phone },
  { id: 'bio', title: 'About You', icon: FileText }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateProfile } = useUser();
  const { user: clerkUser } = useClerkUser();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    profileImage: null,
    profileImageFile: null,
    title: '',
    department: '',
    phone: '',
    bio: ''
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await UploadFile.upload(file);
      setFormData({
        ...formData,
        profileImage: result.file_url,
        profileImageFile: file
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleNext = () => {
    // Validate current step
    if (currentStep === 0 && !formData.profileImage) {
      // Profile picture is optional, can skip
    } else if (currentStep === 1 && !formData.title) {
      toast({
        title: "Required field",
        description: "Please enter your job title",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const launchConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      // Prepare the complete profile data
      const profileData = {
        id: user?.id,
        email: user?.email,
        full_name: user?.full_name || user?.name || user?.email?.split('@')[0],
        role: user?.role || 'viewer',
        organization_id: user?.organization_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        profile_image: formData.profileImage,
        title: formData.title,
        department: formData.department,
        phone: formData.phone,
        bio: formData.bio,
        needs_onboarding: false,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_progress: {
          profile_picture: !!formData.profileImage,
          professional_info: !!formData.title,
          contact_info: !!formData.phone,
          bio: !!formData.bio,
          completed_steps: 4
        },
        notification_preferences: user?.notification_preferences || {
          email: true,
          sms: false,
          level: 'all'
        }
      };

      console.log('[Onboarding] Saving complete profile data');
      
      // Use upsert to handle both new profiles and updates
      const { data: updatedProfile, error: profileError } = await supabase
        .from('users')
        .upsert(profileData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('[Onboarding] Failed to save profile:', profileError);
        toast({
          title: "Error",
          description: profileError.message || "Failed to save profile. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Update local user state
      const result = await updateProfile(updatedProfile || profileData);
      
      if (result.success) {
        // Check if user came from invitation and create team member if needed
        if (clerkUser?.publicMetadata?.project_id) {
          console.log('[Onboarding] User has invitation metadata, checking team member...');
          
          // Check if team member already exists
          const { data: existingTeamMember } = await supabase
            .from('team_members')
            .select('*')
            .eq('user_id', updatedProfile?.id || profileData.id)
            .eq('project_id', clerkUser.publicMetadata.project_id)
            .single();
          
          if (!existingTeamMember) {
            console.log('[Onboarding] Creating team member from invitation metadata');
            const teamType = clerkUser.publicMetadata.team_type || 
                            (clerkUser.publicMetadata.role === 'agency' ? 'agency' : 'client');
            
            const teamMemberData = {
              project_id: clerkUser.publicMetadata.project_id,
              user_id: updatedProfile?.id || profileData.id,
              name: updatedProfile?.full_name || profileData.full_name,
              email: updatedProfile?.email || profileData.email,
              role: updatedProfile?.role || profileData.role,
              team_type: teamType,
              is_decision_maker: clerkUser.publicMetadata.is_decision_maker === true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { error: teamError } = await supabase
              .from('team_members')
              .insert([teamMemberData]);
            
            if (teamError) {
              console.error('[Onboarding] Error creating team member:', teamError);
            } else {
              console.log('[Onboarding] Team member created successfully');
            }
          }
        }
        
        // Launch confetti celebration
        launchConfetti();
        
        toast({
          title: "Welcome aboard! 🎉",
          description: "Your profile has been set up successfully",
        });
        
        // Redirect to dashboard after celebration
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        console.error('[Onboarding] Failed to save profile:', result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to save profile. Please try again.",
          variant: "destructive"
        });
        
        // If it's a schema error, provide helpful message
        if (result.error?.includes('schema')) {
          toast({
            title: "Database Update Required",
            description: "Please ask your administrator to run the latest database migrations.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('[Onboarding] Unexpected error:', error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Profile Picture
        return (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={formData.profileImage} />
                <AvatarFallback className="text-2xl">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mb-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              
              <p className="text-sm text-gray-500 text-center">
                Upload a professional photo (optional)
              </p>
            </div>
          </div>
        );

      case 1: // Professional Info
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Marketing Manager"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="department">Department (Optional)</Label>
              <Input
                id="department"
                placeholder="e.g. Marketing"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>
        );

      case 2: // Contact Info
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                For important project updates only
              </p>
            </div>
          </div>
        );

      case 3: // Bio
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bio">About You (Optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell us a bit about yourself, your experience, or what you're excited about..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="min-h-[120px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                This helps your team get to know you better
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Welcome to Princess! 
              </CardTitle>
              <CardDescription>
                Let's set up your profile
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Step {currentStep + 1} of {STEPS.length}</span>
                  <span>{STEPS[currentStep].title}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              {/* Step Indicators */}
              <div className="flex justify-between">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex flex-col items-center ${
                        isActive ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-indigo-100' : isCompleted ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Step Content */}
              <div className="min-h-[200px]">
                {renderStepContent()}
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0 || isLoading}
                >
                  Back
                </Button>
                
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : currentStep === STEPS.length - 1 ? (
                    <>
                      Complete
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              
              {/* Skip Option */}
              {currentStep < STEPS.length - 1 && (
                <div className="text-center">
                  <Button
                    variant="link"
                    className="text-sm text-gray-500"
                    onClick={() => setCurrentStep(currentStep + 1)}
                  >
                    Skip this step
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}