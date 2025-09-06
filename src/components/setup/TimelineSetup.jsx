import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Zap,
  Target,
  ChevronRight,
  Info,
  CalendarDays,
  CalendarRange,
  Timer,
  Milestone,
  BarChart3,
  Settings,
  AlertCircle,
  Plus,
  X,
  Flag
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths, differenceInDays, isWeekend, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { useWizard } from '@/pages/ProjectSetup';
import { useToast } from '@/components/ui/use-toast';

// Predefined milestone templates
const MILESTONE_TEMPLATES = [
  { name: 'Kickoff Meeting', daysFromStart: 0, type: 'meeting', icon: Flag },
  { name: 'Research Complete', daysFromStart: 30, type: 'deliverable', icon: CheckCircle2 },
  { name: 'Strategy Presentation', daysFromStart: 45, type: 'presentation', icon: Target },
  { name: 'Design Review', daysFromStart: 75, type: 'review', icon: BarChart3 },
  { name: 'Final Delivery', daysFromStart: -1, type: 'deliverable', icon: CheckCircle2 }
];

// Timeline scenarios
const TIMELINE_SCENARIOS = {
  standard: { name: 'Standard', bufferPercent: 20, description: 'Recommended buffer for most projects' },
  aggressive: { name: 'Aggressive', bufferPercent: 10, description: 'Minimal buffer, higher risk' },
  conservative: { name: 'Conservative', bufferPercent: 30, description: 'Extra buffer for complex projects' },
  custom: { name: 'Custom', bufferPercent: 15, description: 'Set your own buffer percentage' }
};

export default function TimelineSetup() {
  const { projectData, updateProjectData } = useWizard();
  const { toast } = useToast();
  
  // Initialize dates
  const [startDate, setStartDate] = useState(
    projectData.timeline?.startDate ? new Date(projectData.timeline.startDate) : new Date()
  );
  const [endDate, setEndDate] = useState(null);
  const [milestones, setMilestones] = useState(projectData.timeline?.milestones || []);
  const [bufferScenario, setBufferScenario] = useState('standard');
  const [customBuffer, setCustomBuffer] = useState(15);
  const [accountForWeekends, setAccountForWeekends] = useState(true);
  const [accountForHolidays, setAccountForHolidays] = useState(true);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', date: null, type: 'deliverable' });
  const [timelineView, setTimelineView] = useState('overview');
  const [parallelOptimization, setParallelOptimization] = useState(true);
  
  // Calculate project duration based on stages
  const calculateProjectDuration = useMemo(() => {
    if (!projectData.stages || projectData.stages.length === 0) {
      return 90; // Default 3 months
    }
    
    let totalDays = 0;
    const stagesByPhase = {};
    
    // Group stages by phase
    projectData.stages.forEach(stage => {
      if (!stagesByPhase[stage.phase]) {
        stagesByPhase[stage.phase] = [];
      }
      stagesByPhase[stage.phase].push(stage);
    });
    
    // Calculate duration considering parallel work
    if (parallelOptimization) {
      // Phases run sequentially, stages within phase can be parallel
      Object.values(stagesByPhase).forEach(phaseStages => {
        const maxDuration = Math.max(...phaseStages.map(s => s.duration || 0));
        totalDays += maxDuration;
      });
    } else {
      // All stages sequential
      totalDays = projectData.stages.reduce((sum, stage) => sum + (stage.duration || 0), 0);
    }
    
    // Apply buffer
    const bufferPercent = bufferScenario === 'custom' ? customBuffer : TIMELINE_SCENARIOS[bufferScenario].bufferPercent;
    totalDays = Math.round(totalDays * (1 + bufferPercent / 100));
    
    // Account for weekends
    if (accountForWeekends) {
      totalDays = Math.round(totalDays * 1.4); // Rough estimate: 5 work days = 7 calendar days
    }
    
    return totalDays;
  }, [projectData.stages, bufferScenario, customBuffer, accountForWeekends, parallelOptimization]);
  
  // Calculate end date
  useEffect(() => {
    if (startDate) {
      const calculatedEnd = addDays(startDate, calculateProjectDuration);
      setEndDate(calculatedEnd);
      
      // Auto-generate milestones if none exist
      if (milestones.length === 0) {
        generateDefaultMilestones(startDate, calculatedEnd);
      }
    }
  }, [startDate, calculateProjectDuration]);
  
  // Update project data
  useEffect(() => {
    updateProjectData({
      timeline: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        duration: calculateProjectDuration,
        milestones,
        settings: {
          bufferScenario,
          customBuffer,
          accountForWeekends,
          accountForHolidays,
          parallelOptimization
        }
      }
    });
  }, [startDate, endDate, milestones, bufferScenario, customBuffer, accountForWeekends, accountForHolidays, parallelOptimization]);
  
  // Generate default milestones
  const generateDefaultMilestones = (start, end) => {
    const duration = differenceInDays(end, start);
    const defaultMilestones = MILESTONE_TEMPLATES.map(template => ({
      id: `milestone-${Date.now()}-${Math.random()}`,
      name: template.name,
      date: template.daysFromStart === -1 
        ? end 
        : addDays(start, Math.min(template.daysFromStart, duration)),
      type: template.type,
      icon: template.icon
    }));
    
    setMilestones(defaultMilestones);
  };
  
  // Add milestone
  const handleAddMilestone = () => {
    if (!newMilestone.name || !newMilestone.date) {
      toast({
        title: "Missing Information",
        description: "Please provide a name and date for the milestone.",
        variant: "destructive"
      });
      return;
    }
    
    const milestone = {
      id: `milestone-${Date.now()}`,
      ...newMilestone
    };
    
    setMilestones([...milestones, milestone]);
    setNewMilestone({ name: '', date: null, type: 'deliverable' });
    setShowMilestoneDialog(false);
    
    toast({
      title: "Milestone Added",
      description: `"${milestone.name}" has been added to the timeline.`,
    });
  };
  
  // Remove milestone
  const handleRemoveMilestone = (milestoneId) => {
    setMilestones(milestones.filter(m => m.id !== milestoneId));
  };
  
  // Calculate timeline statistics
  const timelineStats = useMemo(() => {
    if (!startDate || !endDate) return null;
    
    const totalDays = differenceInDays(endDate, startDate);
    const workDays = Math.round(totalDays * 0.71); // Rough estimate
    const weeks = Math.ceil(totalDays / 7);
    const months = Math.round(totalDays / 30);
    
    const phases = projectData.stages ? [...new Set(projectData.stages.map(s => s.phase))].length : 0;
    const deliverables = projectData.stages ? projectData.stages.filter(s => s.is_deliverable).length : 0;
    
    return {
      totalDays,
      workDays,
      weeks,
      months,
      phases,
      deliverables,
      averageDaysPerPhase: phases > 0 ? Math.round(totalDays / phases) : 0,
      criticalPathLength: calculateProjectDuration
    };
  }, [startDate, endDate, projectData.stages, calculateProjectDuration]);
  
  // Timeline feasibility check
  const feasibilityCheck = useMemo(() => {
    if (!timelineStats) return null;
    
    const issues = [];
    const warnings = [];
    const suggestions = [];
    
    // Check if timeline is too aggressive
    if (bufferScenario === 'aggressive' || (bufferScenario === 'custom' && customBuffer < 15)) {
      warnings.push('Low buffer may increase risk of delays');
      suggestions.push('Consider adding more buffer time for unexpected issues');
    }
    
    // Check if timeline is too long
    if (timelineStats.months > 6) {
      warnings.push('Long project duration may affect team availability');
      suggestions.push('Consider breaking into phases or parallel work streams');
    }
    
    // Check milestone distribution
    const milestoneDensity = milestones.length / timelineStats.weeks;
    if (milestoneDensity < 0.5) {
      suggestions.push('Add more milestones for better progress tracking');
    } else if (milestoneDensity > 2) {
      warnings.push('Too many milestones may create overhead');
    }
    
    // Check for weekend/holiday conflicts
    const weekendMilestones = milestones.filter(m => isWeekend(new Date(m.date)));
    if (weekendMilestones.length > 0 && accountForWeekends) {
      warnings.push(`${weekendMilestones.length} milestone(s) fall on weekends`);
    }
    
    return {
      score: 100 - (issues.length * 20) - (warnings.length * 10),
      issues,
      warnings,
      suggestions,
      status: issues.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success'
    };
  }, [timelineStats, bufferScenario, customBuffer, milestones, accountForWeekends]);
  
  // Create visual timeline
  const renderVisualTimeline = () => {
    if (!startDate || !endDate) return null;
    
    const totalDays = differenceInDays(endDate, startDate);
    const weeks = Math.ceil(totalDays / 7);
    
    return (
      <div className="relative">
        {/* Timeline Bar */}
        <div className="relative h-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg overflow-hidden">
          {/* Phase blocks */}
          {projectData.stages && (
            <div className="absolute inset-0 flex">
              {Object.entries(
                projectData.stages.reduce((acc, stage) => {
                  if (!acc[stage.phase]) acc[stage.phase] = 0;
                  acc[stage.phase] += stage.duration || 0;
                  return acc;
                }, {})
              ).map(([phase, duration], index, array) => {
                const totalDuration = array.reduce((sum, [, d]) => sum + d, 0);
                const width = (duration / totalDuration) * 100;
                
                return (
                  <div
                    key={phase}
                    className="h-full flex items-center justify-center border-r border-white/50"
                    style={{ width: `${width}%` }}
                  >
                    <span className="text-xs font-medium text-blue-800 truncate px-2">
                      {phase}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Progress indicator */}
          <div className="absolute bottom-0 left-0 h-1 bg-blue-500" style={{ width: '0%' }} />
        </div>
        
        {/* Milestones */}
        <div className="relative mt-2">
          {milestones.map(milestone => {
            const position = (differenceInDays(new Date(milestone.date), startDate) / totalDays) * 100;
            
            return (
              <div
                key={milestone.id}
                className="absolute flex flex-col items-center"
                style={{ left: `${Math.min(Math.max(position, 0), 100)}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-0.5 h-6 bg-gray-400" />
                <div className="w-3 h-3 bg-white border-2 border-gray-600 rounded-full" />
                <div className="mt-1 text-xs text-gray-600 whitespace-nowrap">
                  {milestone.name}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Date labels */}
        <div className="flex justify-between mt-8 text-xs text-gray-600">
          <span>{format(startDate, 'MMM d, yyyy')}</span>
          <span>{format(endDate, 'MMM d, yyyy')}</span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Timeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>
            Configure project dates, milestones, and timeline optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={timelineView} onValueChange={setTimelineView}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Project Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP') : 'Select start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-sm text-gray-600 mt-1">
                    When will the project kick off?
                  </p>
                </div>
                
                <div>
                  <Label>Estimated End Date</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal"
                      disabled
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : 'Calculating...'}
                    </Button>
                    <Badge variant="secondary">Auto-calculated</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Based on stages and buffer settings
                  </p>
                </div>
              </div>
              
              {/* Visual Timeline */}
              {startDate && endDate && (
                <div>
                  <Label className="mb-3 block">Timeline Visualization</Label>
                  {renderVisualTimeline()}
                </div>
              )}
              
              {/* Timeline Statistics */}
              {timelineStats && (
                <div>
                  <Label className="mb-3 block">Timeline Breakdown</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-8 h-8 text-blue-500" />
                          <div>
                            <div className="text-2xl font-bold">{timelineStats.totalDays}</div>
                            <div className="text-xs text-gray-600">Total Days</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-8 h-8 text-green-500" />
                          <div>
                            <div className="text-2xl font-bold">{timelineStats.workDays}</div>
                            <div className="text-xs text-gray-600">Work Days</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <CalendarRange className="w-8 h-8 text-purple-500" />
                          <div>
                            <div className="text-2xl font-bold">{timelineStats.weeks}</div>
                            <div className="text-xs text-gray-600">Weeks</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-8 h-8 text-orange-500" />
                          <div>
                            <div className="text-2xl font-bold">{timelineStats.deliverables}</div>
                            <div className="text-xs text-gray-600">Deliverables</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="milestones" className="space-y-6">
              {/* Milestones Management */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Project Milestones</Label>
                  <Button
                    size="sm"
                    onClick={() => setShowMilestoneDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {milestones.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Milestone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No milestones added yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => generateDefaultMilestones(startDate, endDate)}
                        >
                          Generate Default Milestones
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    milestones.map(milestone => (
                      <Card key={milestone.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {milestone.type === 'meeting' && <Users className="w-5 h-5 text-blue-500" />}
                              {milestone.type === 'deliverable' && <Package className="w-5 h-5 text-green-500" />}
                              {milestone.type === 'presentation' && <Target className="w-5 h-5 text-purple-500" />}
                              {milestone.type === 'review' && <BarChart3 className="w-5 h-5 text-orange-500" />}
                              
                              <div>
                                <div className="font-medium">{milestone.name}</div>
                                <div className="text-sm text-gray-600">
                                  {format(new Date(milestone.date), 'PPP')}
                                  {isWeekend(new Date(milestone.date)) && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Weekend
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMilestone(milestone.id)}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="optimization" className="space-y-6">
              {/* Buffer Settings */}
              <div>
                <Label className="mb-3 block">Buffer Strategy</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(TIMELINE_SCENARIOS).map(([key, scenario]) => (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all ${
                        bufferScenario === key ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setBufferScenario(key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{scenario.name}</div>
                            <div className="text-sm text-gray-600">{scenario.description}</div>
                          </div>
                          <Badge variant={bufferScenario === key ? 'default' : 'outline'}>
                            {key === 'custom' ? `${customBuffer}%` : `${scenario.bufferPercent}%`}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {bufferScenario === 'custom' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <Label>Custom Buffer Percentage</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Slider
                        value={[customBuffer]}
                        onValueChange={([value]) => setCustomBuffer(value)}
                        min={0}
                        max={50}
                        step={5}
                        className="flex-1"
                      />
                      <span className="font-medium w-12 text-right">{customBuffer}%</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Optimization Settings */}
              <div>
                <Label className="mb-3 block">Timeline Optimization</Label>
                <div className="space-y-3">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Account for Weekends</div>
                          <div className="text-sm text-gray-600">
                            Exclude weekends from work days calculation
                          </div>
                        </div>
                        <Switch
                          checked={accountForWeekends}
                          onCheckedChange={setAccountForWeekends}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Account for Holidays</div>
                          <div className="text-sm text-gray-600">
                            Factor in major holidays and office closures
                          </div>
                        </div>
                        <Switch
                          checked={accountForHolidays}
                          onCheckedChange={setAccountForHolidays}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Parallel Work Optimization</div>
                          <div className="text-sm text-gray-600">
                            Allow stages within phases to run in parallel
                          </div>
                        </div>
                        <Switch
                          checked={parallelOptimization}
                          onCheckedChange={setParallelOptimization}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Feasibility Check */}
      {feasibilityCheck && (
        <Card className={`border-2 ${
          feasibilityCheck.status === 'error' ? 'border-red-200 bg-red-50' :
          feasibilityCheck.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
          'border-green-200 bg-green-50'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {feasibilityCheck.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {feasibilityCheck.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
              {feasibilityCheck.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              Timeline Feasibility Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Feasibility Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Feasibility Score</span>
                  <span className="text-sm font-bold">{feasibilityCheck.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      feasibilityCheck.score >= 80 ? 'bg-green-500' :
                      feasibilityCheck.score >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${feasibilityCheck.score}%` }}
                  />
                </div>
              </div>
              
              {/* Issues and Warnings */}
              {feasibilityCheck.issues.length > 0 && (
                <div>
                  <Label className="text-red-600 mb-2 block">Issues</Label>
                  <div className="space-y-1">
                    {feasibilityCheck.issues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <X className="w-4 h-4 text-red-500 mt-0.5" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {feasibilityCheck.warnings.length > 0 && (
                <div>
                  <Label className="text-yellow-600 mb-2 block">Warnings</Label>
                  <div className="space-y-1">
                    {feasibilityCheck.warnings.map((warning, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {feasibilityCheck.suggestions.length > 0 && (
                <div>
                  <Label className="text-blue-600 mb-2 block">Suggestions</Label>
                  <div className="space-y-1">
                    {feasibilityCheck.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Add Milestone Dialog */}
      <Dialog open={showMilestoneDialog} onOpenChange={setShowMilestoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription>
              Add a key checkpoint or deliverable to the project timeline.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Milestone Name</Label>
              <Input
                placeholder="e.g., Design Review"
                value={newMilestone.name}
                onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newMilestone.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newMilestone.date ? format(new Date(newMilestone.date), 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newMilestone.date ? new Date(newMilestone.date) : undefined}
                    onSelect={(date) => setNewMilestone({ ...newMilestone, date: date?.toISOString() })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Type</Label>
              <Select
                value={newMilestone.type}
                onValueChange={(value) => setNewMilestone({ ...newMilestone, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="deliverable">Deliverable</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMilestoneDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMilestone}>
              Add Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}