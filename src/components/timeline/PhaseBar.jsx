import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { isWithinInterval, startOfDay, endOfMonth, addDays } from 'date-fns';
import { Progress } from '@/components/ui/progress';

export default function PhaseBar({ phase, timePeriods, onPhaseClick }) {
  const barInfo = useMemo(() => {
    const totalPeriods = timePeriods.length;
    const periodWidth = 100 / totalPeriods; // percentage width per period
    
    // Define phase dates
    const phaseStartDate = new Date(phase.start_date);
    const phaseEndDate = new Date(phase.end_date);
    
    // Find start and end positions
    let startIndex = -1;
    let endIndex = -1;
    
    timePeriods.forEach((period, index) => {
      const periodStart = startOfDay(period);
      const periodEnd = endOfMonth(period); // For month view
      
      // Check if phase starts in this period
      if (startIndex === -1 && isWithinInterval(phaseStartDate, { start: periodStart, end: periodEnd })) {
        startIndex = index;
      }
      
      // Check if phase ends in this period  
      if (isWithinInterval(phaseEndDate, { start: periodStart, end: periodEnd })) {
        endIndex = index;
      }
    });

    // If phase is outside visible range, don't show it
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
  }, [phase, timePeriods]);

  if (!barInfo?.visible) {
    return null;
  }

  const handleClick = (e) => {
    e.stopPropagation();
    if (onPhaseClick) {
      onPhaseClick(phase);
    }
  };

  return (
    <motion.div
      className="absolute top-1/2 transform -translate-y-1/2 h-12 group cursor-pointer"
      style={{
        left: barInfo.left,
        width: barInfo.width,
        minWidth: '80px'
      }}
      whileHover={{ scale: 1.02, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Phase Bar */}
      <div
        className={`
          h-full rounded-lg border-2 relative overflow-hidden
          ${phase.color} border-opacity-70 shadow-lg
          hover:shadow-xl transition-all duration-200
          group-hover:brightness-110
        `}
      >
        {/* Progress Bar Inside */}
        <div 
          className="absolute inset-0 bg-white bg-opacity-20"
          style={{ width: `${phase.progressPercentage}%` }}
        />
        
        {/* Content */}
        <div className="h-full flex items-center justify-between px-3 relative z-10">
          <div className="flex flex-col">
            <span className="text-white text-sm font-semibold truncate">
              {phase.name}
            </span>
            <span className="text-white text-xs opacity-90">
              {phase.completedCount}/{phase.stageCount} stages
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-medium">
              {phase.progressPercentage}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}