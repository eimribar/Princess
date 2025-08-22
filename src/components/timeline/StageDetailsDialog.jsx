import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar, 
  Link2, 
  Star,
  FileText,
  Hash
} from 'lucide-react';

export default function StageDetailsDialog({ stage, teamMembers, allStages, open, onOpenChange }) {
  if (!stage) return null;

  const assignedMember = teamMembers?.find(m => m.email === stage.assigned_to);
  
  // Get dependency stages
  const dependencies = (stage.dependencies || []).map(depId => 
    allStages?.find(s => s.id === depId)
  ).filter(Boolean);

  // Get stages that depend on this stage
  const dependentStages = allStages?.filter(s => 
    s.dependencies?.includes(stage.id)
  ) || [];

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Completed' };
      case 'in_progress':
        return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'In Progress' };
      case 'blocked':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', label: 'Blocked' };
      default:
        return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Not Started' };
    }
  };

  const statusConfig = getStatusConfig(stage.status);
  const StatusIcon = statusConfig.icon;

  const getCategoryColor = (category) => {
    const colors = {
      'onboarding': 'bg-blue-100 text-blue-700',
      'research': 'bg-purple-100 text-purple-700',
      'strategy': 'bg-indigo-100 text-indigo-700',
      'brand_building': 'bg-pink-100 text-pink-700',
      'brand_collaterals': 'bg-orange-100 text-orange-700',
      'brand_activation': 'bg-green-100 text-green-700',
      'employer_branding': 'bg-teal-100 text-teal-700',
      'project_closure': 'bg-gray-100 text-gray-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const formatCategory = (category) => {
    return category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'General';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {stage.is_deliverable && (
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
              )}
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-normal text-slate-500">{stage.number_index}</span>
            </div>
            <span>{stage.name}</span>
          </DialogTitle>
          <DialogDescription>
            Stage details and dependencies
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Status and Category */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusConfig.bg}`}>
              <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
              <span className={`text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <Badge className={getCategoryColor(stage.category)}>
              {formatCategory(stage.category)}
            </Badge>
            {stage.is_deliverable && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                Deliverable
              </Badge>
            )}
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Start Date</p>
                  <p className="text-sm font-medium">
                    {stage.start_date ? format(new Date(stage.start_date), 'MMM d, yyyy') : 'Not set'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">End Date</p>
                  <p className="text-sm font-medium">
                    {stage.end_date ? format(new Date(stage.end_date), 'MMM d, yyyy') : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Duration: {stage.estimated_duration || 0} days
            </div>
          </div>

          <Separator />

          {/* Assigned To */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Assigned To</h3>
            {assignedMember ? (
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={assignedMember.avatar_url || assignedMember.profile_image} />
                  <AvatarFallback>
                    {assignedMember.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{assignedMember.name}</p>
                  <p className="text-xs text-slate-500">{assignedMember.role}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Not assigned</p>
            )}
          </div>

          {/* Description */}
          {stage.description && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Description</h3>
                <p className="text-sm text-slate-600">{stage.description}</p>
              </div>
            </>
          )}

          {/* Dependencies */}
          {dependencies.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Dependencies ({dependencies.length})
                </h3>
                <div className="space-y-2">
                  {dependencies.map(dep => (
                    <div key={dep.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{dep.number_index}</span>
                        <span className="text-sm">{dep.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {dep.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Dependent Stages */}
          {dependentStages.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Stages Depending on This ({dependentStages.length})
                </h3>
                <div className="space-y-2">
                  {dependentStages.map(dep => (
                    <div key={dep.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{dep.number_index}</span>
                        <span className="text-sm">{dep.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {dep.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Additional Details */}
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Blocking Priority</p>
              <p className="font-medium capitalize">{stage.blocking_priority || 'Medium'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Resource Dependency</p>
              <p className="font-medium capitalize">{stage.resource_dependency?.replace('_', ' ') || 'None'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}