import React from 'react';
import { useProjectInit } from '@/pages/ProjectInitiation';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  BellOff, 
  Mail, 
  MessageSquare,
  AlertTriangle,
  Info,
  Clock
} from 'lucide-react';

export default function NotificationSetup() {
  const { projectData, updateProjectData } = useProjectInit();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Notification Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure how team members and clients receive project updates
        </p>
      </div>
      
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These settings determine when and how people are notified about project progress, 
          deliverables, and required actions.
        </AlertDescription>
      </Alert>
      
      {/* Client Notification Level */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Client Notifications</h3>
          <p className="text-sm text-gray-500 mt-1">
            Choose what the client team receives notifications about
          </p>
        </div>
        
        <RadioGroup
          value={projectData.clientNotificationLevel || 'approvals_only'}
          onValueChange={(value) => updateProjectData({ clientNotificationLevel: value })}
        >
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <RadioGroupItem value="all" className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      All Updates
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Receive notifications for all project activity including stage completions, 
                      comments, and team updates
                    </p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <RadioGroupItem value="major_milestones" className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Major Milestones
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Only notify for significant project milestones and deliverable submissions
                    </p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <RadioGroupItem value="approvals_only" className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Approvals Only
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Only notify when client action is required (approvals, feedback)
                    </p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </RadioGroup>
      </div>
      
      {/* Agency Notification Level */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Agency Notifications</h3>
          <p className="text-sm text-gray-500 mt-1">
            Internal team notification preferences
          </p>
        </div>
        
        <RadioGroup
          value={projectData.agencyNotificationLevel || 'all'}
          onValueChange={(value) => updateProjectData({ agencyNotificationLevel: value })}
        >
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <RadioGroupItem value="all" className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium">All Activity</div>
                    <p className="text-sm text-gray-500 mt-1">
                      Full visibility of all project activity
                    </p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <RadioGroupItem value="assigned_only" className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium">Assigned Tasks Only</div>
                    <p className="text-sm text-gray-500 mt-1">
                      Only notify about tasks assigned to each team member
                    </p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </RadioGroup>
      </div>
      
      {/* Escalation Rules */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Escalation Rules</h3>
          <p className="text-sm text-gray-500 mt-1">
            Automatic escalation for overdue approvals
          </p>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Enable Auto-Escalation</div>
                    <p className="text-sm text-gray-500">
                      Automatically notify additional contacts when approvals are overdue
                    </p>
                  </div>
                </div>
                <Switch
                  checked={projectData.escalationRules?.enabled !== false}
                  onCheckedChange={(checked) => 
                    updateProjectData({ 
                      escalationRules: { 
                        ...projectData.escalationRules, 
                        enabled: checked 
                      }
                    })
                  }
                />
              </div>
              
              {projectData.escalationRules?.enabled !== false && (
                <div className="pl-8 space-y-3">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="escalation-days" className="whitespace-nowrap">
                      Escalate after:
                    </Label>
                    <select
                      id="escalation-days"
                      value={projectData.escalationRules?.daysBeforeEscalation || 2}
                      onChange={(e) => 
                        updateProjectData({ 
                          escalationRules: { 
                            ...projectData.escalationRules, 
                            daysBeforeEscalation: parseInt(e.target.value) 
                          }
                        })
                      }
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="1">1 day</option>
                      <option value="2">2 days</option>
                      <option value="3">3 days</option>
                      <option value="5">5 days</option>
                    </select>
                    <span className="text-sm text-gray-500">
                      past the approval SLA
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Summary */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">Notification Summary</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              • Clients will receive: {' '}
              <span className="font-medium">
                {projectData.clientNotificationLevel === 'all' ? 'All updates' :
                 projectData.clientNotificationLevel === 'major_milestones' ? 'Major milestone notifications' :
                 'Approval requests only'}
              </span>
            </div>
            <div>
              • Agency team will receive: {' '}
              <span className="font-medium">
                {projectData.agencyNotificationLevel === 'all' ? 'All project activity' : 'Assigned task notifications'}
              </span>
            </div>
            {projectData.escalationRules?.enabled !== false && (
              <div>
                • Overdue approvals escalate after: {' '}
                <span className="font-medium">
                  {projectData.approvalSLA || 3} + {projectData.escalationRules?.daysBeforeEscalation || 2} days
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}