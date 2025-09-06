import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GripVertical,
  Plus,
  Trash2,
  Edit2,
  Star,
  Circle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle2,
  X,
  Copy,
  RotateCcw,
  Layers,
  Zap,
  Package,
  Search,
  Filter,
  Eye,
  EyeOff,
  Calendar,
  Target,
  Info
} from 'lucide-react';
import { useWizard } from '@/pages/ProjectSetup';
import { useToast } from '@/components/ui/use-toast';

// Phase colors for visual distinction
const PHASE_COLORS = {
  'Onboarding': 'bg-blue-100 text-blue-800 border-blue-300',
  'Research': 'bg-purple-100 text-purple-800 border-purple-300',
  'Strategy': 'bg-green-100 text-green-800 border-green-300',
  'Brand Building': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Brand Collaterals': 'bg-orange-100 text-orange-800 border-orange-300',
  'Brand Activation': 'bg-red-100 text-red-800 border-red-300'
};

// Common stage templates for quick add
const STAGE_TEMPLATES = [
  { name: 'Stakeholder Interview', phase: 'Research', duration: 3, is_deliverable: false },
  { name: 'Competitor Analysis', phase: 'Research', duration: 5, is_deliverable: true },
  { name: 'Brand Positioning', phase: 'Strategy', duration: 7, is_deliverable: true },
  { name: 'Logo Design', phase: 'Brand Building', duration: 10, is_deliverable: true },
  { name: 'Color Palette', phase: 'Brand Building', duration: 5, is_deliverable: true },
  { name: 'Typography System', phase: 'Brand Building', duration: 5, is_deliverable: true },
  { name: 'Business Cards', phase: 'Brand Collaterals', duration: 3, is_deliverable: true },
  { name: 'Website Design', phase: 'Brand Collaterals', duration: 15, is_deliverable: true },
  { name: 'Launch Campaign', phase: 'Brand Activation', duration: 10, is_deliverable: true }
];

export default function StageCustomizer() {
  const { projectData, updateProjectData } = useWizard();
  const { toast } = useToast();
  
  // Initialize stages from template or empty
  const [stages, setStages] = useState(() => {
    if (projectData.stages && projectData.stages.length > 0) {
      return projectData.stages;
    } else if (projectData.template && !projectData.template.isBlank) {
      // Generate default stages based on template
      return generateStagesFromTemplate(projectData.template);
    }
    return [];
  });
  
  const [collapsedPhases, setCollapsedPhases] = useState(new Set());
  const [selectedStages, setSelectedStages] = useState(new Set());
  const [editingStage, setEditingStage] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDeliverables, setFilterDeliverables] = useState(false);
  const [showDependencyWarning, setShowDependencyWarning] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState([]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    const totalStages = stages.length;
    const deliverables = stages.filter(s => s.is_deliverable).length;
    const totalDuration = stages.reduce((sum, s) => sum + (s.duration || 0), 0);
    const phases = [...new Set(stages.map(s => s.phase))];
    
    const original = projectData.template ? {
      stages: projectData.template.stages,
      deliverables: projectData.template.deliverables,
      duration: parseInt(projectData.template.duration) || 0
    } : null;
    
    return {
      totalStages,
      deliverables,
      totalDuration,
      phases: phases.length,
      original,
      deviation: original ? Math.round(((totalStages - original.stages) / original.stages) * 100) : 0
    };
  }, [stages, projectData.template]);
  
  // Group stages by phase
  const stagesByPhase = useMemo(() => {
    const grouped = {};
    stages.forEach(stage => {
      if (!grouped[stage.phase]) {
        grouped[stage.phase] = [];
      }
      grouped[stage.phase].push(stage);
    });
    return grouped;
  }, [stages]);
  
  // Filter stages
  const filteredStages = useMemo(() => {
    let filtered = [...stages];
    
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterDeliverables) {
      filtered = filtered.filter(s => s.is_deliverable);
    }
    
    return filtered;
  }, [stages, searchQuery, filterDeliverables]);
  
  // Update project data when stages change
  useEffect(() => {
    updateProjectData({ stages });
  }, [stages]);
  
  // Handle drag end
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    const newStages = Array.from(stages);
    const [reorderedItem] = newStages.splice(source.index, 1);
    newStages.splice(destination.index, 0, reorderedItem);
    
    // Update order indices
    newStages.forEach((stage, index) => {
      stage.order_index = index;
    });
    
    setStages(newStages);
    
    toast({
      title: "Stages Reordered",
      description: "The stage order has been updated.",
    });
  };
  
  // Add new stage
  const handleAddStage = (stageData) => {
    const newStage = {
      id: `stage-${Date.now()}`,
      name: stageData.name || 'New Stage',
      phase: stageData.phase || 'Research',
      duration: stageData.duration || 5,
      is_deliverable: stageData.is_deliverable || false,
      dependencies: [],
      order_index: stages.length,
      description: stageData.description || '',
      is_custom: true
    };
    
    setStages([...stages, newStage]);
    
    toast({
      title: "Stage Added",
      description: `"${newStage.name}" has been added to the workflow.`,
    });
  };
  
  // Bulk add stages
  const handleBulkAdd = () => {
    const newStages = [];
    for (let i = 0; i < 5; i++) {
      newStages.push({
        id: `stage-${Date.now()}-${i}`,
        name: `New Stage ${stages.length + i + 1}`,
        phase: 'Research',
        duration: 5,
        is_deliverable: false,
        dependencies: [],
        order_index: stages.length + i,
        is_custom: true
      });
    }
    
    setStages([...stages, ...newStages]);
    
    toast({
      title: "Stages Added",
      description: "5 new stages have been added.",
    });
  };
  
  // Remove stage(s)
  const handleRemoveStages = (stageIds) => {
    const idsToRemove = Array.isArray(stageIds) ? stageIds : [stageIds];
    
    // Check for dependency issues
    const dependentStages = stages.filter(s => 
      !idsToRemove.includes(s.id) &&
      s.dependencies?.some(d => idsToRemove.includes(d))
    );
    
    if (dependentStages.length > 0) {
      setPendingRemoval(idsToRemove);
      setShowDependencyWarning(true);
    } else {
      performRemoval(idsToRemove);
    }
  };
  
  const performRemoval = (idsToRemove) => {
    const newStages = stages.filter(s => !idsToRemove.includes(s.id));
    
    // Update order indices
    newStages.forEach((stage, index) => {
      stage.order_index = index;
      // Remove dependencies to deleted stages
      if (stage.dependencies) {
        stage.dependencies = stage.dependencies.filter(d => !idsToRemove.includes(d));
      }
    });
    
    setStages(newStages);
    setSelectedStages(new Set());
    setShowDependencyWarning(false);
    setPendingRemoval([]);
    
    toast({
      title: "Stages Removed",
      description: `${idsToRemove.length} stage(s) have been removed.`,
    });
  };
  
  // Edit stage
  const handleEditStage = (stageId, updates) => {
    setStages(stages.map(s => 
      s.id === stageId ? { ...s, ...updates } : s
    ));
    
    toast({
      title: "Stage Updated",
      description: "The stage has been updated successfully.",
    });
  };
  
  // Toggle phase collapse
  const togglePhase = (phase) => {
    const newCollapsed = new Set(collapsedPhases);
    if (newCollapsed.has(phase)) {
      newCollapsed.delete(phase);
    } else {
      newCollapsed.add(phase);
    }
    setCollapsedPhases(newCollapsed);
  };
  
  // Toggle stage selection
  const toggleStageSelection = (stageId) => {
    const newSelected = new Set(selectedStages);
    if (newSelected.has(stageId)) {
      newSelected.delete(stageId);
    } else {
      newSelected.add(stageId);
    }
    setSelectedStages(newSelected);
  };
  
  // Select all in phase
  const selectAllInPhase = (phase) => {
    const phaseStages = stagesByPhase[phase] || [];
    const newSelected = new Set(selectedStages);
    phaseStages.forEach(s => newSelected.add(s.id));
    setSelectedStages(newSelected);
  };
  
  // Reset to template
  const handleResetToTemplate = () => {
    if (projectData.template && !projectData.template.isBlank) {
      const templateStages = generateStagesFromTemplate(projectData.template);
      setStages(templateStages);
      setSelectedStages(new Set());
      
      toast({
        title: "Reset to Template",
        description: "Stages have been reset to the original template.",
      });
    }
  };
  
  // Calculate timeline impact
  const calculateTimelineImpact = () => {
    const originalDuration = projectData.template?.duration ? 
      parseInt(projectData.template.duration) * 30 : 180; // Convert months to days
    const currentDuration = stats.totalDuration;
    const difference = currentDuration - originalDuration;
    
    return {
      original: originalDuration,
      current: currentDuration,
      difference,
      percentage: originalDuration ? Math.round((difference / originalDuration) * 100) : 0
    };
  };
  
  const timelineImpact = calculateTimelineImpact();
  
  return (
    <div className="space-y-6">
      {/* Statistics Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalStages}</div>
              <div className="text-sm text-gray-600">
                Total Stages
                {stats.original && (
                  <span className={`ml-2 ${stats.deviation > 0 ? 'text-green-600' : stats.deviation < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    ({stats.deviation > 0 ? '+' : ''}{stats.deviation}%)
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.deliverables}</div>
              <div className="text-sm text-gray-600">Deliverables</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.phases}</div>
              <div className="text-sm text-gray-600">Phases</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalDuration}</div>
              <div className="text-sm text-gray-600">Days Total</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${timelineImpact.percentage > 10 ? 'text-red-600' : timelineImpact.percentage < -10 ? 'text-green-600' : 'text-gray-900'}`}>
                {timelineImpact.percentage > 0 ? '+' : ''}{timelineImpact.percentage}%
              </div>
              <div className="text-sm text-gray-600">Timeline Impact</div>
            </div>
          </div>
          
          {/* Timeline Impact Alert */}
          {Math.abs(timelineImpact.percentage) > 20 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Significant Timeline Change</AlertTitle>
              <AlertDescription>
                Your customizations have {timelineImpact.percentage > 0 ? 'increased' : 'decreased'} 
                the project timeline by {Math.abs(timelineImpact.percentage)}%. 
                Original: {timelineImpact.original} days, Current: {timelineImpact.current} days.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search stages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <Button
                variant={filterDeliverables ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterDeliverables(!filterDeliverables)}
              >
                <Star className="w-4 h-4 mr-2" />
                Deliverables Only
              </Button>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              {selectedStages.size > 0 && (
                <>
                  <Badge variant="secondary" className="px-3 py-2">
                    {selectedStages.size} selected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkEdit(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleRemoveStages(Array.from(selectedStages))}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Selected
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuickAdd(true)}
              >
                <Zap className="w-4 h-4 mr-2" />
                Quick Add
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkAdd}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add 5 Stages
              </Button>
              
              {projectData.template && !projectData.template.isBlank && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetToTemplate}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Template
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stages List */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Stages</CardTitle>
          <CardDescription>
            Drag to reorder, click to select, or edit inline. Stages marked with a star are deliverables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="stages">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {Object.entries(stagesByPhase).map(([phase, phaseStages]) => {
                    const isCollapsed = collapsedPhases.has(phase);
                    const visibleStages = phaseStages.filter(s => 
                      (!searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
                      (!filterDeliverables || s.is_deliverable)
                    );
                    
                    if (visibleStages.length === 0) return null;
                    
                    return (
                      <div key={phase} className="space-y-2">
                        {/* Phase Header */}
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => togglePhase(phase)}
                            className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            <Badge className={PHASE_COLORS[phase] || 'bg-gray-100 text-gray-800'}>
                              {phase}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {visibleStages.length} stages
                            </span>
                          </button>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => selectAllInPhase(phase)}
                            >
                              Select All
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddStage({ phase })}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Phase Stages */}
                        <AnimatePresence>
                          {!isCollapsed && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-2 pl-8"
                            >
                              {visibleStages.map((stage, index) => {
                                const globalIndex = stages.findIndex(s => s.id === stage.id);
                                
                                return (
                                  <Draggable
                                    key={stage.id}
                                    draggableId={stage.id}
                                    index={globalIndex}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`
                                          bg-white border rounded-lg p-3 transition-all
                                          ${snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'}
                                          ${selectedStages.has(stage.id) ? 'ring-2 ring-blue-500' : ''}
                                          ${stage.is_custom ? 'border-blue-300' : 'border-gray-200'}
                                        `}
                                      >
                                        <div className="flex items-center gap-3">
                                          {/* Drag Handle */}
                                          <div {...provided.dragHandleProps}>
                                            <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                                          </div>
                                          
                                          {/* Selection Checkbox */}
                                          <Checkbox
                                            checked={selectedStages.has(stage.id)}
                                            onCheckedChange={() => toggleStageSelection(stage.id)}
                                          />
                                          
                                          {/* Stage Icon */}
                                          {stage.is_deliverable ? (
                                            <Star className="w-5 h-5 text-yellow-500" />
                                          ) : (
                                            <Circle className="w-5 h-5 text-gray-400" />
                                          )}
                                          
                                          {/* Stage Name (Editable) */}
                                          <Input
                                            value={stage.name}
                                            onChange={(e) => handleEditStage(stage.id, { name: e.target.value })}
                                            className="flex-1 border-0 focus:ring-1"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          
                                          {/* Duration */}
                                          <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <Input
                                              type="number"
                                              value={stage.duration}
                                              onChange={(e) => handleEditStage(stage.id, { duration: parseInt(e.target.value) || 0 })}
                                              className="w-20 border-0 focus:ring-1"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <span className="text-sm text-gray-600">days</span>
                                          </div>
                                          
                                          {/* Custom Badge */}
                                          {stage.is_custom && (
                                            <Badge variant="outline" className="text-blue-600">
                                              Custom
                                            </Badge>
                                          )}
                                          
                                          {/* Actions */}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingStage(stage)}
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveStages(stage.id)}
                                          >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                          </Button>
                                        </div>
                                        
                                        {/* Dependencies indicator */}
                                        {stage.dependencies && stage.dependencies.length > 0 && (
                                          <div className="mt-2 text-xs text-gray-500">
                                            Depends on: {stage.dependencies.length} stage(s)
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          
          {stages.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No stages yet. Add stages to build your workflow.</p>
              <Button className="mt-4" onClick={() => setShowQuickAdd(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Stage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Add Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quick Add Stages</DialogTitle>
            <DialogDescription>
              Select from common stage templates or create a custom stage.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {STAGE_TEMPLATES.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    handleAddStage(template);
                    setShowQuickAdd(false);
                  }}
                >
                  {template.is_deliverable ? (
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  ) : (
                    <Circle className="w-4 h-4 mr-2 text-gray-400" />
                  )}
                  <span className="flex-1 text-left">{template.name}</span>
                  <Badge variant="secondary">{template.duration}d</Badge>
                </Button>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <Button
                className="w-full"
                onClick={() => {
                  handleAddStage({});
                  setShowQuickAdd(false);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Stage
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dependency Warning Dialog */}
      <Dialog open={showDependencyWarning} onOpenChange={setShowDependencyWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dependency Warning</DialogTitle>
            <DialogDescription>
              Removing these stages will affect other stages that depend on them. 
              Dependencies will be automatically removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDependencyWarning(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => performRemoval(pendingRemoval)}
            >
              Remove Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to generate stages from template
function generateStagesFromTemplate(template) {
  // This would normally come from the template's actual stage data
  // For now, we'll generate some example stages
  const phases = ['Onboarding', 'Research', 'Strategy', 'Brand Building', 'Brand Collaterals', 'Brand Activation'];
  const stages = [];
  let stageCount = 0;
  
  phases.forEach((phase, phaseIndex) => {
    const stagesInPhase = Math.floor(template.stages / phases.length);
    
    for (let i = 0; i < stagesInPhase; i++) {
      stages.push({
        id: `stage-${phaseIndex}-${i}`,
        name: `${phase} Stage ${i + 1}`,
        phase: phase,
        duration: Math.floor(Math.random() * 7) + 3,
        is_deliverable: Math.random() > 0.6,
        dependencies: [],
        order_index: stageCount++,
        is_custom: false
      });
    }
  });
  
  return stages;
}