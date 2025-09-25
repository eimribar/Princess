
import React, { useState, useEffect } from "react";
import { SupabaseDeliverable, SupabaseStage } from "@/api/supabaseEntities";
import { useProject } from '@/contexts/ProjectContext';
import { useUser } from '@/contexts/SupabaseUserContext';
import { useViewMode } from '@/hooks/useViewMode';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Clock, 
  CheckCircle2,
  Calendar,
  Star,
  ChevronRight,
  FolderArchive,
  Loader2,
  AlertTriangle,
  Plus,
  Filter,
  ArrowRight,
  GitCommit,
  Upload,
  CheckSquare,
  Square,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ClientApprovalDashboard from "@/components/client/ClientApprovalDashboard";
import { useToast } from "@/components/ui/use-toast";

export default function Deliverables() {
  const { currentProjectId, stages: projectStages } = useProject();
  const { user } = useUser();
  const { isClient, isDecisionMaker, canApprove, canEdit } = useViewMode();
  const { toast } = useToast();
  const [deliverables, setDeliverables] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (currentProjectId) {
      loadDeliverables();
    }
  }, [currentProjectId]);

  const loadDeliverables = async () => {
    if (!currentProjectId) return;
    
    setIsLoading(true);
    try {
      // Load deliverables for current project and use stages from context
      const [deliverablesData, stagesData] = await Promise.all([
        SupabaseDeliverable.filter({ project_id: currentProjectId }),
        projectStages?.length > 0 ? Promise.resolve(projectStages) : SupabaseStage.filter({ project_id: currentProjectId })
      ]);
      
      // Create a map of stage_id to stage for quick lookup
      const stageMap = new Map(stagesData.map(stage => [stage.id, stage]));
      
      // Enrich deliverables with stage information
      const enrichedDeliverables = deliverablesData.map(deliverable => {
        const stage = stageMap.get(deliverable.stage_id);
        return {
          ...deliverable,
          stage_number: stage?.number_index || 999, // Use 999 for missing stages to sort them last
          stage_name: stage?.name || deliverable.name
        };
      });
      
      setDeliverables(enrichedDeliverables || []);
    } catch (error) {
      console.error("Error loading deliverables:", error);
    }
    setIsLoading(false);
  };

  // Batch operation handlers
  const handleBatchApprove = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      const promises = Array.from(selectedItems).map(id => 
        SupabaseDeliverable.update(id, { 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
      );
      
      await Promise.all(promises);
      
      toast({
        title: "Batch Approval Successful",
        description: `${selectedItems.size} deliverables approved`,
        variant: "success"
      });
      
      setSelectedItems(new Set());
      setIsSelectionMode(false);
      await loadDeliverables();
    } catch (error) {
      toast({
        title: "Batch Approval Failed",
        description: "Some items could not be approved",
        variant: "destructive"
      });
    }
  };

  const handleBatchDecline = async (feedback) => {
    if (selectedItems.size === 0) return;
    
    try {
      const promises = Array.from(selectedItems).map(id => 
        SupabaseDeliverable.update(id, { 
          status: 'declined',
          feedback: feedback || 'Changes requested',
          declined_at: new Date().toISOString()
        })
      );
      
      await Promise.all(promises);
      
      toast({
        title: "Changes Requested",
        description: `Feedback sent for ${selectedItems.size} deliverables`,
        variant: "default"
      });
      
      setSelectedItems(new Set());
      setIsSelectionMode(false);
      await loadDeliverables();
    } catch (error) {
      toast({
        title: "Operation Failed",
        description: "Could not process the request",
        variant: "destructive"
      });
    }
  };

  const handleQuickApprove = async (deliverableId) => {
    try {
      await SupabaseDeliverable.update(deliverableId, {
        status: 'approved',
        approved_at: new Date().toISOString()
      });
      
      toast({
        title: "Deliverable Approved",
        description: "The deliverable has been approved successfully"
      });
      
      await loadDeliverables();
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Could not approve the deliverable",
        variant: "destructive"
      });
    }
  };

  const handleQuickDecline = async (deliverableId) => {
    try {
      await SupabaseDeliverable.update(deliverableId, {
        status: 'declined',
        declined_at: new Date().toISOString()
      });
      
      toast({
        title: "Changes Requested",
        description: "Feedback request sent to the team"
      });
      
      await loadDeliverables();
    } catch (error) {
      toast({
        title: "Operation Failed",
        description: "Could not process the request",
        variant: "destructive"
      });
    }
  };

  const toggleSelection = (deliverableId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(deliverableId)) {
      newSelected.delete(deliverableId);
    } else {
      newSelected.add(deliverableId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredDeliverables.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredDeliverables.map(d => d.id)));
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_iterations': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'not_started': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'research': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'strategy': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'creative': return 'bg-pink-50 text-pink-700 border-pink-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getActionRequired = (deliverable) => {
    if (!deliverable.versions || deliverable.versions.length === 0) {
      return false;
    }
    const latestVersion = deliverable.versions[deliverable.versions.length - 1];
    return latestVersion?.status === 'submitted';
  };

  const getVersionInfo = (deliverable) => {
    if (!deliverable.versions || deliverable.versions.length === 0) {
      return { hasVersions: false, currentVersion: null, totalVersions: 0 };
    }
    
    const latestVersion = deliverable.versions[deliverable.versions.length - 1];
    return {
      hasVersions: true,
      currentVersion: latestVersion.version_number,
      totalVersions: deliverable.versions.length,
      latestStatus: latestVersion.status
    };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'in_iterations': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'not_started': return <Clock className="w-4 h-4 text-gray-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredDeliverables = deliverables.filter(deliverable => {
    const statusMatch = filterStatus === "all" || deliverable.status === filterStatus;
    const typeMatch = filterType === "all" || deliverable.type === filterType;
    return statusMatch && typeMatch;
  });

  // Sort deliverables chronologically by stage number (step 1-104)
  const sortedDeliverables = [...filteredDeliverables].sort((a, b) => {
    return a.stage_number - b.stage_number;
  });

  const deliverableStats = {
    total: deliverables.length,
    urgent: deliverables.filter(d => getActionRequired(d)).length,
    in_progress: deliverables.filter(d => d.status === 'in_progress').length,
    completed: deliverables.filter(d => d.status === 'approved').length,
  };

  // Group deliverables by project phase based on step numbers
  const phases = [
    { 
      name: "Phase 1: Project Setup", 
      deliverables: sortedDeliverables.filter(d => d.stage_number <= 25),
      color: "from-slate-100 to-slate-200",
      textColor: "text-slate-700"
    },
    { 
      name: "Phase 2: Research & Discovery", 
      deliverables: sortedDeliverables.filter(d => d.stage_number > 25 && d.stage_number <= 50),
      color: "from-blue-50 to-blue-100", 
      textColor: "text-blue-800"
    },
    { 
      name: "Phase 3: Strategy Development", 
      deliverables: sortedDeliverables.filter(d => d.stage_number > 50 && d.stage_number <= 75),
      color: "from-indigo-50 to-indigo-100",
      textColor: "text-indigo-800"
    },
    { 
      name: "Phase 4: Creative Execution", 
      deliverables: sortedDeliverables.filter(d => d.stage_number > 75),
      color: "from-rose-50 to-rose-100",
      textColor: "text-rose-800"
    }
  ];

  const StatCard = ({ icon, value, label, color = "text-gray-600" }) => {
    const IconComponent = icon;
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <IconComponent className={`w-5 h-5 ${color}`} />
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-600">{label}</p>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Show client dashboard for client users who are decision makers
  if (isClient && isDecisionMaker && user?.preferences?.showQuickActions) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <ClientApprovalDashboard
            deliverables={deliverables}
            onApprove={handleQuickApprove}
            onDecline={handleQuickDecline}
            onBulkAction={async (action, ids) => {
              if (action === 'approve') {
                setSelectedItems(new Set(ids));
                await handleBatchApprove();
              } else if (action === 'decline') {
                setSelectedItems(new Set(ids));
                await handleBatchDecline('Changes requested via bulk action');
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Action Required Section for Clients */}
        {isClient && deliverables.filter(d => d.status === 'submitted').length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <h2 className="text-xl font-semibold text-amber-900">Action Required</h2>
                <Badge className="bg-amber-600 text-white">
                  {deliverables.filter(d => d.status === 'submitted').length}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              {deliverables.filter(d => d.status === 'submitted').slice(0, 3).map(deliverable => (
                <div 
                  key={deliverable.id} 
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/deliverables/${deliverable.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="font-medium text-gray-900">{deliverable.name}</p>
                      <p className="text-sm text-gray-600">Stage {deliverable.stage_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDecisionMaker && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="gap-1 border-green-200 text-green-700 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickApprove(deliverable.id);
                          }}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickDecline(deliverable.id);
                          }}
                        >
                          <ThumbsDown className="w-3 h-3" />
                          Request Changes
                        </Button>
                      </>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
              {deliverables.filter(d => d.status === 'submitted').length > 3 && (
                <p className="text-sm text-amber-700 text-center pt-2">
                  +{deliverables.filter(d => d.status === 'submitted').length - 3} more deliverables require your attention
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Header with Batch Actions */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Deliverables</h1>
            <p className="text-gray-600 mt-1">Chronological timeline of all project deliverables</p>
          </div>
          
          <div className="flex items-center gap-2">
            {canApprove && (
              <Button
                variant={isSelectionMode ? "secondary" : "outline"}
                className="gap-2"
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedItems(new Set());
                }}
              >
                {isSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                {isSelectionMode ? 'Exit Selection' : 'Select Mode'}
              </Button>
            )}
            
            {canEdit && (
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Deliverable
              </Button>
            )}
          </div>
        </div>

        {/* Batch Actions Toolbar */}
        {isSelectionMode && selectedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedItems.size === filteredDeliverables.length && filteredDeliverables.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="font-medium text-blue-900">
                {selectedItems.size} of {filteredDeliverables.length} selected
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                className="gap-1"
                onClick={handleBatchApprove}
              >
                <ThumbsUp className="w-3 h-3" />
                Approve Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => handleBatchDecline('Changes requested')}
              >
                <ThumbsDown className="w-3 h-3" />
                Request Changes
              </Button>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={AlertTriangle} value={deliverableStats.urgent} label="Need Review" color="text-red-500" />
          <StatCard icon={Clock} value={deliverableStats.in_progress} label="In Progress" color="text-blue-500" />
          <StatCard icon={CheckCircle2} value={deliverableStats.completed} label="Completed" color="text-green-500" />
          <StatCard icon={FileText} value={deliverableStats.total} label="Total" />
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted for Approval</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="research">Research</option>
            <option value="strategy">Strategy</option>
            <option value="creative">Creative</option>
          </select>
        </div>

        {/* Chronological Phases */}
        <div className="space-y-8">
          {phases.map((phase, phaseIndex) => {
            if (phase.deliverables.length === 0) return null;
            
            return (
              <motion.div
                key={phase.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: phaseIndex * 0.1 }}
              >
                <Card className="border-gray-200 shadow-sm overflow-hidden">
                  <CardHeader className={`bg-gradient-to-r ${phase.color} p-6 border-b border-gray-200/60`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-xl font-semibold flex items-center gap-3 ${phase.textColor}`}>
                        <ArrowRight className="w-5 h-5" />
                        {phase.name}
                      </CardTitle>
                      <Badge className={`bg-white/80 ${phase.textColor} border-gray-300`}>
                        {phase.deliverables.length} deliverables
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                          {isSelectionMode && <TableHead className="w-12"></TableHead>}
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Deliverable</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {phase.deliverables.map((deliverable, index) => {
                          const versionInfo = getVersionInfo(deliverable);
                          return (
                            <TableRow
                              key={deliverable.id}
                              className={`hover:bg-gray-50/60 cursor-pointer group ${
                                selectedItems.has(deliverable.id) ? 'bg-blue-50' : ''
                              }`}
                              onClick={(e) => {
                                if (isSelectionMode) {
                                  e.stopPropagation();
                                  toggleSelection(deliverable.id);
                                } else {
                                  navigate(`/deliverables/${deliverable.id}`);
                                }
                              }}
                            >
                              {isSelectionMode && (
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={selectedItems.has(deliverable.id)}
                                    onChange={() => toggleSelection(deliverable.id)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                </TableCell>
                              )}
                              <TableCell className="text-center">
                                {getStatusIcon(deliverable.status)}
                              </TableCell>
                              <TableCell className="py-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                      #{deliverable.stage_number}
                                    </span>
                                    <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                      {deliverable.name}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {deliverable.stage_name && (
                                      <span className="text-xs text-gray-500">
                                        Stage: {deliverable.stage_name}
                                      </span>
                                    )}
                                    {deliverable.include_in_brandbook && (
                                      <div className="flex items-center gap-1 text-xs text-amber-600">
                                        <Star className="w-3 h-3" />
                                        <span>Brandbook</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`${getTypeColor(deliverable.type)} border`}>
                                  {deliverable.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`${getStatusColor(deliverable.status)} border`}>
                                  {deliverable.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {versionInfo.hasVersions ? (
                                  <div className="flex items-center gap-2">
                                    <GitCommit className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {versionInfo.currentVersion}
                                    </span>
                                    {versionInfo.totalVersions > 1 && (
                                      <Badge variant="outline" className="text-xs bg-gray-50">
                                        +{versionInfo.totalVersions - 1}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <Upload className="w-4 h-4" />
                                    <span className="text-sm">No versions</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {deliverable.due_date ? (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    {format(new Date(deliverable.due_date), 'MMM d')}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {getActionRequired(deliverable) && (
                                  <div className="flex items-center justify-center gap-1">
                                    {canApprove && !isSelectionMode && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickApprove(deliverable.id);
                                          }}
                                        >
                                          <ThumbsUp className="w-3 h-3 text-green-600" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickDecline(deliverable.id);
                                          }}
                                        >
                                          <ThumbsDown className="w-3 h-3 text-red-600" />
                                        </Button>
                                      </>
                                    )}
                                    {isClient && !isDecisionMaker && (
                                      <Badge className="bg-amber-500 text-white">Awaiting Decision Maker</Badge>
                                    )}
                                    {!isClient && !canApprove && (
                                      <Badge className="bg-blue-500 text-white">Review Required</Badge>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {deliverables.length === 0 && (
          <div className="text-center py-12">
            <FolderArchive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deliverables Yet</h3>
            <p className="text-gray-600 mb-6">Create your first deliverable to get started with project tracking.</p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Deliverable
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
