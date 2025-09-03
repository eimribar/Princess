import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  CalendarX,
  ArrowRight
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

export default function DeadlineImpactWarning({ 
  originalDeadline,
  currentDeadline,
  impactDays = 0,
  feedbackHistory = [],
  showProjection = true,
  nextFeedbackImpact = 3 // Default days added per feedback cycle
}) {
  if (!originalDeadline) return null;

  const original = new Date(originalDeadline);
  const current = currentDeadline ? new Date(currentDeadline) : original;
  const delayDays = differenceInDays(current, original);
  const isDelayed = delayDays > 0;
  const projectedDeadline = addDays(current, nextFeedbackImpact);

  // Calculate impact breakdown by feedback rounds
  const impactBreakdown = feedbackHistory
    .filter(item => item.deadline_impact_days > 0)
    .map((item, index) => ({
      round: index + 1,
      date: item.date,
      impact: item.deadline_impact_days,
      feedback: item.feedback
    }));

  // Severity levels
  const getSeverity = () => {
    if (delayDays === 0) return 'on-track';
    if (delayDays <= 3) return 'minor';
    if (delayDays <= 7) return 'moderate';
    return 'severe';
  };

  const severity = getSeverity();
  const severityConfig = {
    'on-track': {
      color: 'green',
      icon: Clock,
      title: 'On Track',
      bgClass: 'bg-green-50 border-green-200',
      textClass: 'text-green-700',
      iconClass: 'text-green-600'
    },
    'minor': {
      color: 'yellow',
      icon: Clock,
      title: 'Minor Delay',
      bgClass: 'bg-yellow-50 border-yellow-200',
      textClass: 'text-yellow-700',
      iconClass: 'text-yellow-600'
    },
    'moderate': {
      color: 'orange',
      icon: AlertTriangle,
      title: 'Moderate Delay',
      bgClass: 'bg-orange-50 border-orange-200',
      textClass: 'text-orange-700',
      iconClass: 'text-orange-600'
    },
    'severe': {
      color: 'red',
      icon: CalendarX,
      title: 'Significant Delay',
      bgClass: 'bg-red-50 border-red-200',
      textClass: 'text-red-700',
      iconClass: 'text-red-600'
    }
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      {/* Main Impact Alert */}
      {isDelayed && (
        <Alert className={`border ${config.bgClass}`}>
          <Icon className={`h-4 w-4 ${config.iconClass}`} />
          <AlertTitle className={config.textClass}>
            {config.title}: {delayDays} days
          </AlertTitle>
          <AlertDescription className={config.textClass}>
            The deadline has been pushed from{' '}
            <strong>{format(original, 'MMM dd, yyyy')}</strong> to{' '}
            <strong>{format(current, 'MMM dd, yyyy')}</strong>
            {impactBreakdown.length > 0 && (
              <span> due to {impactBreakdown.length} feedback round{impactBreakdown.length > 1 ? 's' : ''}.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Timeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4" />
            Deadline Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Original Deadline */}
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Original Deadline</span>
                  <span className="text-sm text-gray-900">
                    {format(original, 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* Impact Breakdown */}
            <AnimatePresence>
              {impactBreakdown.map((impact, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 ml-4"
                >
                  <div className="mt-1.5">
                    <ArrowRight className="w-3 h-3 text-orange-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Feedback Round {impact.round}
                      </span>
                      <Badge variant="outline" className="text-xs text-orange-600">
                        +{impact.impact} days
                      </Badge>
                    </div>
                    {impact.feedback && (
                      <p className="text-xs text-gray-600 italic truncate">
                        "{impact.feedback}"
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Current Deadline */}
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                isDelayed ? 'bg-orange-500' : 'bg-green-500'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Current Deadline</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {format(current, 'MMM dd, yyyy')}
                    </span>
                    {isDelayed && (
                      <Badge variant={severity === 'severe' ? 'destructive' : 'outline'}>
                        +{delayDays} days
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Projected Next Deadline */}
            {showProjection && (
              <div className="flex items-center gap-3 opacity-60">
                <div className="w-2 h-2 rounded-full bg-gray-300 ring-2 ring-gray-200" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 italic">
                      If changes requested...
                    </span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {format(projectedDeadline, 'MMM dd, yyyy')}
                      </span>
                      <Badge variant="outline" className="text-xs text-gray-500">
                        +{nextFeedbackImpact} more days
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {isDelayed && (
            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{delayDays}</div>
                <div className="text-xs text-gray-500">Total Days Delayed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {impactBreakdown.length}
                </div>
                <div className="text-xs text-gray-500">Feedback Rounds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(delayDays / (impactBreakdown.length || 1))}
                </div>
                <div className="text-xs text-gray-500">Avg Days/Round</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {severity === 'severe' && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Recommendation</AlertTitle>
          <AlertDescription className="text-blue-700">
            Consider consolidating feedback or scheduling a review meeting to minimize 
            further delays. Each additional feedback cycle will add approximately {nextFeedbackImpact} days 
            to the timeline.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}