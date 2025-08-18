import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  X, 
  Star,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackForm({ 
  version, 
  isOpen, 
  onClose, 
  onSubmit,
  type = 'general' // 'approval', 'decline', 'general'
}) {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        feedback,
        rating: type === 'approval' ? rating : null,
        type
      });
      setFeedback('');
      setRating(0);
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
    setIsSubmitting(false);
  };

  const getFormConfig = () => {
    switch (type) {
      case 'approval':
        return {
          title: 'Approve Version',
          subtitle: `Approving ${version?.version_number}`,
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          buttonText: 'Approve & Send Feedback',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          placeholder: 'Add positive feedback and approval notes...',
          showRating: true
        };
      case 'decline':
        return {
          title: 'Decline Version',
          subtitle: `Declining ${version?.version_number}`,
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          buttonText: 'Decline & Send Feedback',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          placeholder: 'Explain what needs to be changed and provide specific feedback...',
          showRating: false
        };
      default:
        return {
          title: 'Add Feedback',
          subtitle: `Feedback for ${version?.version_number}`,
          icon: MessageSquare,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          buttonText: 'Send Feedback',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          placeholder: 'Share your thoughts, suggestions, or questions...',
          showRating: true
        };
    }
  };

  const config = getFormConfig();
  const IconComponent = config.icon;

  if (!isOpen || !version) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          <Card className="border-0 shadow-none">
            <CardHeader className={`${config.bgColor} ${config.borderColor} border-b`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
                    <IconComponent className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900">
                      {config.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {config.subtitle}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Version Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{version.file_name}</p>
                  <p className="text-sm text-gray-600">
                    Uploaded {version.uploaded_date ? new Date(version.uploaded_date).toLocaleDateString() : 'Recently'}
                    {version.uploaded_by && ` by ${version.uploaded_by}`}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {version.version_number}
                </Badge>
              </div>

              {/* Rating (for approval/general feedback) */}
              {config.showRating && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Rating (Optional)
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 rounded transition-colors ${
                          star <= rating 
                            ? 'text-yellow-400 hover:text-yellow-500' 
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-sm text-gray-600">
                        ({rating}/5)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Feedback Text */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Feedback {type === 'decline' ? '(Required)' : '(Optional)'}
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={config.placeholder}
                  className="min-h-[120px] resize-none"
                  rows={5}
                />
                <p className="text-xs text-gray-500">
                  {feedback.length}/500 characters
                </p>
              </div>

              {/* Quick Feedback Templates (for decline) */}
              {type === 'decline' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Quick Templates
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      "Please revise the color scheme to match brand guidelines",
                      "The layout needs adjustment for better visual hierarchy",
                      "Content needs to be more aligned with the brief requirements",
                      "Quality could be improved - please provide higher resolution"
                    ].map((template, index) => (
                      <button
                        key={index}
                        onClick={() => setFeedback(feedback + (feedback ? '\n\n' : '') + template)}
                        className="text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200 transition-colors"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (type === 'decline' && !feedback.trim())}
                  className={`flex-1 gap-2 ${config.buttonColor} text-white`}
                >
                  {isSubmitting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Submitting...' : config.buttonText}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}