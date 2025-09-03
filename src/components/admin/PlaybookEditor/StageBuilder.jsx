import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus,
  Trash2,
  GripVertical,
  Save,
  Edit2,
  Copy,
  Star,
  Circle,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Layers,
  FileText,
  Clock
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PHASE_OPTIONS = [
  'Onboarding',
  'Research', 
  'Strategy',
  'Brand Building',
  'Brand Collaterals',
  'Brand Activation',
  'Audit',
  'Brand Evolution',
  'Implementation'
];

const DEADLINE_TYPES = [
  { value: 'fixed_date', label: 'Fixed Date' },
  { value: 'relative_to_stage', label: 'Relative to Stage' },
  { value: 'relative_to_previous', label: 'Relative to Previous' },
  { value: 'relative_to_dependencies', label: 'After All Dependencies' }
];

export default function StageBuilder({ template, onUpdate, onSave }) {
  const [stages, setStages] = useState(template.stages || []);
  const [expandedPhases, setExpandedPhases] = useState(new Set());
  const [editingStage, setEditingStage] = useState(null);
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStage, setNewStage] = useState({
    name: '',
    formal_name: '',
    description: '',
    phase: 'Onboarding',
    is_deliverable: false,
    is_optional: false,
    estimated_duration: 1,
    deadline_type: 'relative_to_previous'
  });
  const { toast } = useToast();

  // Group stages by phase
  const stagesByPhase = stages.reduce((acc, stage) => {
    const phase = stage.phase || 'Uncategorized';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(stage);
    return acc;
  }, {});

  // Initialize expanded phases
  useEffect(() => {
    setExpandedPhases(new Set(Object.keys(stagesByPhase)));
  }, []);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newStages = Array.from(stages);
    const [reorderedItem] = newStages.splice(result.source.index, 1);
    newStages.splice(result.destination.index, 0, reorderedItem);

    // Update order indices
    const updatedStages = newStages.map((stage, index) => ({
      ...stage,
      order_index: index + 1
    }));

    setStages(updatedStages);
    updateTemplate(updatedStages);
  };

  const updateTemplate = (updatedStages) => {
    const phases = [...new Set(updatedStages.map(s => s.phase).filter(Boolean))];
    onUpdate({
      stages: updatedStages,
      stageCount: updatedStages.length,
      phases: phases
    });
  };

  const addStage = () => {
    if (!newStage.name.trim()) {
      toast({
        title: "Stage name required",
        description: "Please enter a name for the stage.",
        variant: "destructive"
      });
      return;
    }

    const stage = {
      id: `stage-${Date.now()}`,
      ...newStage,
      order_index: stages.length + 1,
      dependencies: [],
      created_at: new Date().toISOString()
    };

    const updatedStages = [...stages, stage];
    setStages(updatedStages);
    updateTemplate(updatedStages);
    
    // Reset form
    setNewStage({
      name: '',
      formal_name: '',
      description: '',
      phase: 'Onboarding',
      is_deliverable: false,
      is_optional: false,
      estimated_duration: 1,
      deadline_type: 'relative_to_previous'
    });
    setShowAddStage(false);

    toast({
      title: "Stage added",
      description: `"${stage.name}" has been added to the template.`
    });
  };

  const updateStage = (stageId, updates) => {
    const updatedStages = stages.map(s => 
      s.id === stageId ? { ...s, ...updates } : s
    );
    setStages(updatedStages);
    updateTemplate(updatedStages);
    setEditingStage(null);
  };

  const deleteStage = (stageId) => {
    const stage = stages.find(s => s.id === stageId);
    const updatedStages = stages.filter(s => s.id !== stageId);
    
    // Update order indices
    const reindexed = updatedStages.map((s, index) => ({
      ...s,
      order_index: index + 1
    }));
    
    setStages(reindexed);
    updateTemplate(reindexed);

    toast({
      title: "Stage deleted",
      description: `"${stage?.name}" has been removed.`
    });
  };

  const duplicateStage = (stage) => {
    const duplicated = {
      ...stage,
      id: `stage-${Date.now()}`,
      name: `${stage.name} (Copy)`,
      order_index: stages.length + 1
    };

    const updatedStages = [...stages, duplicated];
    setStages(updatedStages);
    updateTemplate(updatedStages);

    toast({
      title: "Stage duplicated",
      description: `"${duplicated.name}" has been created.`
    });
  };

  const togglePhase = (phase) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phase)) {
      newExpanded.delete(phase);
    } else {
      newExpanded.add(phase);
    }
    setExpandedPhases(newExpanded);
  };

  const bulkAddStages = (count, phase) => {
    const newStages = [];
    for (let i = 0; i < count; i++) {
      newStages.push({
        id: `stage-${Date.now()}-${i}`,
        name: `New Stage ${stages.length + i + 1}`,
        formal_name: '',
        description: '',
        phase: phase,
        is_deliverable: false,
        is_optional: false,
        estimated_duration: 1,
        deadline_type: 'relative_to_previous',
        order_index: stages.length + i + 1,
        dependencies: [],
        created_at: new Date().toISOString()
      });
    }

    const updatedStages = [...stages, ...newStages];
    setStages(updatedStages);
    updateTemplate(updatedStages);

    toast({
      title: "Stages added",
      description: `${count} new stages have been added to ${phase}.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Stage Builder</h3>
          <p className="text-sm text-gray-600">
            Drag and drop to reorder stages. Total: {stages.length} stages
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddStage(!showAddStage)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Stage
          </Button>
          <Button onClick={onSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Add Stage Form */}
      <AnimatePresence>
        {showAddStage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add New Stage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stage Name</label>
                    <Input
                      placeholder="e.g., Brand Discovery"
                      value={newStage.name}
                      onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Formal Name</label>
                    <Input
                      placeholder="e.g., Initial Brand Discovery Session"
                      value={newStage.formal_name}
                      onChange={(e) => setNewStage({ ...newStage, formal_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe what happens in this stage..."
                    value={newStage.description}
                    onChange={(e) => setNewStage({ ...newStage, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phase</label>
                    <Select
                      value={newStage.phase}
                      onValueChange={(value) => setNewStage({ ...newStage, phase: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PHASE_OPTIONS.map(phase => (
                          <SelectItem key={phase} value={phase}>
                            {phase}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (days)</label>
                    <Input
                      type="number"
                      min="1"
                      value={newStage.estimated_duration}
                      onChange={(e) => setNewStage({ 
                        ...newStage, 
                        estimated_duration: parseInt(e.target.value) || 1 
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deadline Type</label>
                    <Select
                      value={newStage.deadline_type}
                      onValueChange={(value) => setNewStage({ ...newStage, deadline_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEADLINE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={newStage.is_deliverable}
                      onCheckedChange={(checked) => 
                        setNewStage({ ...newStage, is_deliverable: checked })
                      }
                    />
                    <label className="text-sm">Is Deliverable</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={newStage.is_optional}
                      onCheckedChange={(checked) => 
                        setNewStage({ ...newStage, is_optional: checked })
                      }
                    />
                    <label className="text-sm">Is Optional</label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddStage(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addStage}>
                    Add Stage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stages by Phase */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="stages">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {Object.entries(stagesByPhase).map(([phase, phaseStages]) => (
                <Card key={phase}>
                  <CardHeader 
                    className="cursor-pointer"
                    onClick={() => togglePhase(phase)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {expandedPhases.has(phase) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <CardTitle className="text-base">{phase}</CardTitle>
                        <Badge variant="secondary">
                          {phaseStages.length} stages
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          bulkAddStages(5, phase);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add 5
                      </Button>
                    </div>
                  </CardHeader>

                  <AnimatePresence>
                    {expandedPhases.has(phase) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <CardContent className="space-y-2">
                          {phaseStages.map((stage, index) => {
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
                                      border rounded-lg p-3 bg-white
                                      ${snapshot.isDragging ? 'shadow-lg' : ''}
                                      ${editingStage === stage.id ? 'ring-2 ring-blue-500' : ''}
                                    `}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        {stage.is_deliverable ? (
                                          <Star className="w-4 h-4 text-yellow-500" />
                                        ) : (
                                          <Circle className="w-4 h-4 text-gray-400" />
                                        )}
                                        <span className="text-sm font-medium">
                                          {stage.order_index}. {stage.name}
                                        </span>
                                        {stage.is_optional && (
                                          <Badge variant="outline" className="text-xs">
                                            Optional
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="ml-auto flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setEditingStage(
                                            editingStage === stage.id ? null : stage.id
                                          )}
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => duplicateStage(stage)}
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => deleteStage(stage.id)}
                                        >
                                          <Trash2 className="w-3 h-3 text-red-500" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Inline Edit Form */}
                                    <AnimatePresence>
                                      {editingStage === stage.id && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="mt-3 pt-3 border-t space-y-3"
                                        >
                                          <Input
                                            placeholder="Stage name"
                                            value={stage.name}
                                            onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                                          />
                                          <Textarea
                                            placeholder="Description"
                                            value={stage.description || ''}
                                            onChange={(e) => updateStage(stage.id, { description: e.target.value })}
                                            rows={2}
                                          />
                                          <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                              <Checkbox
                                                checked={stage.is_deliverable}
                                                onCheckedChange={(checked) => 
                                                  updateStage(stage.id, { is_deliverable: checked })
                                                }
                                              />
                                              <label className="text-sm">Deliverable</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Checkbox
                                                checked={stage.is_optional}
                                                onCheckedChange={(checked) => 
                                                  updateStage(stage.id, { is_optional: checked })
                                                }
                                              />
                                              <label className="text-sm">Optional</label>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stages.length}</div>
              <div className="text-sm text-gray-600">Total Stages</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {stages.filter(s => s.is_deliverable).length}
              </div>
              <div className="text-sm text-gray-600">Deliverables</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {stages.filter(s => s.is_optional).length}
              </div>
              <div className="text-sm text-gray-600">Optional</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Object.keys(stagesByPhase).length}
              </div>
              <div className="text-sm text-gray-600">Phases</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}