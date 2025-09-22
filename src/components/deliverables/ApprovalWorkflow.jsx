import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send,
  MessageSquare,
  User,
  Calendar,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Mail
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function ApprovalWorkflow({ 
  deliverable, 
  version, 
  onApprove, 
  onDecline, 
  onSubmitForApproval,
  quickMode = false 
}) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null); // 'approve' or 'decline'
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showQuickApprove, setShowQuickApprove] = useState(false);

  // Feedback templates for common scenarios
  const feedbackTemplates = [
    { value: 'needs-refinement', label: 'Needs Refinement', text: 'Please refine the design elements to better align with our brand guidelines.' },
    { value: 'missing-elements', label: 'Missing Elements', text: 'Some required elements are missing. Please review the requirements document.' },
    { value: 'quality-issues', label: 'Quality Issues', text: 'The quality needs improvement. Please ensure high-resolution assets and proper formatting.' },
    { value: 'brand-alignment', label: 'Brand Alignment', text: 'Please ensure better alignment with our brand voice and visual identity.' },
    { value: 'technical-issues', label: 'Technical Issues', text: 'There are technical issues that need to be addressed before approval.' },
    { value: 'custom', label: 'Custom Feedback', text: '' }
  ];

  const handleTemplateChange = (value) => {
    setSelectedTemplate(value);
    const template = feedbackTemplates.find(t => t.value === value);
    if (template && template.text) {
      setFeedback(template.text);
    }
  };

  const approvers = deliverable?.approval_required_from || [];
  const currentVersion = version || deliverable?.versions?.[deliverable.versions.length - 1];
  
  const getApprovalStatus = () => {
    if (!currentVersion) return 'no_version';
    switch (currentVersion.status) {
      case 'draft': return 'draft';
      case 'submitted':
      case 'pending_approval': return 'pending';
      case 'approved': return 'approved';
      case 'declined': return 'declined';
      default: return 'draft';
    }
  };

  const status = getApprovalStatus();

  const handleSubmitForApproval = async () => {
    if (!currentVersion) return;
    
    setIsSubmitting(true);
    try {
      if (onSubmitForApproval) {
        await onSubmitForApproval(currentVersion.id);
      }
    } catch (error) {
      console.error('Failed to submit for approval:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovalAction = async (action) => {
    // In quick mode, approve without feedback requirement
    if (quickMode && action === 'approve' && !feedback.trim()) {
      setIsSubmitting(true);
      try {
        if (onApprove) {
          await onApprove(currentVersion?.id, 'Approved');
        }
        setShowQuickApprove(false);
      } catch (error) {
        console.error('Failed to process approval:', error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!currentVersion || (!feedback.trim() && action === 'decline')) {
      setShowFeedbackForm(true);
      setApprovalAction(action);
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === 'approve' && onApprove) {
        await onApprove(currentVersion.id, feedback || 'Approved');
      } else if (action === 'decline' && onDecline) {
        await onDecline(currentVersion.id, feedback);
      }
      
      // Reset form
      setFeedback('');
      setShowFeedbackForm(false);
      setApprovalAction(null);
      setSelectedTemplate('');
    } catch (error) {
      console.error('Failed to process approval:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StatusIcon = {
    draft: Clock,
    pending: Clock,
    approved: CheckCircle2,
    declined: XCircle,
    no_version: AlertTriangle
  }[status];

  const statusConfig = {
    draft: { color: 'bg-gray-50 text-gray-700 border-gray-200', label: 'Draft' },
    pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending Approval' },
    approved: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Approved' },
    declined: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Changes Requested' },
    no_version: { color: 'bg-gray-50 text-gray-700 border-gray-200', label: 'No Version Available' }
  }[status];

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card className="border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <StatusIcon className="w-5 h-5 text-gray-600" />
              Approval Status
            </CardTitle>
            <Badge variant="outline" className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'no_version' && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                No version available for approval. Please upload a version first.
              </AlertDescription>
            </Alert>
          )}

          {status === 'draft' && currentVersion && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Version {currentVersion.version_number} is ready to be submitted for approval.
              </p>
              <Button 
                onClick={handleSubmitForApproval}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </div>
          )}

          {status === 'pending' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Version {currentVersion?.version_number} is awaiting approval from:
              </p>
              <div className="flex flex-wrap gap-2">
                {approvers.map((email, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {email.split('@')[0].slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-700">{email}</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                ))}
              </div>
              
              {/* Approval Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {quickMode ? (
                  // Quick approve mode with single click
                  <>
                    <Button
                      onClick={() => handleApprovalAction('approve')}
                      disabled={isSubmitting}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      {isSubmitting ? 'Processing...' : 'Quick Approve'}
                    </Button>
                    <Button
                      onClick={() => {
                        setApprovalAction('decline');
                        setShowFeedbackForm(true);
                      }}
                      variant="outline"
                      className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Request Changes
                    </Button>
                  </>
                ) : (
                  // Standard approval with feedback requirement
                  <>
                    <Button
                      onClick={() => {
                        setApprovalAction('approve');
                        setShowFeedbackForm(true);
                      }}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        setApprovalAction('decline');
                        setShowFeedbackForm(true);
                      }}
                      variant="outline"
                      className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Request Changes
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {status === 'approved' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">
                  Version {currentVersion?.version_number} has been approved!
                </span>
              </div>
              {currentVersion?.approval_date && (
                <p className="text-sm text-gray-600">
                  Approved on {format(new Date(currentVersion.approval_date), 'MMM d, yyyy')}
                  {currentVersion.approved_by && ` by ${currentVersion.approved_by}`}
                </p>
              )}
            </div>
          )}

          {status === 'declined' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">
                  Changes requested for version {currentVersion?.version_number}
                </span>
              </div>
              {currentVersion?.feedback && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Feedback:</h4>
                  <p className="text-red-800">{currentVersion.feedback}</p>
                  {currentVersion.feedback_date && (
                    <p className="text-sm text-red-600 mt-2">
                      {format(new Date(currentVersion.feedback_date), 'MMM d, yyyy')}
                      {currentVersion.feedback_by && ` by ${currentVersion.feedback_by}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Form Modal */}
      <AnimatePresence>
        {showFeedbackForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowFeedbackForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-0 shadow-none">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {approvalAction === 'approve' ? 'Approval Comments' : 'Request Changes'}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6 space-y-4">
                  {/* Feedback Templates for decline */}
                  {approvalAction === 'decline' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Quick Feedback Templates
                      </label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Select a template...</option>
                        {feedbackTemplates.map(template => (
                          <option key={template.value} value={template.value}>
                            {template.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {approvalAction === 'approve' 
                        ? 'Comments (optional)' 
                        : 'What changes are needed? *'}
                    </label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder={approvalAction === 'approve' 
                        ? 'Any additional comments...' 
                        : 'Describe the changes that need to be made...'}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowFeedbackForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleApprovalAction(approvalAction)}
                      disabled={isSubmitting || (approvalAction === 'decline' && !feedback.trim())}
                      className={approvalAction === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'}
                    >
                      {isSubmitting ? 'Processing...' : (
                        approvalAction === 'approve' ? 'Approve' : 'Request Changes'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approval History */}
      {deliverable?.versions && deliverable.versions.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Approval History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deliverable.versions.map((ver, index) => (
                <div key={ver.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${
                      ver.status === 'approved' ? 'bg-green-100' :
                      ver.status === 'declined' ? 'bg-red-100' :
                      'bg-gray-100'
                    }`}>
                      {ver.status === 'approved' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : ver.status === 'declined' ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{ver.version_number}</span>
                      <Badge variant="outline" className={
                        ver.status === 'approved' ? 'border-green-200 text-green-700' :
                        ver.status === 'declined' ? 'border-red-200 text-red-700' :
                        'border-gray-200 text-gray-700'
                      }>
                        {ver.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {ver.feedback && (
                      <p className="text-sm text-gray-600 mb-2">{ver.feedback}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {ver.submitted_date && (
                        <span>{format(new Date(ver.submitted_date), 'MMM d, yyyy')}</span>
                      )}
                      {ver.feedback_by && (
                        <span>by {ver.feedback_by}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}