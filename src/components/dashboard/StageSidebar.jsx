
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
  AlertCircle
} from "lucide-react";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { Stage, TeamMember, Comment } from "@/api/entities"; // Added Comment

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
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'blocked': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'not_started': return <Clock className="w-5 h-5 text-slate-400" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  const deadlineDate = stage.deadline ? new Date(stage.deadline) : null;
  const assignedMember = teamMembers.find(member => member.email === stage.assigned_to);

  return (
    <div className="h-full flex flex-col bg-white/80 backdrop-blur-xl">
      <CardHeader className="border-b border-slate-200/60 p-6 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">{stage.number_index}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {stage.is_deliverable && <Star className="w-5 h-5 text-amber-400 fill-current" />}
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Step {stage.number_index}
                  </CardTitle>
                </div>
                <p className="text-slate-600 font-medium">{stage.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusIcon(stage.status)}
              <Badge variant="outline" className="text-xs font-medium">
                {stage.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {stage.is_optional && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                  Optional
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0 text-slate-500 hover:text-slate-800">
            <X className="w-4 h-4" />
          </Button>
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

      <ScrollArea className="flex-1">
        <CardContent className="p-6 space-y-8">
          {/* Management Section */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-3 font-semibold text-slate-800 text-sm">
              <CheckSquare className="w-4 h-4 text-slate-400" />
              <span>Management</span>
            </h4>
            
            {/* Status Management */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Change Status</label>
              <Select 
                onValueChange={handleStatusChange} 
                defaultValue={stage.status}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              {isUpdatingStatus && <p className="text-xs text-slate-500">Updating status...</p>}
            </div>

            {/* Assignment Management */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Assigned To</label>
              <Select 
                onValueChange={handleAssigneeChange} 
                defaultValue={stage.assigned_to || ""}
                disabled={isUpdatingAssignee}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.email}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={member.profile_image} />
                          <AvatarFallback className="text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="unassign">
                    <span className="text-slate-500 italic">Unassign</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {isUpdatingAssignee && <p className="text-xs text-slate-500">Updating assignment...</p>}
              
              {/* Current Assignment Display */}
              {assignedMember && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-slate-50 rounded-lg">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={assignedMember.profile_image} />
                    <AvatarFallback className="text-xs">
                      {getInitials(assignedMember.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-slate-700">
                    Currently assigned to <strong>{assignedMember.name}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-slate-200/60" />

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
          
          <Separator className="bg-slate-200/60" />
          
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

          {/* Resources */}
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

          <Separator className="bg-slate-200/60" />

          {/* Activity Feed */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-3 font-semibold text-slate-800 text-sm">
              <MessageCircle className="w-4 h-4 text-slate-400" />
              <span>Activity</span>
            </h4>
            
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
        </CardContent>
      </ScrollArea>
    </div>
  );
}
