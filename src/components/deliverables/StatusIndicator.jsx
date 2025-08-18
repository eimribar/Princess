import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText,
  Upload,
  Target,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatusIndicator({ deliverable, className = '' }) {
  const versions = deliverable?.versions || [];
  const totalVersions = versions.length;
  const approvedVersions = versions.filter(v => v.status === 'approved').length;
  const pendingVersions = versions.filter(v => v.status === 'pending_approval').length;
  const declinedVersions = versions.filter(v => v.status === 'declined').length;
  
  const progressPercent = totalVersions > 0 ? (approvedVersions / totalVersions) * 100 : 0;
  
  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return { 
          color: 'bg-green-50 text-green-700 border-green-200', 
          icon: CheckCircle2,
          bgGradient: 'from-green-50 to-green-100'
        };
      case 'wip':
        return { 
          color: 'bg-blue-50 text-blue-700 border-blue-200', 
          icon: Upload,
          bgGradient: 'from-blue-50 to-blue-100'
        };
      case 'in_iterations':
        return { 
          color: 'bg-amber-50 text-amber-700 border-amber-200', 
          icon: Clock,
          bgGradient: 'from-amber-50 to-amber-100'
        };
      case 'needs_revision':
        return { 
          color: 'bg-red-50 text-red-700 border-red-200', 
          icon: AlertTriangle,
          bgGradient: 'from-red-50 to-red-100'
        };
      default:
        return { 
          color: 'bg-gray-50 text-gray-700 border-gray-200', 
          icon: FileText,
          bgGradient: 'from-gray-50 to-gray-100'
        };
    }
  };

  const statusConfig = getStatusConfig(deliverable.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br ${statusConfig.bgGradient} rounded-xl p-6 border border-white/50 backdrop-blur-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${statusConfig.color.replace('text-', 'text-').replace('border-', 'bg-')}`}>
            <StatusIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Status Overview</h3>
            <Badge variant="outline" className={statusConfig.color}>
              {deliverable.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
        {deliverable.current_version && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Current Version</p>
            <p className="font-bold text-lg text-gray-900">{deliverable.current_version}</p>
          </div>
        )}
      </div>

      {/* Progress Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-1">
            <Upload className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalVersions}</p>
          <p className="text-xs text-gray-600">Total</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">{approvedVersions}</p>
          <p className="text-xs text-gray-600">Approved</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full mx-auto mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">{pendingVersions}</p>
          <p className="text-xs text-gray-600">Pending</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full mx-auto mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700">{declinedVersions}</p>
          <p className="text-xs text-gray-600">Declined</p>
        </div>
      </div>

      {/* Approval Progress */}
      {totalVersions > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <Target className="w-4 h-4" />
              Approval Progress
            </span>
            <span className="font-semibold text-gray-900">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3 bg-gray-200" />
          <p className="text-xs text-gray-500">
            {approvedVersions} of {totalVersions} versions approved
          </p>
        </div>
      )}

      {/* Success Rate */}
      {totalVersions > 1 && (
        <div className="mt-4 pt-4 border-t border-white/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Success Rate
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {totalVersions > 0 ? Math.round((approvedVersions / totalVersions) * 100) : 0}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}