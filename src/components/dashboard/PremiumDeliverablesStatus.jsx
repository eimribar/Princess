import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  ArrowRight,
  TrendingUp,
  Package,
  ExternalLink,
  Zap
} from 'lucide-react';

export default function PremiumDeliverablesStatus({ deliverables }) {
  const deliverablesByStatus = {
    completed: deliverables?.filter(d => d.status === 'completed') || [],
    in_progress: deliverables?.filter(d => d.status === 'in_progress') || [],
    pending_approval: deliverables?.filter(d => d.status === 'pending_approval') || [],
    not_started: deliverables?.filter(d => d.status === 'not_started') || []
  };

  const totalDeliverables = deliverables?.length || 0;
  const completedCount = deliverablesByStatus.completed.length;
  const progressPercentage = totalDeliverables > 0 ? (completedCount / totalDeliverables) * 100 : 0;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          badge: 'bg-green-50 text-green-700 border-green-200'
        };
      case 'in_progress':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          badge: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'pending_approval':
        return {
          icon: AlertCircle,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          badge: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      default:
        return {
          icon: FileText,
          color: 'text-gray-500',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          badge: 'bg-gray-50 text-gray-600 border-gray-200'
        };
    }
  };

  if (totalDeliverables === 0) {
    return (
      <Card className="overflow-hidden border border-gray-200 shadow-lg bg-white">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-gray-400" />
            <div>
              <h3 className="font-medium text-gray-900">Deliverables</h3>
              <p className="text-sm text-gray-500">No deliverables yet</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-gray-50 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm">No deliverables created yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-gray-200 shadow-lg bg-white">
      <CardHeader className="bg-gray-50 border-b border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Deliverables</h3>
              <p className="text-sm text-gray-500">{completedCount} of {totalDeliverables} completed</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold text-gray-900">{Math.round(progressPercentage)}%</div>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="bg-gray-200 rounded-full h-1.5">
            <motion.div 
              className="bg-gray-600 rounded-full h-1.5"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="p-4">
          {/* Status Summary Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {Object.entries(deliverablesByStatus).map(([status, items]) => {
              const config = getStatusConfig(status);
              const Icon = config.icon;
              
              if (items.length === 0) return null;
              
              return (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-lg border ${config.border} ${config.bg} cursor-pointer transition-all duration-200`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <span className="text-xs font-medium text-gray-700 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <Badge variant="secondary" className={config.badge}>
                      {items.length}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Recent Deliverables */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Recent Activity
              </h4>
            </div>
            
            <AnimatePresence>
              {deliverables?.slice(0, 3).map((deliverable, index) => {
                const config = getStatusConfig(deliverable.status);
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={deliverable.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:border-gray-300 transition-all duration-200">
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">
                            {deliverable.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 capitalize">
                              {deliverable.status.replace('_', ' ')}
                            </span>
                            {deliverable.type && (
                              <span className="text-xs text-gray-400">
                                • {deliverable.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-7 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* View All Button */}
          {totalDeliverables > 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4"
            >
              <Button 
                variant="outline" 
                className="w-full group hover:border-gray-300 hover:bg-gray-50"
              >
                <span className="text-gray-600 group-hover:text-gray-700">
                  View All Deliverables
                </span>
                <ArrowRight className="w-4 h-4 ml-2 text-gray-600 group-hover:text-gray-700 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}