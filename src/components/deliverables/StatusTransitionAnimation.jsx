import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StatusTransitionAnimation({ 
  status, 
  previousStatus, 
  onAnimationComplete 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status !== previousStatus && status) {
      setIsVisible(true);
      
      // Trigger confetti for approval
      if (status === 'approved') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7']
        });
      }
      
      // Hide animation after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        onAnimationComplete && onAnimationComplete();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [status, previousStatus]);

  const getAnimationConfig = () => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          message: 'Deliverable Approved!',
          subMessage: 'Stage will be completed automatically'
        };
      case 'declined':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          message: 'Changes Requested',
          subMessage: 'Please review feedback and submit revision'
        };
      case 'submitted':
      case 'submitted':
        return {
          icon: Clock,
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
          message: 'Submitted for Review',
          subMessage: 'Awaiting client approval'
        };
      case 'in_progress':
      case 'in_progress':
        return {
          icon: TrendingUp,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          message: 'Work In Progress',
          subMessage: 'Team is working on this deliverable'
        };
      default:
        return null;
    }
  };

  const config = getAnimationConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -50 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          className="fixed bottom-8 right-8 z-50"
        >
          <div className={`${config.bgColor} rounded-lg shadow-2xl p-6 min-w-[320px] border-2 border-white`}>
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className={`w-12 h-12 rounded-full bg-white flex items-center justify-center ${config.color}`}
              >
                <Icon className="w-6 h-6" />
              </motion.div>
              
              <div className="flex-1">
                <motion.h3
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`font-bold text-lg ${config.color}`}
                >
                  {config.message}
                </motion.h3>
                
                <motion.p
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-gray-600 mt-1"
                >
                  {config.subMessage}
                </motion.p>
              </div>
              
              {status === 'approved' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                </motion.div>
              )}
            </div>
            
            {/* Progress bar animation */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-white/50 rounded-b-lg overflow-hidden"
            >
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
                className={`h-full ${
                  status === 'approved' ? 'bg-green-500' :
                  status === 'declined' ? 'bg-red-500' :
                  status === 'submitted' ? 'bg-amber-500' :
                  'bg-blue-500'
                }`}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export a hook for managing status transitions
export function useStatusTransition(initialStatus) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [previousStatus, setPreviousStatus] = useState(initialStatus);

  const updateStatus = (newStatus) => {
    if (newStatus !== currentStatus) {
      setPreviousStatus(currentStatus);
      setCurrentStatus(newStatus);
    }
  };

  return {
    currentStatus,
    previousStatus,
    updateStatus
  };
}