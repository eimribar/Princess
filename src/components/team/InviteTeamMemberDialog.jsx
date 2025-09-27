import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check,
  Copy,
  Users
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useToast } from '../ui/use-toast';
import { useUser } from '@/contexts/ClerkUserContext';
import { useProject } from '../../contexts/ProjectContext';
import { supabase } from '../../lib/supabase';
import { 
  createInvitation, 
  checkDecisionMakerLimit, 
  swapDecisionMaker 
} from '@/services/invitationService';

// Step states
const STEPS = {
  SELECT_ROLE: 'select_role',
  ENTER_DETAILS: 'enter_details',
  SUCCESS: 'success'
};

// Persona configurations with real descriptions
const PERSONAS = [
  {
    id: 'client_decision_maker',
    title: 'Client Decision Maker',
    description: 'Can approve deliverables and provide feedback',
    role: 'client',
    teamType: 'client',
    isDecisionMaker: true,
    requiresName: true
  },
  {
    id: 'client_team',
    title: 'Client Team Member',
    description: 'Can provide feedback on deliverables',
    role: 'client',
    teamType: 'client',
    isDecisionMaker: false,
    requiresName: true
  },
  {
    id: 'agency_team',
    title: 'Agency Team Member',
    description: 'Can create and manage projects',
    role: 'agency',
    teamType: 'agency',
    isDecisionMaker: false,
    requiresName: false
  }
];

export default function InviteTeamMemberDialog({ open, onOpenChange, projectId = null }) {
  const { user } = useUser();
  const { project, currentProjectId } = useProject();
  const { toast } = useToast();
  
  // Use the passed projectId or fall back to currentProjectId from context
  const activeProjectId = projectId || currentProjectId;
  
  const [currentStep, setCurrentStep] = useState(STEPS.SELECT_ROLE);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [existingDecisionMakers, setExistingDecisionMakers] = useState([]);
  const [invitationLink, setInvitationLink] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    message: ''
  });
  
  const [errors, setErrors] = useState({});

  // Determine available personas based on user role and context
  const getAvailablePersonas = () => {
    if (!user) return [];
    
    // If inviting from project context (Team page), only show client personas
    if (activeProjectId) {
      if (user.role === 'admin' || user.role === 'agency') {
        return PERSONAS.filter(p => p.teamType === 'client');
      } else if (user.role === 'client' && user.is_decision_maker) {
        // Client decision makers can only invite other client team members
        return PERSONAS.filter(p => p.id === 'client_team');
      }
    } else {
      // Organization-level invitations (no project context)
      if (user.role === 'admin') {
        return PERSONAS.filter(p => p.teamType === 'agency');
      }
    }
    
    return [];
  };

  const availablePersonas = getAvailablePersonas();

  // Fetch existing decision makers when needed
  useEffect(() => {
    if (open && selectedPersona?.isDecisionMaker && activeProjectId) {
      fetchDecisionMakers();
    }
  }, [open, selectedPersona, activeProjectId]);

  const fetchDecisionMakers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('project_id', activeProjectId)
        .eq('is_decision_maker', true)
        .eq('team_type', 'client');
        
      if (!error && data) {
        setExistingDecisionMakers(data);
      }
    } catch (error) {
      console.error('Error fetching decision makers:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation - required on first step
    if (currentStep === STEPS.SELECT_ROLE) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    // Name validation for client invitations on second step
    if (currentStep === STEPS.ENTER_DETAILS && selectedPersona?.requiresName) {
      if (!formData.name?.trim()) {
        newErrors.name = 'Name is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!selectedPersona) {
      toast({
        title: "Please select a role",
        description: "Choose who you want to invite",
        variant: "destructive"
      });
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    // Move to details step
    setCurrentStep(STEPS.ENTER_DETAILS);
  };

  const handleInvite = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Check decision maker limit if applicable
      if (selectedPersona.isDecisionMaker && activeProjectId) {
        const limitCheck = await checkDecisionMakerLimit(activeProjectId);
        
        if (!limitCheck.canAdd) {
          toast({
            title: "Decision Maker Limit",
            description: "Maximum 2 decision makers allowed per project. Please remove an existing decision maker first.",
            variant: "warning"
          });
          setIsLoading(false);
          return;
        }
      }
      
      // Parse name into first and last
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Build complete metadata
      const metadata = {
        firstName,
        lastName,
        full_name: formData.name,
        message: formData.message,
        inviter_name: user.full_name || user.email,
        project_name: project?.name || 'the project',
        persona_type: selectedPersona.id
      };
      
      // Create invitation through Clerk service
      const result = await createInvitation({
        email: formData.email,
        role: selectedPersona.role,
        teamType: selectedPersona.teamType,
        projectId: activeProjectId,
        organizationId: user.organization_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        isDecisionMaker: selectedPersona.isDecisionMaker,
        invitedBy: user.id,
        metadata
      });

      if (result.success) {
        // Generate a proper invitation URL
        const baseUrl = window.location.origin;
        setInvitationLink(result.invitationUrl || `${baseUrl}/invitation/accept?token=${result.invitationId}`);
        setCurrentStep(STEPS.SUCCESS);
        
        toast({
          title: "Invitation sent!",
          description: `Invitation sent to ${formData.email}`,
        });
      } else {
        throw new Error(result.error || 'Failed to create invitation');
      }
    } catch (error) {
      console.error('Invitation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDone = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      message: ''
    });
    setSelectedPersona(null);
    setErrors({});
    setCurrentStep(STEPS.SELECT_ROLE);
    setInvitationLink('');
  };

  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    toast({
      title: "Link copied!",
      description: "Invitation link copied to clipboard"
    });
  };

  const handleRoleSelect = (value) => {
    const persona = PERSONAS.find(p => p.id === value);
    setSelectedPersona(persona);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Role */}
          {currentStep === STEPS.SELECT_ROLE && (
            <motion.div
              key="select-role"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Invite team members
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a role and enter an email to invite a new member.
                </p>
              </div>

              <div className="mt-6">
                <RadioGroup
                  value={selectedPersona?.id || ''}
                  onValueChange={handleRoleSelect}
                  className="space-y-4"
                >
                  {availablePersonas.map((persona) => (
                    <label
                      key={persona.id}
                      htmlFor={persona.id}
                      className={`
                        flex cursor-pointer items-center justify-between rounded-lg border p-4
                        transition-all duration-200
                        ${selectedPersona?.id === persona.id 
                          ? 'border-primary ring-2 ring-primary' 
                          : 'border-gray-200 hover:border-primary dark:border-gray-700 dark:hover:border-primary'
                        }
                      `}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {persona.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {persona.description}
                        </p>
                      </div>
                      <RadioGroupItem
                        value={persona.id}
                        id={persona.id}
                        className="h-5 w-5"
                      />
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="mt-8">
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors({ ...errors, email: '' });
                  }}
                  className={`
                    mt-1 block w-full rounded-lg bg-gray-50 p-3 dark:bg-gray-800
                    ${errors.email ? 'border-red-500' : ''}
                  `}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  onClick={handleContinue}
                  disabled={!selectedPersona || isLoading}
                  className="rounded-lg px-6 py-3 text-base font-bold"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Enter Details */}
          {currentStep === STEPS.ENTER_DETAILS && (
            <motion.div
              key="enter-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 sm:p-8"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Invite {selectedPersona?.title}
              </h2>

              <div className="mt-6 space-y-6">
                {selectedPersona?.requiresName && (
                  <div>
                    <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setErrors({ ...errors, name: '' });
                      }}
                      className={`
                        mt-1 block w-full rounded-lg bg-gray-50 dark:bg-gray-800
                        ${errors.name ? 'border-red-500' : ''}
                      `}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Personal message (optional)
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Write a personal message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="mt-1 block w-full rounded-lg bg-gray-50 dark:bg-gray-800"
                    rows={4}
                  />
                </div>

                {selectedPersona?.isDecisionMaker && (
                  <div className="flex items-start rounded-lg bg-primary/10 dark:bg-primary/20 p-4">
                    <Users className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-primary/80 dark:text-primary/90">
                      You can invite up to <span className="font-bold">2 Client Decision Makers</span>. 
                      This role has full access to project details and approvals.
                      {existingDecisionMakers.length > 0 && (
                        <span className="block mt-1">
                          Currently {existingDecisionMakers.length} of 2 decision makers.
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(STEPS.SELECT_ROLE)}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={isLoading}
                  className="min-w-[140px]"
                >
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {currentStep === STEPS.SUCCESS && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 text-center"
            >
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full dark:bg-green-900/50">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              
              <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                Invitation sent!
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Your invitation has been successfully sent. You can also share the link manually.
              </p>

              <div className="mt-6 relative">
                <Input
                  value={invitationLink}
                  readOnly
                  className="pr-12 text-sm bg-gray-50 dark:bg-gray-800"
                />
                <button
                  onClick={copyInvitationLink}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-500 hover:text-primary transition-colors"
                  type="button"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleDone}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}