import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  AlertCircle,
  Info,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, differenceInDays, parseISO } from 'date-fns';

export default function ClientFriendlyImpactDialog({ 
  open, 
  onOpenChange, 
  pendingChanges,
  onConfirm,
  onCancel
}) {
  if (!pendingChanges) return null;

  const { stageId, updates, impact } = pendingChanges;
  const { affected, conflicts, summary } = impact;
  
  // Generate human-readable explanation
  const getExplanation = useMemo(() => {
    // Check if there are any affected stages
    if (!affected || affected.length === 0) {
      return {
        mainImpact: "This change won't affect your delivery dates",
        reason: "This task can be rescheduled independently.",
        daysImpact: 0
      };
    }
    
    // Find the most important impacts
    const keyDeliverables = affected.filter(a => {
      const stageName = a.stageName || '';
      return stageName.includes('Launch') || 
             stageName.includes('Final') || 
             stageName.includes('Delivery') ||
             stageName.includes('Presentation');
    });
    
    const finalDelivery = keyDeliverables.find(d => d.stageName?.includes('Final')) || 
                         keyDeliverables[keyDeliverables.length - 1] ||
                         affected[affected.length - 1];
    
    if (finalDelivery && finalDelivery.adjustment) {
      const delayDays = Math.abs(finalDelivery.adjustment || 0);
      const newDate = typeof finalDelivery.newEnd === 'string' 
        ? format(parseISO(finalDelivery.newEnd), 'MMMM d, yyyy')
        : format(finalDelivery.newEnd, 'MMMM d, yyyy');
      const oldDate = typeof finalDelivery.originalEnd === 'string'
        ? format(parseISO(finalDelivery.originalEnd), 'MMMM d, yyyy')
        : format(finalDelivery.originalEnd, 'MMMM d, yyyy');
      
      return {
        mainImpact: delayDays > 0 
          ? `This will push your final delivery from ${oldDate} to ${newDate}`
          : `This will move your final delivery earlier from ${oldDate} to ${newDate}`,
        reason: "This happens because each phase builds on the previous one. Later tasks depend on this one being completed first.",
        daysImpact: delayDays
      };
    }
    
    const maxDelay = Math.max(...affected.map(a => Math.abs(a.adjustment || 0)));
    const affectedCount = affected.length;
    
    return {
      mainImpact: maxDelay > 0
        ? `This change will affect ${affectedCount} other task${affectedCount > 1 ? 's' : ''} and shift timelines by up to ${maxDelay} days`
        : `This change will affect ${affectedCount} other task${affectedCount > 1 ? 's' : ''}`,
      reason: affectedCount > 1 
        ? "Multiple tasks depend on this one. Moving it will cascade through your timeline."
        : "Another task depends on this one being completed first.",
      daysImpact: maxDelay
    };
  }, [affected]);
  
  // Get the top 3 most important timeline changes
  const keyTimelineChanges = useMemo(() => {
    if (!affected || affected.length === 0) return [];
    
    return affected
      .filter(a => a.stageName)
      .slice(0, 3)
      .map(item => {
        const oldDate = typeof item.originalEnd === 'string'
          ? format(parseISO(item.originalEnd), 'MMM d')
          : format(item.originalEnd, 'MMM d');
        const newDate = typeof item.newEnd === 'string'
          ? format(parseISO(item.newEnd), 'MMM d')
          : format(item.newEnd, 'MMM d');
        
        return {
          name: item.stageName,
          oldDate,
          newDate,
          isDeliverable: item.stageName?.includes('Deliverable') || item.stageName?.includes('Presentation')
        };
      });
  }, [affected]);
  
  const hasBlockingIssues = conflicts.some(c => c.severity === 'critical');
  const isMinorChange = getExplanation.daysImpact <= 2;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 py-4"
        >
          {/* Header Icon */}
          <div className="flex justify-center">
            {hasBlockingIssues ? (
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            ) : isMinorChange ? (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            )}
          </div>
          
          {/* Main Message */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">
              Impact on Your Project
            </h2>
            <p className="text-base text-slate-700 font-medium">
              {getExplanation.mainImpact}
            </p>
          </div>
          
          {/* Timeline Changes */}
          {keyTimelineChanges.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Key dates that will change:
              </p>
              <div className="space-y-2">
                {keyTimelineChanges.map((change, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-700 flex items-center gap-2">
                      {change.isDeliverable && <span className="text-amber-500">⭐</span>}
                      {change.name}
                    </span>
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="line-through">{change.oldDate}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="font-semibold">{change.newDate}</span>
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Why this happens */}
          <div className="flex items-start gap-3 text-sm">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-slate-700">Why this happens:</p>
              <p className="text-slate-600">{getExplanation.reason}</p>
            </div>
          </div>
          
          {/* Special messages for specific scenarios */}
          {hasBlockingIssues && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <p className="text-red-800">
                We need to complete some earlier work first before we can make this change.
              </p>
            </div>
          )}
          
          {isMinorChange && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <p className="text-green-800">
                This is a minor adjustment that won't significantly impact your project.
              </p>
            </div>
          )}
        </motion.div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Keep Original Dates
          </Button>
          <Button
            onClick={onConfirm}
            disabled={hasBlockingIssues}
          >
            Accept New Timeline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}