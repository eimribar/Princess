/**
 * Stage Action System
 * UI for managing stage transitions (start, complete, reset)
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  CheckCircle2, 
  RotateCcw, 
  AlertTriangle, 
  Clock,
  Lock,
  Unlock,
  Loader2,
  Users,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import stageManager from '@/api/stageManager';
import { getDependencyStatus } from './DependencyUtils';

export default function StageActions({ stage, allStages, onStageUpdate, teamMembers = [] }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [dependencyStatus, setDependencyStatus] = useState('not_started');
  const [incompleteDependencies, setIncompleteDependencies] = useState([]);

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

  const showMessage = (type, text, duration = 4000) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), duration);
  };

  const handleStartStage = async () => {
    setIsLoading(true);
    try {
      await stageManager.startStage(stage.id, 'Current User');
      showMessage('success', 'Stage started successfully!');
      onStageUpdate && onStageUpdate();
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteStage = async () => {
    setIsLoading(true);
    try {
      const result = await stageManager.completeStage(stage.id, 'Current User');
      showMessage('success', `Stage completed! ${result.dependentStagesUpdated.length} stages are now ready to start.`);
      onStageUpdate && onStageUpdate();
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetStage = async () => {
    if (!confirm('Are you sure you want to reset this stage? This will mark it as not started.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await stageManager.resetStage(stage.id, 'Manual reset by user');
      showMessage('success', 'Stage reset to not started');
      onStageUpdate && onStageUpdate();
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = () => {
    switch (stage.status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Completed',
          description: 'This stage has been completed successfully'
        };
      case 'in_progress':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'In Progress',
          description: 'Currently being worked on'
        };
      case 'not_started':
        if (dependencyStatus === 'ready') {
          return {
            icon: Unlock,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-200',
            label: 'Ready to Start',
            description: 'All dependencies met - can be started'
          };
        } else if (dependencyStatus === 'blocked') {
          return {
            icon: Lock,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
            label: 'Blocked',
            description: 'Waiting for dependencies to complete'
          };
        } else {
          return {
            icon: Target,
            color: 'text-gray-600',
            bg: 'bg-gray-50',
            border: 'border-gray-200',
            label: 'Not Started',
            description: 'Ready to begin'
          };
        }
      default:
        return {
          icon: Target,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: 'Unknown',
          description: ''
        };
    }
  };

  const getPriorityBadge = () => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <Badge className={`${colors[stage.blocking_priority] || colors.medium} font-medium`}>
        {stage.blocking_priority?.toUpperCase() || 'MEDIUM'} PRIORITY
      </Badge>
    );
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const canStart = stage.status === 'not_started' && dependencyStatus === 'ready';
  const canComplete = stage.status === 'in_progress';
  const canReset = stage.status !== 'not_started';
  const isBlocked = stage.status === 'not_started' && dependencyStatus === 'blocked';

  const assignedMember = teamMembers.find(member => member.email === stage.assigned_to);

  return (
    <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
            <span>Stage Actions</span>
          </div>
          {getPriorityBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Message Display */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className={`${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Status */}
        <div className={`p-4 rounded-lg border ${statusInfo.bg} ${statusInfo.border}`}>
          <div className="flex items-center gap-3 mb-2">
            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
            <span className={`font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-600">{statusInfo.description}</p>
          
          {/* Assigned Member */}
          {assignedMember && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Assigned to <strong>{assignedMember.name}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Dependency Information */}
        {isBlocked && incompleteDependencies.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-800">Blocked by Dependencies</span>
            </div>
            <div className="space-y-1">
              {incompleteDependencies.map(dep => (
                <div key={dep.id} className="text-sm text-amber-700">
                  • Step {dep.number_index}: {dep.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {canStart && (
            <Button 
              onClick={handleStartStage} 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start Working
            </Button>
          )}

          {canComplete && (
            <Button 
              onClick={handleCompleteStage} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Mark Complete
            </Button>
          )}

          {canReset && (
            <Button 
              onClick={handleResetStage} 
              disabled={isLoading}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Reset Stage
            </Button>
          )}
        </div>

        {/* Stage Information */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Step Number:</span>
              <span className="ml-2 font-medium">#{stage.number_index}</span>
            </div>
            <div>
              <span className="text-gray-500">Category:</span>
              <span className="ml-2 font-medium capitalize">
                {stage.category?.replace('_', ' ')}
              </span>
            </div>
            {stage.dependencies && stage.dependencies.length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-500">Dependencies:</span>
                <span className="ml-2 font-medium">
                  {stage.dependencies.length} stage{stage.dependencies.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}