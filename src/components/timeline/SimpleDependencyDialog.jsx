import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';

export default function SimpleDependencyDialog({ 
  open, 
  onOpenChange, 
  pendingChanges,
  onConfirm,
  onCancel,
  onApplySuggestion
}) {
  if (!pendingChanges) return null;

  const { stageId, updates, impact } = pendingChanges;
  const { affected, conflicts, summary } = impact;
  
  // Generate smart suggestion
  const generateSmartSuggestion = () => {
    if (conflicts.length === 0 && affected.length === 0) {
      return null;
    }
    
    // Find the main issue
    const mainIssue = conflicts[0] || { type: 'cascade', severity: 'low' };
    const affectedCount = affected.length;
    const maxDelay = Math.max(...affected.map(a => Math.abs(a.adjustment || 0)), 0);
    
    // Generate actionable suggestion based on issue type
    if (mainIssue.type === 'dependency_violation') {
      return {
        icon: '🔧',
        text: `Move this 2 days later to respect dependencies`,
        action: 'adjust_dates'
      };
    }
    
    if (affectedCount > 5) {
      return {
        icon: '✨',
        text: `Compress timeline to minimize ${maxDelay}-day delay`,
        action: 'compress_timeline'
      };
    }
    
    if (maxDelay > 7) {
      return {
        icon: '📅',
        text: `Shift entire phase ${Math.ceil(maxDelay / 2)} days to balance`,
        action: 'shift_phase'
      };
    }
    
    return {
      icon: '👍',
      text: `This change looks good to apply`,
      action: 'apply'
    };
  };
  
  const suggestion = generateSmartSuggestion();
  const hasIssues = conflicts.length > 0 || affected.length > 0;
  
  // Simplify the main message
  const getMainMessage = () => {
    if (conflicts.length > 0) {
      const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
      if (criticalConflicts.length > 0) {
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-500" />,
          title: "Can't make this change",
          subtitle: criticalConflicts[0].message,
          color: 'text-red-600'
        };
      }
      
      return {
        icon: <AlertCircle className="w-6 h-6 text-orange-500" />,
        title: `This will cause ${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''}`,
        subtitle: conflicts[0].message,
        color: 'text-orange-600'
      };
    }
    
    if (affected.length > 0) {
      const maxDelay = Math.max(...affected.map(a => Math.abs(a.adjustment || 0)));
      return {
        icon: <Calendar className="w-6 h-6 text-blue-500" />,
        title: `Moving this will delay the project by ${maxDelay} day${maxDelay > 1 ? 's' : ''}`,
        subtitle: `${affected.length} other stage${affected.length > 1 ? 's' : ''} will be affected`,
        color: 'text-blue-600'
      };
    }
    
    return {
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      title: "Good to go!",
      subtitle: "This change won't affect other stages",
      color: 'text-green-600'
    };
  };
  
  const message = getMainMessage();
  const canProceed = !conflicts.some(c => c.severity === 'critical');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 py-4"
        >
          {/* Main Message */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              {message.icon}
            </div>
            <h2 className={`text-xl font-semibold ${message.color}`}>
              {message.title}
            </h2>
            <p className="text-sm text-slate-600">
              {message.subtitle}
            </p>
          </div>
          
          {/* Smart Suggestion */}
          {suggestion && hasIssues && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Smart suggestion:</p>
                    <p className="text-sm text-slate-700 mt-1">
                      {suggestion.text}
                    </p>
                  </div>
                  {suggestion.action !== 'apply' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full bg-white hover:bg-blue-50"
                      onClick={() => onApplySuggestion && onApplySuggestion(suggestion.action)}
                    >
                      Apply Suggestion
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Show most impacted stages (max 3) */}
          {affected.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Most affected stages:
              </p>
              <div className="space-y-1">
                {affected.slice(0, 3).map((item, index) => (
                  <motion.div
                    key={item.stageId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between text-sm py-1 px-2 bg-slate-50 rounded"
                  >
                    <span className="text-slate-700">{item.stageName}</span>
                    <span className={`text-xs font-medium ${
                      item.adjustment > 0 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {item.adjustment > 0 ? '+' : ''}{item.adjustment} days
                    </span>
                  </motion.div>
                ))}
                {affected.length > 3 && (
                  <p className="text-xs text-slate-500 pl-2">
                    and {affected.length - 3} more...
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          {hasIssues ? (
            <Button
              variant={conflicts.length > 0 ? "secondary" : "default"}
              onClick={onConfirm}
              disabled={!canProceed}
            >
              Move Anyway
            </Button>
          ) : (
            <Button
              onClick={onConfirm}
            >
              Apply Change
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}