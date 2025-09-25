import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { formatDistanceToNow, isValid, format } from "date-fns";
import { SupabaseStage, SupabaseDeliverable } from "@/api/supabaseEntities";
import { getDependencyStatus } from './DependencyUtils';
import { useToast } from "@/components/ui/use-toast";

// Material Icons
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

// Helper to get status icon
const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="text-green-600" style={{ fontSize: 'inherit' }} />;
    case 'in_progress':
      return <AccessTimeIcon className="text-blue-600" style={{ fontSize: 'inherit' }} />;
    case 'blocked':
      return <LockIcon className="text-red-500" style={{ fontSize: 'inherit' }} />;
    default:
      return <RadioButtonUncheckedIcon className="text-gray-400" style={{ fontSize: 'inherit' }} />;
  }
};

// Helper to get status button style
const getStatusButtonStyle = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 hover:bg-green-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
    case 'blocked':
      return 'bg-red-100 text-red-700 hover:bg-red-200';
    default:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  }
};

// Helper to get status label
const getStatusLabel = (status) => {
  switch (status) {
    case 'completed': return 'Completed';
    case 'in_progress': return 'In Progress';
    case 'blocked': return 'Blocked';
    case 'not_started': return 'Ready';
    default: return 'Not Started';
  }
};

// Helper to find descendants
const findDescendants = (stageId, allStages) => {
  const descendants = [];
  const findDeps = (id) => {
    allStages.forEach(stage => {
      if (stage.dependencies?.includes(id) && !descendants.find(d => d.id === stage.id)) {
        descendants.push(stage);
        findDeps(stage.id);
      }
    });
  };
  findDeps(stageId);
  return descendants;
};

export default function StageSidebarV2({ 
  stage, 
  stages, 
  comments, 
  onClose, 
  onAddComment, 
  onStageUpdate, 
  teamMembers,
  isExpanded = false,
  onToggleExpand,
  deliverables = [],
  readOnly = false
}) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(stage?.status || 'not_started');
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [localExpanded, setLocalExpanded] = useState(isExpanded);
  const { toast } = useToast();
  
  // Use local state if no handler provided
  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setLocalExpanded(!localExpanded);
    }
  };
  
  const expanded = onToggleExpand ? isExpanded : localExpanded;
  
  // Check if stage is locked/blocked
  const dependencyStatus = stage ? getDependencyStatus(stage, stages) : 'not_started';
  const isLocked = dependencyStatus === 'blocked';
  // Allow reverting completed stages
  const canModify = !isLocked && onStageUpdate;
  
  // Get associated deliverable for deliverable stages
  const associatedDeliverable = stage?.is_deliverable ? 
    deliverables?.find(d => d.id === stage.deliverable_id || d.stage_id === stage.id) : null;
  
  // Get assigned member
  const assignedMember = (() => {
    if (stage?.is_deliverable && associatedDeliverable?.assigned_to) {
      return teamMembers.find(member => member.id === associatedDeliverable.assigned_to);
    }
    return stage?.assigned_to ? teamMembers.find(member => member.id === stage.assigned_to) : null;
  })();
  
  useEffect(() => {
    // Always sync with the stage's actual status
    if (stage?.status) {
      setSelectedStatus(stage.status);
    }
  }, [stage?.status]);
  
  useEffect(() => {
    // Sync assignee separately
    setSelectedAssignee(assignedMember?.id || 'unassigned');
  }, [assignedMember?.id]);

  if (!stage) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (newStatus) => {
    if (!canModify || newStatus === selectedStatus) return;
    
    // Update local state immediately for instant feedback
    const previousStatus = selectedStatus;
    setSelectedStatus(newStatus);
    
    try {
      // Simple validation - don't block the UI update
      if (newStatus === 'completed' || newStatus === 'in_progress') {
        // Check if dependencies are met
        const incompleteDeps = stage.dependencies?.filter(depId => {
          const dep = stages.find(s => s.id === depId);
          return dep && dep.status !== 'completed';
        }) || [];
        
        if (incompleteDeps.length > 0 && newStatus !== 'not_started') {
          // Revert optimistic update
          setSelectedStatus(previousStatus);
          toast({
            title: "Cannot Change Status",
            description: `${incompleteDeps.length} dependencies must be completed first`,
            variant: "destructive",
          });
          return;
        }
      }
      
      // Call the parent's update handler directly
      if (onStageUpdate) {
        await onStageUpdate(stage.id, { status: newStatus });
        
        toast({
          title: newStatus === 'completed' ? "Stage Completed!" : 
                 newStatus === 'in_progress' ? "Stage Started" : "Status Updated",
          description: `${stage.name} status changed to ${newStatus.replace('_', ' ')}`,
          duration: 3000,
        });
      }
    } catch (error) {
      // Revert on error
      setSelectedStatus(previousStatus);
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };
  
  const handleAssigneeChange = async (value) => {
    try {
      const memberId = value === 'unassigned' ? null : value;
      
      if (stage?.is_deliverable && associatedDeliverable) {
        await SupabaseDeliverable.update(associatedDeliverable.id, { assigned_to: memberId });
        await SupabaseStage.update(stage.id, { assigned_to: memberId });
      } else {
        await SupabaseStage.update(stage.id, { assigned_to: memberId });
      }
      
      setSelectedAssignee(value);
      const member = teamMembers.find(m => m.id === memberId);
      toast({
        title: "Assignee Updated",
        description: member ? `Assigned to ${member.name}` : "Assignment removed",
        duration: 3000,
      });
      onStageUpdate && onStageUpdate(stage.id, { assigned_to: memberId });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assignee",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  
  // Get dependencies
  const blockedDependencies = stage.dependencies?.map(depId => 
    stages.find(s => s.id === depId)
  ).filter(dep => dep && dep.status !== 'completed') || [];
  
  const completedDependencies = stage.dependencies?.map(depId => 
    stages.find(s => s.id === depId)
  ).filter(dep => dep && dep.status === 'completed') || [];
  
  // Get stages that depend on this one
  const enabledStages = stages.filter(s => 
    s.dependencies?.includes(stage.id)
  );

  // Navigate to previous/next stage
  const currentIndex = stages.findIndex(s => s.id === stage.id);
  const prevStage = currentIndex > 0 ? stages[currentIndex - 1] : null;
  const nextStage = currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;

  return (
    <motion.div 
      className="h-full flex flex-col bg-white border-l border-gray-200"
      initial={{ width: 380 }}
      animate={{ width: expanded ? 600 : 380 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-indigo-600 text-white flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0">
            {stage.number_index}
          </div>
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {stage.name}
            {stage.is_deliverable && (
              <StarIcon className="inline ml-1 text-amber-400" style={{ fontSize: 16 }} />
            )}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggle}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? 
              <ChevronRightIcon style={{ fontSize: 20 }} /> : 
              <ChevronLeftIcon style={{ fontSize: 20 }} />
            }
          </button>
          <button 
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${getStatusButtonStyle(dependencyStatus)}`}
          >
            <span className="text-sm">{getStatusIcon(dependencyStatus)}</span>
            <span>{getStatusLabel(dependencyStatus)}</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors ml-2"
          >
            <CloseIcon style={{ fontSize: 20 }} />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-x-hidden">
        <div className="p-4 space-y-4">
          {/* Phase Badge */}
          {stage.category && (
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-500 w-20">Phase:</span>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full capitalize">
                {stage.category.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* Controls - Show for agency/admin only */}
          {!readOnly ? (
            <div className="space-y-3">
              <div className="flex items-center">
                <label className="text-xs font-medium text-gray-500 w-20">Status:</label>
                <Select
                  value={selectedStatus}
                  onValueChange={handleStatusChange}
                  disabled={!canModify}
                >
                  <SelectTrigger className="flex-1 h-8 text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedStatus)}
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">
                      <div className="flex items-center gap-2">
                        <RadioButtonUncheckedIcon className="text-gray-400" style={{ fontSize: 16 }} />
                        <span>Not Started</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex items-center gap-2">
                        <AccessTimeIcon className="text-blue-600" style={{ fontSize: 16 }} />
                        <span>In Progress</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="text-green-600" style={{ fontSize: 16 }} />
                        <span>Completed</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center">
                <label className="text-xs font-medium text-gray-500 w-20">Assigned:</label>
                <Select
                  value={selectedAssignee || 'unassigned'}
                  onValueChange={handleAssigneeChange}
                  disabled={!onStageUpdate}
                >
                  <SelectTrigger className="flex-1 h-8 text-sm">
                    {assignedMember ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={assignedMember.profile_image} />
                          <AvatarFallback className="text-xs bg-gray-100">
                            {getInitials(assignedMember.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{assignedMember.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      <span className="text-gray-500">Unassigned</span>
                    </SelectItem>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={member.profile_image} />
                            <AvatarFallback className="text-xs bg-gray-100">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            /* Client View - Show status and assigned person as read-only */
            <div className="space-y-3">
              <div className="flex items-center">
                <label className="text-xs font-medium text-gray-500 w-20">Status:</label>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md flex-1">
                  {getStatusIcon(selectedStatus)}
                  <span className="text-sm">{getStatusLabel(selectedStatus)}</span>
                </div>
              </div>
              
              {assignedMember && (
                <div className="flex items-center">
                  <label className="text-xs font-medium text-gray-500 w-20">Team Lead:</label>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md flex-1">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={assignedMember.profile_image} />
                      <AvatarFallback className="text-xs bg-gray-100">
                        {getInitials(assignedMember.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{assignedMember.name}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Deliverable Card */}
          {stage.is_deliverable && associatedDeliverable && (
            <div 
              onClick={() => window.location.href = `/deliverables/${associatedDeliverable.id}`}
              className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-md cursor-pointer hover:bg-indigo-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-900">Deliverable</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  associatedDeliverable.status === 'approved' ? 'bg-green-100 text-green-700' :
                  associatedDeliverable.status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {associatedDeliverable.status}
                </span>
              </div>
              {associatedDeliverable.max_iterations && (
                <div className="mt-1.5 text-xs text-indigo-700">
                  Iteration {associatedDeliverable.current_iteration}/{associatedDeliverable.max_iterations}
                </div>
              )}
            </div>
          )}

          {/* Video Preview (when expanded) */}
          {expanded && (
            <div className="mt-4">
              <h3 className="text-xs font-medium text-gray-500 mb-2">Preview</h3>
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group cursor-pointer">
                {/* Placeholder for video */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300">
                  {stage.wireframe_example ? (
                    <img 
                      src={stage.wireframe_example} 
                      alt={`${stage.name} preview`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 text-sm">No preview available</p>
                    </div>
                  )}
                </div>
                
                {/* Play button overlay */}
                {stage.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <PlayArrowIcon className="text-gray-900 ml-1" style={{ fontSize: 32 }} />
                    </div>
                  </div>
                )}
                
                {/* Video info overlay */}
                {stage.video_url && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white text-sm font-medium">Stage Overview</p>
                    <p className="text-white/80 text-xs">Click to play video</p>
                  </div>
                )}
              </div>
              
              {/* Video description */}
              {expanded && stage.video_description && (
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                  {stage.video_description}
                </p>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 -mx-4">
            <nav className="-mb-px flex space-x-4 px-4">
              <button
                onClick={() => setActiveTab('details')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs transition-colors ${
                  activeTab === 'details'
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs transition-colors ${
                  activeTab === 'activity'
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Activity
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' ? (
            <div className="space-y-4 mt-4">
              {/* Details */}
              {stage.formal_name && stage.formal_name !== stage.name && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">Formal Name</h3>
                  <p className="text-sm text-gray-900">{stage.formal_name}</p>
                </div>
              )}
              
              {stage.description && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">Description</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{stage.description}</p>
                </div>
              )}
              
              {stage.deadline && isValid(new Date(stage.deadline)) && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">Deadline</h3>
                  <p className="text-sm text-gray-900">{format(new Date(stage.deadline), 'MMM d, yyyy')}</p>
                </div>
              )}

              {/* Dependencies Section - Same view for all users */}
              <div className="pt-2 space-y-4">
                  <h2 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Dependencies</h2>
                  
                  <div className="space-y-4">
                    {/* Depends On */}
                    {(blockedDependencies.length > 0 || completedDependencies.length > 0) && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-400 mb-2">
                      DEPENDS ON ({blockedDependencies.length + completedDependencies.length})
                    </h3>
                    <div className="space-y-1.5">
                      {completedDependencies.map(dep => (
                        <div
                          key={dep.id}
                          onClick={() => document.getElementById(`stage-${dep.id}`)?.click()}
                          className="flex items-center justify-between p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100">
                              <CheckCircleIcon className="text-green-600" style={{ fontSize: 14 }} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {dep.number_index}. {dep.name}
                              </p>
                              <span className="text-xs text-green-600">completed</span>
                            </div>
                          </div>
                          <ChevronRightIcon className="text-gray-400" style={{ fontSize: 18 }} />
                        </div>
                      ))}
                      {blockedDependencies.map(dep => (
                        <div
                          key={dep.id}
                          onClick={() => document.getElementById(`stage-${dep.id}`)?.click()}
                          className="flex items-center justify-between p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100">
                              <LockIcon className="text-red-500" style={{ fontSize: 14 }} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {dep.number_index}. {dep.name}
                              </p>
                              <span className="text-xs text-red-500">
                                {dep.status === 'in_progress' ? 'in progress' : 'not started'}
                              </span>
                            </div>
                          </div>
                          <ChevronRightIcon className="text-gray-400" style={{ fontSize: 18 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Stage Highlight */}
                <div className="p-2 rounded-md bg-indigo-50 border border-indigo-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-indigo-500">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-700">
                        {stage.number_index}. {stage.name}
                      </p>
                      <span className="text-xs text-indigo-600">Current Stage</span>
                    </div>
                  </div>
                </div>

                {/* Enables */}
                {enabledStages.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-400 mb-2">
                      ENABLES ({enabledStages.length})
                    </h3>
                    <div className="space-y-1.5">
                      {enabledStages.map(dep => {
                        const depStatus = getDependencyStatus(dep, stages);
                        return (
                          <div
                            key={dep.id}
                            onClick={() => document.getElementById(`stage-${dep.id}`)?.click()}
                            className="flex items-center justify-between p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 flex items-center justify-center rounded-full ${
                                depStatus === 'completed' ? 'bg-green-100' :
                                depStatus === 'in_progress' ? 'bg-blue-100' :
                                depStatus === 'blocked' ? 'bg-red-100' :
                                'bg-gray-100'
                              }`}>
                                {depStatus === 'completed' ? 
                                  <CheckCircleIcon className="text-green-600" style={{ fontSize: 14 }} /> :
                                  depStatus === 'in_progress' ?
                                  <AccessTimeIcon className="text-blue-600" style={{ fontSize: 14 }} /> :
                                  depStatus === 'blocked' ?
                                  <LockIcon className="text-red-500" style={{ fontSize: 14 }} /> :
                                  <RadioButtonUncheckedIcon className="text-gray-400" style={{ fontSize: 14 }} />
                                }
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {dep.number_index}. {dep.name}
                                </p>
                                <span className={`text-xs ${
                                  depStatus === 'completed' ? 'text-green-600' :
                                  depStatus === 'in_progress' ? 'text-blue-600' :
                                  depStatus === 'blocked' ? 'text-red-500' :
                                  'text-gray-500'
                                }`}>
                                  {getStatusLabel(depStatus).toLowerCase()}
                                </span>
                              </div>
                            </div>
                            <ArrowForwardIcon className="text-gray-400" style={{ fontSize: 18 }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                  </div>
                </div>
            </div>
          ) : (
            // Activity Tab
            <div className="space-y-4">
              {canModify && (
                <div className="space-y-2">
                  <Textarea 
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] text-sm"
                  />
                  <Button 
                    onClick={handleSubmitComment} 
                    disabled={!newComment.trim() || isSubmitting} 
                    size="sm"
                    className="w-full"
                  >
                    {isSubmitting ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              )}
              
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="flex items-start gap-2.5">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-xs bg-gray-100">
                        {getInitials(comment.author_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {comment.author_name} • {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">No comments yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}