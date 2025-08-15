/**
 * Compact Stage Actions
 * Professional management section with space-efficient design
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Play, 
  CheckCircle2, 
  RotateCcw, 
  Clock,
  Lock,
  AlertTriangle,
  User,
  Edit2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import stageManager from '@/api/stageManager';
import { getDependencyStatus } from './DependencyUtils';
import { Stage, TeamMember } from '@/api/entities';

export default function CompactStageActions({ stage, allStages, onStageUpdate, teamMembers }) {
  const [isLoading, setIsLoading] = useState(false);
  const [dependencyStatus, setDependencyStatus] = useState('not_started');
  const [incompleteDependencies, setIncompleteDependencies] = useState([]);
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(stage?.assigned_to || '');
  const { toast } = useToast();

  useEffect(() => {
    if (stage && allStages) {
      const status = getDependencyStatus(stage, allStages);
      setDependencyStatus(status);
      
      // Get incomplete dependencies
      if (stage.dependencies) {
        const incomplete = stage.dependencies
          .map(depId => allStages.find(s => s.id === depId))
          .filter(dep => dep && dep.status !== 'completed');
        setIncompleteDependencies(incomplete);
      }
    }
  }, [stage, allStages]);

  useEffect(() => {
    setSelectedAssignee(stage?.assigned_to || '');
  }, [stage]);

  const handleStatusChange = async (newStatus) => {
    setIsLoading(true);
    try {
      if (newStatus === 'in_progress' && stage.status === 'not_started') {
        await stageManager.startStage(stage.id, 'Current User');
        toast({
          title: "Stage Started",
          description: `Work has begun on ${stage.name}`,
          duration: 3000,
        });
      } else if (newStatus === 'completed' && stage.status === 'in_progress') {
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
      } else {
        // Direct status update
        await Stage.update(stage.id, { status: newStatus });
        toast({
          title: "Status Updated",
          description: `Stage status changed to ${newStatus.replace('_', ' ')}`,
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssigneeChange = async (email) => {
    try {
      await Stage.update(stage.id, { assigned_to: email });
      setSelectedAssignee(email);
      setIsEditingAssignee(false);
      toast({
        title: "Assignee Updated",
        description: "Team member has been assigned to this stage",
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

  const getStatusOptions = () => {
    const options = [];
    
    if (stage.status === 'not_started') {
      if (dependencyStatus === 'ready') {
        options.push({ value: 'in_progress', label: 'Start Working' });
      }
      options.push({ value: 'not_started', label: 'Not Started' });
    } else if (stage.status === 'in_progress') {
      options.push({ value: 'completed', label: 'Mark Complete' });
      options.push({ value: 'in_progress', label: 'In Progress' });
      options.push({ value: 'not_started', label: 'Reset to Not Started' });
    } else if (stage.status === 'completed') {
      options.push({ value: 'completed', label: 'Completed' });
      options.push({ value: 'not_started', label: 'Reset to Not Started' });
    }
    
    return options;
  };

  const getStatusDisplay = () => {
    if (stage.status === 'completed') {
      return { label: 'Completed', color: 'text-green-700', icon: CheckCircle2 };
    } else if (stage.status === 'in_progress') {
      return { label: 'In Progress', color: 'text-blue-700', icon: Clock };
    } else if (dependencyStatus === 'blocked') {
      return { label: 'Blocked', color: 'text-red-700', icon: Lock };
    } else if (dependencyStatus === 'ready') {
      return { label: 'Ready to Start', color: 'text-green-700', icon: Play };
    } else {
      return { label: 'Not Started', color: 'text-gray-600', icon: Clock };
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[priority] || colors.medium;
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  const assignedMember = teamMembers.find(member => member.email === stage.assigned_to);
  const isBlocked = stage.status === 'not_started' && dependencyStatus === 'blocked';

  return (
    <div className="bg-white/50 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Edit2 className="w-4 h-4 text-gray-500" />
        <h3 className="font-semibold text-sm text-gray-900">Management</h3>
        {stage.blocking_priority && (
          <Badge className={`text-xs ml-auto ${getPriorityColor(stage.blocking_priority)}`}>
            {stage.blocking_priority.toUpperCase()}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {/* Status Change */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Change Status</label>
          {isBlocked ? (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <Lock className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700 font-medium">Blocked by Dependencies</span>
            </div>
          ) : (
            <Select 
              value={stage.status} 
              onValueChange={handleStatusChange}
              disabled={isLoading || isBlocked}
            >
              <SelectTrigger className="w-full h-9 bg-white">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-4 h-4 ${statusDisplay.color}`} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {getStatusOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Blocked Warning */}
        {isBlocked && incompleteDependencies.length > 0 && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-800">Waiting for:</p>
                <ul className="mt-1 space-y-0.5">
                  {incompleteDependencies.slice(0, 2).map(dep => (
                    <li key={dep.id} className="text-xs text-amber-700">
                      • Step {dep.number_index}: {dep.name}
                    </li>
                  ))}
                  {incompleteDependencies.length > 2 && (
                    <li className="text-xs text-amber-600">
                      • ...and {incompleteDependencies.length - 2} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Assigned To */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Assigned To</label>
          <div className="flex items-center gap-2">
            {assignedMember && (
              <Avatar className="w-7 h-7">
                <AvatarImage src={assignedMember.profile_image} />
                <AvatarFallback className="text-xs bg-gray-100">
                  {assignedMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            {isEditingAssignee ? (
              <Select 
                value={selectedAssignee} 
                onValueChange={handleAssigneeChange}
              >
                <SelectTrigger className="flex-1 h-8 text-sm">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teamMembers.map(member => (
                    <SelectItem key={member.email} value={member.email}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <button
                onClick={() => setIsEditingAssignee(true)}
                className="flex-1 text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                {assignedMember ? (
                  <span>Currently assigned to <strong>{assignedMember.name}</strong></span>
                ) : (
                  <span className="text-gray-500">Click to assign...</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}