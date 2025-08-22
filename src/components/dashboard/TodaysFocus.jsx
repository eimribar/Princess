import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

export default function TodaysFocus({ 
  stages, 
  deliverables, 
  onActionClick,
  projectProgress 
}) {
  // Get today's actionable items
  const getTodayActions = () => {
    const actions = [];
    
    // Find stages that need attention
    stages.forEach(stage => {
      if (stage.status === 'blocked') {
        actions.push({
          id: stage.id,
          type: 'unblock',
          icon: AlertCircle,
          color: 'text-red-600 bg-red-50',
          title: `Unblock: ${stage.name}`,
          subtitle: 'Waiting for dependencies',
          priority: 3
        });
      } else if (stage.status === 'ready' && !stage.assigned_to) {
        actions.push({
          id: stage.id,
          type: 'assign',
          icon: Clock,
          color: 'text-blue-600 bg-blue-50',
          title: `Assign: ${stage.name}`,
          subtitle: 'Ready to start',
          priority: 2
        });
      }
    });
    
    // Find deliverables needing approval
    deliverables.forEach(deliverable => {
      if (deliverable.status === 'pending_approval' || deliverable.status === 'submitted') {
        actions.push({
          id: deliverable.id,
          type: 'approve',
          icon: CheckCircle,
          color: 'text-green-600 bg-green-50',
          title: `Review: ${deliverable.name}`,
          subtitle: 'Awaiting approval',
          priority: 1
        });
      }
    });
    
    // Sort by priority and return top 3
    return actions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3);
  };
  
  // Get next milestone
  const getNextMilestone = () => {
    const upcomingDeliverables = stages
      .filter(s => s.is_deliverable && s.status !== 'completed')
      .sort((a, b) => {
        const aDate = new Date(a.end_date || a.endDate || Date.now());
        const bDate = new Date(b.end_date || b.endDate || Date.now());
        return aDate - bDate;
      });
    
    if (upcomingDeliverables.length === 0) return null;
    
    const next = upcomingDeliverables[0];
    const daysUntil = Math.ceil(
      (new Date(next.end_date || next.endDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      name: next.name,
      daysUntil,
      status: next.status
    };
  };
  
  const todayActions = getTodayActions();
  const nextMilestone = getNextMilestone();
  const hasActions = todayActions.length > 0;
  
  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Today's Focus
              </CardTitle>
              <p className="text-sm text-slate-600">
                {hasActions ? `${todayActions.length} actions need your attention` : 'All caught up!'}
              </p>
            </div>
          </div>
          {!hasActions && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              On Track
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Action Items */}
        {hasActions ? (
          <div className="space-y-3">
            {todayActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start p-3 h-auto hover:bg-slate-50 group"
                  onClick={() => onActionClick(action)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color} mr-3`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-900">{action.title}</p>
                    <p className="text-xs text-slate-500">{action.subtitle}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Sparkles className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-slate-700 font-medium">You're all caught up!</p>
            <p className="text-sm text-slate-500 mt-1">No actions required today</p>
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Overall Progress</span>
            <span className="font-semibold text-slate-900">{projectProgress}%</span>
          </div>
          <Progress value={projectProgress} className="h-2" />
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <TrendingUp className="w-3 h-3" />
            <span>On track for completion</span>
          </div>
        </div>
        
        {/* Next Milestone */}
        {nextMilestone && (
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Next Milestone
                </p>
                <p className="font-semibold text-slate-900">{nextMilestone.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{nextMilestone.daysUntil}</p>
                <p className="text-xs text-slate-500">days</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}