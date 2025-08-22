import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  Link2,
  ChevronRight
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Card } from '@/components/ui/card';
import { useProject } from '@/contexts/ProjectContext';

export default function DependencyHoverCard({ 
  stage, 
  isVisible, 
  position,
  onShowFullChain 
}) {
  const { stages, getStageDependencies, getStageDependents } = useProject();
  const [showCard, setShowCard] = useState(false);
  
  // Delay showing card to avoid flicker on quick hovers
  useEffect(() => {
    let timer;
    if (isVisible) {
      timer = setTimeout(() => setShowCard(true), 300);
    } else {
      setShowCard(false);
    }
    return () => clearTimeout(timer);
  }, [isVisible]);
  
  // Get dependencies and dependents
  const dependencies = useMemo(() => getStageDependencies(stage.id), [stage.id, getStageDependencies]);
  const dependents = useMemo(() => getStageDependents(stage.id), [stage.id, getStageDependents]);
  
  // Calculate if dragging is allowed
  const canDrag = useMemo(() => {
    const hasBlockedDependencies = dependencies.some(dep => dep.status === 'blocked');
    return !hasBlockedDependencies;
  }, [dependencies]);
  
  if (!showCard || !stage) return null;
  
  const getDaysUntil = (date) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days > 0) return `In ${days} days`;
    return `${Math.abs(days)} days ago`;
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-3 h-3 text-blue-500" />;
      case 'blocked':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };
  
  return (
    <AnimatePresence>
      {showCard && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute z-50 pointer-events-none"
          style={{
            left: position?.x || 0,
            top: position?.y || 0
          }}
        >
          <Card className="w-80 p-4 shadow-xl border-slate-200 bg-white pointer-events-auto">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    {stage.is_deliverable && (
                      <span className="text-amber-500">⭐</span>
                    )}
                    {stage.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {getDaysUntil(stage.endDate || stage.end_date)}
                    </span>
                    {stage.assignedMember && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {stage.assignedMember.name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>
                {getStatusIcon(stage.status)}
              </div>
              
              {/* Drag instruction */}
              {canDrag && (
                <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded flex items-center gap-1">
                  <span>↔</span> Drag horizontally to reschedule
                </div>
              )}
              
              {/* Dependencies Section */}
              {dependencies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Needs to be completed first:
                  </p>
                  <div className="space-y-1">
                    {dependencies.slice(0, 3).map(dep => (
                      <div key={dep.id} className="flex items-center gap-2 text-sm">
                        {getStatusIcon(dep.status)}
                        <span className={dep.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}>
                          {dep.name}
                        </span>
                      </div>
                    ))}
                    {dependencies.length > 3 && (
                      <p className="text-xs text-slate-500 pl-5">
                        +{dependencies.length - 3} more...
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Dependents Section */}
              {dependents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Waiting for this:
                  </p>
                  <div className="space-y-1">
                    {dependents.slice(0, 3).map(dep => (
                      <div key={dep.id} className="flex items-center gap-2 text-sm">
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-700">{dep.name}</span>
                      </div>
                    ))}
                    {dependents.length > 3 && (
                      <p className="text-xs text-slate-500 pl-5">
                        +{dependents.length - 3} more stages...
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Show full chain button */}
              {(dependencies.length > 0 || dependents.length > 0) && (
                <button
                  onClick={onShowFullChain}
                  className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 py-2 hover:bg-blue-50 rounded transition-colors"
                >
                  <Link2 className="w-3 h-3" />
                  See full dependency chain
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
              
              {/* Impact Preview */}
              {dependencies.length === 0 && dependents.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-2">
                  This stage is independent and can be moved freely
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}