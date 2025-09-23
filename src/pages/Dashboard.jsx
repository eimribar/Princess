
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import dataService from "@/services/dataService";
import stageManager from "@/api/stageManager";
import { motion, AnimatePresence } from "framer-motion";
import { useProject } from "@/contexts/ProjectContext";
import { useUser } from "@/contexts/SupabaseUserContext";
import dataFilterService from "@/services/dataFilterService";
import { useAbortableRequest } from "@/services/abortableRequest";

import ProjectHeader from "../components/dashboard/ProjectHeader";
import VisualTimeline from "../components/dashboard/VisualTimeline";
import PremiumRequiresAttention from "../components/dashboard/PremiumRequiresAttention";
import PremiumDeliverablesStatus from "../components/dashboard/PremiumDeliverablesStatus";
import StageSidebarV2 from "../components/dashboard/StageSidebarV2";
import OutOfScopeForm from "../components/dashboard/OutOfScopeForm";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  // Get project ID from URL if present
  const { projectId } = useParams();
  
  // Get user context for role-based rendering
  const { user } = useUser();
  const isClient = user?.role === 'client';
  const isAgency = user?.role === 'agency';
  const isAdmin = user?.role === 'admin';
  
  // Use global state from ProjectContext
  const { 
    currentProjectId,
    project: contextProject,
    stages: contextStages, 
    deliverables: contextDeliverables, 
    teamMembers: contextTeamMembers,
    isLoading: contextLoading,
    updateStage: globalUpdateStage,
    updateStageOptimistic,
    reloadData: reloadProjectData,
    switchProject
  } = useProject();
  
  // Local state for dashboard-specific data
  const [project, setProject] = useState(contextProject);
  const [stages, setStages] = useState(contextStages);
  const [comments, setComments] = useState([]);
  const [deliverables, setDeliverables] = useState(contextDeliverables);
  const [teamMembers, setTeamMembers] = useState(contextTeamMembers);
  const [outOfScopeRequests, setOutOfScopeRequests] = useState([]);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [isOutOfScopeFormOpen, setIsOutOfScopeFormOpen] = useState(false);
  const [realProgress, setRealProgress] = useState(0);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const { toast } = useToast();
  const abortableRequest = useAbortableRequest();
  const loadDataAbortRef = useRef(null);
  
  // Sync with context when it changes
  useEffect(() => {
    setProject(contextProject);
    setStages(contextStages);
    setDeliverables(contextDeliverables);
    setTeamMembers(contextTeamMembers);
    
    // Calculate progress when context data updates (especially on initial load/refresh)
    if (contextStages.length > 0 && currentProjectId) {
      stageManager.calculateRealProgress(currentProjectId)
        .then(progress => {
          console.log('Progress calculated from context update:', {
            projectId: currentProjectId,
            stageCount: contextStages.length,
            calculatedProgress: progress
          });
          setRealProgress(progress);
        })
        .catch(error => {
          console.error('Failed to calculate initial progress:', error);
          setRealProgress(0);
        });
    } else if (contextStages.length === 0) {
      // No stages = 0% progress
      setRealProgress(0);
    }
  }, [contextProject, contextStages, contextDeliverables, contextTeamMembers, currentProjectId]);

  // Handle project switching from URL
  useEffect(() => {
    if (projectId && projectId !== currentProjectId) {
      switchProject(projectId);
    }
  }, [projectId, currentProjectId, switchProject]);
  
  // Ensure progress is calculated on initial mount if stages are already loaded
  useEffect(() => {
    // This handles the case where ProjectContext already has data on mount
    if (realProgress === 0 && stages.length > 0 && currentProjectId) {
      console.log('Calculating initial progress on mount');
      stageManager.calculateRealProgress(currentProjectId)
        .then(progress => {
          console.log('Initial mount progress calculated:', progress);
          setRealProgress(progress);
        })
        .catch(error => {
          console.error('Failed to calculate mount progress:', error);
        });
    }
  }, []); // Run once on mount

  const loadData = useCallback(async () => {
    // Abort any previous load request
    if (loadDataAbortRef.current) {
      loadDataAbortRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    loadDataAbortRef.current = abortController;
    
    // setIsLoading(true); // Removed - using contextLoading
    try {
      // Check if already aborted
      if (abortController.signal.aborted) {
        return;
      }
      
      // Use unified data service
      let projectData, stagesData, commentsData, deliverablesData, teamMembersData, outOfScopeData;
      
      if (projectId) {
        // Load specific project data
        const data = await dataService.loadProjectData(projectId);
        if (abortController.signal.aborted) return;
        projectData = data.project;
        stagesData = data.stages;
        deliverablesData = data.deliverables;
        commentsData = data.comments;
        teamMembersData = data.teamMembers;
        outOfScopeData = data.outOfScopeRequests;
      } else {
        // Load general dashboard data
        const data = await dataService.loadDashboardData();
        if (abortController.signal.aborted) return;
        projectData = data.project;
        stagesData = data.stages;
        deliverablesData = data.deliverables;
        commentsData = [];
        teamMembersData = data.teamMembers;
        outOfScopeData = [];
      }
      
      // Apply role-based filtering for clients
      const filteredStages = dataFilterService.filterStages(stagesData || [], user);
      const filteredDeliverables = dataFilterService.filterDeliverables(deliverablesData || [], user);
      const filteredComments = dataFilterService.filterComments(commentsData || [], user);
      const filteredTeamMembers = dataFilterService.filterTeamMembers(teamMembersData || [], user);
      
      setProject(projectData);
      setStages(filteredStages);
      setComments(filteredComments);
      setDeliverables(filteredDeliverables);
      setTeamMembers(filteredTeamMembers);
      
      // Clients don't see out-of-scope requests
      if (!isClient) {
        setOutOfScopeRequests(outOfScopeData || []);
      }

      // Calculate real progress using stage manager with project filtering
      const projectIdToUse = projectId || projectData?.id;
      if (projectIdToUse) {
        const progress = await stageManager.calculateRealProgress(projectIdToUse);
        if (!abortController.signal.aborted) {
          setRealProgress(progress);
        }
      } else {
        setRealProgress(0); // No project, no progress
      }
    } catch (error) {
      // Ignore abort errors
      if (error.name !== 'AbortError') {
        console.error("Error loading data:", error);
      }
    } finally {
      // Only set loading false if not aborted
      if (!abortController.signal.aborted) {
        // setIsLoading(false); // Removed - using contextLoading
      }
    }
  }, [user, isClient, projectId]);

  useEffect(() => {
    // Load comments (not loaded by ProjectContext)
    loadComments();

    // Subscribe to stage manager changes for real-time updates
    const unsubscribe = stageManager.subscribe(async (changes) => {
      
      // Only show notifications for user-initiated actions, not data reloads
      if (changes.isUserAction !== false) {
        // Show toast notification for stage changes with auto-dismiss
        if (changes.type === 'stage_completed') {
          toast({
            title: "Stage Completed!",
            description: `${changes.stage.name} has been completed. Progress updated to ${changes.newProgress}%`,
            duration: 3000, // Auto-dismiss after 3 seconds
          });
        } else if (changes.type === 'stage_started') {
          toast({
            title: "Stage Started",
            description: `Work has begun on ${changes.stage.name}`,
            duration: 3000, // Auto-dismiss after 3 seconds
          });
        }
      }

      // Only reload stages and progress, not everything
      // FIXED: Use project-filtered stages instead of ALL stages
      const currentProjectId = projectId || project?.id;
      if (!currentProjectId) return;
      
      const [stagesData, projectData] = await Promise.all([
        dataService.getProjectStages(currentProjectId, 'number_index'),
        dataService.getProject(currentProjectId)
      ]);
      setStages(stagesData || []);
      if (projectData) {
        setProject(projectData);
      }
      
      // Update real progress with project filtering
      if (currentProjectId) {
        const progress = await stageManager.calculateRealProgress(currentProjectId);
        setRealProgress(progress);
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
      // Abort any pending requests on unmount
      if (loadDataAbortRef.current) {
        loadDataAbortRef.current.abort();
      }
    };
  }, [loadData, toast, lastNotificationTime, projectId]);

  const calculateProjectProgress = () => {
    return realProgress; // Use intelligent progress calculation from stage manager
  };

  const projectProgress = calculateProjectProgress();

  const handleStageClick = (stageId) => {
    setSelectedStageId(stageId);
  };
  
  const handleCloseSidebar = () => {
    setSelectedStageId(null);
  };

  const loadComments = async () => {
    try {
      // CRITICAL FIX: Load only project-specific comments
      const currentProjectId = projectId || project?.id;
      if (!currentProjectId) {
        setComments([]);
        return;
      }
      
      const commentsData = await dataService.getProjectComments(currentProjectId, '-created_at');
      const filteredComments = dataFilterService.filterComments(commentsData || [], user);
      setComments(filteredComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleStageUpdate = async (stageId, updates) => {
    // Use optimistic update for smooth UX without page jumps
    if (stageId && updates) {
      // Use optimistic update for immediate UI response
      await updateStageOptimistic(stageId, updates);
      
      // Recalculate progress immediately after status change
      if (updates.status && currentProjectId) {
        // Calculate new progress based on updated stages
        const newProgress = await stageManager.calculateRealProgress(currentProjectId);
        setRealProgress(newProgress);
        console.log('Progress recalculated after status change:', newProgress);
      }
      
      // Only reload comments if status changed (might have system comments)
      if (updates.status) {
        await loadComments();
      }
    } else {
      // Fallback to reload if no specific update
      await reloadProjectData();
      await loadComments();
    }
  };

  const handleOpenOutOfScopeForm = () => {
    setIsOutOfScopeFormOpen(true);
  };

  const handleOutOfScopeSubmitted = () => {
    setIsOutOfScopeFormOpen(false);
    toast({
      title: "Request Submitted!",
      description: "Your out of scope request has been logged for review.",
      className: "bg-green-500 text-white",
    });
  };

  const handleAddComment = async (content) => {
    if (!selectedStageId) return;
    const stage = stages.find(s => s.id === selectedStageId);
    if (!stage) return;
    
    await dataService.createComment({
      project_id: stage.project_id,
      stage_id: stage.id,
      content: content,
      author_name: user?.name || "Current User",
      author_email: user?.email || "user@deutschco.com", 
    });
    
    // Refresh comments
    const updatedComments = await dataService.getComments('-created_at');
    setComments(updatedComments);
  };

  const selectedStage = selectedStageId ? stages.find(s => s.id === selectedStageId) : null;
  const stageComments = selectedStageId ? comments.filter(c => c.stage_id === selectedStageId) : [];

  // Use contextLoading instead of local isLoading
  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-8 lg:p-12 space-y-10">
          {/* Client Welcome Message */}
          {isClient && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Welcome to your brand development portal. Review deliverables requiring your attention in the sidebar.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
          
          <ProjectHeader 
            project={project} 
            onOpenOutOfScopeForm={!isClient ? handleOpenOutOfScopeForm : undefined} 
          />
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-slate-600">
                <span>Project Progress</span>
                <span className="font-semibold text-slate-800">{projectProgress}%</span>
              </div>
              <Progress value={projectProgress} className="h-2" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>
            {stages && stages.length > 0 ? (
              <VisualTimeline 
                stages={stages} 
                onStageClick={handleStageClick} 
                selectedStageId={selectedStageId}
                teamMembers={teamMembers}
                deliverables={deliverables}
              />
            ) : (
              <div>No stages available to display</div>
            )}
          </motion.div>
        </div>
      </div>

      <aside 
        className={`${isSidebarExpanded ? 'w-[600px]' : 'w-[380px]'} flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto h-full transition-all duration-300`}
      >
        {selectedStage ? (
          <StageSidebarV2 
                stage={selectedStage} 
                stages={stages}
                comments={stageComments} 
                onClose={() => {
                  setSelectedStageId(null);
                  setIsSidebarExpanded(false);
                }}
                onAddComment={!isClient ? handleAddComment : undefined}
                onStageUpdate={!isClient ? handleStageUpdate : undefined}
                teamMembers={teamMembers}
                isExpanded={isSidebarExpanded}
                onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
                readOnly={isClient}
                deliverables={deliverables}
          />
        ) : (
          <div className="p-6 space-y-6">
            {/* Enhanced attention widget for clients */}
            {isClient && deliverables.filter(d => d.status === 'submitted').length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">Action Required</h3>
                    <p className="text-sm text-red-700 mt-1">
                      You have {deliverables.filter(d => d.status === 'submitted').length} deliverables awaiting your review
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
            <PremiumRequiresAttention 
              deliverables={deliverables} 
              outOfScopeRequests={!isClient ? outOfScopeRequests : []} 
            />
            <PremiumDeliverablesStatus deliverables={deliverables} />
          </div>
        )}
      </aside>

      {project && (
        <OutOfScopeForm
          project={project}
          open={isOutOfScopeFormOpen}
          onOpenChange={setIsOutOfScopeFormOpen}
          onSubmitted={handleOutOfScopeSubmitted}
        />
      )}
    </div>
  );
}
