import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IterationCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function FeedbackLimitIndicator({ 
  currentIteration = 0, 
  maxIterations = 3,
  isCompact = false 
}) {
  // Ensure we have valid numbers
  const safeCurrentIteration = Math.max(0, currentIteration || 0);
  const safeMaxIterations = Math.max(1, maxIterations || 3);
  
  const remainingIterations = safeMaxIterations - safeCurrentIteration;
  const progressPercentage = (safeCurrentIteration / safeMaxIterations) * 100;
  const isAtLimit = safeCurrentIteration >= safeMaxIterations;
  const isNearLimit = remainingIterations === 1;
  const hasStarted = safeCurrentIteration > 0;
  
  // Compact version for inline display
  if (isCompact) {
    return (
      <div className="flex items-center gap-2">
        <IterationCw className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">
          Iteration {safeCurrentIteration}/{safeMaxIterations}
        </span>
        {isAtLimit && hasStarted && (
          <Badge variant="destructive" className="text-xs">
            Limit Reached
          </Badge>
        )}
        {isNearLimit && !isAtLimit && (
          <Badge variant="outline" className="text-xs text-orange-600">
            Last Iteration
          </Badge>
        )}
      </div>
    );
  }

  // Full version with visual indicators
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IterationCw className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Feedback Iterations</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {safeCurrentIteration} of {safeMaxIterations} used
          </span>
          {remainingIterations > 0 && (
            <Badge variant="outline" className="text-xs">
              {remainingIterations} remaining
            </Badge>
          )}
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="space-y-2">
        <Progress 
          value={progressPercentage} 
          className="h-2"
          indicatorClassName={
            isAtLimit ? 'bg-red-500' : 
            isNearLimit ? 'bg-orange-500' : 
            'bg-blue-500'
          }
        />
        
        {/* Iteration Dots */}
        <div className="flex justify-between">
          {Array.from({ length: safeMaxIterations }).map((_, index) => (
            <div
              key={index}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                index < safeCurrentIteration
                  ? 'bg-blue-500 text-white'
                  : index === safeCurrentIteration && !isAtLimit
                  ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {index < safeCurrentIteration ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Alerts */}
      {isAtLimit && hasStarted && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Iteration limit reached.</strong> No further changes can be requested 
            without a scope adjustment.
          </AlertDescription>
        </Alert>
      )}
      
      {isNearLimit && !isAtLimit && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700">
            <strong>Final iteration available.</strong> The next round of feedback will be 
            the last opportunity for changes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}