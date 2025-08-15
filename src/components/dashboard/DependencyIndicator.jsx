import React from 'react';
import { Lock, Play } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function DependencyIndicator({ status, dependencies = [], stages = [] }) {
  // Only show indicators for actionable statuses (blocked or ready)
  if (status !== 'blocked' && status !== 'ready') {
    return null;
  }

  const dependencyNames = dependencies
    .map(depId => {
        const stage = stages.find(s => s.id === depId);
        // Only show dependencies that are NOT complete
        return stage && stage.status !== 'completed' ? stage.name : null;
    })
    .filter(Boolean);

  const tooltipContent = status === 'blocked'
    ? `Blocked by: ${dependencyNames.slice(0, 3).join(', ')}${dependencyNames.length > 3 ? '...' : ''}`
    : 'All dependencies complete. Ready to start.';

  const icon = status === 'blocked'
    ? <Lock className="w-2.5 h-2.5 text-red-600" />
    : <Play className="w-2.5 h-2.5 text-emerald-600 fill-emerald-500" />;
  
  const bgColor = status === 'blocked' ? 'bg-red-100' : 'bg-emerald-100';

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`absolute -top-1 -right-1 w-5 h-5 ${bgColor} rounded-full flex items-center justify-center shadow-md border-2 border-white`}>
            {icon}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}