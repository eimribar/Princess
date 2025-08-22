import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useDrop } from 'react-dnd';
import { differenceInDays, addDays } from 'date-fns';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import GanttBar from './GanttBar';

export default function TimelineRow({ 
  stage, 
  timePeriods, 
  zoom, 
  onStageClick, 
  onStageUpdate,
  onHover,
  isDropTarget = false 
}) {
  const rowRef = useRef(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'gantt-bar',
    canDrop: (item) => item.id === stage.id, // Only allow dropping on the same stage (horizontal drag)
    drop: (item, monitor) => {
      if (!onStageUpdate) return;
      
      const clientOffset = monitor.getClientOffset();
      const rowRect = rowRef.current?.getBoundingClientRect();
      
      if (clientOffset && rowRect) {
        // Calculate the relative position within the timeline area
        const timelineStart = rowRect.left + 320; // Account for stage name column width
        const timelineWidth = rowRect.width - 320;
        const relativeX = clientOffset.x - timelineStart;
        
        // Calculate which time period this corresponds to
        const periodIndex = Math.floor((relativeX / timelineWidth) * timePeriods.length);
        const boundedPeriodIndex = Math.max(0, Math.min(periodIndex, timePeriods.length - 1));
        
        const newStartDate = timePeriods[boundedPeriodIndex];
        const duration = differenceInDays(item.originalEnd, item.originalStart);
        const newEndDate = addDays(newStartDate, Math.max(1, duration)); // Ensure at least 1 day duration
        
        // Update the stage with new dates
        onStageUpdate(item.id, {
          start_date: newStartDate.toISOString(),
          end_date: newEndDate.toISOString()
        });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine the drop ref with the row ref
  const combinedRef = (el) => {
    rowRef.current = el;
    drop(el);
  };

  return (
    <motion.div
      ref={combinedRef}
      className={`
        flex border-b border-slate-100 hover:bg-slate-50/50 transition-colors
        ${isOver && canDrop ? 'bg-blue-50 ring-2 ring-blue-200' : ''}
      `}
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
        {/* Drop zone indicator */}
        {isOver && canDrop && (
          <div className="absolute inset-0 bg-blue-100 border-2 border-dashed border-blue-300 rounded flex items-center justify-center">
            <span className="text-xs text-blue-600 font-medium">Drop here to reschedule</span>
          </div>
        )}
        
        <GanttBar
          stage={stage}
          timePeriods={timePeriods}
          zoom={zoom}
          onStageClick={onStageClick}
          onStageUpdate={onStageUpdate}
          onHover={onHover}
        />
      </div>
    </motion.div>
  );
}