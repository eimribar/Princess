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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VersionControl from "@/components/deliverables/VersionControl";
import VersionUpload from "@/components/deliverables/VersionUpload";
import ApprovalWorkflow from "@/components/deliverables/ApprovalWorkflow";
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
  CheckCircle2,
  Upload,
  Clock,
  History,
  Settings
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
  const [showVersionUpload, setShowVersionUpload] = useState(false);
  const [uploadingVersionNumber, setUploadingVersionNumber] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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

  const handleVersionUpload = (versionNumber) => {
    setUploadingVersionNumber(versionNumber);
    setShowVersionUpload(true);
  };

  const handleVersionUploadSubmit = async (versionData) => {
    try {
      // Update deliverable with new version
      const updatedVersions = [...(deliverable.versions || []), versionData];
      await Deliverable.update(deliverable.id, {
        versions: updatedVersions,
        current_version: versionData.version_number
      });
      
      // Log the upload as a comment
      await Comment.create({
        deliverable_id: deliverable.id,
        project_id: deliverable.project_id,
        content: `New version uploaded: ${versionData.version_number} - ${versionData.changes_summary}`,
        author_name: "Current User",
        author_email: "user@deutschco.com",
        log_type: "version_upload"
      });
      
      await loadData(deliverable.id);
      setShowVersionUpload(false);
      setActiveTab('versions');
      setUpdateMessage({ type: 'success', text: `${versionData.version_number} uploaded successfully!` });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (error) {
      console.error('Failed to upload version:', error);
    }
  };

  const handleApprovalAction = async (versionId, action, feedback = '') => {
    try {
      const updatedVersions = deliverable.versions.map(v => {
        if (v.id === versionId) {
          return {
            ...v,
            status: action === 'approve' ? 'approved' : 'declined',
            feedback: feedback,
            feedback_date: new Date().toISOString(),
            feedback_by: 'Current User',
            approval_date: action === 'approve' ? new Date().toISOString() : null,
            approved_by: action === 'approve' ? 'Current User' : null
          };
        }
        return v;
      });
      
      await Deliverable.update(deliverable.id, { versions: updatedVersions });
      
      // Log the approval action
      await Comment.create({
        deliverable_id: deliverable.id,
        project_id: deliverable.project_id,
        content: `Version ${action === 'approve' ? 'approved' : 'declined'}: ${feedback}`,
        author_name: "Current User",
        author_email: "user@deutschco.com",
        log_type: "approval_action"
      });
      
      await loadData(deliverable.id);
      setUpdateMessage({ 
        type: 'success', 
        text: `Version ${action === 'approve' ? 'approved' : 'declined'} successfully!` 
      });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (error) {
      console.error('Failed to process approval:', error);
    }
  };

  const handleSubmitForApproval = async (versionId) => {
    try {
      const updatedVersions = deliverable.versions.map(v => {
        if (v.id === versionId) {
          return {
            ...v,
            status: 'pending_approval',
            submitted_date: new Date().toISOString()
          };
        }
        return v;
      });
      
      await Deliverable.update(deliverable.id, { versions: updatedVersions });
      await loadData(deliverable.id);
      setUpdateMessage({ type: 'success', text: 'Version submitted for approval!' });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (error) {
      console.error('Failed to submit for approval:', error);
    }
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

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-xl border border-white/20">
            <TabsTrigger value="overview" className="gap-2">
              <Settings className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="versions" className="gap-2">
              <GitCommit className="w-4 h-4" />
              Versions
            </TabsTrigger>
            <TabsTrigger value="approval" className="gap-2">
              <Clock className="w-4 h-4" />
              Approval
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <History className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <TabsContent value="overview" className="space-y-8 mt-0">
                {/* Basic Information */}
                <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-slate-500"/>
                      Deliverable Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Type</label>
                        <p className="text-sm text-slate-600 capitalize">{deliverable.type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Priority</label>
                        <p className="text-sm text-slate-600 capitalize">{deliverable.priority || 'Medium'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Max Iterations</label>
                        <p className="text-sm text-slate-600">{deliverable.max_iterations || 3}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Current Version</label>
                        <p className="text-sm text-slate-600">{deliverable.current_version || 'None'}</p>
                      </div>
                    </div>
                    {deliverable.approval_required_from && (
                      <div>
                        <label className="text-sm font-medium text-slate-700">Approval Required From</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {deliverable.approval_required_from.map((email, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="versions" className="space-y-8 mt-0">
                <VersionControl 
                  deliverable={deliverable}
                  onVersionUpload={handleVersionUpload}
                  onApprovalAction={handleApprovalAction}
                />
              </TabsContent>

              <TabsContent value="approval" className="space-y-8 mt-0">
                <ApprovalWorkflow 
                  deliverable={deliverable}
                  onApprove={(versionId, feedback) => handleApprovalAction(versionId, 'approve', feedback)}
                  onDecline={(versionId, feedback) => handleApprovalAction(versionId, 'decline', feedback)}
                  onSubmitForApproval={handleSubmitForApproval}
                />
              </TabsContent>

              <TabsContent value="activity" className="space-y-8 mt-0">
                <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <History className="w-6 h-6 text-slate-500"/>
                      Activity Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comments.map(comment => (
                        <div key={comment.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <Avatar className="w-8 h-8 border">
                            <AvatarImage />
                            <AvatarFallback className="text-xs bg-slate-100 font-semibold text-slate-600">
                              {getInitials(comment.author_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-slate-900">{comment.author_name}</span>
                              <span className="text-xs text-slate-500">
                                {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-8">No activity yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
            
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <MessageSquare className="w-6 h-6 text-slate-500" />
                      Quick Comments
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
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {comments.slice(0, 3).map(comment => (
                        <div key={comment.id} className="flex items-start gap-3">
                           <Avatar className="w-6 h-6 border">
                            <AvatarImage />
                            <AvatarFallback className="text-xs bg-slate-100 font-semibold text-slate-600">
                               {getInitials(comment.author_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-slate-100 rounded-lg px-2 py-1">
                               <p className="text-xs text-slate-700 leading-relaxed">
                                {comment.content.length > 60 ? comment.content.substring(0, 60) + '...' : comment.content}
                              </p>
                            </div>
                             <p className="text-xs text-slate-500 mt-1">
                                {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                              </p>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-4">No comments yet.</p>
                      )}
                      {comments.length > 3 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setActiveTab('activity')}
                          className="w-full text-xs"
                        >
                          View all {comments.length} comments
                        </Button>
                      )}
                    </div>
                  </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>

        {/* Version Upload Modal */}
        {showVersionUpload && (
          <VersionUpload
            deliverable={deliverable}
            versionNumber={uploadingVersionNumber}
            onUpload={handleVersionUploadSubmit}
            onClose={() => setShowVersionUpload(false)}
          />
        )}
      </div>
    </div>
  );
}