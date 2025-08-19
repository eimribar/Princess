import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { isWithinInterval, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { Lock, AlertTriangle, CheckCircle, Clock, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function GanttBar({ stage, timePeriods, zoom, onStageClick, onStageUpdate }) {
  const barInfo = useMemo(() => {
    const totalPeriods = timePeriods.length;
    const periodWidth = 100 / totalPeriods; // percentage width per period
    
    // Find start and end positions
    let startIndex = -1;
    let endIndex = -1;
    
    timePeriods.forEach((period, index) => {
      const periodStart = startOfDay(period);
      const periodEnd = zoom === 'week' ? endOfDay(new Date(period.getTime() + 6 * 24 * 60 * 60 * 1000)) : endOfDay(period);
      
      if (startIndex === -1 && (isSameDay(stage.startDate, period) || isWithinInterval(stage.startDate, { start: periodStart, end: periodEnd }))) {
        startIndex = index;
      }
      
      if (isSameDay(stage.endDate, period) || isWithinInterval(stage.endDate, { start: periodStart, end: periodEnd })) {
        endIndex = index;
      }
    });

    // If stage is outside visible range, don't show it
    if (startIndex === -1 && endIndex === -1) {
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          className="absolute top-1/2 transform -translate-y-1/2 h-6 cursor-pointer group"
          style={{
            left: barInfo.left,
            width: barInfo.width,
            minWidth: '24px'
          }}
          whileHover={{ scale: 1.02, zIndex: 10 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClick}
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

          {/* Hover Details */}
          <div className="absolute -top-8 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none">
            <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
              {stage.duration} days • {stage.status.replace('_', ' ')}
            </div>
          </div>
        </motion.div>
      </TooltipTrigger>
      
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-2">
          <div className="font-semibold">{stage.name}</div>
          <div className="text-xs space-y-1">
            <div>Duration: {stage.duration} days</div>
            <div>Status: {stage.status.replace('_', ' ')}</div>
            {stage.assignedMember && (
              <div>Assigned: {stage.assignedMember.name}</div>
            )}
            {stage.dependencies && stage.dependencies.length > 0 && (
              <div>Dependencies: {stage.dependencies.length} stage(s)</div>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}