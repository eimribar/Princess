import React, { useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { isWithinInterval, isSameDay, startOfDay, endOfDay, addDays, differenceInDays, endOfMonth } from 'date-fns';
import { Lock, AlertTriangle, CheckCircle, Clock, Star, GripVertical } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDrag, useDrop } from 'react-dnd';
import { useUser } from '@/contexts/SupabaseUserContext';
import { canManageTeamMember } from '@/lib/permissions';

export default function GanttBar({ stage, timePeriods, zoom, onStageClick, onStageUpdate, onHover }) {
  const { user } = useUser();
  const [isResizing, setIsResizing] = useState(false);
  const [resizeMode, setResizeMode] = useState(null); // 'start' or 'end'
  const [dragPreview, setDragPreview] = useState(null);
  const barRef = useRef(null);

  // Check if user can edit this stage
  const canEdit = canManageTeamMember(user, { team_type: 'agency' }); // Simplified permission check
  
  const barInfo = useMemo(() => {
    const totalPeriods = timePeriods.length;
    const periodWidth = 100 / totalPeriods; // percentage width per period
    
    // Define stage dates at the beginning
    const stageStartDate = new Date(stage.start_date);
    const stageEndDate = new Date(stage.end_date);
    
    // Find start and end positions
    let startIndex = -1;
    let endIndex = -1;
    
    timePeriods.forEach((period, index) => {
      const periodStart = startOfDay(period);
      // Fix: For month view, use endOfMonth to cover the entire month
      const periodEnd = zoom === 'week' 
        ? endOfDay(addDays(period, 6))  // Week: 7 days
        : zoom === 'month' 
          ? endOfMonth(period)  // Month: entire month
          : endOfDay(period);  // Day: just that day
      
      if (startIndex === -1 && (isSameDay(stageStartDate, period) || isWithinInterval(stageStartDate, { start: periodStart, end: periodEnd }))) {
        startIndex = index;
      }
      
      if (isSameDay(stageEndDate, period) || isWithinInterval(stageEndDate, { start: periodStart, end: periodEnd })) {
        endIndex = index;
      }
    });

    // If stage is outside visible range, don't show it
    if (startIndex === -1 && endIndex === -1) {
      // Better debugging to see the actual date mismatch
      if (stage.number_index === 1) { // Only log once for the first stage
        console.log('Stage dates:', stageStartDate.toDateString(), 'to', stageEndDate.toDateString());
        console.log('Timeline showing:', timePeriods[0]?.toDateString(), 'to', timePeriods[timePeriods.length - 1]?.toDateString());
      }
      return null;
    }

    // Clamp to visible range
    startIndex = Math.max(0, startIndex);
    endIndex = Math.min(totalPeriods - 1, endIndex);
    
    const leftPosition = startIndex * periodWidth;
    const width = Math.max(periodWidth, (endIndex - startIndex + 1) * periodWidth);
    
    return {
      left: `${leftPosition}%`,
      width: `${width}%`,
      visible: true
    };
  }, [stage, timePeriods, zoom]);

  if (!barInfo?.visible) {
    return null;
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-emerald-500',
          border: 'border-emerald-600',
          icon: CheckCircle,
          opacity: 'opacity-90'
        };
      case 'in_progress':
        return {
          bg: 'bg-blue-500',
          border: 'border-blue-600',
          icon: Clock,
          opacity: 'opacity-90'
        };
      case 'blocked':
        return {
          bg: 'bg-red-500',
          border: 'border-red-600',
          icon: AlertTriangle,
          opacity: 'opacity-90'
        };
      case 'ready':
        return {
          bg: 'bg-green-400',
          border: 'border-green-500',
          icon: Clock,
          opacity: 'opacity-80'
        };
      default:
        return {
          bg: 'bg-gray-300',
          border: 'border-gray-400',
          icon: Clock,
          opacity: 'opacity-70'
        };
    }
  };

  const statusConfig = getStatusConfig(stage.status);
  const StatusIcon = statusConfig.icon;

  const handleClick = (e) => {
    e.stopPropagation();
    if (onStageClick) {
      onStageClick(stage.id);
    }
  };

  const progressPercentage = useMemo(() => {
    if (stage.status === 'completed') return 100;
    if (stage.status === 'in_progress') return 65; // Mock progress
    return 0;
  }, [stage.status]);

  // Drag and Drop functionality
  const [{ isDragging }, drag] = useDrag({
    type: 'gantt-bar',
    item: { 
      id: stage.id, 
      stage,
      originalStart: new Date(stage.start_date),
      originalEnd: new Date(stage.end_date)
    },
    canDrag: canEdit && !isResizing,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Remove the drop functionality from individual bars - this will be handled by the timeline row

  // Resize functionality
  const handleResizeStart = (mode, e) => {
    if (!canEdit) return;
    e.stopPropagation();
    setIsResizing(true);
    setResizeMode(mode);
    
    const handleMouseMove = (e) => {
      if (!barRef.current) return;
      
      const barRect = barRef.current.getBoundingClientRect();
      const periodIndex = Math.floor(
        ((e.clientX - barRect.left) / barRect.width) * timePeriods.length
      );
      
      const newDate = timePeriods[Math.max(0, Math.min(periodIndex, timePeriods.length - 1))];
      
      if (mode === 'start') {
        const stageEndDate = new Date(stage.end_date);
        if (newDate < stageEndDate) {
          setDragPreview({ start: newDate, end: stageEndDate });
        }
      } else {
        const stageStartDate = new Date(stage.start_date);
        if (newDate > stageStartDate) {
          setDragPreview({ start: stageStartDate, end: newDate });
        }
      }
    };
    
    const handleMouseUp = () => {
      if (dragPreview && onStageUpdate) {
        onStageUpdate(stage.id, {
          start_date: dragPreview.start.toISOString(),
          end_date: dragPreview.end.toISOString()
        });
      }
      setIsResizing(false);
      setResizeMode(null);
      setDragPreview(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Validate dependencies (basic implementation)
  const validateDependencies = (stageToMove, newStart, newEnd) => {
    // TODO: Implement proper dependency validation
    // For now, just check if the new dates are valid
    return newStart && newEnd && newStart <= newEnd;
  };

  // Combine drag ref only (drop is handled by timeline row)
  const combinedRef = (el) => {
    barRef.current = el;
    drag(el);
  };

  return (
    <motion.div
          ref={combinedRef}
          className={`
            absolute top-1/2 transform -translate-y-1/2 h-8 group
            ${canEdit ? 'cursor-move' : 'cursor-pointer'}
            ${isDragging ? 'opacity-30 cursor-grabbing' : ''}
          `}
          style={{
            left: barInfo.left,
            width: barInfo.width,
            minWidth: '24px'
          }}
          whileHover={{ scale: canEdit ? 1.02 : 1.01, zIndex: 10 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClick}
          onMouseEnter={(e) => {
            if (onHover) {
              const rect = e.currentTarget.getBoundingClientRect();
              onHover(stage.id, { x: rect.left + rect.width / 2, y: rect.bottom });
            }
          }}
          onMouseLeave={() => {
            if (onHover) {
              onHover(null, null);
            }
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: stage.number_index * 0.02 }}
        >
          {/* Main Bar */}
          <div
            className={`
              h-full rounded-md border-2 relative overflow-hidden
              ${statusConfig.bg} ${statusConfig.border} ${statusConfig.opacity}
              shadow-sm hover:shadow-md transition-all duration-200
              group-hover:brightness-110
            `}
          >
            {/* Progress Fill for In-Progress Items */}
            {stage.status === 'in_progress' && (
              <motion.div
                className="absolute inset-0 bg-blue-600 opacity-60"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            )}

            {/* Resize Handles */}
            {canEdit && (
              <>
                <div
                  className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-transparent hover:bg-black/20 transition-colors group-hover:visible invisible"
                  onMouseDown={(e) => handleResizeStart('start', e)}
                  title="Resize start date"
                />
                <div
                  className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-transparent hover:bg-black/20 transition-colors group-hover:visible invisible"
                  onMouseDown={(e) => handleResizeStart('end', e)}
                  title="Resize end date"
                />
              </>
            )}

            {/* Remove drag handle text - will show in dependency card instead */}
            
            {/* Content */}
            <div className="h-full flex items-center justify-between px-2 relative z-10">
              <div className="flex items-center gap-1 overflow-hidden">
                
                {stage.is_deliverable && (
                  <Star className="w-3 h-3 text-white fill-current flex-shrink-0" />
                )}
                
                <span className="text-white text-xs font-medium truncate">
                  {stage.name}
                </span>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <StatusIcon className="w-3 h-3 text-white" />
                
                {stage.status === 'blocked' && (
                  <Lock className="w-3 h-3 text-white" />
                )}
              </div>
            </div>

            {/* Dependency Indicators */}
            {stage.dependencies && stage.dependencies.length > 0 && (
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-purple-400 rounded-full border border-white shadow-sm" />
            )}

            {/* Critical Path Indicator */}
            {stage.is_critical_path && (
              <div className="absolute inset-0 border-2 border-orange-400 rounded-md animate-pulse" />
            )}
          </div>

        </motion.div>
  );
}