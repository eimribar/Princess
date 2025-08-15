
import React, { useState, useEffect } from "react";
import { Deliverable } from "@/api/entities";
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
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Deliverables() {
  const [deliverables, setDeliverables] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDeliverables();
  }, []);

  const loadDeliverables = async () => {
    setIsLoading(true);
    try {
      const data = await Deliverable.list('-created_date');
      setDeliverables(data || []);
    } catch (error) {
      console.error("Error loading deliverables:", error);
    }
    setIsLoading(false);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'wip': return 'bg-blue-50 text-blue-700 border-blue-200';
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
    const latestVersion = deliverable.versions?.[deliverable.versions.length - 1];
    return latestVersion?.status === 'submitted';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'wip': return <Clock className="w-4 h-4 text-blue-500" />;
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

  // Sort deliverables chronologically by stage number (assuming we have this info)
  // For now, we'll sort by creation date, but ideally by step number
  const sortedDeliverables = [...filteredDeliverables].sort((a, b) => {
    // If we had step numbers: return a.step_number - b.step_number;
    // For now, using created_date as proxy for chronological order
    return new Date(a.created_date) - new Date(b.created_date);
  });

  const deliverableStats = {
    total: deliverables.length,
    urgent: deliverables.filter(d => getActionRequired(d)).length,
    in_progress: deliverables.filter(d => d.status === 'wip' || d.status === 'in_iterations').length,
    completed: deliverables.filter(d => d.status === 'completed').length,
  };

  // Group deliverables by project phase for better organization
  const phases = [
    { 
      name: "Phase 1: Project Setup", 
      deliverables: sortedDeliverables.slice(0, Math.ceil(sortedDeliverables.length * 0.2)),
      color: "from-slate-100 to-slate-200",
      textColor: "text-slate-700"
    },
    { 
      name: "Phase 2: Research & Discovery", 
      deliverables: sortedDeliverables.slice(Math.ceil(sortedDeliverables.length * 0.2), Math.ceil(sortedDeliverables.length * 0.5)),
      color: "from-blue-50 to-blue-100", 
      textColor: "text-blue-800"
    },
    { 
      name: "Phase 3: Strategy Development", 
      deliverables: sortedDeliverables.slice(Math.ceil(sortedDeliverables.length * 0.5), Math.ceil(sortedDeliverables.length * 0.7)),
      color: "from-indigo-50 to-indigo-100",
      textColor: "text-indigo-800"
    },
    { 
      name: "Phase 4: Creative Execution", 
      deliverables: sortedDeliverables.slice(Math.ceil(sortedDeliverables.length * 0.7)),
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Deliverables</h1>
            <p className="text-gray-600 mt-1">Chronological timeline of all project deliverables</p>
          </div>
          
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Deliverable
          </Button>
        </div>

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
              <option value="wip">In Progress</option>
              <option value="in_iterations">In Review</option>
              <option value="completed">Completed</option>
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
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Deliverable</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {phase.deliverables.map((deliverable, index) => (
                          <TableRow
                            key={deliverable.id}
                            className="hover:bg-gray-50/60 cursor-pointer group"
                            onClick={() => navigate(createPageUrl(`DeliverableDetail?id=${deliverable.id}`))}
                          >
                            <TableCell className="text-center">
                              {getStatusIcon(deliverable.status)}
                            </TableCell>
                            <TableCell className="py-4">
                              <div>
                                <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                  {deliverable.name}
                                </p>
                                {deliverable.include_in_brandbook && (
                                  <div className="flex items-center gap-1 text-xs mt-1 text-amber-600">
                                    <Star className="w-3 h-3" />
                                    <span>Brandbook</span>
                                  </div>
                                )}
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
                                <Badge className="bg-red-500 text-white animate-pulse">Review</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                            </TableCell>
                          </TableRow>
                        ))}
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
