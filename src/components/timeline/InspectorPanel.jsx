import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Lock, Unlock, AlertCircle, GitCommit, User, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import scheduleRuleEngine from '@/services/scheduleRuleEngine';
import { useUser } from '@/contexts/ClerkUserContext';
import { toast } from 'sonner';

export default function InspectorPanel({ 
  stage, 
  stages, 
  isOpen, 
  onClose, 
  onUpdate,
  teamMembers = []
}) {
  const { user } = useUser();
  const isClient = user?.role === 'client';
  const canEdit = !isClient && !stage?.is_locked;

  // Rule state
  const [scheduleRule, setScheduleRule] = useState('fixed');
  const [anchorStageId, setAnchorStageId] = useState('');
  const [offsetValue, setOffsetValue] = useState(0);
  const [offsetUnit, setOffsetUnit] = useState('days');
  const [useBusinessDays, setUseBusinessDays] = useState(true);
  
  // Constraint state
  const [isLocked, setIsLocked] = useState(false);
  const [earliestDate, setEarliestDate] = useState('');
  const [latestDate, setLatestDate] = useState('');
  const [duration, setDuration] = useState(3);
  const [slaDay

s, setSlaDays] = useState(null);
  
  // Other state
  const [assignedTo, setAssignedTo] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [impactPreview, setImpactPreview] = useState(null);

  // Initialize state from stage
  useEffect(() => {
    if (stage) {
      setScheduleRule(stage.schedule_rule || 'fixed');
      setAnchorStageId(stage.anchor_stage_id || '');
      setOffsetValue(stage.offset_value || 0);
      setOffsetUnit(stage.offset_unit || 'days');
      setUseBusinessDays(stage.use_business_days !== false);
      setIsLocked(stage.is_locked || false);
      setEarliestDate(stage.earliest_date || '');
      setLatestDate(stage.latest_date || '');
      setDuration(stage.estimated_duration || 3);
      setSlaDays(stage.sla_days || null);
      setAssignedTo(stage.assigned_to || '');
      setIsMilestone(stage.is_milestone || false);
      setIsDirty(false);
    }
  }, [stage]);

  // Calculate impact preview
  useEffect(() => {
    if (stage && isDirty) {
      // Initialize rule engine with current stages
      scheduleRuleEngine.initialize(stages);
      
      // Update the rule for this stage
      scheduleRuleEngine.updateStageRule(stage.id, {
        rule: scheduleRule,
        anchorId: anchorStageId,
        offsetValue,
        offsetUnit,
        useBusinessDays
      });
      
      // Calculate new dates
      const calculated = scheduleRuleEngine.calculateStageDate(stage.id);
      if (calculated) {
        setImpactPreview({
          newStartDate: calculated.startDate,
          newEndDate: calculated.endDate,
          ruleString: calculated.ruleString,
          oldStartDate: stage.start_date ? parseISO(stage.start_date) : new Date(),
          oldEndDate: stage.end_date ? parseISO(stage.end_date) : new Date()
        });
      }
    }
  }, [scheduleRule, anchorStageId, offsetValue, offsetUnit, useBusinessDays, isDirty]);

  const handleApply = () => {
    const updates = {
      schedule_rule: scheduleRule,
      anchor_stage_id: anchorStageId || null,
      offset_value: offsetValue,
      offset_unit: offsetUnit,
      use_business_days: useBusinessDays,
      is_locked: isLocked,
      earliest_date: earliestDate || null,
      latest_date: latestDate || null,
      estimated_duration: duration,
      sla_days: slaDays,
      assigned_to: assignedTo || null,
      is_milestone: isMilestone
    };

    // Calculate new dates if rule changed
    if (impactPreview) {
      updates.start_date = impactPreview.newStartDate.toISOString();
      updates.end_date = impactPreview.newEndDate.toISOString();
    }

    onUpdate(stage.id, updates);
    setIsDirty(false);
    toast.success('Stage updated successfully');
  };

  const handleRevert = () => {
    // Re-initialize from stage
    if (stage) {
      setScheduleRule(stage.schedule_rule || 'fixed');
      setAnchorStageId(stage.anchor_stage_id || '');
      setOffsetValue(stage.offset_value || 0);
      setOffsetUnit(stage.offset_unit || 'days');
      setUseBusinessDays(stage.use_business_days !== false);
      setIsLocked(stage.is_locked || false);
      setEarliestDate(stage.earliest_date || '');
      setLatestDate(stage.latest_date || '');
      setDuration(stage.estimated_duration || 3);
      setSlaDays(stage.sla_days || null);
      setAssignedTo(stage.assigned_to || '');
      setIsMilestone(stage.is_milestone || false);
      setIsDirty(false);
      setImpactPreview(null);
    }
  };

  const handleRecompute = () => {
    scheduleRuleEngine.initialize(stages);
    const recalculated = scheduleRuleEngine.recalculateAllDates();
    toast.info(`Recomputed dates for ${recalculated.length} stages`);
  };

  if (!isOpen || !stage) return null;

  // Get available anchor stages (exclude self and dependents)
  const availableAnchors = stages.filter(s => 
    s.id !== stage.id && 
    !s.dependencies?.includes(stage.id)
  );

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {stage.is_deliverable ? 'Deliverable' : 'Stage'} Inspector
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              #{stage.number_index} {stage.name}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Status badges */}
        <div className="flex items-center gap-2 mt-3">
          <Badge variant={stage.status === 'completed' ? 'success' : 'default'}>
            {stage.status}
          </Badge>
          {stage.is_deliverable && (
            <Badge variant="outline">
              <GitCommit className="w-3 h-3 mr-1" />
              Deliverable
            </Badge>
          )}
          {isLocked && (
            <Badge variant="destructive">
              <Lock className="w-3 h-3 mr-1" />
              Locked
            </Badge>
          )}
          {isMilestone && (
            <Badge variant="secondary">
              Milestone
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <Tabs defaultValue="scheduling" className="w-full">
          <TabsList className="w-full justify-start px-6 pt-4">
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduling" className="px-6 space-y-6">
            {/* Scheduling Rule */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Scheduling Rule</Label>
              <RadioGroup 
                value={scheduleRule} 
                onValueChange={(value) => {
                  setScheduleRule(value);
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="cursor-pointer">Fixed Date</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offset_from_step" id="offset_step" />
                  <Label htmlFor="offset_step" className="cursor-pointer">Offset from Specific Step</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offset_from_previous" id="offset_prev" />
                  <Label htmlFor="offset_prev" className="cursor-pointer">Offset from Previous Step</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offset_from_dependencies" id="offset_deps" />
                  <Label htmlFor="offset_deps" className="cursor-pointer">Offset from All Dependencies</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Anchor Selection (for offset_from_step) */}
            {scheduleRule === 'offset_from_step' && (
              <div className="space-y-2">
                <Label htmlFor="anchor">Anchor Step</Label>
                <Select 
                  value={anchorStageId} 
                  onValueChange={(value) => {
                    setAnchorStageId(value);
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select anchor step" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAnchors.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        #{s.number_index} {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Offset Configuration */}
            {scheduleRule !== 'fixed' && (
              <div className="space-y-2">
                <Label>Offset</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={offsetValue}
                    onChange={(e) => {
                      setOffsetValue(parseInt(e.target.value) || 0);
                      setIsDirty(true);
                    }}
                    disabled={!canEdit}
                    className="w-24"
                  />
                  <Select 
                    value={offsetUnit} 
                    onValueChange={(value) => {
                      setOffsetUnit(value);
                      setIsDirty(true);
                    }}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Business Days Toggle */}
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="business-days"
                    checked={useBusinessDays}
                    onCheckedChange={(checked) => {
                      setUseBusinessDays(checked);
                      setIsDirty(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="business-days" className="text-sm">
                    Use business days only
                  </Label>
                </div>
              </div>
            )}

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => {
                  setDuration(parseInt(e.target.value) || 1);
                  setIsDirty(true);
                }}
                disabled={!canEdit}
                className="w-32"
              />
            </div>

            {/* Owner Assignment */}
            <div className="space-y-2">
              <Label htmlFor="owner">Assigned To</Label>
              <Select 
                value={assignedTo} 
                onValueChange={(value) => {
                  setAssignedTo(value);
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
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
            </div>

            {/* Impact Preview */}
            {impactPreview && isDirty && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Impact Preview</span>
                </div>
                <p className="text-sm text-blue-600">{impactPreview.ruleString}</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current:</span>
                    <span>{format(impactPreview.oldStartDate, 'MMM d')} - {format(impactPreview.oldEndDate, 'MMM d')}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-600">New:</span>
                    <span>{format(impactPreview.newStartDate, 'MMM d')} - {format(impactPreview.newEndDate, 'MMM d')}</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="constraints" className="px-6 space-y-6">
            {/* Lock Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lock Status</Label>
                <Button
                  variant={isLocked ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsLocked(!isLocked);
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                >
                  {isLocked ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Locked
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Unlocked
                    </>
                  )}
                </Button>
              </div>
              {isLocked && (
                <p className="text-sm text-gray-600">
                  This stage cannot be moved by drag operations or cascade effects.
                </p>
              )}
            </div>

            <Separator />

            {/* Date Constraints */}
            <div className="space-y-4">
              <Label>Date Constraints</Label>
              
              <div className="space-y-2">
                <Label htmlFor="earliest" className="text-sm">Earliest Start Date</Label>
                <Input
                  id="earliest"
                  type="date"
                  value={earliestDate}
                  onChange={(e) => {
                    setEarliestDate(e.target.value);
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="latest" className="text-sm">Latest Start Date</Label>
                <Input
                  id="latest"
                  type="date"
                  value={latestDate}
                  onChange={(e) => {
                    setLatestDate(e.target.value);
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <Separator />

            {/* SLA for Deliverables */}
            {stage.is_deliverable && (
              <div className="space-y-2">
                <Label htmlFor="sla">SLA (days)</Label>
                <Input
                  id="sla"
                  type="number"
                  value={slaDays || ''}
                  onChange={(e) => {
                    setSlaDays(e.target.value ? parseInt(e.target.value) : null);
                    setIsDirty(true);
                  }}
                  placeholder="No SLA"
                  disabled={!canEdit}
                  className="w-32"
                />
                <p className="text-sm text-gray-600">
                  Maximum days for approval after submission
                </p>
              </div>
            )}

            {/* Milestone Flag */}
            <div className="flex items-center space-x-2">
              <Switch
                id="milestone"
                checked={isMilestone}
                onCheckedChange={(checked) => {
                  setIsMilestone(checked);
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
              <Label htmlFor="milestone">
                Mark as Milestone
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="px-6 space-y-4">
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Change History</h3>
              
              {/* Mock audit entries */}
              <div className="space-y-2">
                <div className="text-sm border-l-2 border-gray-200 pl-4 py-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Status changed to "in_progress"</span>
                    <span>2d ago</span>
                  </div>
                  <div className="text-gray-500">By John Doe</div>
                </div>
                
                <div className="text-sm border-l-2 border-gray-200 pl-4 py-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Dates shifted +3 days (cascade)</span>
                    <span>5d ago</span>
                  </div>
                  <div className="text-gray-500">System (dependency change)</div>
                </div>
                
                <div className="text-sm border-l-2 border-gray-200 pl-4 py-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Created</span>
                    <span>Aug 1</span>
                  </div>
                  <div className="text-gray-500">By System</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-gray-200 space-y-3">
        {/* Client-friendly explanation */}
        {isClient && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              {scheduleRuleEngine.explainRule(stage.id)}
            </p>
          </div>
        )}
        
        {/* Action buttons */}
        {canEdit && (
          <div className="flex gap-2">
            <Button 
              onClick={handleApply} 
              disabled={!isDirty}
              className="flex-1"
            >
              Apply Changes
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRevert}
              disabled={!isDirty}
            >
              Revert
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRecompute}
            >
              Recompute
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}