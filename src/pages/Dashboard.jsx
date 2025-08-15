
import React, { useState, useEffect, useCallback } from "react";
import { Project, Stage, Comment, Deliverable, TeamMember, OutOfScopeRequest } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";

import ProjectHeader from "../components/dashboard/ProjectHeader";
import VisualTimeline from "../components/dashboard/VisualTimeline";
import RequiresAttentionWidget from "../components/dashboard/RequiresAttentionWidget";
import DeliverablesStatusWidget from "../components/dashboard/DeliverablesStatusWidget";
import StageSidebar from "../components/dashboard/StageSidebar";
import OutOfScopeForm from "../components/dashboard/OutOfScopeForm";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

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
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
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
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateProjectProgress = () => {
    if (stages.length === 0) return 0;
    const completedStages = stages.filter(stage => stage.status === 'completed').length;
    return Math.round((completedStages / stages.length) * 100);
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
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Toaster />
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
            <VisualTimeline 
              stages={stages} 
              onStageClick={handleStageClick} 
              selectedStageId={selectedStageId}
              teamMembers={teamMembers}
            />
          </motion.div>
        </div>
      </div>

      <aside className="w-[380px] flex-shrink-0 bg-white/60 backdrop-blur-xl border-l border-slate-200/60 overflow-y-auto">
         <AnimatePresence>
          {selectedStage ? (
            <motion.div
              key={selectedStage.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              <StageSidebar 
                stage={selectedStage} 
                stages={stages}
                comments={stageComments} 
                onClose={handleCloseSidebar}
                onAddComment={handleAddComment}
                onStageUpdate={handleStageUpdate}
                teamMembers={teamMembers}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="widgets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-8 space-y-8"
            >
              <RequiresAttentionWidget 
                deliverables={deliverables} 
                outOfScopeRequests={outOfScopeRequests} 
              />
              <DeliverablesStatusWidget deliverables={deliverables} />
            </motion.div>
          )}
        </AnimatePresence>
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
