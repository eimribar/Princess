import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Deliverable, Stage, Comment, TeamMember } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  FileText,
  Download,
  Send,
  MessageSquare,
  Check,
  AlertCircle,
  FileClock,
  User,
  GitCommit,
  CheckSquare,
  CheckCircle2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function DeliverableDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [deliverable, setDeliverable] = useState(null);
  const [stage, setStage] = useState(null);
  const [comments, setComments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) {
      loadData(id);
    }
  }, [location.search]);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const members = await TeamMember.list();
      setTeamMembers(members || []);
    } catch (error) {
      console.error("Failed to load team members:", error);
    }
  };

  const loadData = async (id) => {
    setIsLoading(true);
    try {
      const [deliverableData, commentsData] = await Promise.all([
        Deliverable.get(id),
        Comment.filter({ deliverable_id: id }, '-created_date')
      ]);

      setDeliverable(deliverableData);
      setComments(commentsData || []);

      if (deliverableData?.stage_id) {
        const stageData = await Stage.get(deliverableData.stage_id);
        setStage(stageData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };
  
  const handleAddComment = async () => {
    if (!newComment.trim() || !deliverable) return;
    setIsSubmitting(true);
    try {
      await Comment.create({
        deliverable_id: deliverable.id,
        project_id: deliverable.project_id,
        content: newComment,
        author_name: "Current User",
        author_email: "user@deutschco.com",
        log_type: "comment"
      });
      setNewComment("");
      await loadData(deliverable.id);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdatingStatus(true);
    setUpdateMessage(null);
    try {
      await Deliverable.update(deliverable.id, { status: newStatus });
      setUpdateMessage({ 
        type: 'success', 
        text: `Deliverable status updated to ${newStatus.replace('_', ' ')}` 
      });
      
      // Log the status change as a comment
      await Comment.create({
        deliverable_id: deliverable.id,
        project_id: deliverable.project_id,
        content: `Status changed to: ${newStatus.replace('_', ' ').toUpperCase()}`,
        author_name: "Current User",
        author_email: "user@deutschco.com",
        log_type: "status_update"
      });
      
      await loadData(deliverable.id);
    } catch (error) {
      console.error("Failed to update deliverable status:", error);
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
      await Deliverable.update(deliverable.id, { assigned_to: assigneeValue });
      
      const assignedMember = teamMembers.find(member => member.email === newAssigneeEmail);
      const assigneeName = assignedMember ? assignedMember.name : "Unassigned";
      
      setUpdateMessage({ 
        type: 'success', 
        text: newAssigneeEmail === "unassign" ? 'Deliverable unassigned' : `Assigned to ${assigneeName}` 
      });
      
      // Log the assignment change as a comment
      const logMessage = newAssigneeEmail === "unassign" 
        ? "Deliverable unassigned from team member"
        : `Deliverable assigned to: ${assigneeName}`;
      await Comment.create({
        deliverable_id: deliverable.id,
        project_id: deliverable.project_id,
        content: logMessage,
        author_name: "Current User",
        author_email: "user@deutschco.com",
        log_type: "status_update"
      });
      
      await loadData(deliverable.id);
    } catch (error) {
      console.error("Failed to assign deliverable:", error);
      setUpdateMessage({ type: 'error', text: 'Failed to update assignment. Please try again.' });
    }
    setIsUpdatingAssignee(false);
    
    // Clear message after 3 seconds
    setTimeout(() => setUpdateMessage(null), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'submitted':
      case 'wip': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'needs_revision':
      case 'in_iterations': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const currentVersion = deliverable?.versions?.[deliverable.versions.length - 1];
  const feedbackRoundsUsed = deliverable?.versions?.filter(v => v.status === 'needs_revision').length || 0;
  const remainingFeedbackRounds = (deliverable?.max_revisions || 0) - feedbackRoundsUsed;
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  const assignedMember = teamMembers.find(member => member.email === deliverable?.assigned_to);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!deliverable) {
    return <div className="p-8">Deliverable not found.</div>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Deliverables
          </Button>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{deliverable.name}</h1>
              <p className="text-slate-600 mt-1">Part of "{stage?.name || 'Stage'}"</p>
            </div>
            <Badge className={`${getStatusColor(deliverable.status)} text-lg px-4 py-2`}>
              {deliverable.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Management Section */}
          <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-slate-400" />
                Deliverable Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Update Message */}
              {updateMessage && (
                <Alert className={`${updateMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  {updateMessage.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={updateMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {updateMessage.text}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status Management */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Update Status</label>
                  <Select 
                    onValueChange={handleStatusChange} 
                    defaultValue={deliverable.status}
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="wip">Work in Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in_iterations">In Iterations</SelectItem>
                    </SelectContent>
                  </Select>
                  {isUpdatingStatus && <p className="text-xs text-slate-500">Updating status...</p>}
                </div>

                {/* Assignment Management */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Assigned To</label>
                  <Select 
                    onValueChange={handleAssigneeChange} 
                    defaultValue={deliverable.assigned_to || ""}
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
                </div>
              </div>

              {/* Current Assignment Display */}
              {assignedMember && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={assignedMember.profile_image} />
                    <AvatarFallback className="text-sm">
                      {getInitials(assignedMember.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Currently assigned to {assignedMember.name}
                    </p>
                    <p className="text-xs text-slate-500">{assignedMember.email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            {/* Version Timeline */}
            <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <GitCommit className="w-6 h-6 text-slate-500"/>
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deliverable.versions && deliverable.versions.length > 0 ? (
                  <div className="relative pl-6">
                    <div className="absolute left-[34px] top-4 bottom-4 w-0.5 bg-slate-200 -translate-x-1/2"></div>
                    {deliverable.versions.map((version, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex items-start gap-6 mb-6 last:mb-0"
                      >
                        <div className="absolute left-[34px] top-4 w-4 h-4 bg-slate-200 rounded-full -translate-x-1/2 border-4 border-slate-50"></div>
                        <Avatar className="w-12 h-12 border">
                          <AvatarImage />
                          <AvatarFallback className="bg-slate-100 text-slate-500">
                            <FileClock className="w-6 h-6"/>
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 pt-1">
                          <p className="font-semibold text-slate-800">{version.version_name}</p>
                          <p className="text-sm text-slate-500 mb-3">
                            Submitted on {format(new Date(version.submission_date), 'MMM d, yyyy')}
                          </p>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={`${getStatusColor(version.status)} font-medium`}>{version.status.replace('_', ' ').toUpperCase()}</Badge>
                            <Button variant="outline" size="sm" asChild>
                              <a href={version.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-3 h-3 mr-2" />
                                Download
                              </a>
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No versions submitted yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Approval & Feedback Section */}
            {currentVersion?.status === 'submitted' && (
              <Card className="bg-white/60 backdrop-blur-xl border border-amber-200/80 shadow-amber-500/5 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                    Action Required: Review {currentVersion.version_name}
                  </CardTitle>
                  <p className="text-sm text-slate-600">
                    Please provide your feedback by {format(new Date(currentVersion.feedback_deadline), 'EEEE, MMM d')}.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Provide your feedback here... Clear feedback helps us move forward effectively."
                    className="min-h-[120px] bg-white"
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <div>
                        <p className="text-sm text-slate-600 font-medium">
                          {remainingFeedbackRounds} feedback round{remainingFeedbackRounds !== 1 && 's'} remaining.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Requesting revisions may impact the project timeline.</p>
                     </div>
                    <div className="flex gap-3 flex-shrink-0">
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Decline with Feedback
                      </Button>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4 mr-2" />
                        Approve Version
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-slate-500" />
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment or log an update..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none bg-white"
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isSubmitting}
                      className="w-full gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2">
                    {comments.map(comment => (
                      <div key={comment.id} className="flex items-start gap-3">
                         <Avatar className="w-8 h-8 border">
                          <AvatarImage />
                          <AvatarFallback className="text-xs bg-slate-100 font-semibold text-slate-600">
                             {getInitials(comment.author_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-slate-100 rounded-lg px-3 py-2">
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
                      <p className="text-sm text-slate-500 text-center py-4">No comments on this deliverable yet.</p>
                    )}
                  </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}