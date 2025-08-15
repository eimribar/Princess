/**
 * Professional Management Section
 * Pixel-perfect replica of the reference design
 */

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit2, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import stageManager from '@/api/stageManager';
import { getDependencyStatus } from './DependencyUtils';
import { Stage } from '@/api/entities';

export default function ProfessionalManagement({ stage, allStages, onStageUpdate, teamMembers }) {
  const [dependencyStatus, setDependencyStatus] = useState('not_started');
  const [selectedAssignee, setSelectedAssignee] = useState(stage?.assigned_to || '');
  const { toast } = useToast();

  useEffect(() => {
    if (stage && allStages) {
      const status = getDependencyStatus(stage, allStages);
      setDependencyStatus(status);
    }
  }, [stage, allStages]);

  useEffect(() => {
    setSelectedAssignee(stage?.assigned_to || '');
  }, [stage]);

  const handleStatusChange = async (newStatus) => {
    try {
      if (newStatus === 'in_progress' && stage.status === 'not_started') {
        await stageManager.startStage(stage.id, 'Current User');
        toast({
          title: "Stage Started",
          description: `Work has begun on ${stage.name}`,
          duration: 3000,
        });
      } else if (newStatus === 'completed') {
        const result = await stageManager.completeStage(stage.id, 'Current User');
        toast({
          title: "Stage Completed!",
          description: `${result.dependentStagesUpdated.length} dependent stages are now ready.`,
          duration: 3000,
        });
      } else if (newStatus === 'not_started') {
        await stageManager.resetStage(stage.id, 'Manual reset by user');
        toast({
          title: "Stage Reset",
          description: "Stage has been reset to not started",
          duration: 3000,
        });
      } else if (newStatus === 'blocked') {
        // Handle blocked status if needed
        await Stage.update(stage.id, { status: 'not_started' });
        toast({
          title: "Status Updated",
          description: "Stage marked as blocked",
          duration: 3000,
        });
      }
      onStageUpdate && onStageUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleAssigneeChange = async (email) => {
    try {
      await Stage.update(stage.id, { assigned_to: email });
      setSelectedAssignee(email);
      toast({
        title: "Assignee Updated",
        description: email ? "Team member has been assigned" : "Assignment removed",
        duration: 3000,
      });
      onStageUpdate && onStageUpdate();
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
    if (stage.status === 'completed') return 'completed';
    if (stage.status === 'in_progress') return 'in_progress';
    if (dependencyStatus === 'blocked') return 'blocked';
    return 'not_started';
  };

  const assignedMember = teamMembers.find(member => member.email === selectedAssignee);
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
          <Select value={currentStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full h-10 bg-white border-gray-200">
              <SelectValue>
                {currentStatus === 'completed' && <Check className="w-4 h-4 text-green-600 inline mr-2" />}
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
              <SelectItem value="blocked">
                <span className="flex items-center">
                  Blocked
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assigned To */}
        <div>
          <label className="text-sm text-gray-600 mb-2 block">Assigned To</label>
          <Select value={selectedAssignee} onValueChange={handleAssigneeChange}>
            <SelectTrigger className="w-full h-10 bg-white border-gray-200">
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
              <SelectItem value="">
                <span className="text-gray-500">Unassign</span>
              </SelectItem>
              {teamMembers.map(member => (
                <SelectItem key={member.email} value={member.email}>
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
            <p className="text-xs text-gray-500 mt-1.5">
              Currently assigned to <strong>{assignedMember.name}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}