import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
  ChevronRight,
  ChevronLeft,
  Lock,
  ExternalLink, 
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Send,
  FileText,
  Paperclip,
  Calendar,
  Info,
  GitBranch,
  Activity,
  Video,
  Play,
  Loader2,
  User,
  AlertCircle
} from "lucide-react";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { SupabaseStage, SupabaseTeamMember, SupabaseComment } from "@/api/supabaseEntities";
import ProfessionalManagement from './ProfessionalManagement';
import MiniDependencyMap from './MiniDependencyMap';
import { motion, AnimatePresence } from "framer-motion";
import { getDependencyStatus } from './DependencyUtils';

// Helper function to find all stages that depend on a given stage
const findDescendants = (stageId, allStages) => {
  const descendants = new Set();
  const queue = [stageId];
  const visited = new Set();

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const children = allStages.filter(s => s.dependencies?.includes(currentId));
    for (const child of children) {
      if (!descendants.has(child.id)) {
        descendants.add(child);
        queue.push(child.id);
      }
    }
  }
  return Array.from(descendants);
};

export default function StageSidebarV2({ 
  stage, 
  stages, 
  comments, 
  onClose, 
  onAddComment, 
  onStageUpdate, 
  teamMembers,
  isExpanded,
  onToggleExpand 
}) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  
  // Check if stage is locked/blocked
  const dependencyStatus = stage ? getDependencyStatus(stage, stages) : 'not_started';
  const isLocked = dependencyStatus === 'blocked';
  const canModify = !isLocked && stage?.status !== 'completed';

  if (!stage) {
    return (
      <div className="w-full h-full flex flex-col bg-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading stage details...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !canModify) return;
    
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
    if (!canModify) return;
    
    setIsUpdatingStatus(true);
    setUpdateMessage(null);
    const originalStatus = stage.status;

    try {
      await Stage.update(stage.id, { status: newStatus });
      await onAddComment(`Status changed to: ${newStatus.replace('_', ' ').toUpperCase()}`);
      setUpdateMessage({ type: 'success', text: `Status updated to ${newStatus.replace('_', ' ')}` });

      if (originalStatus === 'completed' && newStatus !== 'completed') {
        const descendants = findDescendants(stage.id, stages || []);
        const stagesToReset = descendants.filter(s => s.status === 'in_progress');

        if (stagesToReset.length > 0) {
          for (const descendant of stagesToReset) {
            await Stage.update(descendant.id, { status: 'not_started' });
            await Comment.create({
              project_id: descendant.project_id,
              stage_id: descendant.id,
              content: `Status automatically reset because dependency "${stage.name}" was un-completed.`,
              author_name: "System",
              author_email: "system@deutschco.com",
            });
          }
        }
      }
      
      if (onStageUpdate) {
        await onStageUpdate();
      }
    } catch (error) {
      console.error("Failed to update stage status:", error);
      setUpdateMessage({ type: 'error', text: 'Failed to update status.' });
    }
    setIsUpdatingStatus(false);
    setTimeout(() => setUpdateMessage(null), 3000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'in_progress': return <Clock className="w-3.5 h-3.5 text-blue-600" />;
      case 'blocked': return <AlertTriangle className="w-3.5 h-3.5 text-red-600" />;
      case 'not_started': return <Clock className="w-3.5 h-3.5 text-slate-500" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  const deadlineDate = stage.deadline ? new Date(stage.deadline) : null;
  const assignedMember = teamMembers.find(member => member.email === stage.assigned_to);

  // Get blocked dependencies
  const blockedDependencies = isLocked ? 
    (stage.dependencies || []).map(depId => stages.find(s => s.id === depId))
      .filter(dep => dep && dep.status !== 'completed') : [];

  return (
    <motion.div 
      className="w-full h-full flex flex-col bg-white"
      animate={{ width: isExpanded ? 600 : 380 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <CardHeader className="border-b border-gray-200 p-4 flex-shrink-0 bg-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{stage.number_index}</span>
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Step {stage.number_index}: {stage.name}
                </CardTitle>
              </div>
              {stage.is_deliverable && <Star className="w-4 h-4 text-amber-400 fill-current" />}
              {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
            </div>
            
            <div className="flex items-center gap-2 ml-11">
              {getStatusIcon(dependencyStatus)}
              <Badge variant="outline" className="text-xs font-medium">
                {dependencyStatus.replace('_', ' ').toUpperCase()}
              </Badge>
              {stage.category && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 border-purple-200 capitalize">
                  {stage.category.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
              className="h-8 w-8"
            >
              {isExpanded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              type="button"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Locked Stage Alert */}
        {isLocked && blockedDependencies.length > 0 && (
          <Alert className="mt-4 bg-amber-50 border-amber-200">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>This stage is locked.</strong> Complete these first:
              <ul className="mt-2 space-y-1">
                {blockedDependencies.map(dep => (
                  <li key={dep.id} className="text-sm">
                    • Step {dep.number_index}: {dep.name}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Update Message */}
        {updateMessage && (
          <Alert className={`mt-4 ${
            updateMessage.type === 'success' ? 'bg-green-50 border-green-200' : 
            updateMessage.type === 'info' ? 'bg-blue-50 border-blue-200' : 
            'bg-red-50 border-red-200'
          }`}>
            <AlertDescription>{updateMessage.text}</AlertDescription>
          </Alert>
        )}
      </CardHeader>

      {/* Management Section - Always visible */}
      <div className="p-4 border-b border-gray-200">
        <ProfessionalManagement 
          stage={stage}
          allStages={stages}
          onStageUpdate={onStageUpdate}
          teamMembers={teamMembers}
          isReadOnly={isLocked}
        />
      </div>

      {/* Simplified Tabs - Only 2 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 px-4 bg-gray-50">
          <TabsTrigger value="details" className="text-sm">
            <Info className="w-4 h-4 mr-1.5" />
            Details
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-sm">
            <Activity className="w-4 h-4 mr-1.5" />
            Activity
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Details Tab - Combined content */}
          <TabsContent value="details" className="p-4 space-y-4 mt-0">
            {/* Overview Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="flex items-center gap-2 font-medium text-gray-900 text-sm mb-4">
                <Info className="w-4 h-4 text-gray-400" />
                <span>Overview</span>
              </h4>
              <div className="space-y-3">
                {stage.formal_name && stage.formal_name !== stage.name && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Formal Name</p>
                    <p className="text-gray-900 text-sm">{stage.formal_name}</p>
                  </div>
                )}
                {stage.description && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Description</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{stage.description}</p>
                  </div>
                )}
                {isValid(deadlineDate) && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Deadline</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400"/>
                      <span className="text-sm text-gray-700">
                        {format(deadlineDate, 'MMMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                )}
                {assignedMember && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Assigned To</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={assignedMember.profile_image} />
                        <AvatarFallback className="text-xs bg-gray-100">
                          {getInitials(assignedMember.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-700">{assignedMember.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Video Section - Only in expanded view */}
            {isExpanded && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="flex items-center gap-2 font-medium text-gray-900 text-sm mb-4">
                  <Video className="w-4 h-4 text-gray-400" />
                  <span>Tutorial Video</span>
                </h4>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-white/90 backdrop-blur rounded-full p-4 shadow-lg hover:bg-white transition-colors">
                      <Play className="w-8 h-8 text-gray-700 ml-1" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-sm text-gray-600 bg-white/90 backdrop-blur rounded px-3 py-2">
                      Introduction to {stage.name}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Dependencies Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="flex items-center gap-2 font-medium text-gray-900 text-sm mb-4">
                <GitBranch className="w-4 h-4 text-gray-400" />
                <span>Dependencies</span>
              </h4>
              <MiniDependencyMap 
                currentStage={stage}
                allStages={stages}
              />
            </div>
            
            {/* Resources Section */}
            {stage.resource_links?.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="flex items-center gap-2 font-medium text-gray-900 text-sm mb-4">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span>Resources</span>
                </h4>
                <div className="space-y-2">
                  {stage.resource_links.map((link, index) => (
                    <Button key={index} variant="outline" asChild className="w-full justify-start text-left">
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {link.split('/').pop() || 'Resource Link'}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="p-4 mt-0">
            <div className="space-y-4">
              {/* Comment Form - Only if not locked */}
              {canModify && (
                <div className="space-y-2">
                  <Textarea 
                    placeholder="Add a comment or log an update..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-white"
                    disabled={!canModify}
                  />
                  <Button 
                    onClick={handleSubmitComment} 
                    disabled={!newComment.trim() || isSubmitting || !canModify} 
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              )}

              {/* Locked Message */}
              {!canModify && (
                <Alert className="bg-gray-50 border-gray-200">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <AlertDescription className="text-gray-600">
                    Comments are disabled for locked stages
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Comments List */}
              <div className="space-y-5 pt-2">
                {comments.map(comment => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 border">
                      <AvatarImage />
                      <AvatarFallback className="text-xs bg-slate-100 font-semibold text-slate-600">
                        {getInitials(comment.author_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-slate-100/80 rounded-lg px-3 py-2">
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">
                        {comment.author_name} • {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No activity on this step yet.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </motion.div>
  );
}