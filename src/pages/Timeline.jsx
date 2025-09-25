import React, { useState, useEffect } from "react";
import { SupabaseStage, SupabaseTeamMember } from "@/api/supabaseEntities";
import { useViewMode } from '@/hooks/useViewMode';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { GanttChartSquare, List, CheckCircle2, Clock, AlertTriangle, User, Calendar, Loader2, BarChart3, Undo, Redo } from "lucide-react";
import GanttChart from "../components/timeline/GanttChart";
import ClientFriendlyImpactDialog from "../components/timeline/ClientFriendlyImpactDialog";
import StageDetailsDialog from "../components/timeline/StageDetailsDialog";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

export default function Timeline() {
  const { 
    stages, 
    teamMembers, 
    isLoading, 
    updateStage, 
    pendingChanges, 
    applyPendingChanges, 
    cancelPendingChanges,
    undo,
    redo,
    canUndo,
    canRedo,
    getCriticalPath
  } = useProject();
  
  const { isClient, canEdit } = useViewMode();
  
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [showStageDetails, setShowStageDetails] = useState(false);
  const [showImpactDialog, setShowImpactDialog] = useState(false);
  const [currentZoom, setCurrentZoom] = useState('week'); // Manage zoom state here to persist it
  
  // Show impact dialog when there are pending changes
  useEffect(() => {
    if (pendingChanges) {
      setShowImpactDialog(true);
    }
  }, [pendingChanges]);
  
  // Sort stages by number_index for list view
  const sortedStages = [...stages].sort((a, b) => a.number_index - b.number_index);
  
  // Get critical path stages
  const criticalPathStages = getCriticalPath();
  const criticalPathIds = new Set(criticalPathStages.map(s => s.id));

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-50' };
      case 'in_progress':
        return { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-50' };
      case 'blocked':
        return { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-50' };
      default:
        return { icon: Clock, color: 'text-slate-400', bgColor: 'bg-slate-50' };
    }
  };
  
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  const handleStageClick = (stageId) => {
    const stage = stages.find(s => s.id === stageId);
    if (stage) {
      setSelectedStageId(stageId);
      setSelectedStage(stage);
      setShowStageDetails(true);
    }
  };

  const handleStageUpdate = async (stageId, updates) => {
    // This will trigger dependency validation in ProjectContext
    const result = await updateStage(stageId, updates);
    if (!result && !pendingChanges) {
      toast.error('Failed to update stage');
    }
    // If there are pending changes, the impact dialog will show
  };
  
  const handleConfirmChanges = async () => {
    try {
      const result = await applyPendingChanges();
      if (result) {
        setShowImpactDialog(false);
        // Success is handled by toast in applyPendingChanges
      }
    } catch (error) {
      console.error('Error applying changes:', error);
      toast.error('Failed to apply timeline changes. Please try again.');
      setShowImpactDialog(false);
    }
  };
  
  const handleCancelChanges = () => {
    cancelPendingChanges();
    setShowImpactDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
      </div>
    );
  }

  // Calculate overall progress
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const totalStages = stages.length;
  const progressPercentage = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  return (
    <div className="p-8 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header with title and progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Project Timeline</h1>
                <p className="text-slate-600 mt-1">Manage project schedule and dependencies</p>
              </div>
            </div>
            
            {/* Undo/Redo buttons - Only show for agency/admin */}
            {canEdit && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={!canUndo}
                  className="gap-2"
                >
                  <Undo className="w-4 h-4" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={!canRedo}
                  className="gap-2"
                >
                  <Redo className="w-4 h-4" />
                  Redo
                </Button>
              </div>
            )}
          </div>

          {/* Overall Progress Bar */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Overall Progress</span>
              <span className="text-sm font-semibold text-slate-900">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>{completedStages} completed</span>
              <span>{totalStages} total stages</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="gantt" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-96">
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <GanttChartSquare className="w-4 h-4" />
              Gantt Chart
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gantt" className="space-y-6">
            <GanttChart
              stages={stages}
              teamMembers={teamMembers}
              onStageClick={handleStageClick}
              onStageUpdate={canEdit ? handleStageUpdate : undefined}
              zoom={currentZoom}
              onZoomChange={setCurrentZoom}
              readOnly={!canEdit}
            />
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="w-16 text-center">#</TableHead>
                    <TableHead>Stage Name</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                    <TableHead className="w-48">Assigned To</TableHead>
                    <TableHead className="w-40">Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStages.map((stage) => {
                    const statusInfo = getStatusInfo(stage.status);
                    const assignedMember = teamMembers.find(m => m.email === stage.assigned_to);
                    return (
                      <TableRow 
                        key={stage.id} 
                        className={`hover:bg-slate-50/60 cursor-pointer ${criticalPathIds.has(stage.id) ? 'border-l-4 border-l-orange-400' : ''}`}
                        onClick={() => handleStageClick(stage.id)}
                      >
                        <TableCell className="text-center font-medium text-slate-500">{stage.number_index}</TableCell>
                        <TableCell className="font-semibold text-slate-800">{stage.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusInfo.bgColor} ${statusInfo.color} border-${statusInfo.color.replace('text-', '')}/20`}>
                            <statusInfo.icon className="w-3.5 h-3.5 mr-1.5" />
                            {stage.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {assignedMember ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarImage src={assignedMember.profile_image} />
                                <AvatarFallback>{getInitials(assignedMember.name)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-slate-700">{assignedMember.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {stage.deadline ? (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(stage.deadline), "MMM d, yyyy")}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Client-Friendly Impact Dialog */}
        <ClientFriendlyImpactDialog
          open={showImpactDialog}
          onOpenChange={setShowImpactDialog}
          pendingChanges={pendingChanges}
          onConfirm={handleConfirmChanges}
          onCancel={handleCancelChanges}
        />
        
        {/* Stage Details Dialog */}
        <StageDetailsDialog
          stage={selectedStage}
          teamMembers={teamMembers}
          allStages={stages}
          open={showStageDetails}
          onOpenChange={setShowStageDetails}
        />
      </motion.div>
    </div>
  );
}