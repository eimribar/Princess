/**
 * Compact Stage Actions Dropdown
 * Professional dropdown interface for stage management
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Play, 
  CheckCircle2, 
  RotateCcw, 
  Clock,
  Lock,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import stageManager from '@/api/stageManager';
import { getDependencyStatus } from './DependencyUtils';

export default function StageActionsDropdown({ stage, allStages, onStageUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [dependencyStatus, setDependencyStatus] = useState('not_started');
  const [incompleteDependencies, setIncompleteDependencies] = useState([]);
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

  const handleStartStage = async () => {
    setIsLoading(true);
    try {
      await stageManager.startStage(stage.id, 'Current User');
      toast({
        title: "Stage Started",
        description: `Work has begun on ${stage.name}`,
        duration: 3000,
      });
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

  const handleCompleteStage = async () => {
    setIsLoading(true);
    try {
      const result = await stageManager.completeStage(stage.id, 'Current User');
      toast({
        title: "Stage Completed!",
        description: `${stage.name} has been completed. ${result.dependentStagesUpdated.length} stages are now ready.`,
        duration: 3000,
      });
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

  const handleResetStage = async () => {
    if (!confirm('Are you sure you want to reset this stage?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await stageManager.resetStage(stage.id, 'Manual reset by user');
      toast({
        title: "Stage Reset",
        description: "Stage has been reset to not started",
        duration: 3000,
      });
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

  const getStatusDisplay = () => {
    if (stage.status === 'completed') {
      return {
        icon: CheckCircle2,
        label: 'Completed',
        color: 'text-green-600 bg-green-50 border-green-200',
        iconColor: 'text-green-600'
      };
    } else if (stage.status === 'in_progress') {
      return {
        icon: Clock,
        label: 'In Progress',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600'
      };
    } else if (dependencyStatus === 'blocked') {
      return {
        icon: Lock,
        label: 'Blocked',
        color: 'text-red-600 bg-red-50 border-red-200',
        iconColor: 'text-red-600'
      };
    } else if (dependencyStatus === 'ready') {
      return {
        icon: Play,
        label: 'Ready to Start',
        color: 'text-green-600 bg-green-50 border-green-200',
        iconColor: 'text-green-600'
      };
    } else {
      return {
        icon: Clock,
        label: 'Not Started',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        iconColor: 'text-gray-600'
      };
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    return colors[priority] || colors.medium;
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  const canStart = stage.status === 'not_started' && dependencyStatus === 'ready';
  const canComplete = stage.status === 'in_progress';
  const canReset = stage.status !== 'not_started';
  const isBlocked = stage.status === 'not_started' && dependencyStatus === 'blocked';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={`h-9 px-3 border ${statusDisplay.color}`}
              disabled={isLoading}
            >
              <StatusIcon className={`w-4 h-4 mr-2 ${statusDisplay.iconColor}`} />
              <span className="font-medium">{statusDisplay.label}</span>
              <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Stage Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {isBlocked && incompleteDependencies.length > 0 && (
              <>
                <div className="px-2 py-2">
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Blocked by:</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {incompleteDependencies.slice(0, 3).map(dep => (
                      <div key={dep.id} className="text-xs text-gray-600 pl-6">
                        • Step {dep.number_index}: {dep.name}
                      </div>
                    ))}
                    {incompleteDependencies.length > 3 && (
                      <div className="text-xs text-gray-500 pl-6">
                        ...and {incompleteDependencies.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            
            {canStart && (
              <DropdownMenuItem onClick={handleStartStage}>
                <Play className="w-4 h-4 mr-2" />
                Start Working
              </DropdownMenuItem>
            )}
            
            {canComplete && (
              <DropdownMenuItem onClick={handleCompleteStage}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Complete
              </DropdownMenuItem>
            )}
            
            {canReset && (
              <DropdownMenuItem onClick={handleResetStage}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Stage
              </DropdownMenuItem>
            )}
            
            {!canStart && !canComplete && !canReset && !isBlocked && (
              <div className="px-2 py-2 text-sm text-gray-500">
                No actions available
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {stage.blocking_priority && (
          <Badge className={`text-xs ${getPriorityColor(stage.blocking_priority)}`}>
            {stage.blocking_priority.toUpperCase()}
          </Badge>
        )}
      </div>
    </div>
  );
}