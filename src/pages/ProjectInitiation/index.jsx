import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check,
  Circle,
  Loader2,
  Save,
  X
} from 'lucide-react';

// Import step components (to be created)
import ProjectBasics from '@/components/projectInit/ProjectBasics';
import ClientTeam from '@/components/projectInit/ClientTeam';
import AgencyTeam from '@/components/projectInit/AgencyTeam';
import TimelineReview from '@/components/projectInit/TimelineReview';
import NotificationSetup from '@/components/projectInit/NotificationSetup';
import ReviewLaunch from '@/components/projectInit/ReviewLaunch';

// Create context for sharing wizard state
export const ProjectInitContext = createContext();

export const useProjectInit = () => {
  const context = useContext(ProjectInitContext);
  if (!context) {
    throw new Error('useProjectInit must be used within ProjectInitProvider');
  }
  return context;
};

// Step configuration - Simplified MVP flow
const WIZARD_STEPS = [
  {
    id: 'basics',
    name: 'Project Basics',
    description: 'Name, client, and start date',
    component: ProjectBasics,
    validation: (data) => !!(data.projectName && data.clientOrganization && data.startDate)
  },
  {
    id: 'client-team',
    name: 'Client Team',
    description: 'Decision makers and approvers',
    component: ClientTeam,
    validation: (data) => data.decisionMakers && data.decisionMakers.length > 0
  },
  {
    id: 'agency-team',
    name: 'Agency Team',
    description: 'Project manager and team',
    component: AgencyTeam,
    validation: (data) => !!data.projectManager
  },
  {
    id: 'timeline',
    name: 'Timeline Review',
    description: 'Review and adjust key dates',
    component: TimelineReview,
    validation: () => true // Timeline is auto-calculated
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Set communication preferences',
    component: NotificationSetup,
    validation: () => true // Has defaults
  },
  {
    id: 'review',
    name: 'Review & Launch',
    description: 'Confirm and create project',
    component: ReviewLaunch,
    validation: () => true
  }
];

export default function NewProjectFlow() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [projectData, setProjectData] = useState({
    // Project Basics
    projectName: '',
    clientOrganization: '',
    projectDescription: '',
    startDate: null,
    
    // Client Team
    decisionMakers: [],
    clientContacts: [],
    approvalSLA: 3, // days
    
    // Agency Team
    projectManager: null,
    teamMembers: [],
    
    // Timeline
    milestoneOverrides: {}, // stage_id: { date, locked }
    
    // Notifications
    clientNotificationLevel: 'approvals_only', // all | major_milestones | approvals_only
    agencyNotificationLevel: 'all',
    escalationRules: {
      enabled: true,
      daysBeforeEscalation: 2
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Auto-save draft
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (currentStep > 0) { // Don't save on first load
        const draft = {
          data: projectData,
          step: currentStep,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('projectInitDraft', JSON.stringify(draft));
        setIsSaving(false);
      }
    }, 1000);
    
    return () => clearTimeout(saveTimer);
  }, [projectData, currentStep]);
  
  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('projectInitDraft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setProjectData(draft.data);
        
        // Ask user if they want to continue from saved draft
        toast({
          title: 'Draft Found',
          description: `Continue from where you left off? (Step ${draft.step + 1} of ${WIZARD_STEPS.length})`,
          action: (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setCurrentStep(draft.step)}
              >
                Continue
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  localStorage.removeItem('projectInitDraft');
                  setProjectData({});
                }}
              >
                Start Fresh
              </Button>
            </div>
          )
        });
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, []);
  
  // Update project data
  const updateProjectData = (updates) => {
    setProjectData(prev => ({
      ...prev,
      ...updates
    }));
    setIsSaving(true);
    setValidationErrors({}); // Clear errors on update
  };
  
  // Navigation
  const canGoNext = () => {
    const step = WIZARD_STEPS[currentStep];
    return step.validation(projectData);
  };
  
  const goToNext = () => {
    if (canGoNext()) {
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    } else {
      // Show validation error
      toast({
        title: 'Please complete required fields',
        description: 'Fill in all required information before proceeding.',
        variant: 'destructive'
      });
    }
  };
  
  const goToPrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };
  
  const goToStep = (index) => {
    // Can only go to previous steps or current step
    if (index <= currentStep) {
      setCurrentStep(index);
    }
  };
  
  // Cancel and cleanup
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Your progress will be saved.')) {
      navigate('/dashboard');
    }
  };
  
  // Current step component
  const CurrentStepComponent = WIZARD_STEPS[currentStep].component;
  
  // Calculate progress
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;
  
  // Context value
  const contextValue = {
    projectData,
    updateProjectData,
    validationErrors,
    setValidationErrors,
    currentStep,
    totalSteps: WIZARD_STEPS.length,
    isLastStep: currentStep === WIZARD_STEPS.length - 1
  };
  
  return (
    <ProjectInitContext.Provider value={contextValue}>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                New Project
              </h1>
              {isSaving && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Save className="w-3 h-3" />
                  Saving draft...
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <Progress value={progress} className="h-2" />
            <div className="mt-2 text-sm text-gray-600">
              Step {currentStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep].name}
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-8">
            {/* Sidebar - Step Navigation */}
            <div className="w-64 flex-shrink-0">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {WIZARD_STEPS.map((step, index) => {
                      const isActive = index === currentStep;
                      const isCompleted = index < currentStep;
                      const isClickable = index <= currentStep;
                      
                      return (
                        <button
                          key={step.id}
                          onClick={() => goToStep(index)}
                          disabled={!isClickable}
                          className={`
                            w-full text-left px-3 py-2 rounded-lg transition-colors
                            ${isActive ? 'bg-blue-50 text-blue-700' : ''}
                            ${isCompleted ? 'text-gray-700 hover:bg-gray-50' : ''}
                            ${!isClickable ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {isCompleted ? (
                                <Check className="w-5 h-5 text-green-600" />
                              ) : isActive ? (
                                <Circle className="w-5 h-5 text-blue-600 fill-current" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {step.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {step.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1">
              <Card>
                <CardContent className="p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CurrentStepComponent />
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={goToPrevious}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                {currentStep < WIZARD_STEPS.length - 1 ? (
                  <Button
                    onClick={goToNext}
                    disabled={!canGoNext() || isLoading}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => {/* Will be handled by ReviewLaunch component */}}
                    disabled={isLoading}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        Launch Project
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProjectInitContext.Provider>
  );
}