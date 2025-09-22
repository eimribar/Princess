import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  IterationCw,
  Calendar,
  User,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

export default function DeliverableTooltip({ 
  stage, 
  deliverable, 
  isVisible, 
  position = { x: 0, y: 0 } 
}) {
  if (!stage.is_deliverable || !deliverable) return null;

  // Calculate position to avoid viewport edges
  const getTooltipPosition = () => {
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const padding = 10;
    
    let x = position.x;
    let y = position.y - tooltipHeight - 20; // Default: above the star
    
    // Check if tooltip would go off right edge
    if (x + tooltipWidth > window.innerWidth - padding) {
      x = window.innerWidth - tooltipWidth - padding;
    }
    
    // Check if tooltip would go off left edge
    if (x < padding) {
      x = padding;
    }
    
    // Check if tooltip would go off top edge
    if (y < padding) {
      y = position.y + 60; // Show below instead
    }
    
    return { x, y };
  };

  const tooltipPos = getTooltipPosition();

  const getStatusIcon = () => {
    switch (deliverable.status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'pending_approval':
      case 'submitted':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'wip':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getIterationColor = () => {
    const current = deliverable.current_iteration || 0;
    const max = deliverable.max_iterations || 3;
    const percentage = (current / max) * 100;
    
    if (percentage >= 100) return 'text-red-600 bg-red-50';
    if (percentage >= 66) return 'text-amber-600 bg-amber-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed z-50 pointer-events-none"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px`,
            width: '320px'
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">
                    {deliverable.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Step {stage.number_index} • {stage.category?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between bg-gray-50 rounded-md p-2">
              <span className="text-xs font-medium text-gray-600">Status:</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                deliverable.status === 'approved' ? 'bg-green-100 text-green-700' :
                deliverable.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                deliverable.status === 'declined' ? 'bg-red-100 text-red-700' :
                deliverable.status === 'wip' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {deliverable.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Iteration Progress */}
            {deliverable.current_iteration !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-600">
                    <IterationCw className="w-3 h-3" />
                    Iterations
                  </span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${getIterationColor()}`}>
                    {deliverable.current_iteration} / {deliverable.max_iterations || 3}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      deliverable.current_iteration >= (deliverable.max_iterations || 3) ? 'bg-red-500' :
                      deliverable.current_iteration >= 2 ? 'bg-amber-500' :
                      'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (deliverable.current_iteration / (deliverable.max_iterations || 3)) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}

            {/* Version Count */}
            {deliverable.versions && deliverable.versions.length > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-gray-600">
                  <FileText className="w-3 h-3" />
                  Versions
                </span>
                <span className="font-semibold">{deliverable.versions.length}</span>
              </div>
            )}

            {/* Deadline */}
            {deliverable.adjusted_deadline && (
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-gray-600">
                  <Calendar className="w-3 h-3" />
                  Deadline
                </span>
                <span className={`font-semibold ${
                  new Date(deliverable.adjusted_deadline) < new Date() ? 'text-red-600' : 'text-gray-700'
                }`}>
                  {format(new Date(deliverable.adjusted_deadline), 'MMM dd, yyyy')}
                </span>
              </div>
            )}

            {/* Assigned To */}
            {stage.assigned_to && (
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-gray-600">
                  <User className="w-3 h-3" />
                  Assigned
                </span>
                <span className="font-semibold text-gray-700 truncate max-w-[150px]">
                  {stage.assigned_to}
                </span>
              </div>
            )}

            {/* Quick Actions Hint */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-center text-gray-500">
                Click to view deliverable details →
              </p>
            </div>
          </div>

          {/* Arrow pointing down to the star */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-2">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}