import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  X, 
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  Loader2,
  FileText,
  Users,
  Calendar,
  Settings,
  Palette,
  Rocket
} from 'lucide-react';

// Import step components (to be created)
import TemplateSelector from '@/components/setup/TemplateSelector';
import StageCustomizer from '@/components/setup/StageCustomizer';
import TeamConfiguration from '@/components/setup/TeamConfiguration';
import TimelineSetup from '@/components/setup/TimelineSetup';
import ClientPreferences from '@/components/setup/ClientPreferences';
import ProjectReview from '@/components/setup/ProjectReview';

// Wizard Context for sharing state between steps
const WizardContext = createContext();

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
};

// Step configuration
const WIZARD_STEPS = [
  {
    id: 'template',
    name: 'Choose Template',
    description: 'Select a starting point for your project',
    icon: FileText,
    component: TemplateSelector,
    estimatedTime: '2 min'
  },
  {
    id: 'stages',
    name: 'Customize Stages',
    description: 'Tailor the workflow to your needs',
    icon: Sparkles,
    component: StageCustomizer,
    estimatedTime: '3 min'
  },
  {
    id: 'team',
    name: 'Assign Team',
    description: 'Add team members and set permissions',
    icon: Users,
    component: TeamConfiguration,
    estimatedTime: '2 min'
  },
  {
    id: 'timeline',
    name: 'Set Timeline',
    description: 'Configure dates and milestones',
    icon: Calendar,
    component: TimelineSetup,
    estimatedTime: '2 min'
  },
  {
    id: 'preferences',
    name: 'Client Settings',
    description: 'Customize client experience',
    icon: Settings,
    component: ClientPreferences,
    estimatedTime: '1 min'
  },
  {
    id: 'review',
    name: 'Review & Create',
    description: 'Confirm and launch your project',
    icon: Rocket,
    component: ProjectReview,
    estimatedTime: '1 min'
  }
];

export default function ProjectSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    template: null,
    stages: [],
    team: [],
    timeline: {
      startDate: null,
      endDate: null,
      milestones: []
    },
    preferences: {
      notifications: {},
      branding: {},
      integrations: []
    }
  });
  
  const [stepValidation, setStepValidation] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('projectSetupDraft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setProjectData(draft.data);
        setCurrentStep(draft.step || 0);
        setLastSaved(new Date(draft.savedAt));
        
        toast({
          title: "Draft Restored",
          description: "Your previous progress has been loaded.",
        });
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, []);
  
  // Auto-save draft
  useEffect(() => {
    if (isDirty) {
      const saveTimer = setTimeout(() => {
        const draft = {
          data: projectData,
          step: currentStep,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('projectSetupDraft', JSON.stringify(draft));
        setLastSaved(new Date());
        setIsDirty(false);
      }, 3000); // Save after 3 seconds of no changes
      
      return () => clearTimeout(saveTimer);
    }
  }, [projectData, currentStep, isDirty]);
  
  // Update project data
  const updateProjectData = useCallback((updates) => {
    setProjectData(prev => ({
      ...prev,
      ...updates
    }));
    setIsDirty(true);
  }, []);
  
  // Validate current step
  const validateStep = useCallback((stepIndex) => {
    const step = WIZARD_STEPS[stepIndex];
    let isValid = false;
    let errors = [];
    
    switch (step.id) {
      case 'template':
        isValid = !!projectData.template;
        if (!isValid) errors.push('Please select a template');
        break;
      case 'stages':
        isValid = projectData.stages && projectData.stages.length > 0;
        if (!isValid) errors.push('At least one stage is required');
        break;
      case 'team':
        isValid = projectData.team && projectData.team.length > 0;
        if (!isValid) errors.push('Please assign at least one team member');
        break;
      case 'timeline':
        isValid = !!projectData.timeline.startDate;
        if (!isValid) errors.push('Please set a start date');
        break;
      case 'preferences':
        isValid = true; // Optional step
        break;
      case 'review':
        isValid = true; // Always valid if reached
        break;
      default:
        isValid = true;
    }
    
    setStepValidation(prev => ({
      ...prev,
      [stepIndex]: { isValid, errors }
    }));
    
    return isValid;
  }, [projectData]);
  
  // Navigation handlers
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < WIZARD_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      toast({
        title: "Validation Error",
        description: stepValidation[currentStep]?.errors[0] || "Please complete this step before proceeding.",
        variant: "destructive"
      });
    }
  }, [currentStep, validateStep, stepValidation]);
  
  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  const handleStepClick = useCallback((stepIndex) => {
    // Only allow navigation to completed steps
    if (stepIndex < currentStep || stepIndex === 0) {
      setCurrentStep(stepIndex);
    }
  }, [currentStep]);
  
  // Save and exit
  const handleSaveAndExit = useCallback(() => {
    const draft = {
      data: projectData,
      step: currentStep,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('projectSetupDraft', JSON.stringify(draft));
    
    toast({
      title: "Progress Saved",
      description: "You can continue setting up this project later.",
    });
    
    navigate('/admin');
  }, [projectData, currentStep, navigate]);
  
  // Handle exit with confirmation
  const handleExit = useCallback(() => {
    if (isDirty) {
      setShowExitDialog(true);
    } else {
      navigate('/admin');
    }
  }, [isDirty, navigate]);
  
  // Create project
  const handleCreateProject = useCallback(async () => {
    setIsCreating(true);
    
    try {
      // Simulate project creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear draft
      localStorage.removeItem('projectSetupDraft');
      
      toast({
        title: "Project Created!",
        description: "Your project has been successfully initialized.",
        className: "bg-green-500 text-white",
      });
      
      // Navigate to new project dashboard
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  }, [projectData, navigate]);
  
  // Calculate progress
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;
  
  // Calculate estimated time remaining
  const calculateTimeRemaining = () => {
    const remainingSteps = WIZARD_STEPS.slice(currentStep);
    const totalMinutes = remainingSteps.reduce((acc, step) => {
      const minutes = parseInt(step.estimatedTime) || 0;
      return acc + minutes;
    }, 0);
    return totalMinutes;
  };
  
  const CurrentStepComponent = WIZARD_STEPS[currentStep].component;
  
  return (
    <WizardContext.Provider value={{ projectData, updateProjectData, currentStep }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-gray-900">New Project Setup</h1>
                {lastSaved && (
                  <Badge variant="outline" className="text-xs">
                    <Save className="w-3 h-3 mr-1" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>~{calculateTimeRemaining()} min remaining</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAndExit}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save & Exit
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExit}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
        
        {/* Stepper */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {WIZARD_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isClickable = index < currentStep || index === 0;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => isClickable && handleStepClick(index)}
                      disabled={!isClickable}
                      className={`
                        flex flex-col items-center gap-2 transition-all
                        ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                      `}
                    >
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all
                        ${isActive ? 'bg-blue-500 text-white ring-4 ring-blue-100' : ''}
                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-100 text-gray-400' : ''}
                      `}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      
                      <div className="text-center">
                        <div className={`
                          text-sm font-medium
                          ${isActive ? 'text-blue-600' : ''}
                          ${isCompleted ? 'text-green-600' : ''}
                          ${!isActive && !isCompleted ? 'text-gray-400' : ''}
                        `}>
                          {step.name}
                        </div>
                        {isActive && (
                          <div className="text-xs text-gray-500 mt-1">
                            {step.description}
                          </div>
                        )}
                      </div>
                    </button>
                    
                    {index < WIZARD_STEPS.length - 1 && (
                      <div className={`
                        w-full max-w-[100px] h-[2px] mx-4
                        ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Step Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent />
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Navigation Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="flex items-center gap-2">
                {WIZARD_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`
                      w-2 h-2 rounded-full transition-all
                      ${index === currentStep ? 'w-8 bg-blue-500' : ''}
                      ${index < currentStep ? 'bg-green-500' : ''}
                      ${index > currentStep ? 'bg-gray-300' : ''}
                    `}
                  />
                ))}
              </div>
              
              {currentStep === WIZARD_STEPS.length - 1 ? (
                <Button
                  onClick={handleCreateProject}
                  disabled={isCreating}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Exit Confirmation Dialog */}
        <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save your progress?</DialogTitle>
              <DialogDescription>
                You have unsaved changes. Would you like to save your progress before leaving?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowExitDialog(false);
                  navigate('/admin');
                }}
              >
                Leave without saving
              </Button>
              <Button
                onClick={() => {
                  handleSaveAndExit();
                  setShowExitDialog(false);
                }}
              >
                Save & Exit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </WizardContext.Provider>
  );
}