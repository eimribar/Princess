/**
 * Professional Management Section
 * Pixel-perfect replica of the reference design
 */

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit2, Check, Lock, AlertTriangle, Users, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import stageManager from '@/api/stageManager';
import { getDependencyStatus, canTransitionToStatus } from './DependencyUtils';
import { SupabaseStage } from '@/api/supabaseEntities';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProfessionalManagement({ stage, allStages, onStageUpdate, teamMembers, isReadOnly = false }) {
  const [dependencyStatus, setDependencyStatus] = useState('not_started');
  const [selectedAssignee, setSelectedAssignee] = useState(stage?.assigned_to || 'unassigned');
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [cascadeImpact, setCascadeImpact] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (stage && allStages) {
      const status = getDependencyStatus(stage, allStages);
      setDependencyStatus(status);
    }
  }, [stage, allStages]);

  useEffect(() => {
    setSelectedAssignee(stage?.assigned_to || 'unassigned');
  }, [stage]);

  const handleStatusChange = async (newStatus) => {
    try {
      // First check if the transition is allowed
      const validation = canTransitionToStatus(stage, newStatus, allStages);
      if (!validation.allowed) {
        toast({
          title: "Cannot Change Status",
          description: validation.reason,
          variant: "destructive",
          duration: 4000,
        });
        return;
      }
      
      // Use the comprehensive status change handler
      const result = await stageManager.changeStageStatus(stage.id, newStatus, {
        changedBy: 'Current User',
        forceChange: false
      });
      
      // Check if confirmation is required
      if (result.requiresConfirmation) {
        setPendingStatusChange(newStatus);
        setCascadeImpact(result.impact);
        setImpactDialogOpen(true);
        return;
      }
      
      // Handle successful status change
      if (result.changed) {
        // Show appropriate toast based on status
        if (newStatus === 'completed') {
          const unblocked = result.impact?.directlyAffected?.filter(i => i.suggestedAction === 'unblock') || [];
          toast({
            title: "Stage Completed!",
            description: unblocked.length > 0 
              ? `${unblocked.length} dependent stages are now ready to start`
              : "Stage has been completed",
            duration: 3000,
          });
        } else if (newStatus === 'in_progress') {
          toast({
            title: "Stage Started",
            description: `Work has begun on ${stage.name}`,
            duration: 3000,
          });
        } else if (newStatus === 'not_started') {
          const blocked = result.impact?.directlyAffected?.filter(i => i.suggestedAction === 'block') || [];
          toast({
            title: "Stage Reset",
            description: blocked.length > 0
              ? `Stage reset. ${blocked.length} dependent stages have been blocked`
              : "Stage has been reset to not started",
            duration: 3000,
          });
        }
        
        // Update optimistically
        onStageUpdate && onStageUpdate(stage.id, { status: newStatus });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 4000,
      });
    }
  };
  
  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    
    try {
      // Force the change despite conflicts
      const result = await stageManager.changeStageStatus(stage.id, pendingStatusChange, {
        changedBy: 'Current User',
        forceChange: true,
        skipCascade: false
      });
      
      if (result.changed || result.stage) {
        toast({
          title: "Status Changed",
          description: "Stage status has been updated with cascade effects applied",
          duration: 3000,
        });
        
        // Update optimistically
        onStageUpdate && onStageUpdate(stage.id, { status: pendingStatusChange });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setImpactDialogOpen(false);
      setPendingStatusChange(null);
      setCascadeImpact(null);
    }
  };

  const handleAssigneeChange = async (value) => {
    try {
      const memberId = value === 'unassigned' ? null : value;
      await SupabaseStage.update(stage.id, { assigned_to: memberId });
      setSelectedAssignee(value);
      const member = teamMembers.find(m => m.id === memberId);
      toast({
        title: "Assignee Updated",
        description: member ? `Assigned to ${member.name}` : "Assignment removed",
        duration: 3000,
      });
      onStageUpdate && onStageUpdate(stage.id, { assigned_to: memberId });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assignee",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'blocked': return 'Blocked';
      default: return 'Not Started';
    }
  };

  const getCurrentStatus = () => {
    // Always show actual status from database
    if (stage.status === 'blocked') return 'blocked';
    if (stage.status === 'completed') return 'completed';
    if (stage.status === 'in_progress') return 'in_progress';
    // Show blocked if dependencies not met
    if (dependencyStatus === 'blocked') return 'blocked';
    return 'not_started';
  };
  
  const getStatusIcon = (status) => {
    if (status === 'blocked') return <Lock className="w-4 h-4 text-red-500 inline mr-2" />;
    if (status === 'completed') return <Check className="w-4 h-4 text-green-600 inline mr-2" />;
    return null;
  };

  const assignedMember = selectedAssignee !== 'unassigned' ? 
    teamMembers.find(member => member.id === selectedAssignee) : null;
  const currentStatus = getCurrentStatus();

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900">Management</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Change Status */}
        <div>
          <label className="text-sm text-gray-600 mb-2 block">Change Status</label>
          <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isReadOnly}>
            <SelectTrigger className="w-full h-10 bg-white border-gray-200" disabled={isReadOnly || currentStatus === 'blocked'}>
              <SelectValue>
                {getStatusIcon(currentStatus)}
                {getStatusLabel(currentStatus)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">
                <span className="flex items-center">
                  Not Started
                </span>
              </SelectItem>
              <SelectItem value="in_progress">
                <span className="flex items-center">
                  In Progress
                </span>
              </SelectItem>
              <SelectItem value="completed">
                <span className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  Completed
                </span>
              </SelectItem>
              <SelectItem value="blocked" disabled>
                <span className="flex items-center">
                  <Lock className="w-4 h-4 text-red-500 mr-2" />
                  Blocked (Auto-managed)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assigned To */}
        <div>
          <label className="text-sm text-gray-600 mb-2 block">
            <Users className="w-3.5 h-3.5 inline mr-1" />
            Assigned To
            {currentStatus === 'blocked' && (
              <span className="text-xs text-amber-600 ml-2">(Pre-assignment)</span>
            )}
          </label>
          <Select value={selectedAssignee} onValueChange={handleAssigneeChange} disabled={isReadOnly}>
            <SelectTrigger 
              className={`w-full h-10 bg-white border-gray-200 ${
                currentStatus === 'blocked' && assignedMember 
                  ? 'border-amber-400 bg-amber-50' 
                  : ''
              }`} 
              disabled={isReadOnly}>
              <div className="flex items-center gap-2">
                {assignedMember && (
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={assignedMember.profile_image} />
                    <AvatarFallback className="text-xs bg-gray-100">
                      {assignedMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <SelectValue placeholder="Select team member">
                  {assignedMember ? assignedMember.name : 'Unassign'}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">
                <span className="text-gray-500">Unassign</span>
              </SelectItem>
              {teamMembers.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={member.profile_image} />
                      <AvatarFallback className="text-xs bg-gray-100">
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {assignedMember && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">
                Currently assigned to <strong>{assignedMember.name}</strong>
              </p>
              {currentStatus === 'blocked' && (
                <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded">
                  <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-700">
                    <p className="font-medium">Pre-assignment Active</p>
                    <p className="mt-0.5">
                      {assignedMember.name} will be notified when this stage becomes ready. 
                      You can assign team members to blocked stages to prepare your workflow in advance.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          {!assignedMember && currentStatus === 'blocked' && (
            <p className="text-xs text-gray-500 mt-1.5 italic">
              💡 Tip: You can assign team members even to blocked stages for better planning
            </p>
          )}
        </div>
        
        {/* Show blocking reason if blocked */}
        {currentStatus === 'blocked' && (
          <Alert className="border-red-200 bg-red-50">
            <Lock className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800">
              <strong>Stage Blocked:</strong> Dependencies not yet completed.
              {stage.dependencies?.length > 0 && (
                <span className="block mt-1 text-xs">
                  Waiting for {stage.dependencies.length} prerequisite{stage.dependencies.length > 1 ? 's' : ''} to complete.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Impact Analysis Dialog */}
      <AlertDialog open={impactDialogOpen} onOpenChange={setImpactDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ This change will affect other stages</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {cascadeImpact?.conflicts?.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="font-semibold text-red-900 mb-2">Conflicts Detected:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {cascadeImpact.conflicts.map((conflict, i) => (
                      <li key={i} className="text-sm text-red-700">
                        {conflict.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {cascadeImpact?.warnings?.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="font-semibold text-yellow-900 mb-2">Warnings:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {cascadeImpact.warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-yellow-700">
                        {warning.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {cascadeImpact?.directlyAffected?.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-2">Stages that will be affected:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {cascadeImpact.directlyAffected.map((affected, i) => (
                      <li key={i} className="text-sm text-blue-700">
                        {affected.stage.name} - {affected.suggestedAction}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p className="text-sm text-gray-600 mt-3">
                Do you want to proceed with this change?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingStatusChange(null);
              setCascadeImpact(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmStatusChange}
              className="bg-red-600 hover:bg-red-700"
            >
              Proceed with Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}