import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileText,
  Users,
  Calendar,
  Settings,
  Palette,
  Star,
  Clock,
  Package,
  Target,
  Layers,
  Crown,
  Bell,
  Shield,
  Link,
  Edit2,
  Printer,
  Download,
  Send,
  Rocket,
  AlertCircle,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { useWizard } from '@/pages/ProjectSetup';
import { useToast } from '@/components/ui/use-toast';

export default function ProjectReview() {
  const { projectData } = useWizard();
  const { toast } = useToast();
  
  const [expandedSections, setExpandedSections] = useState(new Set(['template', 'stages', 'team', 'timeline']));
  const [showCostEstimate, setShowCostEstimate] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [sendEmailSummary, setSendEmailSummary] = useState(true);
  const [validationIssues, setValidationIssues] = useState([]);
  
  // Toggle section expansion
  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };
  
  // Calculate project statistics
  const projectStats = useMemo(() => {
    const stages = projectData.stages || [];
    const team = projectData.team || [];
    const timeline = projectData.timeline || {};
    
    return {
      totalStages: stages.length,
      deliverables: stages.filter(s => s.is_deliverable).length,
      phases: [...new Set(stages.map(s => s.phase))].length,
      customStages: stages.filter(s => s.is_custom).length,
      teamSize: team.length,
      agencyMembers: team.filter(m => m.team_type === 'agency').length,
      clientMembers: team.filter(m => m.team_type === 'client').length,
      decisionMakers: team.filter(m => m.is_decision_maker).length,
      duration: timeline.duration || 0,
      milestones: timeline.milestones?.length || 0,
      integrations: projectData.preferences?.integrations?.length || 0
    };
  }, [projectData]);
  
  // Calculate what changed from template
  const templateChanges = useMemo(() => {
    if (!projectData.template) return null;
    
    const changes = [];
    const originalStages = projectData.template.stages || 0;
    const currentStages = projectStats.totalStages;
    
    if (currentStages !== originalStages) {
      const diff = currentStages - originalStages;
      changes.push({
        type: diff > 0 ? 'addition' : 'removal',
        description: `${Math.abs(diff)} stage${Math.abs(diff) > 1 ? 's' : ''} ${diff > 0 ? 'added' : 'removed'}`,
        impact: 'timeline'
      });
    }
    
    if (projectStats.customStages > 0) {
      changes.push({
        type: 'customization',
        description: `${projectStats.customStages} custom stage${projectStats.customStages > 1 ? 's' : ''} created`,
        impact: 'workflow'
      });
    }
    
    const bufferType = projectData.timeline?.settings?.bufferScenario;
    if (bufferType && bufferType !== 'standard') {
      changes.push({
        type: bufferType === 'aggressive' ? 'risk' : 'safety',
        description: `${bufferType} timeline buffer applied`,
        impact: 'schedule'
      });
    }
    
    return changes;
  }, [projectData, projectStats]);
  
  // Validate project configuration
  const validateProject = () => {
    const issues = [];
    
    // Check for critical requirements
    if (!projectData.name) {
      issues.push({ type: 'error', message: 'Project name is required' });
    }
    
    if (!projectData.template) {
      issues.push({ type: 'error', message: 'No template selected' });
    }
    
    if (projectStats.totalStages === 0) {
      issues.push({ type: 'error', message: 'Project must have at least one stage' });
    }
    
    if (projectStats.teamSize === 0) {
      issues.push({ type: 'warning', message: 'No team members assigned' });
    }
    
    if (projectStats.decisionMakers === 0 && projectStats.teamSize > 0) {
      issues.push({ type: 'warning', message: 'No decision makers designated' });
    }
    
    if (!projectData.timeline?.startDate) {
      issues.push({ type: 'warning', message: 'No start date set' });
    }
    
    // Check for optimization opportunities
    if (projectStats.milestones === 0) {
      issues.push({ type: 'info', message: 'Consider adding milestones for better tracking' });
    }
    
    if (projectStats.integrations === 0) {
      issues.push({ type: 'info', message: 'No integrations configured' });
    }
    
    setValidationIssues(issues);
    return issues.filter(i => i.type === 'error').length === 0;
  };
  
  // Estimate project cost (mock calculation)
  const estimateCost = () => {
    const baseRate = 150; // Per hour
    const totalHours = projectStats.totalStages * 8; // Average 8 hours per stage
    const teamMultiplier = 1 + (projectStats.teamSize * 0.1);
    const complexityMultiplier = projectStats.phases > 4 ? 1.2 : 1;
    
    const estimatedCost = baseRate * totalHours * teamMultiplier * complexityMultiplier;
    
    return {
      low: Math.round(estimatedCost * 0.8),
      mid: Math.round(estimatedCost),
      high: Math.round(estimatedCost * 1.2)
    };
  };
  
  const costEstimate = estimateCost();
  
  // Print summary
  const handlePrintSummary = () => {
    window.print();
    toast({
      title: "Print Dialog Opened",
      description: "Use your browser's print dialog to save or print the summary.",
    });
  };
  
  // Export summary
  const handleExportSummary = () => {
    const summary = {
      project: {
        name: projectData.name,
        description: projectData.description,
        template: projectData.template?.name
      },
      statistics: projectStats,
      timeline: {
        startDate: projectData.timeline?.startDate,
        endDate: projectData.timeline?.endDate,
        duration: projectData.timeline?.duration
      },
      team: projectData.team?.map(m => ({
        name: m.name,
        role: m.assigned_role,
        email: m.email
      })),
      settings: projectData.preferences
    };
    
    const dataStr = JSON.stringify(summary, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `${projectData.name || 'project'}_summary.json`);
    linkElement.click();
    
    toast({
      title: "Summary Exported",
      description: "Project summary has been downloaded.",
    });
  };
  
  // Section component
  const ReviewSection = ({ id, title, icon: Icon, children, stats }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection(id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
              <Icon className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            {stats && (
              <div className="flex gap-2">
                {stats.map((stat, index) => (
                  <Badge key={index} variant="secondary">
                    {stat}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            {children}
          </CardContent>
        )}
      </Card>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {projectData.name || 'New Project'}
              </h2>
              {projectData.description && (
                <p className="text-gray-600 mt-2 max-w-2xl">
                  {projectData.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-3 mt-4">
                <Badge className="bg-blue-100 text-blue-700">
                  <FileText className="w-3 h-3 mr-1" />
                  {projectData.template?.name || 'No Template'}
                </Badge>
                <Badge className="bg-green-100 text-green-700">
                  <Clock className="w-3 h-3 mr-1" />
                  {projectStats.duration} days
                </Badge>
                <Badge className="bg-purple-100 text-purple-700">
                  <Users className="w-3 h-3 mr-1" />
                  {projectStats.teamSize} team members
                </Badge>
                <Badge className="bg-orange-100 text-orange-700">
                  <Layers className="w-3 h-3 mr-1" />
                  {projectStats.totalStages} stages
                </Badge>
              </div>
            </div>
            
            {projectData.preferences?.branding?.logo && (
              <img 
                src={projectData.preferences.branding.logo} 
                alt="Logo" 
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <Alert className={`
          ${validationIssues.some(i => i.type === 'error') ? 'border-red-200 bg-red-50' :
            validationIssues.some(i => i.type === 'warning') ? 'border-yellow-200 bg-yellow-50' :
            'border-blue-200 bg-blue-50'}
        `}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Review</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              {validationIssues.map((issue, index) => (
                <div key={index} className="flex items-start gap-2">
                  {issue.type === 'error' && <X className="w-4 h-4 text-red-500 mt-0.5" />}
                  {issue.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                  {issue.type === 'info' && <Info className="w-4 h-4 text-blue-500 mt-0.5" />}
                  <span className="text-sm">{issue.message}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Review Sections */}
      <div className="space-y-4">
        {/* Template & Stages */}
        <ReviewSection
          id="stages"
          title="Workflow Configuration"
          icon={Layers}
          stats={[
            `${projectStats.totalStages} stages`,
            `${projectStats.deliverables} deliverables`,
            `${projectStats.phases} phases`
          ]}
        >
          <div className="space-y-4">
            {/* Template Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Base Template</div>
                  <div className="text-sm text-gray-600">
                    {projectData.template?.name || 'No template selected'}
                  </div>
                </div>
                {projectData.template?.category && (
                  <Badge>{projectData.template.category}</Badge>
                )}
              </div>
            </div>
            
            {/* Changes from Template */}
            {templateChanges && templateChanges.length > 0 && (
              <div>
                <div className="font-medium mb-2">Customizations</div>
                <div className="space-y-2">
                  {templateChanges.map((change, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {change.type === 'addition' && <Plus className="w-4 h-4 text-green-500" />}
                      {change.type === 'removal' && <X className="w-4 h-4 text-red-500" />}
                      {change.type === 'customization' && <Edit2 className="w-4 h-4 text-blue-500" />}
                      {change.type === 'risk' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                      {change.type === 'safety' && <Shield className="w-4 h-4 text-green-500" />}
                      <span>{change.description}</span>
                      <Badge variant="outline" className="text-xs">
                        {change.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Phase Breakdown */}
            <div>
              <div className="font-medium mb-2">Phase Distribution</div>
              <div className="space-y-2">
                {projectData.stages && Object.entries(
                  projectData.stages.reduce((acc, stage) => {
                    if (!acc[stage.phase]) acc[stage.phase] = 0;
                    acc[stage.phase]++;
                    return acc;
                  }, {})
                ).map(([phase, count]) => (
                  <div key={phase} className="flex items-center justify-between">
                    <span className="text-sm">{phase}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${(count / projectStats.totalStages) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ReviewSection>
        
        {/* Team */}
        <ReviewSection
          id="team"
          title="Team Assignment"
          icon={Users}
          stats={[
            `${projectStats.teamSize} members`,
            `${projectStats.decisionMakers} decision makers`
          ]}
        >
          <div className="space-y-4">
            {/* Team by Role */}
            {projectData.team && Object.entries(
              projectData.team.reduce((acc, member) => {
                const role = member.assigned_role || 'Unassigned';
                if (!acc[role]) acc[role] = [];
                acc[role].push(member);
                return acc;
              }, {})
            ).map(([role, members]) => (
              <div key={role}>
                <div className="font-medium mb-2">{role}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{member.name}</div>
                        <div className="text-xs text-gray-600">{member.email}</div>
                      </div>
                      {member.is_decision_maker && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {projectStats.teamSize === 0 && (
              <div className="text-center py-4 text-gray-500">
                No team members assigned
              </div>
            )}
          </div>
        </ReviewSection>
        
        {/* Timeline */}
        <ReviewSection
          id="timeline"
          title="Timeline & Milestones"
          icon={Calendar}
          stats={[
            `${projectStats.duration} days`,
            `${projectStats.milestones} milestones`
          ]}
        >
          <div className="space-y-4">
            {/* Date Range */}
            {projectData.timeline?.startDate && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Start Date</div>
                  <div className="font-medium">
                    {format(new Date(projectData.timeline.startDate), 'PPP')}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">End Date</div>
                  <div className="font-medium">
                    {projectData.timeline.endDate ? 
                      format(new Date(projectData.timeline.endDate), 'PPP') : 
                      'TBD'
                    }
                  </div>
                </div>
              </div>
            )}
            
            {/* Timeline Settings */}
            <div>
              <div className="font-medium mb-2">Timeline Configuration</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Buffer: {projectData.timeline?.settings?.bufferScenario || 'standard'}</span>
                </div>
                {projectData.timeline?.settings?.accountForWeekends && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Weekends excluded</span>
                  </div>
                )}
                {projectData.timeline?.settings?.parallelOptimization && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Parallel work optimization enabled</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Milestones */}
            {projectData.timeline?.milestones && projectData.timeline.milestones.length > 0 && (
              <div>
                <div className="font-medium mb-2">Key Milestones</div>
                <div className="space-y-2">
                  {projectData.timeline.milestones.map(milestone => (
                    <div key={milestone.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span>{milestone.name}</span>
                      </div>
                      <span className="text-gray-600">
                        {format(new Date(milestone.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ReviewSection>
        
        {/* Client Preferences */}
        <ReviewSection
          id="preferences"
          title="Client Settings"
          icon={Settings}
          stats={[
            projectData.preferences?.notifications?.level || 'important',
            `${projectStats.integrations} integrations`
          ]}
        >
          <div className="space-y-4">
            {/* Notifications */}
            <div>
              <div className="font-medium mb-2">Notifications</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <span>Level: {projectData.preferences?.notifications?.level || 'important'}</span>
                </div>
                {projectData.preferences?.notifications?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Email notifications enabled</span>
                  </div>
                )}
                {projectData.preferences?.notifications?.sms && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>SMS notifications enabled</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Access Control */}
            <div>
              <div className="font-medium mb-2">Access Control</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span>Default level: {projectData.preferences?.access?.defaultLevel || 'standard'}</span>
                </div>
                {projectData.preferences?.access?.requireApproval && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>New members require approval</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Integrations */}
            {projectData.preferences?.integrations && projectData.preferences.integrations.length > 0 && (
              <div>
                <div className="font-medium mb-2">Connected Integrations</div>
                <div className="flex flex-wrap gap-2">
                  {projectData.preferences.integrations.map(integration => (
                    <Badge key={integration.id} variant="secondary">
                      <Link className="w-3 h-3 mr-1" />
                      {integration.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ReviewSection>
      </div>
      
      {/* Cost Estimate */}
      <Card className="border-2 border-dashed">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Estimated Project Investment
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCostEstimate(!showCostEstimate)}
            >
              {showCostEstimate ? 'Hide' : 'Show'} Estimate
            </Button>
          </div>
        </CardHeader>
        {showCostEstimate && (
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Conservative</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${costEstimate.low.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Most Likely</div>
                <div className="text-3xl font-bold text-blue-600">
                  ${costEstimate.mid.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">With Scope Creep</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${costEstimate.high.toLocaleString()}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              *Estimate based on project complexity and team size. Actual costs will be confirmed separately.
            </p>
          </CardContent>
        )}
      </Card>
      
      {/* Final Actions */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Terms Agreement */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
              />
              <div className="flex-1">
                <label htmlFor="terms" className="font-medium cursor-pointer">
                  I have reviewed the project configuration
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  By creating this project, you confirm that all information is accurate and ready for initialization.
                </p>
              </div>
            </div>
            
            {/* Email Summary Option */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="email"
                checked={sendEmailSummary}
                onCheckedChange={setSendEmailSummary}
              />
              <div className="flex-1">
                <label htmlFor="email" className="font-medium cursor-pointer">
                  Send project summary to team
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  All assigned team members will receive an email with project details and their roles.
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrintSummary}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Summary
                </Button>
                <Button variant="outline" onClick={handleExportSummary}>
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-2">
                  Ready to create your project?
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <Rocket className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">
                    All systems go!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Validation Warning */}
      {!agreedToTerms && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Almost There!</AlertTitle>
          <AlertDescription>
            Please review the configuration and check the confirmation box before creating the project.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}