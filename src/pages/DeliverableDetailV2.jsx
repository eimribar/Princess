import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SupabaseDeliverable as Deliverable, SupabaseStage as Stage, SupabaseComment as Comment, SupabaseTeamMember as TeamMember } from '@/api/supabaseEntities';
import { useProject } from '@/contexts/ProjectContext';
import { useUser } from '@/contexts/ClerkUserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FilePreview from '@/components/deliverables/FilePreview';
import VersionUpload from '@/components/deliverables/VersionUpload';
import NotificationService from '@/services/notificationService';
import { 
  ChevronLeft,
  Download,
  Eye,
  Upload,
  Send,
  Image,
  Clock,
  Edit,
  ThumbsUp,
  ThumbsDown,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export default function DeliverableDetailV2() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  
  // Debug logging for role visibility
  console.log('🔍 DeliverableDetailV2 - Current user role:', user?.role, 'User:', user?.email);
  
  // Project context for real-time updates
  let projectContext = null;
  try {
    projectContext = useProject();
  } catch (error) {
    console.log('Running in standalone mode');
  }
  
  const { deliverables: contextDeliverables, stages: contextStages, currentProjectId } = projectContext || {};
  
  // State management
  const [deliverable, setDeliverable] = useState(null);
  const [stage, setStage] = useState(null);
  const [comments, setComments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showVersionUpload, setShowVersionUpload] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Permission system - CRITICAL for role-based access
  // MUST be declared AFTER state variables to avoid reference errors
  const canEdit = useMemo(() => {
    // Default to false (no edit) to ensure clients can't edit
    if (!user || user.role === 'client') {
      console.log('🚫 DeliverableDetailV2 - Edit DENIED for role:', user?.role || 'no user');
      return false;
    }
    
    // Only allow edit for admin or agency
    const hasEditPermission = user.role === 'admin' || user.role === 'agency';
    console.log(hasEditPermission ? '✅' : '❌', 'DeliverableDetailV2 - canEdit:', hasEditPermission, 'for role:', user.role);
    return hasEditPermission;
  }, [user, user?.role]);
  
  // Permission to approve/decline - includes decision-maker clients
  const canApprove = useMemo(() => {
    if (!user) return false;
    
    // Admin and agency can always approve
    if (user.role === 'admin' || user.role === 'agency') return true;
    
    // Clients can approve only if they are decision makers
    if (user.role === 'client') {
      // Check if user is a decision maker in team members
      const isDecisionMaker = teamMembers.find(m => m.email === user.email || m.user_id === user.id)?.is_decision_maker;
      console.log('🎯 DeliverableDetailV2 - Client decision maker:', isDecisionMaker);
      return isDecisionMaker === true;
    }
    
    return false;
  }, [user, user?.role, teamMembers]);
  
  // Debug when user role changes
  useEffect(() => {
    if (user) {
      console.log('🔄 DeliverableDetailV2 - User role changed to:', user.role);
      console.log('👤 Full user object:', user);
      // Check localStorage to see what's stored
      const storedUser = localStorage.getItem('princess_user');
      if (storedUser) {
        console.log('💾 localStorage princess_user role:', JSON.parse(storedUser).role);
      }
    }
  }, [user?.role]);

  // Load data on mount
  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (deliverableId) => {
    setIsLoading(true);
    try {
      const [deliverableData, commentsData] = await Promise.all([
        Deliverable.get(deliverableId),
        Comment.filter({ deliverable_id: deliverableId }, '-created_date')
      ]);

      if (!deliverableData) {
        console.error('Deliverable not found');
        setIsLoading(false);
        return;
      }

      setDeliverable(deliverableData);
      setComments(commentsData || []);
      
      // Load team members
      if (deliverableData.project_id) {
        const members = await TeamMember.filter({ project_id: deliverableData.project_id });
        setTeamMembers(members || []);
      }

      // Load stage info
      if (deliverableData.stage_id) {
        const stageData = await Stage.get(deliverableData.stage_id);
        setStage(stageData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !deliverable) return;
    setIsSubmitting(true);
    try {
      const comment = await Comment.create({
        deliverable_id: deliverable.id,
        project_id: deliverable.project_id,
        content: newComment,
        author_name: 'Current User',
        author_email: 'user@company.com'
      });
      
      await NotificationService.notifyCommentAdded(deliverable, comment);
      setNewComment('');
      await loadData(deliverable.id);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (newStatus) => {
    if (!deliverable) return;
    try {
      await Deliverable.update(deliverable.id, { status: newStatus });
      await loadData(deliverable.id);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAssigneeChange = async (newAssigneeId) => {
    if (!deliverable) return;
    try {
      const assigneeValue = newAssigneeId === 'unassign' ? null : newAssigneeId;
      await Deliverable.update(deliverable.id, { assigned_to: assigneeValue });
      await loadData(deliverable.id);
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const handleVersionUpload = () => {
    setShowVersionUpload(true);
  };

  const handleVersionUploadSubmit = async (versionData) => {
    try {
      console.log('Deliverable ID:', deliverable.id);
      console.log('Version data received:', versionData);
      console.log('Current user:', user);
      
      // Map the data from VersionUpload to match database schema
      const versionDataForDB = {
        version_number: versionData.version_number || 'V1',
        status: 'submitted', // Use 'submitted' as initial status for new uploads
        file_url: versionData.file_url,
        file_name: versionData.file_name,
        file_size: versionData.file_size,
        file_type: versionData.file_type || 'application/octet-stream',
        notes: versionData.changes_summary || ''
      };
      
      console.log('Sending to DB:', versionDataForDB);
      
      await Deliverable.createVersion(deliverable.id, versionDataForDB);
      
      await NotificationService.notifyVersionUpload(deliverable, versionData);
      await loadData(deliverable.id);
      setShowVersionUpload(false);
    } catch (error) {
      console.error('Failed to upload version:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      alert(`Failed to upload version: ${error.message || 'Unknown error'}`);
    }
  };

  const handleFilePreview = (version) => {
    setPreviewFile(version);
    setShowFilePreview(true);
  };

  const handleFileDownload = (version) => {
    if (version.file_url) {
      const link = document.createElement('a');
      link.href = version.file_url;
      link.download = version.file_name || 'download';
      link.click();
    }
  };

  const handleApprove = async () => {
    if (!deliverable) return;
    try {
      await Deliverable.update(deliverable.id, { 
        status: 'approved',
        approved_at: new Date().toISOString()
      });
      await NotificationService.notifySystemUpdate(`${deliverable.name} has been approved`);
      await loadData(deliverable.id);
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleDecline = async () => {
    if (!deliverable) return;
    const feedback = prompt('Please provide feedback for the requested changes:');
    if (!feedback) return;
    
    try {
      await Deliverable.update(deliverable.id, { 
        status: 'declined',
        feedback: feedback
      });
      await NotificationService.notifySystemUpdate(`Changes requested for ${deliverable.name}`);
      await loadData(deliverable.id);
    } catch (error) {
      console.error('Error declining:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'not_started': 'bg-gray-100 text-gray-700',
      'in_progress': 'bg-blue-100 text-blue-700',
      'submitted': 'bg-amber-100 text-amber-700',
      'approved': 'bg-green-100 text-green-700',
      'declined': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const assignedMember = teamMembers.find(m => m.id === deliverable?.assigned_to);
  const currentVersion = deliverable?.versions?.[deliverable.versions.length - 1];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!deliverable) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Deliverable not found</p>
      </div>
    );
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        {/* Main Content Area - No duplicate header */}
        <div className="gap-1 px-6 flex flex-1 justify-center py-5">
          {/* Left Column - Main Content */}
          <div className="flex flex-col max-w-[920px] flex-1">
            {/* Breadcrumb with Back Button */}
            <div className="flex items-center gap-3 p-4">
              <button 
                onClick={() => navigate('/deliverables')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-500 hover:text-gray-700 text-base font-medium"
                >
                  Dashboard
                </button>
                <span className="text-gray-500">/</span>
                {stage && (
                  <>
                    <span className="text-gray-500 text-base">
                      {stage.category?.replace('_', ' ')}
                    </span>
                    <span className="text-gray-500">/</span>
                  </>
                )}
                <span className="text-gray-900 text-base font-medium">{deliverable.name}</span>
              </div>
            </div>

            {/* Title Section */}
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <div className="flex min-w-72 flex-col gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{deliverable.name}</h1>
                <p className="text-gray-600 text-sm">
                  {deliverable.description || `This deliverable is part of stage ${stage?.number_index}: ${stage?.name}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(deliverable.status)} text-sm px-3 py-1`}>
                  {deliverable.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons (Contextual) */}
            <div className="px-4 pb-4">
              <div className="flex gap-2">
                {deliverable.status === 'submitted' && canApprove && (
                  <>
                    <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button onClick={handleDecline} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Request Changes
                    </Button>
                  </>
                )}
                {canEdit && (deliverable.status === 'not_started' || deliverable.status === 'declined' || deliverable.status === 'in_progress') && (
                  <Button onClick={handleVersionUpload} className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Version
                  </Button>
                )}
              </div>
            </div>

            {/* Overview Section */}
            <h2 className="text-xl font-bold text-gray-900 px-4 pb-3 pt-5">Overview</h2>
            <p className="text-gray-700 text-base px-4 pb-3">
              {deliverable.description || 'This deliverable includes the necessary files and assets for the project stage.'}
            </p>

            {/* Latest Version Preview */}
            {currentVersion && (
              <>
                <h2 className="text-xl font-bold text-gray-900 px-4 pb-3 pt-5">Latest Version</h2>
                <div className="flex w-full grow bg-white p-4">
                  <div className="w-full gap-1 overflow-hidden bg-gray-100 aspect-[3/2] rounded-lg flex items-center justify-center">
                    {currentVersion.file_url ? (
                      currentVersion.file_type?.startsWith('image/') ? (
                        <img 
                          src={currentVersion.file_url} 
                          alt={currentVersion.file_name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                          <FileText className="w-16 h-16" />
                          <p className="text-lg font-medium">{currentVersion.file_name}</p>
                          <div className="flex gap-2">
                            <Button onClick={() => handleFilePreview(currentVersion)} variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                            <Button onClick={() => handleFileDownload(currentVersion)} variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-gray-400 text-center">
                        <Upload className="w-16 h-16 mx-auto mb-3" />
                        <p>No file uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Version Timeline */}
            <h2 className="text-xl font-bold text-gray-900 px-4 pb-3 pt-5">Version Timeline</h2>
            <div className="grid grid-cols-[40px_1fr] gap-x-2 px-4">
              {deliverable.versions?.map((version, index) => (
                <React.Fragment key={version.id}>
                  <div className="flex flex-col items-center gap-1 pt-3">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {index + 1}
                      </AvatarFallback>
                    </Avatar>
                    {index < deliverable.versions.length - 1 && (
                      <div className="w-[1.5px] bg-gray-300 h-full min-h-[40px]" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-900 font-medium">
                          {version.version_number || `Version ${index + 1}`}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Uploaded {version.created_at ? format(new Date(version.created_at), 'MMM d, yyyy') : 'Unknown date'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleFilePreview(version)} variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleFileDownload(version)} variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
              {(!deliverable.versions || deliverable.versions.length === 0) && (
                <div className="col-span-2 text-gray-500 text-center py-4">
                  No versions uploaded yet
                </div>
              )}
            </div>

            {/* Comments Section */}
            <h2 className="text-xl font-bold text-gray-900 px-4 pb-3 pt-5">Comments</h2>
            <div className="space-y-3 px-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback>{getInitials(comment.author_name || 'User')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-sm text-gray-900">{comment.author_name}</p>
                      <p className="text-sm text-gray-500">
                        {comment.created_date && formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              )}
            </div>

            {/* Add Comment */}
            <div className="flex items-center px-4 py-3 gap-3 mt-4">
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 items-stretch rounded-lg bg-gray-100">
                <input
                  placeholder="Add a comment"
                  className="flex-1 px-4 py-2 bg-transparent outline-none text-gray-900 placeholder:text-gray-500"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <div className="flex items-center gap-2 px-3">
                  <button className="text-gray-500 hover:text-gray-700">
                    <Image className="w-5 h-5" />
                  </button>
                  <Button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 h-8"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="flex flex-col w-[360px] pl-6">
            {/* Status & Assignment */}
            <h2 className="text-xl font-bold text-gray-900 px-4 pb-3 pt-5">Management</h2>
            <div className="px-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">{canEdit ? 'Update Status' : 'Status'}</label>
                {canEdit ? (
                  <Select value={deliverable.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                    <span className="text-gray-700 capitalize">
                      {deliverable.status?.replace(/_/g, ' ') || 'Not Started'}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">{canEdit ? 'Assigned To' : 'Assigned To'}</label>
                {canEdit ? (
                  <Select value={deliverable.assigned_to || ''} onValueChange={handleAssigneeChange}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassign">Unassigned</SelectItem>
                      {teamMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                    <span className="text-gray-700">
                      {teamMembers.find(m => m.id === deliverable.assigned_to)?.name || 'Unassigned'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Approvals */}
            {deliverable.approval_history && deliverable.approval_history.length > 0 && (
              <>
                <h2 className="text-xl font-bold text-gray-900 px-4 pb-3 pt-5">Approvals</h2>
                {deliverable.approval_history.map((approval, index) => (
                  <div key={index} className="flex items-center gap-4 px-4 py-2">
                    <Avatar className="w-14 h-14">
                      <AvatarFallback>{getInitials(approval.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{approval.name}</p>
                      <p className="text-sm text-gray-600">
                        {approval.status === 'approved' ? 'Approved' : 'Pending'}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* People & Roles */}
            <h2 className="text-xl font-bold text-gray-900 px-4 pb-3 pt-5">People & Roles</h2>
            {assignedMember && (
              <div className="flex items-center gap-4 px-4 py-2">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={assignedMember.profile_image} />
                  <AvatarFallback>{getInitials(assignedMember.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{assignedMember.name}</p>
                  <p className="text-sm text-gray-600">{assignedMember.role}</p>
                </div>
              </div>
            )}
            {teamMembers.filter(m => m.team_type === 'client').map(member => (
              <div key={member.id} className="flex items-center gap-4 px-4 py-2">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={member.profile_image} />
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">Client</p>
                </div>
              </div>
            ))}

            {/* Metadata */}
            <h2 className="text-xl font-bold text-gray-900 px-4 pb-3 pt-5">Metadata</h2>
            <div className="p-4 grid grid-cols-[30%_1fr] gap-x-6">
              <div className="col-span-2 grid grid-cols-subgrid border-t border-gray-200 py-3">
                <p className="text-gray-500 text-sm">Type</p>
                <p className="text-gray-900 text-sm">{deliverable.type || 'Deliverable'}</p>
              </div>
              <div className="col-span-2 grid grid-cols-subgrid border-t border-gray-200 py-3">
                <p className="text-gray-500 text-sm">Stage</p>
                <p className="text-gray-900 text-sm">
                  {stage ? `${stage.number_index}: ${stage.name}` : 'N/A'}
                </p>
              </div>
              <div className="col-span-2 grid grid-cols-subgrid border-t border-gray-200 py-3">
                <p className="text-gray-500 text-sm">Created</p>
                <p className="text-gray-900 text-sm">
                  {deliverable.created_at && format(new Date(deliverable.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="col-span-2 grid grid-cols-subgrid border-t border-gray-200 py-3">
                <p className="text-gray-500 text-sm">Updated</p>
                <p className="text-gray-900 text-sm">
                  {deliverable.updated_at && format(new Date(deliverable.updated_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Activity Log */}
            <h2 className="text-xl font-bold text-gray-900 px-4 pb-3 pt-5">Activity Log</h2>
            <div className="space-y-2 px-4">
              {comments.slice(0, 3).map(comment => (
                <div key={comment.id} className="flex items-center gap-3 py-2">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {comment.author_name} commented
                    </p>
                    <p className="text-xs text-gray-500">
                      {comment.created_date && formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Version Upload Modal */}
      {showVersionUpload && (
        <VersionUpload
          deliverable={deliverable}
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
    </div>
  );
}