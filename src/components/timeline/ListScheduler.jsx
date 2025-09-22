import React, { useState, useEffect, useRef } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  ClipboardPaste, 
  ArrowDown, 
  RotateCcw, 
  Lock, 
  Unlock,
  Star,
  Circle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Hash,
  User,
  GitCommit,
  Filter,
  Download,
  ChevronDown
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import scheduleRuleEngine from '@/services/scheduleRuleEngine';
import { useUser } from '@/contexts/SupabaseUserContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ListScheduler({ 
  stages, 
  teamMembers = [], 
  onStageUpdate,
  onBulkUpdate 
}) {
  const { user } = useUser();
  const isClient = user?.role === 'client';
  const canEdit = !isClient;

  // State
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [copiedData, setCopiedData] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    owner: 'all'
  });
  const [sortColumn, setSortColumn] = useState('number_index');
  const [sortDirection, setSortDirection] = useState('asc');
  const [dirtyRows, setDirtyRows] = useState(new Set());

  // Refs for keyboard navigation
  const tableRef = useRef(null);
  const inputRefs = useRef({});

  // Initialize rule engine
  useEffect(() => {
    scheduleRuleEngine.initialize(stages);
  }, [stages]);

  // Filter and sort stages
  const processedStages = React.useMemo(() => {
    let filtered = [...stages];

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(s => s.status === filters.status);
    }
    if (filters.type !== 'all') {
      filtered = filtered.filter(s => 
        filters.type === 'deliverable' ? s.is_deliverable : !s.is_deliverable
      );
    }
    if (filters.owner !== 'all') {
      filtered = filtered.filter(s => s.assigned_to === filters.owner);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      if (sortColumn === 'expected_date') {
        aVal = a.start_date ? new Date(a.start_date).getTime() : 0;
        bVal = b.start_date ? new Date(b.start_date).getTime() : 0;
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [stages, filters, sortColumn, sortDirection]);

  // Handle cell edit
  const startEdit = (stageId, field) => {
    if (!canEdit) return;
    
    const stage = stages.find(s => s.id === stageId);
    if (!stage || stage.is_locked) return;

    setEditingCell(`${stageId}-${field}`);
    
    // Set initial value based on field
    let initialValue = '';
    switch (field) {
      case 'rule':
        initialValue = stage.schedule_rule || 'fixed';
        break;
      case 'anchor':
        initialValue = stage.anchor_stage_id || '';
        break;
      case 'offset':
        initialValue = stage.offset_value || '0';
        break;
      case 'expected':
        initialValue = stage.start_date ? format(parseISO(stage.start_date), 'yyyy-MM-dd') : '';
        break;
      case 'duration':
        initialValue = stage.estimated_duration || '3';
        break;
      case 'sla':
        initialValue = stage.sla_days || '';
        break;
      case 'owner':
        initialValue = stage.assigned_to || '';
        break;
      case 'notes':
        initialValue = stage.notes || '';
        break;
      default:
        initialValue = stage[field] || '';
    }
    
    setTempValue(initialValue);
  };

  const saveEdit = (stageId, field) => {
    const updates = {};
    
    switch (field) {
      case 'rule':
        updates.schedule_rule = tempValue;
        break;
      case 'anchor':
        updates.anchor_stage_id = tempValue || null;
        break;
      case 'offset':
        const [value, unit] = tempValue.split(' ');
        updates.offset_value = parseInt(value) || 0;
        updates.offset_unit = unit || 'days';
        break;
      case 'expected':
        if (tempValue) {
          updates.start_date = new Date(tempValue).toISOString();
          const stage = stages.find(s => s.id === stageId);
          const duration = stage?.estimated_duration || 3;
          updates.end_date = addDays(new Date(tempValue), duration - 1).toISOString();
        }
        break;
      case 'duration':
        updates.estimated_duration = parseInt(tempValue) || 3;
        break;
      case 'sla':
        updates.sla_days = tempValue ? parseInt(tempValue) : null;
        break;
      case 'owner':
        updates.assigned_to = tempValue || null;
        break;
      case 'notes':
        updates.notes = tempValue;
        break;
    }

    onStageUpdate(stageId, updates);
    setDirtyRows(prev => new Set([...prev, stageId]));
    setEditingCell(null);
    setTempValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setTempValue('');
  };

  // Selection handlers
  const toggleRowSelection = (stageId) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(stageId)) {
      newSelection.delete(stageId);
    } else {
      newSelection.add(stageId);
    }
    setSelectedRows(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === processedStages.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(processedStages.map(s => s.id)));
    }
  };

  // Copy/Paste operations
  const handleCopy = () => {
    const selectedStages = processedStages.filter(s => selectedRows.has(s.id));
    if (selectedStages.length === 0) return;

    const dataToCopy = {
      rules: selectedStages.map(s => ({
        schedule_rule: s.schedule_rule,
        anchor_stage_id: s.anchor_stage_id,
        offset_value: s.offset_value,
        offset_unit: s.offset_unit
      }))
    };

    setCopiedData(dataToCopy);
    navigator.clipboard.writeText(JSON.stringify(dataToCopy));
    toast.success(`Copied ${selectedStages.length} rules`);
  };

  const handlePaste = () => {
    if (!copiedData || selectedRows.size === 0) return;

    const targetStages = Array.from(selectedRows);
    const updates = targetStages.map((stageId, index) => {
      const ruleData = copiedData.rules[index % copiedData.rules.length];
      return {
        id: stageId,
        ...ruleData
      };
    });

    onBulkUpdate(updates);
    toast.success(`Pasted rules to ${targetStages.length} stages`);
  };

  // Fill down operation
  const handleFillDown = (field) => {
    const selectedStageIds = Array.from(selectedRows);
    if (selectedStageIds.length < 2) return;

    // Get the first selected stage's value
    const firstStage = processedStages.find(s => s.id === selectedStageIds[0]);
    if (!firstStage) return;

    const value = firstStage[field];
    const updates = selectedStageIds.slice(1).map(id => ({
      id,
      [field]: value
    }));

    onBulkUpdate(updates);
    toast.success(`Filled down ${field} to ${updates.length} stages`);
  };

  // Recompute from rules
  const handleRecompute = () => {
    scheduleRuleEngine.initialize(stages);
    const recalculated = scheduleRuleEngine.recalculateAllDates();
    
    const updates = recalculated.map(stage => ({
      id: stage.id,
      start_date: stage.start_date,
      end_date: stage.end_date
    }));

    onBulkUpdate(updates);
    toast.success(`Recomputed dates for ${updates.length} stages`);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!editingCell) return;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          const [stageId, field] = editingCell.split('-');
          saveEdit(stageId, field);
          break;
        case 'Escape':
          e.preventDefault();
          cancelEdit();
          break;
        case 'Tab':
          // Navigate to next cell
          e.preventDefault();
          // Implementation for tab navigation would go here
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, tempValue]);

  // Status helpers
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'blocked':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRuleDisplay = (stage) => {
    const rule = stage.schedule_rule || 'fixed';
    switch (rule) {
      case 'fixed':
        return 'Fixed';
      case 'offset_from_step':
        return 'Offset/Step';
      case 'offset_from_previous':
        return 'Offset/Prev';
      case 'offset_from_dependencies':
        return 'Offset/Deps';
      default:
        return rule;
    }
  };

  const getAnchorDisplay = (stage) => {
    if (!stage.anchor_stage_id) return '—';
    const anchor = stages.find(s => s.id === stage.anchor_stage_id);
    return anchor ? `#${anchor.number_index}` : '—';
  };

  const getOffsetDisplay = (stage) => {
    if (!stage.offset_value) return '—';
    return `${stage.offset_value > 0 ? '+' : ''}${stage.offset_value} ${stage.offset_unit || 'd'}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Filters */}
            <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(v) => setFilters({...filters, type: v})}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="stage">Stages</SelectItem>
                <SelectItem value="deliverable">Deliverables</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => setFilters({ status: 'all', type: 'all', owner: 'all' })}>
              Clear Filters
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk actions */}
            {selectedRows.size > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handlePaste} disabled={!copiedData}>
                  <ClipboardPaste className="w-4 h-4 mr-2" />
                  Paste
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleFillDown('schedule_rule')}>
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Fill Down
                </Button>
              </>
            )}
            
            <Button variant="outline" size="sm" onClick={handleRecompute}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Recompute
            </Button>

            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Selection info */}
        {selectedRows.size > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table ref={tableRef}>
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedRows.size === processedStages.length && processedStages.length > 0}
                  onCheckedChange={toggleAllSelection}
                />
              </TableHead>
              <TableHead className="w-20">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSortColumn('number_index');
                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  }}
                  className="h-auto p-0 font-medium"
                >
                  <Hash className="w-4 h-4 mr-1" />
                  #
                </Button>
              </TableHead>
              <TableHead>Node</TableHead>
              <TableHead className="w-20">Type</TableHead>
              <TableHead className="w-24">Cluster</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-32">Rule</TableHead>
              <TableHead className="w-20">Anchor</TableHead>
              <TableHead className="w-24">Offset</TableHead>
              <TableHead className="w-28">Expected</TableHead>
              <TableHead className="w-20">Duration</TableHead>
              <TableHead className="w-20">SLA</TableHead>
              <TableHead className="w-32">Owner</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedStages.map((stage) => {
              const isEditing = (field) => editingCell === `${stage.id}-${field}`;
              const isDirty = dirtyRows.has(stage.id);
              const isSelected = selectedRows.has(stage.id);
              const hasViolation = false; // TODO: Check for violations

              return (
                <TableRow 
                  key={stage.id}
                  className={cn(
                    "group",
                    isSelected && "bg-blue-50",
                    isDirty && "bg-yellow-50",
                    hasViolation && "bg-red-50"
                  )}
                >
                  <TableCell>
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => toggleRowSelection(stage.id)}
                    />
                  </TableCell>
                  
                  <TableCell className="font-mono text-xs">
                    {stage.number_index}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {stage.is_deliverable ? (
                        <Star className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="font-medium">{stage.name}</span>
                      {stage.is_locked && <Lock className="w-3 h-3 text-gray-500" />}
                      {stage.is_milestone && <Badge variant="secondary" className="text-xs">M</Badge>}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {stage.is_deliverable ? 'Del' : 'Step'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-xs">
                    {stage.category?.replace('_', ' ')}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(stage.status)}
                      <span className="text-xs">{stage.status}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => startEdit(stage.id, 'rule')}
                  >
                    {isEditing('rule') ? (
                      <Select 
                        value={tempValue} 
                        onValueChange={(v) => {
                          setTempValue(v);
                          saveEdit(stage.id, 'rule');
                        }}
                        open
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed</SelectItem>
                          <SelectItem value="offset_from_step">Offset/Step</SelectItem>
                          <SelectItem value="offset_from_previous">Offset/Prev</SelectItem>
                          <SelectItem value="offset_from_dependencies">Offset/Deps</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs">{getRuleDisplay(stage)}</span>
                    )}
                  </TableCell>
                  
                  <TableCell 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => startEdit(stage.id, 'anchor')}
                  >
                    {isEditing('anchor') ? (
                      <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => saveEdit(stage.id, 'anchor')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(stage.id, 'anchor');
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="h-7 text-xs"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs">{getAnchorDisplay(stage)}</span>
                    )}
                  </TableCell>
                  
                  <TableCell 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => startEdit(stage.id, 'offset')}
                  >
                    {isEditing('offset') ? (
                      <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => saveEdit(stage.id, 'offset')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(stage.id, 'offset');
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        placeholder="+5 days"
                        className="h-7 text-xs"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs font-mono">{getOffsetDisplay(stage)}</span>
                    )}
                  </TableCell>
                  
                  <TableCell 
                    className={cn(
                      "cursor-pointer hover:bg-gray-100",
                      stage.schedule_rule === 'fixed' && "font-medium"
                    )}
                    onClick={() => stage.schedule_rule === 'fixed' && startEdit(stage.id, 'expected')}
                  >
                    {isEditing('expected') ? (
                      <Input
                        type="date"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => saveEdit(stage.id, 'expected')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(stage.id, 'expected');
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="h-7 text-xs"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs">
                        {stage.start_date ? format(parseISO(stage.start_date), 'MMM d') : '—'}
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => startEdit(stage.id, 'duration')}
                  >
                    {isEditing('duration') ? (
                      <Input
                        type="number"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => saveEdit(stage.id, 'duration')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(stage.id, 'duration');
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="h-7 text-xs w-16"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs">{stage.estimated_duration || 3}d</span>
                    )}
                  </TableCell>
                  
                  <TableCell 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => stage.is_deliverable && startEdit(stage.id, 'sla')}
                  >
                    {isEditing('sla') ? (
                      <Input
                        type="number"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => saveEdit(stage.id, 'sla')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(stage.id, 'sla');
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="h-7 text-xs w-16"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs">
                        {stage.is_deliverable && stage.sla_days ? `${stage.sla_days}d` : '—'}
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => startEdit(stage.id, 'owner')}
                  >
                    {isEditing('owner') ? (
                      <Select 
                        value={tempValue} 
                        onValueChange={(v) => {
                          setTempValue(v);
                          saveEdit(stage.id, 'owner');
                        }}
                        open
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {teamMembers.map(member => (
                            <SelectItem key={member.id} value={member.email}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs">
                        {stage.assigned_to ? 
                          teamMembers.find(m => m.email === stage.assigned_to)?.name || stage.assigned_to 
                          : '—'
                        }
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => startEdit(stage.id, 'notes')}
                  >
                    {isEditing('notes') ? (
                      <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => saveEdit(stage.id, 'notes')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(stage.id, 'notes');
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="h-7 text-xs"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs text-gray-600">{stage.notes || ''}</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Empty state */}
      {processedStages.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No stages match your filters</p>
            <Button 
              variant="link" 
              onClick={() => setFilters({ status: 'all', type: 'all', owner: 'all' })}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}