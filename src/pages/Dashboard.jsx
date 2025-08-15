
import React, { useState, useEffect, useCallback } from "react";
import { Project, Stage, Comment, Deliverable, TeamMember, OutOfScopeRequest } from "@/api/entities";
import stageManager from "@/api/stageManager";
import { motion, AnimatePresence } from "framer-motion";
import { checkAndInitialize } from "@/api/initializeData";

import ProjectHeader from "../components/dashboard/ProjectHeader";
import VisualTimeline from "../components/dashboard/VisualTimeline";
import PremiumRequiresAttention from "../components/dashboard/PremiumRequiresAttention";
import PremiumDeliverablesStatus from "../components/dashboard/PremiumDeliverablesStatus";
import StageSidebarV2 from "../components/dashboard/StageSidebarV2";
import OutOfScopeForm from "../components/dashboard/OutOfScopeForm";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const [project, setProject] = useState(null);
  const [stages, setStages] = useState([]);
  const [comments, setComments] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [outOfScopeRequests, setOutOfScopeRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [isOutOfScopeFormOpen, setIsOutOfScopeFormOpen] = useState(false);
  const [realProgress, setRealProgress] = useState(0);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Initialize data if needed
      await checkAndInitialize();
      
      const [projectData, stagesData, commentsData, deliverablesData, teamMembersData, outOfScopeData] = await Promise.all([
        Project.list().then(p => p[0]),
        Stage.list('order_index'),
        Comment.list('-created_date'),
        Deliverable.list('-created_date'),
        TeamMember.list(),
        OutOfScopeRequest.list('-created_date')
      ]);
      
      setProject(projectData);
      setStages(stagesData || []);
      setComments(commentsData || []);
      setDeliverables(deliverablesData || []);
      setTeamMembers(teamMembersData || []);
      setOutOfScopeRequests(outOfScopeData || []);

      // Calculate real progress using stage manager
      const progress = await stageManager.calculateRealProgress();
      setRealProgress(progress);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to stage manager changes for real-time updates
    const unsubscribe = stageManager.subscribe(async (changes) => {
      console.log('Stage changes detected:', changes);
      
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
      const [stagesData, projectData] = await Promise.all([
        Stage.list('order_index'),
        Project.list().then(p => p[0])
      ]);
      setStages(stagesData || []);
      if (projectData) {
        setProject(projectData);
      }
      
      // Update real progress
      const progress = await stageManager.calculateRealProgress();
      setRealProgress(progress);
    });

    return unsubscribe;
  }, [loadData, toast, lastNotificationTime]);

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

  const handleStageUpdate = async () => {
    // Reload data when a stage is updated
    await loadData();
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
    
    await Comment.create({
      project_id: stage.project_id,
      stage_id: stage.id,
      content: content,
      author_name: "Current User",
      author_email: "user@deutschco.com", 
    });
    
    // Refresh comments
    const updatedComments = await Comment.list('-created_date');
    setComments(updatedComments);
  };

  const selectedStage = selectedStageId ? stages.find(s => s.id === selectedStageId) : null;
  const stageComments = selectedStageId ? comments.filter(c => c.stage_id === selectedStageId) : [];

  if (isLoading) {
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
          <ProjectHeader project={project} onOpenOutOfScopeForm={handleOpenOutOfScopeForm} />
          
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
                onAddComment={handleAddComment}
                onStageUpdate={handleStageUpdate}
                teamMembers={teamMembers}
                isExpanded={isSidebarExpanded}
                onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
          />
        ) : (
          <div className="p-6 space-y-6">
            <PremiumRequiresAttention 
              deliverables={deliverables} 
              outOfScopeRequests={outOfScopeRequests} 
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
