import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  Calendar, 
  Users, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Target,
  Flag,
  TrendingUp,
  Lock
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, addMonths, isSameMonth, isWithinInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/contexts/SupabaseUserContext';
import { cn } from '@/lib/utils';

export default function MilestonesBoard({ 
  stages, 
  teamMembers = [], 
  onStageUpdate,
  onStageClick,
  currentView = 'quarter' // 'month' or 'quarter'
}) {
  const { user } = useUser();
  const isClient = user?.role === 'client';
  const canDrag = !isClient;

  const [selectedPeriod, setSelectedPeriod] = useState(new Date());
  const [draggedMilestone, setDraggedMilestone] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Filter only milestone stages
  const milestones = useMemo(() => {
    return stages.filter(s => s.is_milestone || s.is_deliverable);
  }, [stages]);

  // Generate time periods based on view
  const periods = useMemo(() => {
    const periods = [];
    const baseDate = selectedPeriod;
    
    if (currentView === 'month') {
      // Show 3 months
      for (let i = -1; i <= 1; i++) {
        const date = addMonths(baseDate, i);
        periods.push({
          id: format(date, 'yyyy-MM'),
          label: format(date, 'MMMM yyyy'),
          shortLabel: format(date, 'MMM'),
          start: startOfMonth(date),
          end: endOfMonth(date),
          isCurrent: i === 0
        });
      }
    } else {
      // Show 4 quarters
      for (let i = 0; i < 4; i++) {
        const date = addMonths(baseDate, i * 3);
        const quarterStart = startOfQuarter(date);
        const quarterEnd = endOfQuarter(date);
        periods.push({
          id: `Q${Math.floor(date.getMonth() / 3) + 1}-${date.getFullYear()}`,
          label: `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`,
          shortLabel: `Q${Math.floor(date.getMonth() / 3) + 1}`,
          start: quarterStart,
          end: quarterEnd,
          isCurrent: isWithinInterval(new Date(), { start: quarterStart, end: quarterEnd })
        });
      }
    }
    
    return periods;
  }, [selectedPeriod, currentView]);

  // Group milestones by period
  const milestonesByPeriod = useMemo(() => {
    const grouped = {};
    
    periods.forEach(period => {
      grouped[period.id] = milestones.filter(milestone => {
        if (!milestone.start_date) return false;
        const startDate = parseISO(milestone.start_date);
        return isWithinInterval(startDate, { start: period.start, end: period.end });
      });
    });
    
    return grouped;
  }, [milestones, periods]);

  // Calculate dependencies met percentage
  const getDependenciesMetPercentage = (stage) => {
    if (!stage.dependencies || stage.dependencies.length === 0) return 100;
    
    const completedDeps = stage.dependencies.filter(depId => {
      const dep = stages.find(s => s.id === depId);
      return dep?.status === 'completed';
    });
    
    return Math.round((completedDeps.length / stage.dependencies.length) * 100);
  };

  // Get approval requirements
  const getApprovalRequirements = (stage) => {
    if (!stage.is_deliverable) return null;
    
    const requirements = [];
    if (stage.requires_client_approval) requirements.push('Client');
    if (stage.requires_internal_approval) requirements.push('Internal');
    
    return requirements.length > 0 ? requirements : null;
  };

  // Handle drag and drop
  const handleDragStart = (e, milestone) => {
    if (!canDrag) return;
    setDraggedMilestone(milestone);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, periodId) => {
    e.preventDefault();
    if (!canDrag) return;
    setDragOverColumn(periodId);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, period) => {
    e.preventDefault();
    if (!canDrag || !draggedMilestone) return;
    
    // Calculate new date (middle of the period)
    const newDate = new Date(
      (period.start.getTime() + period.end.getTime()) / 2
    );
    
    // Update the milestone
    onStageUpdate(draggedMilestone.id, {
      start_date: newDate.toISOString(),
      end_date: new Date(newDate.getTime() + (draggedMilestone.estimated_duration || 3) * 24 * 60 * 60 * 1000).toISOString()
    });
    
    setDraggedMilestone(null);
    setDragOverColumn(null);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'blocked':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get priority color
  const getPriorityColor = (stage) => {
    if (stage.blocking_priority === 'critical') return 'text-red-500';
    if (stage.blocking_priority === 'high') return 'text-orange-500';
    if (stage.blocking_priority === 'medium') return 'text-yellow-500';
    return 'text-gray-400';
  };

  // Navigation
  const navigatePeriod = (direction) => {
    const months = currentView === 'month' ? 1 : 3;
    setSelectedPeriod(prev => addMonths(prev, direction * months));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Milestones Board</h2>
            <Badge variant="secondary">
              {milestones.length} milestones
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigatePeriod(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="px-3 py-1 text-sm font-medium">
              {format(selectedPeriod, currentView === 'month' ? 'MMMM yyyy' : 'yyyy')}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigatePeriod(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPeriod(new Date())}
              className="ml-4"
            >
              Today
            </Button>
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">
              {milestones.filter(m => m.status === 'completed').length} Completed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600">
              {milestones.filter(m => m.status === 'in_progress').length} In Progress
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">
              {milestones.filter(m => m.status === 'blocked').length} Blocked
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span className="text-gray-600">
              {milestones.filter(m => getDependenciesMetPercentage(m) < 100).length} Pending Dependencies
            </span>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full min-w-max">
          {periods.map((period) => (
            <div
              key={period.id}
              className={cn(
                "flex-1 min-w-[300px] border-r border-gray-200 flex flex-col",
                period.isCurrent && "bg-blue-50/30",
                dragOverColumn === period.id && "bg-blue-100/50"
              )}
              onDragOver={(e) => handleDragOver(e, period.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, period)}
            >
              {/* Column header */}
              <div className={cn(
                "px-4 py-3 border-b",
                period.isCurrent ? "bg-blue-100 border-blue-200" : "bg-gray-100 border-gray-200"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{period.label}</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {milestonesByPeriod[period.id]?.length || 0} milestones
                    </p>
                  </div>
                  {period.isCurrent && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              </div>

              {/* Milestone cards */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence>
                  {milestonesByPeriod[period.id]?.map((milestone) => (
                    <motion.div
                      key={milestone.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      draggable={canDrag && !milestone.is_locked}
                      onDragStart={(e) => handleDragStart(e, milestone)}
                      className={cn(
                        "cursor-pointer",
                        canDrag && !milestone.is_locked && "cursor-move"
                      )}
                    >
                      <Card 
                        className={cn(
                          "hover:shadow-md transition-shadow",
                          milestone.is_locked && "opacity-75"
                        )}
                        onClick={() => onStageClick(milestone.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {milestone.is_deliverable ? (
                                <Star className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Flag className={cn("w-4 h-4", getPriorityColor(milestone))} />
                              )}
                              <span className="font-medium text-sm line-clamp-2">
                                {milestone.name}
                              </span>
                            </div>
                            {milestone.is_locked && (
                              <Lock className="w-3 h-3 text-gray-500" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getStatusColor(milestone.status))}
                            >
                              {milestone.status}
                            </Badge>
                            {milestone.is_deliverable && (
                              <Badge variant="secondary" className="text-xs">
                                Deliverable
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          {/* Due date */}
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {milestone.start_date ? format(parseISO(milestone.start_date), 'MMM d') : 'Not scheduled'}
                            </span>
                          </div>
                          
                          {/* Dependencies progress */}
                          {milestone.dependencies && milestone.dependencies.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">Dependencies</span>
                                <span className="font-medium">
                                  {getDependenciesMetPercentage(milestone)}%
                                </span>
                              </div>
                              <Progress 
                                value={getDependenciesMetPercentage(milestone)} 
                                className="h-1.5"
                              />
                            </div>
                          )}
                          
                          {/* Approvals required */}
                          {getApprovalRequirements(milestone) && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <div className="flex gap-1">
                                {getApprovalRequirements(milestone).map(req => (
                                  <Badge key={req} variant="outline" className="text-xs">
                                    {req}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Assigned to */}
                          {milestone.assigned_to && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {teamMembers.find(m => m.email === milestone.assigned_to)?.name?.[0] || '?'}
                                </span>
                              </div>
                              <span className="text-gray-600 text-xs">
                                {teamMembers.find(m => m.email === milestone.assigned_to)?.name || milestone.assigned_to}
                              </span>
                            </div>
                          )}
                          
                          {/* Blockers indicator */}
                          {milestone.status === 'blocked' && (
                            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Blocked by dependencies</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Empty state */}
                {(!milestonesByPeriod[period.id] || milestonesByPeriod[period.id].length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No milestones</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions for client */}
      {isClient && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
          <p className="text-sm text-blue-700">
            <span className="font-medium">View Only:</span> Review upcoming milestones and deliverables. Click on any card for details.
          </p>
        </div>
      )}
    </div>
  );
}