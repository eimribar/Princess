import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ChevronRight, 
  Calendar,
  Users,
  Target,
  Clock,
  TrendingUp,
  GitBranch,
  XCircle,
  CheckCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, differenceInDays } from 'date-fns';

export default function DependencyImpactDialog({ 
  open, 
  onOpenChange, 
  pendingChanges,
  onConfirm,
  onCancel 
}) {
  if (!pendingChanges) return null;

  const { stageId, updates, impact } = pendingChanges;
  const { affected, conflicts, valid, summary } = impact;

  // Group affected stages by category
  const affectedByCategory = useMemo(() => {
    const grouped = affected.reduce((acc, item) => {
      const category = item.reason.includes('Cascaded') ? 'cascaded' : 
                      item.reason.includes('Pulled') ? 'pulled' : 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
    return grouped;
  }, [affected]);

  // Group conflicts by type
  const conflictsByType = useMemo(() => {
    const grouped = conflicts.reduce((acc, conflict) => {
      if (!acc[conflict.type]) acc[conflict.type] = [];
      acc[conflict.type].push(conflict);
      return acc;
    }, {});
    return grouped;
  }, [conflicts]);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const formatDateChange = (original, updated) => {
    const diff = differenceInDays(updated, original);
    const sign = diff > 0 ? '+' : '';
    return `${format(original, 'MMM d')} → ${format(updated, 'MMM d')} (${sign}${diff} days)`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Dependency Impact Analysis
          </DialogTitle>
          <DialogDescription>
            Review the impact of your changes before applying them
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-6">
            {/* Summary Alert */}
            <Alert className={getSeverityColor(summary.severity)}>
              <div className="flex items-start gap-3">
                {getSeverityIcon(summary.severity)}
                <div className="flex-1">
                  <AlertTitle className="text-base">Impact Summary</AlertTitle>
                  <AlertDescription className="mt-2">
                    {summary.message}
                  </AlertDescription>
                  
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <p className="text-xs opacity-75">Affected Stages</p>
                        <p className="font-semibold">{summary.totalAffected}</p>
                      </div>
                    </div>
                    
                    {summary.maxDelay > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <div>
                          <p className="text-xs opacity-75">Max Delay</p>
                          <p className="font-semibold">{summary.maxDelay} days</p>
                        </div>
                      </div>
                    )}
                    
                    {summary.criticalPathImpact && (
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <div>
                          <p className="text-xs opacity-75">Critical Path</p>
                          <p className="font-semibold">Impacted</p>
                        </div>
                      </div>
                    )}
                    
                    {summary.conflictCount > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <div>
                          <p className="text-xs opacity-75">Conflicts</p>
                          <p className="font-semibold">{summary.conflictCount}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Alert>

            {/* Conflicts Section */}
            {conflicts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Conflicts Detected ({conflicts.length})
                </h3>
                
                {Object.entries(conflictsByType).map(([type, typeConflicts]) => (
                  <div key={type} className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-700 capitalize">
                      {type.replace(/_/g, ' ')}
                    </h4>
                    {typeConflicts.map((conflict, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        {getSeverityIcon(conflict.severity)}
                        <div className="flex-1">
                          <p className="text-sm text-red-900">{conflict.message}</p>
                          {conflict.resource && (
                            <div className="mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span className="text-xs text-red-700">{conflict.resource}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Affected Stages Section */}
            {affected.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Affected Stages ({affected.length})
                </h3>
                
                {affectedByCategory.cascaded && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-700">
                      Cascaded Changes (Pushed Later)
                    </h4>
                    {affectedByCategory.cascaded.map((item, index) => (
                      <motion.div
                        key={item.stageId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <ChevronRight className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-medium text-slate-900">{item.stageName}</p>
                            <p className="text-sm text-slate-600">
                              {formatDateChange(item.originalStart, item.newStart)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          +{item.adjustment} days
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}

                {affectedByCategory.pulled && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-700">
                      Pulled Changes (Moved Earlier)
                    </h4>
                    {affectedByCategory.pulled.map((item, index) => (
                      <motion.div
                        key={item.stageId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <ChevronRight className="w-4 h-4 text-green-600 rotate-180" />
                          <div>
                            <p className="font-medium text-slate-900">{item.stageName}</p>
                            <p className="text-sm text-slate-600">
                              {formatDateChange(item.originalStart, item.newStart)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {item.adjustment} days
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Success Message */}
            {valid && affected.length === 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <AlertTitle className="text-green-900">No Conflicts</AlertTitle>
                <AlertDescription className="text-green-700">
                  This change can be applied without affecting other stages or creating conflicts.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {conflicts.length > 0 && (
              <span className="text-red-600 font-medium">
                ⚠️ Proceeding will override {conflicts.length} conflict(s)
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant={conflicts.length > 0 ? "destructive" : "default"}
              onClick={onConfirm}
              disabled={conflicts.some(c => c.severity === 'critical')}
            >
              {conflicts.length > 0 ? 'Apply Anyway' : 'Apply Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}