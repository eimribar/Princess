import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SupabaseDeliverable as Deliverable, SupabaseStage as Stage, SupabaseComment as Comment, SupabaseTeamMember as TeamMember } from "@/api/supabaseEntities";
import { useProject } from "@/contexts/ProjectContext";
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
import FilePreview from "@/components/deliverables/FilePreview";
import StatusIndicator from "@/components/deliverables/StatusIndicator";
import FileTypeIcon, { FileTypeLabel } from "@/components/deliverables/FileTypeIcon";
import NotificationService from "@/services/notificationService";
// New feedback management components
import FeedbackManager from "@/components/deliverables/FeedbackManager";
import FeedbackLimitIndicator from "@/components/deliverables/FeedbackLimitIndicator";
import DeadlineImpactWarning from "@/components/deliverables/DeadlineImpactWarning";
import ApprovalFinality from "@/components/deliverables/ApprovalFinality";
import StageInfoCard from "@/components/deliverables/StageInfoCard";
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
  Settings,
  Eye,
  ThumbsUp,
  ThumbsDown,
  X,
  ChevronRight,
  Home
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function DeliverableDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Try to use ProjectContext but don't fail if it's not available
  let projectContext = null;
  let contextAvailable = false;
  
  try {
    projectContext = useProject();
    contextAvailable = true;
  } catch (error) {
    // ProjectContext not available, but that's okay - we can still load data directly
    console.log('ProjectContext not available, running in standalone mode');
  }
  
  const { 
    updateDeliverable, 
    deliverables: contextDeliverables, 
    stages: contextStages,
    currentProjectId,
    switchProject 
  } = projectContext || {};
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
  const [previewFile, setPreviewFile] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null); // 'approve' or 'decline'
  const [approvalFeedback, setApprovalFeedback] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [quickComment, setQuickComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  
  // Refs for cleanup
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [id]);

  // Listen for context updates to sync real-time changes (only if context is available)
  useEffect(() => {
    if (projectContext && id && contextDeliverables) {
      const updatedDeliverable = contextDeliverables.find(d => d.id === id);
      if (updatedDeliverable && 
          JSON.stringify(updatedDeliverable) !== JSON.stringify(deliverable)) {
        // Sanitize versions before setting
        const sanitizedDeliverable = {
          ...updatedDeliverable,
          versions: sanitizeVersionsArray(updatedDeliverable.versions)
        };
        setDeliverable(sanitizedDeliverable);
        // Also update the stage if needed
        if (updatedDeliverable.stage_id && contextStages) {
          const updatedStage = contextStages.find(s => s.id === updatedDeliverable.stage_id);
          if (updatedStage) {
            setStage(updatedStage);
          }
        }
      }
    }
  }, [contextDeliverables, contextStages, id, projectContext]);

  // Team members are now loaded in loadData after we have the project_id

  // Sanitize status values to match current database enum
  const sanitizeVersionStatus = (status) => {
    const statusMap = {
      'pending_approval': 'submitted',
      'draft': 'not_started',
      'wip': 'in_progress'
    };
    return statusMap[status] || status;
  };

  // Sanitize all versions in an array
  const sanitizeVersionsArray = (versions) => {
    if (!versions || !Array.isArray(versions)) return versions;
    return versions.map(v => ({
      ...v,
      status: sanitizeVersionStatus(v.status)
    }));
  };

  const loadTeamMembers = async (projectId) => {
    try {
      // Filter team members by project_id to avoid duplicates from other projects
      const members = await TeamMember.filter({ project_id: projectId });
      setTeamMembers(members || []);
    } catch (error) {
      console.error("Failed to load team members:", error);
      setTeamMembers([]);
    }
  };

  const loadData = async (deliverableId) => {
    setIsLoading(true);
    try {
      const [deliverableData, commentsData] = await Promise.all([
        Deliverable.get(deliverableId),
        Comment.filter({ deliverable_id: deliverableId }, '-created_date')
      ]);

      if (!deliverableData) {
        console.error('Deliverable not found:', deliverableId);
        setIsLoading(false);
        return;
      }

      // Sanitize versions array to fix old enum values
      const sanitizedDeliverable = {
        ...deliverableData,
        versions: sanitizeVersionsArray(deliverableData.versions)
      };
      
      setDeliverable(sanitizedDeliverable);
      setComments(commentsData || []);
      
      // Ensure ProjectContext has the right project loaded
      if (contextAvailable && deliverableData.project_id) {
        if (currentProjectId !== deliverableData.project_id) {
          console.log(`Project mismatch detected. Current: ${currentProjectId}, Deliverable's: ${deliverableData.project_id}`);
          if (switchProject) {
            console.log(`Switching to project ${deliverableData.project_id}...`);
            try {
              await switchProject(deliverableData.project_id);
              console.log('Project switch successful');
            } catch (error) {
              console.error('Failed to switch project:', error);
              // Continue anyway - we can still work without context
            }
          }
        }
      }
      
      // Load team members filtered by project to avoid duplicates
      if (deliverableData.project_id) {
        await loadTeamMembers(deliverableData.project_id);
      }

      if (deliverableData?.stage_id) {
        const stageData = await Stage.get(deliverableData.stage_id);
        setStage(stageData);
      }
    } catch (error) {
      console.error("Error loading deliverable data:", error);
    }
    setIsLoading(false);
  };
  
  const handleAddComment = async (commentText = null) => {
    const comment = commentText || newComment;
    if (!comment.trim() || !deliverable) return;
    setIsSubmitting(true);
    try {
      const newCommentObj = await Comment.create({
        deliverable_id: deliverable.id,
        project_id: deliverable.project_id,
        content: comment,
        author_name: "Current User",
        author_email: "user@deutschco.com",
        log_type: "comment"
      });
      
      // Create notification for comment
      await NotificationService.notifyCommentAdded(deliverable, newCommentObj);
      
      if (!commentText) setNewComment("");
      await loadData(deliverable.id);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (newStatus) => {
    if (!deliverable) {
      console.error('No deliverable loaded');
      return;
    }

    setIsUpdatingStatus(true);
    setUpdateMessage(null);
    
    const maxRetries = 3;
    let success = false;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting to update status to ${newStatus} (attempt ${attempt}/${maxRetries})`);
        
        // Check if deliverable exists in context
        const deliverableInContext = contextAvailable && contextDeliverables?.some(d => d.id === deliverable.id);
        
        // Try context update first if available and deliverable is in context
        if (contextAvailable && updateDeliverable && deliverableInContext) {
          console.log('Using context update method...');
          success = await updateDeliverable(deliverable.id, { 
            status: newStatus 
          }, { 
            maxRetries: 1,  // Don't retry within updateDeliverable since we're retrying here
            silent: true 
          });
        }
        
        // Fallback to direct update if context update failed or unavailable
        if (!success) {
          console.log('Using direct update method...');
          await Deliverable.update(deliverable.id, { status: newStatus });
          
          // Manually sync stage if needed
          if (stage?.is_deliverable) {
            const stageStatusMap = {
              'not_started': 'not_started',
              'in_progress': 'in_progress',
              'submitted': 'in_progress',
              'declined': 'in_progress',
              'approved': 'completed'
            };
            
            const newStageStatus = stageStatusMap[newStatus] || 'not_started';
            console.log(`Syncing stage status to ${newStageStatus}...`);
            
            try {
              await Stage.update(stage.id, { status: newStageStatus });
            } catch (stageError) {
              console.error('Failed to sync stage status:', stageError);
              // Don't fail the whole operation if stage sync fails
            }
          }
          
          success = true;
        }

        if (success) {
          console.log('Status update successful!');
          
          // Create audit log comment
          try {
            await Comment.create({
              deliverable_id: deliverable.id,
              project_id: deliverable.project_id,
              content: `Status changed to: ${newStatus.replace('_', ' ').toUpperCase()}`,
              author_name: "Current User",
              author_email: "user@deutschco.com"
            });
          } catch (commentError) {
            console.error('Failed to create audit comment:', commentError);
            // Don't fail the whole operation if comment fails
          }

          // Reload data to ensure consistency
          await loadData(deliverable.id);
          
          // Broadcast the update to other tabs/components
          try {
            const channel = new BroadcastChannel('deliverable-updates');
            channel.postMessage({
              type: 'status_updated',
              deliverableId: deliverable.id,
              projectId: deliverable.project_id,
              newStatus: newStatus,
              timestamp: Date.now()
            });
            channel.close();
            console.log('[DeliverableDetail] Broadcasted status update');
          } catch (broadcastError) {
            console.error('[DeliverableDetail] Failed to broadcast update:', broadcastError);
          }
          
          setUpdateMessage({ 
            type: 'success', 
            text: `Status updated to ${newStatus.replace('_', ' ')}` 
          });
          
          break; // Success, exit retry loop
        }
      } catch (error) {
        lastError = error;
        console.error(`Status update attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!success) {
      console.error('Failed to update status after all retries:', lastError);
      setUpdateMessage({ 
        type: 'error', 
        text: 'Failed to update status. Please refresh and try again.' 
      });
    }

    setIsUpdatingStatus(false);
    
    // Clear message after 3 seconds
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setUpdateMessage(null);
      timeoutRef.current = null;
    }, 3000);
  };

  const handleAssigneeChange = async (newAssigneeId) => {
    if (!deliverable) {
      console.error('No deliverable loaded');
      return;
    }

    setIsUpdatingAssignee(true);
    setUpdateMessage(null);
    
    const maxRetries = 3;
    let success = false;
    let lastError = null;
    const assigneeValue = newAssigneeId === "unassign" ? null : newAssigneeId;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting to update assignment (attempt ${attempt}/${maxRetries})`);
        
        // Check if deliverable exists in context
        const deliverableInContext = contextAvailable && contextDeliverables?.some(d => d.id === deliverable.id);
        
        // Try context update first if available and deliverable is in context
        if (contextAvailable && updateDeliverable && deliverableInContext) {
          console.log('Using context update method for assignment...');
          success = await updateDeliverable(deliverable.id, { 
            assigned_to: assigneeValue 
          }, { 
            maxRetries: 1,
            silent: true 
          });
        }
        
        // Fallback to direct update if context update failed or unavailable
        if (!success) {
          console.log('Using direct update method for assignment...');
          await Deliverable.update(deliverable.id, { assigned_to: assigneeValue });
          
          // Manually sync stage if needed
          if (stage?.is_deliverable) {
            console.log('Syncing stage assignment...');
            try {
              await Stage.update(stage.id, { assigned_to: assigneeValue });
            } catch (stageError) {
              console.error('Failed to sync stage assignment:', stageError);
              // Don't fail the whole operation if stage sync fails
            }
          }
          
          success = true;
        }

        if (success) {
          console.log('Assignment update successful!');
          
          const assignedMember = teamMembers.find(member => member.id === newAssigneeId);
          const assigneeName = assignedMember ? assignedMember.name : "Unassigned";
          
          // Create audit log comment
          try {
            const logMessage = newAssigneeId === "unassign" 
              ? "Deliverable unassigned from team member"
              : `Deliverable assigned to: ${assigneeName}`;
              
            await Comment.create({
              deliverable_id: deliverable.id,
              project_id: deliverable.project_id,
              content: logMessage,
              author_name: "Current User",
              author_email: "user@deutschco.com"
            });
          } catch (commentError) {
            console.error('Failed to create audit comment:', commentError);
            // Don't fail the whole operation if comment fails
          }

          // Reload data to ensure consistency
          await loadData(deliverable.id);
          
          setUpdateMessage({ 
            type: 'success', 
            text: newAssigneeId === "unassign" ? 'Deliverable unassigned' : `Assigned to ${assigneeName}` 
          });
          
          break; // Success, exit retry loop
        }
      } catch (error) {
        lastError = error;
        console.error(`Assignment update attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!success) {
      console.error('Failed to update assignment after all retries:', lastError);
      setUpdateMessage({ 
        type: 'error', 
        text: 'Failed to update assignment. Please refresh and try again.' 
      });
    }

    setIsUpdatingAssignee(false);
    
    // Clear message after 3 seconds
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setUpdateMessage(null);
      timeoutRef.current = null;
    }, 3000);
  };

  const handleVersionUpload = (versionNumber) => {
    setUploadingVersionNumber(versionNumber);
    setShowVersionUpload(true);
  };

  const handleVersionUploadSubmit = async (versionData) => {
    try {
      // Create a new version in the deliverable_versions table
      await Deliverable.createVersion(deliverable.id, {
        ...versionData,
        status: 'not_started',
        created_at: new Date().toISOString(),
        submitted_by: 'Current User'
      });
      
      // Update the current_version field on the deliverable
      await Deliverable.update(deliverable.id, {
        current_version: versionData.version_number
      });
      
      // Create notification
      await NotificationService.notifyVersionUpload(deliverable, versionData);
      
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
      const version = deliverable.versions.find(v => v.id === versionId);
      
      // Update the version in the deliverable_versions table
      const updateData = {
        status: action === 'approve' ? 'approved' : 'declined',
        feedback: feedback,
        feedback_date: new Date().toISOString(),
        feedback_by: 'Current User',
        approval_date: action === 'approve' ? new Date().toISOString() : null,
        approved_by: action === 'approve' ? 'Current User' : null
      };
      
      await Deliverable.updateVersion(versionId, updateData);
      
      // Create notifications
      if (action === 'approve') {
        await NotificationService.notifyVersionApproved(deliverable, version);
      } else {
        await NotificationService.notifyVersionDeclined(deliverable, version, 'Current User', feedback);
      }
      
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
      const version = deliverable.versions.find(v => v.id === versionId);
      
      // Update the version in the deliverable_versions table
      await Deliverable.updateVersion(versionId, {
        status: 'submitted',
        submitted_date: new Date().toISOString()
      });
      
      // Create notification for approval request
      await NotificationService.notifyApprovalRequest(deliverable, version);
      
      await loadData(deliverable.id);
      setUpdateMessage({ type: 'success', text: 'Version submitted for approval!' });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (error) {
      console.error('Failed to submit for approval:', error);
    }
  };

  const handleFilePreview = (version) => {
    setPreviewFile(version);
    setShowFilePreview(true);
  };

  const handleFileDownload = (version) => {
    if (version.file_url) {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = version.file_url;
      link.download = version.file_name || `${deliverable.name}_${version.version_number}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleVersionRollback = async (version) => {
    if (window.confirm(`Are you sure you want to set ${version.version_number} as the current version? This will rollback from ${deliverable.current_version}.`)) {
      try {
        // Update current version
        await Deliverable.update(deliverable.id, { 
          current_version: version.version_number 
        });
        
        // Log the rollback action
        await Comment.create({
          deliverable_id: deliverable.id,
          project_id: deliverable.project_id,
          content: `Version rolled back to ${version.version_number} from ${deliverable.current_version}`,
          author_name: "Current User",
          author_email: "user@deutschco.com",
          log_type: "version_rollback"
        });
        
        // Create notification
        await NotificationService.notifySystemUpdate(
          `Version rolled back to ${version.version_number} for "${deliverable.name}"`
        );
        
        await loadData(deliverable.id);
        setUpdateMessage({ 
          type: 'success', 
          text: `Rolled back to ${version.version_number} successfully!` 
        });
        setTimeout(() => setUpdateMessage(null), 3000);
      } catch (error) {
        console.error('Failed to rollback version:', error);
        setUpdateMessage({ type: 'error', text: 'Failed to rollback version. Please try again.' });
        setTimeout(() => setUpdateMessage(null), 3000);
      }
    }
  };

  const handleQuickApprovalAction = (action, version) => {
    setApprovalAction(action);
    setApprovalFeedback('');
    setShowApprovalDialog(true);
  };

  const handleProcessApproval = async () => {
    if (!approvalAction) return;
    
    const latestVersion = deliverable.versions[deliverable.versions.length - 1];
    if (!latestVersion) return;

    // For decline, feedback is required
    if (approvalAction === 'decline' && !approvalFeedback.trim()) {
      return;
    }

    setIsProcessingApproval(true);
    try {
      await handleApprovalAction(latestVersion.id, approvalAction, approvalFeedback);
      setShowApprovalDialog(false);
      setApprovalAction(null);
      setApprovalFeedback('');
    } catch (error) {
      console.error('Failed to process approval:', error);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleQuickComment = async () => {
    if (!quickComment.trim()) return;
    setIsAddingComment(true);
    try {
      await handleAddComment(quickComment);
      setQuickComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'submitted':
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'needs_revision':
      case 'in_iterations': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const currentVersion = deliverable?.versions?.[deliverable.versions.length - 1];
  const feedbackRoundsUsed = deliverable?.versions?.filter(v => v.status === 'needs_revision').length || 0;
  const remainingFeedbackRounds = (deliverable?.max_revisions || 0) - feedbackRoundsUsed;
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  const assignedMember = teamMembers.find(member => member.id === deliverable?.assigned_to);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!deliverable) {
    return <div className="p-8">Deliverable not found.</div>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {stage?.category && (
              <>
                <span className="capitalize">
                  {stage.category.replace('_', ' ')}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </>
            )}
            {stage && (
              <>
                <span>Step {stage.number_index}: {stage.name}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </>
            )}
            <span className="font-medium text-gray-900">{deliverable.name}</span>
          </nav>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{deliverable.name}</h1>
              <p className="text-slate-600 mt-1">Deliverable for Stage {stage?.number_index}: {stage?.name}</p>
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
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="submitted">Submitted for Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
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
                        <SelectItem key={member.id} value={member.id}>
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 rounded-lg p-1 mb-8">
              <TabsTrigger value="overview" className="text-sm font-medium">
                Overview
              </TabsTrigger>
              <TabsTrigger value="versions" className="text-sm font-medium">
                Versions
              </TabsTrigger>
              <TabsTrigger value="feedback" className="text-sm font-medium">
                Feedback
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-sm font-medium">
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-0">
                {/* Stage Information Card */}
                {stage && (
                  <StageInfoCard 
                    stage={stage} 
                    deliverable={deliverable}
                    teamMembers={teamMembers}
                  />
                )}
                
                {/* Status Overview */}
                <StatusIndicator deliverable={deliverable} />
                
                {/* Feedback Limit Indicator */}
                {deliverable.max_iterations && (
                  <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm">
                    <CardContent className="pt-6">
                      <FeedbackLimitIndicator
                        currentIteration={deliverable.current_iteration || 0}
                        maxIterations={deliverable.max_iterations}
                        isCompact={false}
                      />
                    </CardContent>
                  </Card>
                )}

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
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-600 capitalize">{deliverable.type}</p>
                          <FileTypeLabel fileName={`${deliverable.type}.file`} />
                        </div>
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
                        <label className="text-sm font-medium text-slate-700">Total Versions</label>
                        <p className="text-sm text-slate-600">{deliverable.versions?.length || 0}</p>
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

                {/* Latest Version Information */}
                {deliverable.versions && deliverable.versions.length > 0 && (() => {
                  const latestVersion = deliverable.versions[deliverable.versions.length - 1];
                  const getVersionStatusColor = (status) => {
                    switch (status) {
                      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
                      case 'submitted': return 'bg-amber-50 text-amber-700 border-amber-200';
                      case 'declined': return 'bg-red-50 text-red-700 border-red-200';
                      case 'not_started': 
                      default: return 'bg-gray-50 text-gray-700 border-gray-200';
                    }
                  };

                  return (
                    <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <GitCommit className="w-6 h-6 text-slate-500"/>
                          Latest Version ({latestVersion.version_number})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileTypeIcon 
                              fileName={latestVersion.file_name} 
                              fileType={latestVersion.file_type}
                              size="md"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`${getVersionStatusColor(latestVersion.status)} border font-medium`}>
                                  {latestVersion.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <span className="text-lg font-semibold text-slate-900">
                                  {latestVersion.version_number}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 mt-1">
                                {latestVersion.file_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {latestVersion.file_url && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-2"
                                  onClick={() => handleFilePreview(latestVersion)}
                                >
                                  <Eye className="w-4 h-4" />
                                  Preview
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-2"
                                  onClick={() => handleFileDownload(latestVersion)}
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </Button>
                              </>
                            )}
                            
                            {/* Status-based Action Buttons */}
                            {(() => {
                              const versionStatus = latestVersion.status?.toLowerCase();
                              
                              // Show Submit button for not_started or declined versions
                              if (versionStatus === 'not_started' || versionStatus === 'declined') {
                                return (
                                  <Button 
                                    size="sm" 
                                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleSubmitForApproval(latestVersion.id)}
                                  >
                                    <Send className="w-4 h-4" />
                                    Submit for Approval
                                  </Button>
                                );
                              }
                              
                              // Show Approve/Decline buttons for submitted or pending approval
                              if (versionStatus === 'submitted') {
                                return (
                                  <>
                                    <Button 
                                      size="sm" 
                                      className="gap-2 bg-green-600 hover:bg-green-700"
                                      onClick={() => handleQuickApprovalAction('approve', latestVersion)}
                                    >
                                      <ThumbsUp className="w-4 h-4" />
                                      Approve
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                                      onClick={() => handleQuickApprovalAction('decline', latestVersion)}
                                    >
                                      <ThumbsDown className="w-4 h-4" />
                                      Request Changes
                                    </Button>
                                  </>
                                );
                              }
                              
                              return null;
                            })()}
                            
                            {/* Always show comment button */}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => setIsAddingComment(!isAddingComment)}
                            >
                              <MessageSquare className="w-4 h-4" />
                              Add Comment
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {latestVersion.uploaded_date && (
                            <div>
                              <label className="text-sm font-medium text-slate-700">Uploaded</label>
                              <p className="text-slate-600">
                                {format(new Date(latestVersion.uploaded_date), 'MMM d, yyyy')}
                                {latestVersion.uploaded_by && ` by ${latestVersion.uploaded_by}`}
                              </p>
                            </div>
                          )}
                          
                          {latestVersion.file_size && (
                            <div>
                              <label className="text-sm font-medium text-slate-700">File Size</label>
                              <p className="text-slate-600">
                                {(latestVersion.file_size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            </div>
                          )}

                          {latestVersion.status === 'approved' && latestVersion.approval_date && (
                            <div>
                              <label className="text-sm font-medium text-slate-700">Approved</label>
                              <p className="text-slate-600">
                                {format(new Date(latestVersion.approval_date), 'MMM d, yyyy')}
                                {latestVersion.approved_by && ` by ${latestVersion.approved_by}`}
                              </p>
                            </div>
                          )}

                          {latestVersion.iteration_count && (
                            <div>
                              <label className="text-sm font-medium text-slate-700">Iteration</label>
                              <p className="text-slate-600">#{latestVersion.iteration_count}</p>
                            </div>
                          )}
                        </div>

                        {latestVersion.changes_summary && (
                          <div>
                            <label className="text-sm font-medium text-slate-700">Changes Summary</label>
                            <p className="text-slate-600 bg-slate-50 rounded-lg p-3 mt-1">
                              {latestVersion.changes_summary}
                            </p>
                          </div>
                        )}

                        {latestVersion.feedback && (
                          <div>
                            <label className="text-sm font-medium text-slate-700">Latest Feedback</label>
                            <p className="text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-1">
                              {latestVersion.feedback}
                            </p>
                          </div>
                        )}

                        {/* Quick Comment Section */}
                        {isAddingComment && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-slate-200 pt-4"
                          >
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-slate-700">Add Comment</label>
                              <Textarea
                                value={quickComment}
                                onChange={(e) => setQuickComment(e.target.value)}
                                placeholder="Add your comment or feedback..."
                                className="min-h-[80px]"
                              />
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setIsAddingComment(false);
                                    setQuickComment('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={handleQuickComment}
                                  disabled={!quickComment.trim() || isAddingComment}
                                >
                                  {isAddingComment ? 'Adding...' : 'Add Comment'}
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Recent Comments Preview */}
                        {comments.length > 0 && !isAddingComment && (
                          <div className="border-t border-slate-200 pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-sm font-medium text-slate-700">Recent Activity</label>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setActiveTab('activity')}
                                className="text-xs"
                              >
                                View all ({comments.length})
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {comments.slice(0, 2).map(comment => (
                                <div key={comment.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs">
                                      {comment.author_name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">{comment.author_name}</span>
                                      <span className="text-xs text-slate-500">
                                        {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
            </TabsContent>

            <TabsContent value="versions" className="space-y-6 mt-0">
              <VersionControl 
                deliverable={deliverable}
                onVersionUpload={handleVersionUpload}
                onApprovalAction={handleApprovalAction}
                onFilePreview={handleFilePreview}
                onFileDownload={handleFileDownload}
                onVersionRollback={handleVersionRollback}
                comments={comments}
              />
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 mt-0">
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
            
            {/* New Feedback Tab */}
            <TabsContent value="feedback" className="space-y-6 mt-0">
              {/* Feedback Management Section */}
              <FeedbackManager
                deliverable={{
                  ...deliverable,
                  max_iterations: deliverable.max_iterations || 3,
                  current_iteration: deliverable.current_iteration || 0,
                  iteration_history: deliverable.iteration_history || [],
                  deadline_impact_total: deliverable.deadline_impact_total || 0,
                  is_final: deliverable.is_final || false
                }}
                onApprove={async (updatedDeliverable) => {
                  try {
                    await Deliverable.update(deliverable.id, updatedDeliverable);
                    setDeliverable(updatedDeliverable);
                    
                    // Create notification
                    await NotificationService.create({
                      type: 'success',
                      title: 'Deliverable Approved',
                      message: `${deliverable.name} has been approved (final).`,
                      link: `/deliverables/detail?id=${deliverable.id}`
                    });
                    
                    setUpdateMessage({ 
                      type: 'success', 
                      text: 'Deliverable approved successfully. This approval is final.' 
                    });
                  } catch (error) {
                    setUpdateMessage({ 
                      type: 'error', 
                      text: 'Failed to approve deliverable: ' + error.message 
                    });
                  }
                }}
                onDecline={async (updatedDeliverable, feedback) => {
                  try {
                    await Deliverable.update(deliverable.id, updatedDeliverable);
                    setDeliverable(updatedDeliverable);
                    
                    // Create comment with feedback
                    await Comment.create({
                      deliverable_id: deliverable.id,
                      author_name: 'Client',
                      author_email: 'client@deutschco.com',
                      content: `Feedback for revision: ${feedback}`,
                      type: 'feedback',
                      created_date: new Date().toISOString()
                    });
                    
                    // Create notification
                    await NotificationService.create({
                      type: 'warning',
                      title: 'Changes Requested',
                      message: `Feedback provided for ${deliverable.name}. Timeline adjusted.`,
                      link: `/deliverables/detail?id=${deliverable.id}`
                    });
                    
                    setUpdateMessage({ 
                      type: 'success', 
                      text: `Feedback submitted. Iteration ${updatedDeliverable.current_iteration} of ${updatedDeliverable.max_iterations}.` 
                    });
                    
                    // Reload comments
                    const updatedComments = await Comment.filter({ deliverable_id: deliverable.id }, '-created_date');
                    setComments(updatedComments || []);
                  } catch (error) {
                    setUpdateMessage({ 
                      type: 'error', 
                      text: 'Failed to submit feedback: ' + error.message 
                    });
                  }
                }}
                onUpdateDeliverable={async (updatedDeliverable) => {
                  await Deliverable.update(deliverable.id, updatedDeliverable);
                  setDeliverable(updatedDeliverable);
                }}
              />
              
              {/* Deadline Impact Warning */}
              <DeadlineImpactWarning
                originalDeadline={deliverable.original_deadline || stage?.end_date}
                currentDeadline={deliverable.adjusted_deadline || deliverable.original_deadline || stage?.end_date}
                impactDays={deliverable.deadline_impact_total || 0}
                feedbackHistory={deliverable.iteration_history || []}
                showProjection={deliverable.current_iteration < deliverable.max_iterations}
              />
              
              {/* Approval Finality Status */}
              <ApprovalFinality
                isApproved={deliverable.is_final}
                isPendingApproval={currentVersion?.status === 'submitted'}
                approvalDate={deliverable.iteration_history?.find(h => h.status === 'approved')?.date}
                approvedBy={deliverable.iteration_history?.find(h => h.status === 'approved')?.feedback_by}
                showWarning={!deliverable.is_final}
              />
            </TabsContent>
        </Tabs>
        </motion.div>

        {/* Version Upload Modal */}
        {showVersionUpload && (
          <VersionUpload
            deliverable={deliverable}
            versionNumber={uploadingVersionNumber}
            onUpload={handleVersionUploadSubmit}
            onClose={() => setShowVersionUpload(false)}
          />
        )}

        {/* File Preview Modal */}
        <FilePreview 
          file={previewFile}
          isOpen={showFilePreview}
          onClose={() => {
            setShowFilePreview(false);
            setPreviewFile(null);
          }}
          onDownload={handleFileDownload}
        />

        {/* Approval Dialog Modal */}
        {showApprovalDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowApprovalDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-0 shadow-none">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {approvalAction === 'approve' ? (
                      <>
                        <ThumbsUp className="w-5 h-5 text-green-600" />
                        Approve Version
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="w-5 h-5 text-amber-600" />
                        Request Changes
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {approvalAction === 'approve' 
                        ? 'Comments (optional)' 
                        : 'What changes are needed? *'}
                    </label>
                    <Textarea
                      value={approvalFeedback}
                      onChange={(e) => setApprovalFeedback(e.target.value)}
                      placeholder={approvalAction === 'approve' 
                        ? 'Any additional comments...' 
                        : 'Describe the changes that need to be made...'}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowApprovalDialog(false)}
                      disabled={isProcessingApproval}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleProcessApproval}
                      disabled={isProcessingApproval || (approvalAction === 'decline' && !approvalFeedback.trim())}
                      className={approvalAction === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-amber-600 hover:bg-amber-700'}
                    >
                      {isProcessingApproval ? 'Processing...' : (
                        approvalAction === 'approve' ? 'Approve' : 'Request Changes'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

      </div>
    </div>
  );
}