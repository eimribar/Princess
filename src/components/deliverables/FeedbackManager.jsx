import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock,
  IterationCw,
  Lock,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

export default function FeedbackManager({ 
  deliverable, 
  onApprove, 
  onDecline, 
  onUpdateDeliverable,
  currentUser = { email: 'client@deutschco.com', name: 'John Smith' }
}) {
  const [feedback, setFeedback] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Calculate remaining iterations with proper defaults and validation
  const maxIterations = deliverable.max_iterations || 3;
  const currentIteration = deliverable.current_iteration || 0;
  const remainingIterations = maxIterations - currentIteration;
  const hasIterationsLeft = remainingIterations > 0;
  const isAtLastIteration = remainingIterations === 1;
  const hasStartedIterations = currentIteration > 0;
  
  // Calculate deadline impact
  const calculateDeadlineImpact = () => {
    if (!deliverable.original_deadline) return null;
    
    const originalDate = new Date(deliverable.original_deadline);
    const adjustedDate = addDays(originalDate, deliverable.deadline_impact_total || 0);
    
    return {
      original: originalDate,
      adjusted: adjustedDate,
      impactDays: deliverable.deadline_impact_total || 0
    };
  };

  const deadlineImpact = calculateDeadlineImpact();

  // Handle approval with finality check
  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const updatedDeliverable = {
        ...deliverable,
        is_final: true,
        iteration_history: [
          ...deliverable.iteration_history,
          {
            version: deliverable.current_version,
            date: new Date().toISOString(),
            feedback: 'Approved',
            feedback_by: currentUser.name,
            status: 'approved',
            deadline_impact_days: 0
          }
        ]
      };

      await onApprove(updatedDeliverable);
      
      toast({
        title: "Deliverable Approved",
        description: "This approval is final and cannot be reversed.",
        duration: 5000,
      });
      
      setShowApprovalDialog(false);
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle decline with feedback
  const handleDecline = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide feedback when declining a deliverable.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const impactDays = 3; // Each feedback cycle adds 3 days
      const newIteration = currentIteration + 1;
      
      const updatedDeliverable = {
        ...deliverable,
        current_iteration: newIteration,
        deadline_impact_total: (deliverable.deadline_impact_total || 0) + impactDays,
        adjusted_deadline: deadlineImpact ? 
          addDays(deadlineImpact.adjusted, impactDays).toISOString() : null,
        iteration_history: [
          ...deliverable.iteration_history,
          {
            version: deliverable.current_version,
            date: new Date().toISOString(),
            feedback: feedback,
            feedback_by: currentUser.name,
            status: 'declined',
            deadline_impact_days: impactDays
          }
        ]
      };

      await onDecline(updatedDeliverable, feedback);
      
      toast({
        title: "Feedback Submitted",
        description: `Iteration ${newIteration} of ${maxIterations}. Timeline adjusted by ${impactDays} days.`,
        duration: 5000,
      });
      
      setShowDeclineDialog(false);
      setFeedback('');
    } catch (error) {
      toast({
        title: "Feedback Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Iteration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IterationCw className="w-5 h-5" />
            Feedback Loop Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Iteration Counter */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Iteration Progress</span>
            <div className="flex items-center gap-2">
              <Badge variant={isAtLastIteration ? "destructive" : hasStartedIterations ? "default" : "secondary"}>
                {currentIteration} of {maxIterations} iterations used
              </Badge>
              {!hasIterationsLeft && currentIteration > 0 && (
                <Badge variant="outline" className="text-red-600">
                  No iterations remaining
                </Badge>
              )}
              {hasIterationsLeft && (
                <Badge variant="outline" className="text-green-600">
                  {remainingIterations} remaining
                </Badge>
              )}
            </div>
          </div>

          {/* Visual Progress */}
          <div className="space-y-2">
            <div className="flex gap-1">
              {Array.from({ length: maxIterations }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    i < currentIteration
                      ? 'bg-blue-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            {isAtLastIteration && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Last Iteration</AlertTitle>
                <AlertDescription className="text-orange-700">
                  This is the final iteration. Further changes will require a scope adjustment.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Deadline Impact */}
          {deadlineImpact && deadlineImpact.impactDays > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Timeline Impact</AlertTitle>
              <AlertDescription className="text-yellow-700">
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>Original Deadline:</span>
                    <span className="font-medium">{format(deadlineImpact.original, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Adjusted Deadline:</span>
                    <span className="font-medium text-orange-600">
                      {format(deadlineImpact.adjusted, 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Impact:</span>
                    <span className="font-medium text-red-600">
                      +{deadlineImpact.impactDays} days
                    </span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Approval Finality Warning */}
          {deliverable.is_final && (
            <Alert className="border-green-200 bg-green-50">
              <Lock className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Final Approval</AlertTitle>
              <AlertDescription className="text-green-700">
                This deliverable has been approved and locked. No further changes can be made.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Iteration History */}
      {deliverable.iteration_history && deliverable.iteration_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Feedback History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliverable.iteration_history.map((iteration, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        iteration.status === 'approved' ? 'success' : 
                        iteration.status === 'declined' ? 'destructive' : 
                        'default'
                      }>
                        {iteration.version}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {format(new Date(iteration.date), 'MMM dd, yyyy h:mm a')}
                      </span>
                    </div>
                    {iteration.deadline_impact_days > 0 && (
                      <Badge variant="outline" className="text-orange-600">
                        +{iteration.deadline_impact_days} days
                      </Badge>
                    )}
                  </div>
                  {iteration.feedback && (
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-sm text-gray-700">{iteration.feedback}</p>
                      <p className="text-xs text-gray-500 mt-1">— {iteration.feedback_by}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!deliverable.is_final && (
        <div className="flex gap-3">
          <Button
            onClick={() => setShowApprovalDialog(true)}
            className="flex-1"
            variant="default"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve (Final)
          </Button>
          <Button
            onClick={() => setShowDeclineDialog(true)}
            disabled={!hasIterationsLeft}
            className="flex-1"
            variant="outline"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Request Changes
            {hasIterationsLeft && (
              <Badge variant="secondary" className="ml-2">
                {remainingIterations} left
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* Approval Confirmation Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Final Approval</DialogTitle>
            <DialogDescription>
              <Alert className="mt-4 border-blue-200 bg-blue-50">
                <Lock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>This action is irreversible.</strong> Once approved, this deliverable 
                  will be locked and no further changes can be requested.
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline with Feedback Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Provide feedback for the changes needed. This will use iteration {currentIteration + 1} of {maxIterations}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Please describe the changes needed..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[120px]"
            />
            {deadlineImpact && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700 text-sm">
                  Requesting changes will add 3 days to the project timeline.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeclineDialog(false);
                setFeedback('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDecline}
              disabled={isProcessing || !feedback.trim()}
              variant="destructive"
            >
              {isProcessing ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}