import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectInit } from '@/pages/ProjectInitiation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { 
  CheckCircle2, 
  Calendar,
  Users,
  Bell,
  Clock,
  Building2,
  User,
  Star,
  AlertCircle,
  Rocket,
  Loader2,
  FileText
} from 'lucide-react';
import projectService from '@/services/projectService';

export default function ReviewLaunch() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { projectData, currentStep, totalSteps } = useProjectInit();
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState('');
  
  // Validate all required data
  const isValid = () => {
    return !!(
      projectData.projectName &&
      projectData.clientOrganization &&
      projectData.startDate &&
      projectData.decisionMakers?.length > 0 &&
      projectData.projectManager
    );
  };
  
  // Create the project
  const handleCreateProject = async () => {
    if (!isValid()) {
      toast({
        title: 'Missing Information',
        description: 'Please complete all required fields before creating the project.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Step 1: Create project
      setCreationProgress('Creating project...');
      const projectId = await projectService.createProject({
        name: projectData.projectName,
        client_name: projectData.clientOrganization,
        description: projectData.projectDescription,
        start_date: projectData.startDate,
        settings: {
          approvalSLA: projectData.approvalSLA,
          notifications: {
            client: projectData.clientNotificationLevel,
            agency: projectData.agencyNotificationLevel
          },
          escalation: projectData.escalationRules
        }
      });
      
      // Step 2: Clone stages for this project
      setCreationProgress('Setting up 104 stages with dependencies...');
      await projectService.cloneStagesForProject(projectId, projectData.startDate, projectData.milestoneOverrides);
      
      // Step 3: Assign team members
      setCreationProgress('Assigning team members...');
      await projectService.assignTeamMembers(projectId, {
        projectManager: projectData.projectManager,
        teamMembers: projectData.teamMembers,
        decisionMakers: projectData.decisionMakers,
        clientContacts: projectData.clientContacts
      });
      
      // Step 4: Setup notifications
      setCreationProgress('Configuring notifications...');
      await projectService.setupNotifications(projectId, {
        clientLevel: projectData.clientNotificationLevel,
        agencyLevel: projectData.agencyNotificationLevel,
        escalationRules: projectData.escalationRules
      });
      
      // Step 5: Map approval gates
      setCreationProgress('Setting up approval workflow...');
      await projectService.mapApprovalGates(projectId, projectData.decisionMakers);
      
      // Clear draft
      localStorage.removeItem('projectInitDraft');
      
      // Success!
      toast({
        title: 'Project Created Successfully!',
        description: `${projectData.projectName} is ready to go with 104 stages configured.`,
        className: 'bg-green-500 text-white'
      });
      
      // Navigate to the new project dashboard
      navigate(`/dashboard/${projectId}`);
      
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create project. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
      setCreationProgress('');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Review & Launch</h2>
        <p className="mt-1 text-sm text-gray-600">
          Confirm all settings and create your project
        </p>
      </div>
      
      {/* Validation Check */}
      {!isValid() && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some required information is missing. Please review and complete all steps.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Project Basics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Project Name</div>
              <div className="font-medium">{projectData.projectName || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Client</div>
              <div className="font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                {projectData.clientOrganization || 'Not set'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Start Date</div>
              <div className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {projectData.startDate ? 
                  format(parseISO(projectData.startDate), 'MMMM d, yyyy') : 
                  'Not set'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Approval SLA</div>
              <div className="font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {projectData.approvalSLA || 3} business days
              </div>
            </div>
          </div>
          {projectData.projectDescription && (
            <div className="pt-3 border-t">
              <div className="text-sm text-gray-500 mb-1">Description</div>
              <div className="text-sm">{projectData.projectDescription}</div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Teams */}
      <div className="grid grid-cols-2 gap-4">
        {/* Client Team */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Client Team
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectData.decisionMakers?.length > 0 ? (
              <>
                <div className="text-sm font-medium text-gray-700">Decision Makers</div>
                {projectData.decisionMakers.map((dm) => (
                  <div key={dm.id} className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{dm.name}</div>
                      <div className="text-xs text-gray-500">{dm.email}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-sm text-red-500">No decision makers assigned</div>
            )}
            
            {projectData.clientContacts?.length > 0 && (
              <>
                <div className="text-sm font-medium text-gray-700 pt-2">Additional Contacts</div>
                {projectData.clientContacts.map((contact) => (
                  <div key={contact.id} className="text-sm text-gray-600">
                    {contact.name} ({contact.email})
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Agency Team */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Agency Team
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectData.projectManager ? (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <div>
                  <div className="text-sm font-medium">{projectData.projectManager.name}</div>
                  <div className="text-xs text-gray-500">Project Manager</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-500">No project manager assigned</div>
            )}
            
            {projectData.teamMembers?.length > 0 && (
              <>
                <div className="text-sm font-medium text-gray-700 pt-2">Team Members</div>
                {projectData.teamMembers.slice(0, 5).map((member) => (
                  <div key={member.id} className="text-sm text-gray-600 flex items-center justify-between">
                    <span>{member.name} - {member.role}</span>
                    {member.visibleToClient && (
                      <Badge variant="outline" className="text-xs">Visible</Badge>
                    )}
                  </div>
                ))}
                {projectData.teamMembers.length > 5 && (
                  <div className="text-xs text-gray-500">
                    +{projectData.teamMembers.length - 5} more members
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Client Notifications</div>
              <div className="font-medium capitalize">
                {projectData.clientNotificationLevel?.replace(/_/g, ' ') || 'Approvals only'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Agency Notifications</div>
              <div className="font-medium capitalize">
                {projectData.agencyNotificationLevel?.replace(/_/g, ' ') || 'All activity'}
              </div>
            </div>
            {projectData.escalationRules?.enabled !== false && (
              <div>
                <div className="text-sm text-gray-500">Escalation</div>
                <div className="font-medium">
                  After {projectData.escalationRules?.daysBeforeEscalation || 2} days overdue
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* What Happens Next */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
            <Rocket className="w-5 h-5" />
            What Happens When You Launch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <span className="font-medium">104 stages</span> will be created with calculated dates
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              All <span className="font-medium">dependencies</span> will be configured automatically
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <span className="font-medium">Approval gates</span> will be assigned to decision makers
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              Team members will receive <span className="font-medium">welcome notifications</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              The project will be <span className="font-medium">ready to start immediately</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Launch Button */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={handleCreateProject}
          disabled={!isValid() || isCreating}
          className="gap-2 px-8"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {creationProgress || 'Creating project...'}
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              Launch Project
            </>
          )}
        </Button>
      </div>
    </div>
  );
}