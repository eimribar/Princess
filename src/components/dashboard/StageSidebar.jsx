
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
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
  User,
  CheckSquare,
  AlertCircle,
  GitBranch,
  Users,
  Activity,
  Video
} from "lucide-react";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { Stage, TeamMember, Comment } from "@/api/entities"; // Added Comment
import CompactStageActions from './CompactStageActions';
import MiniDependencyMap from './MiniDependencyMap';

// Helper function to find all stages that depend on a given stage, directly or indirectly
const findDescendants = (stageId, allStages) => {
  const descendants = new Set();
  const queue = [stageId]; // Using an array as a queue for BFS
  const visited = new Set(); // To prevent infinite loops and redundant processing

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    // Find stages that list currentId as a dependency
    const children = allStages.filter(s => s.dependencies?.includes(currentId));
    for (const child of children) {
      if (!descendants.has(child.id)) { // Check if already added to descendants set by its ID
        descendants.add(child); // Add the full child object
        queue.push(child.id); // Add child's ID to queue for further exploration
      }
    }
  }
  return Array.from(descendants);
};


export default function StageSidebar({ stage, stages, comments, onClose, onAddComment, onStageUpdate, teamMembers }) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // teamMembers state removed as it's passed via props
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // loadTeamMembers useEffect and function removed as teamMembers is now a prop
  // useEffect(() => {
  //   loadTeamMembers();
  // }, []);

  // const loadTeamMembers = async () => {
  //   try {
  //     const members = await TeamMember.list();
  //     setTeamMembers(members || []);
  //   } catch (error) {
  //     console.error("Failed to load team members:", error);
  //   }
  // };

  if (!stage) return null;

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
    setIsUpdatingStatus(true);
    setUpdateMessage(null);
    const originalStatus = stage.status;

    try {
      // 1. Update the primary stage
      await Stage.update(stage.id, { status: newStatus });
      await onAddComment(`Status changed to: ${newStatus.replace('_', ' ').toUpperCase()}`);
      setUpdateMessage({ type: 'success', text: `Status updated to ${newStatus.replace('_', ' ')}` });

      // 2. Handle cascading status updates if a stage is "un-completed"
      if (originalStatus === 'completed' && newStatus !== 'completed') {
        setUpdateMessage({ type: 'info', text: 'Dependency status changed. Checking dependent stages for necessary resets...' });
        
        // Find all stages that are descendants of the current stage
        const descendants = findDescendants(stage.id, stages || []);
        // Filter descendants to find those that are 'in_progress' and need to be reset
        const stagesToReset = descendants.filter(s => s.status === 'in_progress');

        if (stagesToReset.length > 0) {
          setUpdateMessage({ type: 'info', text: `Reverting ${stagesToReset.length} dependent stage(s) to 'Not Started'...` });

          for (const descendant of stagesToReset) {
            await Stage.update(descendant.id, { status: 'not_started' });
            // Log this change as a comment on the descendant stage
            await Comment.create({
                project_id: descendant.project_id, // Ensure descendant object has project_id
                stage_id: descendant.id,
                content: `Status automatically reset to NOT STARTED because a required dependency ("${stage.name}") was un-completed.`, 
                author_name: "System",
                author_email: "system@deutschco.com", 
            });
          }
        } else {
             setUpdateMessage({ type: 'info', text: 'No dependent stages needed status reset.' });
        }
      }
      
      // 3. Notify parent component to reload all data after all updates are done
      if (onStageUpdate) {
        await onStageUpdate();
      }
       // Final success message after all operations are complete
       setUpdateMessage({ type: 'success', text: `Stage updated successfully.` });


    } catch (error) {
      console.error("Failed to update stage status:", error);
      setUpdateMessage({ type: 'error', text: 'Failed to update status. Please try again.' });
    }
    setIsUpdatingStatus(false);
    
    // Clear message after 3 seconds
    setTimeout(() => setUpdateMessage(null), 3000);
  };

  const handleAssigneeChange = async (newAssigneeEmail) => {
    setIsUpdatingAssignee(true);
    setUpdateMessage(null);
    try {
      const assigneeValue = newAssigneeEmail === "unassign" ? null : newAssigneeEmail;
      await Stage.update(stage.id, { assigned_to: assigneeValue });
      
      const assignedMember = teamMembers.find(member => member.email === newAssigneeEmail);
      const assigneeName = assignedMember ? assignedMember.name : "Unassigned";
      
      setUpdateMessage({ 
        type: 'success', 
        text: newAssigneeEmail === "unassign" ? 'Stage unassigned' : `Assigned to ${assigneeName}` 
      });
      
      // Log the assignment change as a comment
      const logMessage = newAssigneeEmail === "unassign" 
        ? "Stage unassigned from team member"
        : `Stage assigned to: ${assigneeName}`;
      await onAddComment(logMessage);
      
      // Notify parent component about the update
      if (onStageUpdate) {
        await onStageUpdate();
      }
    } catch (error) {
      console.error("Failed to assign stage:", error);
      setUpdateMessage({ type: 'error', text: 'Failed to update assignment. Please try again.' });
    }
    setIsUpdatingAssignee(false);
    
    // Clear message after 3 seconds
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

  return (
    <div className="h-full flex flex-col bg-white/80 backdrop-blur-xl">
      <CardHeader className="border-b border-slate-200/60 p-4 flex-shrink-0">
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
            </div>
            
            <div className="flex items-center gap-2 ml-11">
              {getStatusIcon(stage.status)}
              <Badge variant="outline" className="text-xs font-medium">
                {stage.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {stage.category && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 border-purple-200 capitalize">
                  {stage.category.replace('_', ' ')}
                </Badge>
              )}
              {stage.is_optional && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                  Optional
                </Badge>
              )}
            </div>
          </div>
          <button 
            onClick={() => {
              console.log('X button clicked!');
              if (onClose) {
                onClose();
              }
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            style={{ 
              position: 'relative',
              zIndex: 10000,
              pointerEvents: 'auto'
            }}
            type="button"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Update Message */}
        {updateMessage && (
          <Alert className={`mt-4 
            ${updateMessage.type === 'success' ? 'bg-green-50 border-green-200' : 
              updateMessage.type === 'info' ? 'bg-blue-50 border-blue-200' : 
              'bg-red-50 border-red-200'}`}>
            {updateMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : updateMessage.type === 'info' ? (
              <Info className="h-4 w-4 text-blue-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={
              updateMessage.type === 'success' ? 'text-green-800' : 
              updateMessage.type === 'info' ? 'text-blue-800' : 
              'text-red-800'}>
              {updateMessage.text}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      {/* Management Section */}
      <div className="px-4 py-4 border-b border-slate-200/60">
        <CompactStageActions 
          stage={stage}
          allStages={stages}
          onStageUpdate={onStageUpdate}
          teamMembers={teamMembers}
        />
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 px-6">
          <TabsTrigger value="overview" className="text-xs">
            <Info className="w-3 h-3 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="text-xs">
            <GitBranch className="w-3 h-3 mr-1" />
            Dependencies
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">
            <Activity className="w-3 h-3 mr-1" />
            Activity
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="overview" className="p-6 space-y-8 mt-0">
            {/* Details Section */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-3 font-semibold text-slate-800 text-sm">
                <Info className="w-4 h-4 text-slate-400" />
                <span>Details</span>
              </h4>
            {stage.formal_name && stage.formal_name !== stage.name && (
              <div>
                <p className="text-xs text-slate-500 font-medium">Formal Name</p>
                <p className="text-slate-700 font-medium">{stage.formal_name}</p>
              </div>
            )}
            {stage.description && (
              <div>
                <p className="text-xs text-slate-500 font-medium">Description</p>
                <p className="text-slate-600 text-sm leading-relaxed">{stage.description}</p>
              </div>
            )}
            {isValid(deadlineDate) && (
              <div className="flex items-center gap-2 pt-2">
                <Calendar className="w-4 h-4 text-slate-400"/>
                <span className="text-sm text-slate-600">
                  Due: <span className="font-medium text-slate-800">{format(deadlineDate, 'MMMM d, yyyy')}</span>
                </span>
              </div>
            )}
            </div>
            
            {/* Visual Example */}
            {stage.visual_example_url && (
              <div className="space-y-3">
                <h4 className="flex items-center gap-3 font-semibold text-slate-800 text-sm">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>What to Expect</span>
                </h4>
                <div className="rounded-lg overflow-hidden border border-slate-200/60">
                  <img src={stage.visual_example_url} alt={`Example for ${stage.name}`} className="w-full h-auto object-cover" />
                </div>
              </div>
            )}
          </TabsContent>

          {/* Dependencies Tab */}
          <TabsContent value="dependencies" className="p-6 mt-0">
            <MiniDependencyMap 
              currentStage={stage}
              allStages={stages}
            />
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="p-6 space-y-6 mt-0">
            {/* Team Members Section */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-3 font-semibold text-slate-800 text-sm">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Team Members</span>
              </h4>
              {assignedMember ? (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                      <AvatarImage src={assignedMember.profile_image} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                        {getInitials(assignedMember.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{assignedMember.name}</p>
                      <p className="text-sm text-gray-600">{assignedMember.email}</p>
                      <Badge className="mt-1 bg-indigo-100 text-indigo-700 border-indigo-200">
                        Assigned Lead
                      </Badge>
                    </div>
                  </div>
                  {assignedMember.video_intro_url && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-3 bg-white hover:bg-indigo-50 border-indigo-200"
                      asChild
                    >
                      <a href={assignedMember.video_intro_url} target="_blank" rel="noopener noreferrer">
                        <Video className="w-4 h-4 mr-2" />
                        Watch Introduction Video
                      </a>
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4 bg-gray-50 rounded-lg">
                  No team member assigned yet
                </p>
              )}
            </div>

            {/* Resource Links */}
            {stage.resource_links?.length > 0 && (
              <div className="space-y-3">
                <h4 className="flex items-center gap-3 font-semibold text-slate-800 text-sm">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <span>Resources</span>
                </h4>
                <div className="space-y-2">
                  {stage.resource_links.map((link, index) => (
                    <Button key={index} variant="outline" asChild className="w-full justify-start text-left bg-white">
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
          <TabsContent value="activity" className="p-6 mt-0">
            <div className="space-y-4">
            
            {/* New Comment Form */}
            <div className="space-y-2">
              <Textarea 
                placeholder="Add a comment or log an update..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-white"
              />
              <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmitting} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
            
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
    </div>
  );
}
