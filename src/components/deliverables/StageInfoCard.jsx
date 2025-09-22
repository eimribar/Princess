import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Calendar,
  GitBranch,
  ExternalLink,
  Layers,
  Target,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function StageInfoCard({ stage, deliverable, teamMembers = [] }) {
  const navigate = useNavigate();
  
  if (!stage) return null;
  
  const assignedMember = teamMembers.find(m => m.id === stage.assigned_to);
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'blocked':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'blocked':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="w-full border-2 border-indigo-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">{stage.number_index}</span>
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Stage Information
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {stage.category?.replace('_', ' ').charAt(0).toUpperCase() + stage.category?.slice(1).replace('_', ' ')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            View in Timeline
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Stage Name and Status */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {stage.name}
              </h3>
              {stage.formal_name && (
                <p className="text-sm text-gray-600 mt-1">{stage.formal_name}</p>
              )}
            </div>
            <Badge className={`${getStatusColor(stage.status)} px-3 py-1`}>
              <span className="flex items-center gap-1.5">
                {getStatusIcon(stage.status)}
                {stage.status.replace('_', ' ').toUpperCase()}
              </span>
            </Badge>
          </div>
          
          {stage.description && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {stage.description}
            </p>
          )}
        </div>

        {/* Key Information Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Assigned To */}
          {assignedMember && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={assignedMember.profile_image} />
                <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                  {assignedMember.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-gray-500">Assigned to</p>
                <p className="text-sm font-medium text-gray-900">{assignedMember.name}</p>
              </div>
            </div>
          )}
          
          {/* Duration */}
          {stage.estimated_duration && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-medium text-gray-900">{stage.estimated_duration} days</p>
              </div>
            </div>
          )}
          
          {/* Start Date */}
          {stage.start_date && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(stage.start_date), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          )}
          
          {/* End Date */}
          {stage.end_date && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">End Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(stage.end_date), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dependencies Section */}
        {stage.dependencies && stage.dependencies.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">Dependencies</h4>
              <Badge variant="outline" className="text-xs">
                {stage.dependencies.length}
              </Badge>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-900">
                This stage depends on {stage.dependencies.length} other stage{stage.dependencies.length > 1 ? 's' : ''} to be completed first.
              </p>
            </div>
          </div>
        )}

        {/* Stage Impact */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-semibold text-gray-900">Stage Impact</h4>
          </div>
          
          <div className="space-y-2">
            {deliverable?.status === 'approved' && stage.status !== 'completed' && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">
                  Approving this deliverable will <strong>complete this stage</strong>
                </span>
              </div>
            )}
            
            {stage.is_deliverable && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="text-gray-700">
                  This stage produces a <strong>deliverable output</strong>
                </span>
              </div>
            )}
            
            {stage.client_facing && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">
                  This stage is <strong>visible to the client</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate('/dashboard')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View in Dashboard
          </Button>
          {stage.wireframe_example && (
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => window.open(stage.wireframe_example, '_blank')}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Example
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}