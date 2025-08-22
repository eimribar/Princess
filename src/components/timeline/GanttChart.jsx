import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Star, Lock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import GanttBar from './GanttBar';
import PhaseBar from './PhaseBar';
import TimelineRow from './TimelineRow';
import TimelineExportDialog from './TimelineExportDialog';

export default function GanttChart({ stages, teamMembers, onStageClick, onStageUpdate, zoom: controlledZoom, onZoomChange }) {
  // Use controlled zoom from parent if provided, otherwise manage locally
  const [localZoom, setLocalZoom] = useState('week');
  const zoom = controlledZoom || localZoom;
  const setZoom = onZoomChange || setLocalZoom;
  
  // Initialize currentDate based on actual stage dates or August 2025
  const [currentDate, setCurrentDate] = useState(() => {
    // Default to August 2025 to match the existing data
    const defaultDate = new Date('2025-08-01');
    
    if (stages && stages.length > 0) {
      // Find the earliest stage start date
      const validDates = stages.map(s => s.start_date).filter(Boolean);
      if (validDates.length > 0) {
        const earliestDate = new Date(Math.min(...validDates.map(d => new Date(d).getTime())));
        console.log('Using earliest stage date:', earliestDate.toDateString());
        return earliestDate;
      }
    }
    console.log('Using default date:', defaultDate.toDateString());
    return defaultDate;
  });
  const [draggedStage, setDraggedStage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [hoveredStageId, setHoveredStageId] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const chartRef = useRef(null);

  // Update currentDate when stages change
  useEffect(() => {
    if (stages && stages.length > 0) {
      const validDates = stages.map(s => s.start_date).filter(Boolean);
      if (validDates.length > 0) {
        const earliestDate = new Date(Math.min(...validDates.map(d => new Date(d).getTime())));
        console.log('Updating currentDate to earliest stage:', earliestDate.toDateString());
        setCurrentDate(earliestDate);
      } else {
        // If no valid dates, use August 2025
        const fallbackDate = new Date('2025-08-01');
        console.log('No valid stage dates, using fallback:', fallbackDate.toDateString());
        setCurrentDate(fallbackDate);
      }
    }
  }, [stages]);

  // Calculate stage positioning and duration
  const processedStages = useMemo(() => {
    return stages.map(stage => {
      const assignedMember = teamMembers.find(m => m.email === stage.assigned_to);
      
      // Keep consistent field names - use snake_case for dates
      const start_date = stage.start_date ? new Date(stage.start_date) : new Date();
      const end_date = stage.end_date ? new Date(stage.end_date) : addDays(start_date, stage.estimated_duration || 3);
      
      return {
        ...stage,
        start_date: start_date.toISOString(),
        end_date: end_date.toISOString(),
        assignedMember,
        duration: Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24))
      };
    });
  }, [stages, teamMembers]);

  // Generate time periods based on zoom level and actual project data
  const timePeriods = useMemo(() => {
    // Calculate project date range from actual stage data
    const stageDates = processedStages.map(stage => [stage.start_date, stage.end_date]).flat().filter(Boolean);
    
    let projectStart, projectEnd;
    if (stageDates.length > 0) {
      projectStart = new Date(Math.min(...stageDates.map(d => new Date(d).getTime())));
      projectEnd = new Date(Math.max(...stageDates.map(d => new Date(d).getTime())));
    } else {
      // Fallback if no stage dates available
      projectStart = currentDate;
      projectEnd = addDays(currentDate, 365);
    }
    
    // Add buffer for better visualization
    const bufferStart = addDays(projectStart, -30);
    const bufferEnd = addDays(projectEnd, 60);
    
    if (zoom === 'quarter') {
      // New quarterly view for very long projects
      const start = startOfMonth(bufferStart);
      const end = endOfMonth(bufferEnd);
      const quarters = [];
      let current = start;
      while (current <= end) {
        quarters.push(current);
        current = addDays(current, 90); // 3 months per quarter
      }
      return quarters;
    } else if (zoom === 'month') {
      const start = startOfMonth(bufferStart);
      const end = endOfMonth(bufferEnd);
      return eachMonthOfInterval({ start, end });
    } else if (zoom === 'week') {
      const start = startOfWeek(bufferStart);
      const end = endOfWeek(bufferEnd);
      const weeks = [];
      let current = start;
      while (current <= end) {
        weeks.push(current);
        current = addDays(current, 7);
      }
      return weeks;
    } else { // day view
      const start = startOfWeek(bufferStart);
      const end = endOfWeek(bufferEnd);
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, zoom, processedStages]);

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
    } else if (zoom === 'month') {
      return format(date, 'MMM yyyy');
    } else if (zoom === 'quarter') {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${format(date, 'yyyy')}`;
    }
    return format(date, 'MMM d');
  };

  // Group stages by category/phase for better organization
  const stagesByPhase = useMemo(() => {
    const phases = {
      'onboarding': { name: 'Project Initiation', stages: [], color: 'bg-blue-500' },
      'research': { name: 'Research & Discovery', stages: [], color: 'bg-purple-500' },
      'strategy': { name: 'Strategy Development', stages: [], color: 'bg-indigo-500' },
      'brand_building': { name: 'Brand Building', stages: [], color: 'bg-pink-500' },
      'brand_collaterals': { name: 'Brand Collaterals', stages: [], color: 'bg-orange-500' },
      'brand_activation': { name: 'Brand Activation', stages: [], color: 'bg-green-500' },
      'employer_branding': { name: 'Employer Branding', stages: [], color: 'bg-teal-500' },
      'project_closure': { name: 'Project Closure', stages: [], color: 'bg-gray-500' }
    };

    processedStages.forEach(stage => {
      const category = stage.category || 'onboarding';
      if (phases[category]) {
        phases[category].stages.push(stage);
      }
    });

    // Sort stages within each phase by number_index in ascending order (1, 2, 3...)
    Object.values(phases).forEach(phase => {
      phase.stages.sort((a, b) => a.number_index - b.number_index);
    });

    return Object.entries(phases).filter(([_, phase]) => phase.stages.length > 0);
  }, [processedStages]);

  // Create phase-level data for monthly view
  const phasesForMonthlyView = useMemo(() => {
    return stagesByPhase.map(([phaseKey, phase]) => {
      const phaseStages = phase.stages;
      if (phaseStages.length === 0) return null;
      
      // Calculate phase start and end dates
      const startDates = phaseStages.map(s => new Date(s.start_date).getTime());
      const endDates = phaseStages.map(s => new Date(s.end_date).getTime());
      
      const phaseStart = new Date(Math.min(...startDates));
      const phaseEnd = new Date(Math.max(...endDates));
      
      // Calculate phase progress
      const completed = phaseStages.filter(s => s.status === 'completed').length;
      const inProgress = phaseStages.filter(s => s.status === 'in_progress').length;
      const total = phaseStages.length;
      const progressPercentage = Math.round((completed / total) * 100);
      
      let status = 'not_started';
      if (completed === total) status = 'completed';
      else if (completed > 0 || inProgress > 0) status = 'in_progress';
      
      return {
        id: phaseKey,
        name: phase.name,
        start_date: phaseStart.toISOString(),
        end_date: phaseEnd.toISOString(),
        stages: phaseStages,
        stageCount: total,
        completedCount: completed,
        progressPercentage,
        status,
        color: phase.color
      };
    }).filter(Boolean);
  }, [stagesByPhase]);

  return (
    <DndProvider backend={HTML5Backend}>
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
              <Button
                variant={zoom === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleZoom('month')}
              >
                Month
              </Button>
              <Button
                variant={zoom === 'quarter' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleZoom('quarter')}
                className="bg-blue-50 hover:bg-blue-100"
              >
                Quarter
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-slate-600 border-l pl-4">
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
        </div>


        {/* Gantt Chart */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm" ref={chartRef}>
          <div className="overflow-x-auto">
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

              {/* Show phases in monthly view, stages in other views */}
              {zoom === 'month' ? (
                // Monthly view: Show phase-level bars
                phasesForMonthlyView.map((phase) => (
                  <div key={phase.id} className="flex border-b border-slate-200 hover:bg-slate-50 h-16">
                    <div className="w-80 p-3 border-r border-slate-200">
                      <div className="flex items-center justify-between h-full">
                        <div>
                          <div className="font-semibold text-slate-800">{phase.name}</div>
                          <div className="text-xs text-slate-500">
                            {phase.completedCount}/{phase.stageCount} stages completed
                          </div>
                        </div>
                        <div className="text-sm font-medium text-slate-700">
                          {phase.progressPercentage}%
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      <PhaseBar
                        phase={phase}
                        timePeriods={timePeriods}
                        onPhaseClick={() => {
                          // When clicking a phase, zoom to week view for that phase
                          if (onZoomChange) {
                            onZoomChange('week');
                          }
                          // Optionally scroll to first stage of the phase
                          const firstStage = phase.stages[0];
                          if (firstStage && onStageClick) {
                            onStageClick(firstStage.id);
                          }
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                // Week/Day view: Show individual stages grouped by phase
                stagesByPhase.map(([phaseKey, phase]) => (
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
                      <TimelineRow
                        key={stage.id}
                        stage={stage}
                        timePeriods={timePeriods}
                        zoom={zoom}
                        onStageClick={onStageClick}
                        onStageUpdate={onStageUpdate}
                        onHover={(stageId, position) => {
                          setHoveredStageId(stageId);
                          setHoverPosition(position);
                        }}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
            
            {/* Dependency visualization overlay will be added here */}
          </div>
        </div>
        
        {/* Dependency hover card will be added here */}

        {/* Today Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-slate-500 bg-blue-50 px-3 py-2 rounded-full">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Today: {format(new Date(), 'MMMM d, yyyy')}
          </div>
        </div>

        {/* Export Dialog */}
        <TimelineExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          stages={processedStages}
          teamMembers={teamMembers}
          chartRef={chartRef}
        />
        </div>
      </TooltipProvider>
    </DndProvider>
  );
}