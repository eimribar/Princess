import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Star, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import GanttBar from './GanttBar';

export default function GanttChart({ stages, teamMembers, onStageClick, onStageUpdate }) {
  const [zoom, setZoom] = useState('week'); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedStage, setDraggedStage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const chartRef = useRef(null);

  // Generate time periods based on zoom level
  const timePeriods = useMemo(() => {
    const start = startOfWeek(addDays(currentDate, -30));
    const end = endOfWeek(addDays(currentDate, 90));
    
    if (zoom === 'day') {
      return eachDayOfInterval({ start, end });
    } else if (zoom === 'week') {
      const weeks = [];
      let current = start;
      while (current <= end) {
        weeks.push(current);
        current = addDays(current, 7);
      }
      return weeks;
    }
    // For month view, we'd generate months
    return eachDayOfInterval({ start, end });
  }, [currentDate, zoom]);

  // Calculate stage positioning and duration
  const processedStages = useMemo(() => {
    return stages.map(stage => {
      const assignedMember = teamMembers.find(m => m.email === stage.assigned_to);
      
      // Mock dates for demonstration - in real app, these would come from the stage data
      const startDate = stage.start_date ? new Date(stage.start_date) : addDays(currentDate, stage.number_index * 2);
      const endDate = stage.end_date ? new Date(stage.end_date) : addDays(startDate, stage.estimated_duration || 3);
      
      return {
        ...stage,
        startDate,
        endDate,
        assignedMember,
        duration: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      };
    });
  }, [stages, teamMembers, currentDate]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500';
      case 'in_progress': return 'bg-blue-500';
      case 'blocked': return 'bg-red-500';
      case 'ready': return 'bg-green-400';
      default: return 'bg-gray-300';
    }
  };

  const getStatusBorderColor = (status) => {
    switch (status) {
      case 'completed': return 'border-emerald-600';
      case 'in_progress': return 'border-blue-600';
      case 'blocked': return 'border-red-600';
      case 'ready': return 'border-green-500';
      default: return 'border-gray-400';
    }
  };

  const handleZoom = (newZoom) => {
    setZoom(newZoom);
  };

  const navigateTime = (direction) => {
    const days = zoom === 'day' ? 7 : zoom === 'week' ? 14 : 30;
    setCurrentDate(prev => addDays(prev, direction * days));
  };

  const formatTimeHeader = (date) => {
    if (zoom === 'day') {
      return format(date, 'MMM d');
    } else if (zoom === 'week') {
      return format(date, 'MMM d');
    }
    return format(date, 'MMM d');
  };

  // Group stages by category/phase for better organization
  const stagesByPhase = useMemo(() => {
    const phases = {
      'onboarding': { name: 'Project Initiation', stages: [] },
      'research': { name: 'Research & Discovery', stages: [] },
      'strategy': { name: 'Strategy Development', stages: [] },
      'brand_building': { name: 'Brand Building', stages: [] },
      'brand_collaterals': { name: 'Brand Collaterals', stages: [] },
      'brand_activation': { name: 'Brand Activation', stages: [] },
      'employer_branding': { name: 'Employer Branding', stages: [] },
      'project_closure': { name: 'Project Closure', stages: [] }
    };

    processedStages.forEach(stage => {
      const category = stage.category || 'onboarding';
      if (phases[category]) {
        phases[category].stages.push(stage);
      }
    });

    return Object.entries(phases).filter(([_, phase]) => phase.stages.length > 0);
  }, [processedStages]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Gantt Controls */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTime(-1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="min-w-32"
              >
                {format(currentDate, 'MMM yyyy')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTime(1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 border-l pl-4">
              <Button
                variant={zoom === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleZoom('day')}
              >
                Day
              </Button>
              <Button
                variant={zoom === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleZoom('week')}
              >
                Week
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>Not Started</span>
            </div>
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto" ref={chartRef}>
            <div className="min-w-[1200px]">
              {/* Time Header */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                <div className="w-80 p-3 font-semibold text-slate-700 border-r border-slate-200">
                  Stage
                </div>
                <div className="flex-1 flex">
                  {timePeriods.map((period, index) => (
                    <div
                      key={index}
                      className="flex-1 min-w-20 p-2 text-center text-xs font-medium text-slate-600 border-r border-slate-100"
                    >
                      {formatTimeHeader(period)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stages by Phase */}
              {stagesByPhase.map(([phaseKey, phase]) => (
                <div key={phaseKey}>
                  {/* Phase Header */}
                  <div className="flex bg-slate-100/50 border-b border-slate-200">
                    <div className="w-80 p-3 font-semibold text-slate-800 border-r border-slate-200">
                      {phase.name} ({phase.stages.length})
                    </div>
                    <div className="flex-1 bg-slate-50/50"></div>
                  </div>

                  {/* Phase Stages */}
                  {phase.stages.map((stage) => (
                    <motion.div
                      key={stage.id}
                      className="flex border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
                    >
                      {/* Stage Name Column */}
                      <div className="w-80 p-3 border-r border-slate-200 flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {stage.number_index}
                          </span>
                          
                          {stage.is_deliverable && (
                            <Star className="w-3 h-3 text-amber-500 fill-current" />
                          )}
                          
                          <span className="font-medium text-slate-700 truncate flex-1">
                            {stage.name}
                          </span>

                          {stage.assignedMember && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Avatar className="w-6 h-6 border border-slate-200">
                                  <AvatarImage src={stage.assignedMember.profile_image} />
                                  <AvatarFallback className="text-xs bg-slate-100">
                                    {stage.assignedMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                {stage.assignedMember.name}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      {/* Timeline Column */}
                      <div className="flex-1 relative h-12 flex items-center">
                        <GanttBar
                          stage={stage}
                          timePeriods={timePeriods}
                          zoom={zoom}
                          onStageClick={onStageClick}
                          onStageUpdate={onStageUpdate}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-slate-500 bg-blue-50 px-3 py-2 rounded-full">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Today: {format(new Date(), 'MMMM d, yyyy')}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}