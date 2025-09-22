import React, { useState, useEffect, useMemo } from 'react';
import { useProjectInit } from '@/pages/ProjectInitiation';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, addDays, addWeeks, parseISO } from 'date-fns';
import { 
  Calendar as CalendarIcon,
  Lock,
  Unlock,
  AlertCircle,
  Info,
  ChevronRight,
  Circle,
  Star,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { playbookData } from '@/components/admin/PlaybookData';

// Categories for grouping stages
const CATEGORIES = {
  onboarding: { name: 'Onboarding', color: 'bg-gray-100 text-gray-700' },
  research: { name: 'Research', color: 'bg-purple-100 text-purple-700' },
  strategy: { name: 'Strategy', color: 'bg-blue-100 text-blue-700' },
  brand_building: { name: 'Brand Building', color: 'bg-green-100 text-green-700' },
  brand_collaterals: { name: 'Brand Collaterals', color: 'bg-yellow-100 text-yellow-700' },
  brand_activation: { name: 'Brand Activation', color: 'bg-red-100 text-red-700' }
};

export default function TimelineReview() {
  const { projectData, updateProjectData } = useProjectInit();
  const [stages, setStages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMilestones, setSelectedMilestones] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Load stages and calculate timeline
  useEffect(() => {
    loadAndCalculateTimeline();
  }, [projectData.startDate]);
  
  const loadAndCalculateTimeline = async () => {
    if (!projectData.startDate) return;
    
    try {
      setIsLoading(true);
      
      // Use the 104 stages template from PlaybookData (not from database)
      // This ensures clean stages for new projects
      const allStages = playbookData.map((stage, index) => ({
        ...stage,
        id: `stage_${index}`,
        status: 'not_started'
      }));
      
      // Calculate dates for each stage based on dependencies and start date
      const startDate = parseISO(projectData.startDate);
      const calculatedStages = calculateStageDates(allStages, startDate, projectData.milestoneOverrides || {});
      
      setStages(calculatedStages);
      
      // Auto-select key milestones (deliverables)
      const keyMilestones = calculatedStages
        .filter(s => s.is_deliverable)
        .slice(0, 10) // Show first 10 deliverables
        .map(s => s.id);
      setSelectedMilestones(keyMilestones);
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate dates for stages based on dependencies
  const calculateStageDates = (stageList, startDate, overrides) => {
    const stagesWithDates = [...stageList];
    const stageMap = new Map(stagesWithDates.map(s => [s.id, s]));
    
    // Simple date calculation - each stage takes estimated duration or default 3 days
    let currentDate = startDate;
    
    stagesWithDates.forEach((stage, index) => {
      // Check if there's an override for this stage
      const override = overrides[stage.id];
      
      if (override?.date) {
        // Use overridden date
        stage.calculatedStartDate = parseISO(override.date);
        stage.isLocked = override.locked || false;
      } else {
        // Calculate based on dependencies or sequential order
        if (stage.dependencies && stage.dependencies.length > 0) {
          // Find latest dependency end date
          let latestDepDate = startDate;
          stage.dependencies.forEach(depId => {
            const depStage = stageMap.get(depId);
            if (depStage?.calculatedEndDate) {
              if (depStage.calculatedEndDate > latestDepDate) {
                latestDepDate = depStage.calculatedEndDate;
              }
            }
          });
          stage.calculatedStartDate = addDays(latestDepDate, 1);
        } else {
          // No dependencies, use sequential timing
          stage.calculatedStartDate = currentDate;
        }
        
        // Calculate end date based on duration
        const duration = stage.estimated_duration || 3;
        stage.calculatedEndDate = addDays(stage.calculatedStartDate, duration);
        
        // Update current date for next stage
        currentDate = addDays(stage.calculatedEndDate, 1);
      }
    });
    
    return stagesWithDates;
  };
  
  // Group stages by category
  const stagesByCategory = useMemo(() => {
    const grouped = {};
    Object.keys(CATEGORIES).forEach(cat => {
      grouped[cat] = stages.filter(s => s.category === cat);
    });
    return grouped;
  }, [stages]);
  
  // Get project end date
  const projectEndDate = useMemo(() => {
    if (stages.length === 0) return null;
    const dates = stages.map(s => s.calculatedEndDate || s.calculatedStartDate);
    return new Date(Math.max(...dates.map(d => d?.getTime() || 0)));
  }, [stages]);
  
  // Get project duration in weeks
  const projectDuration = useMemo(() => {
    if (!projectData.startDate || !projectEndDate) return 0;
    const start = parseISO(projectData.startDate);
    const diffTime = Math.abs(projectEndDate - start);
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  }, [projectData.startDate, projectEndDate]);
  
  // Override a milestone date
  const overrideMilestone = (stageId, newDate, locked = false) => {
    const overrides = { ...projectData.milestoneOverrides };
    overrides[stageId] = { date: newDate.toISOString(), locked };
    updateProjectData({ milestoneOverrides: overrides });
    
    // Recalculate timeline
    loadAndCalculateTimeline();
  };
  
  // Remove override
  const removeOverride = (stageId) => {
    const overrides = { ...projectData.milestoneOverrides };
    delete overrides[stageId];
    updateProjectData({ milestoneOverrides: overrides });
    
    // Recalculate timeline
    loadAndCalculateTimeline();
  };
  
  if (!projectData.startDate) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please set a project start date in Step 1 to view the timeline
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Timeline Review</h2>
        <p className="mt-1 text-sm text-gray-600">
          Review the auto-calculated timeline and adjust key milestones if needed
        </p>
      </div>
      
      {/* Project Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Start Date</div>
            <div className="text-lg font-semibold">
              {format(parseISO(projectData.startDate), 'MMM d, yyyy')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Expected End</div>
            <div className="text-lg font-semibold">
              {projectEndDate ? format(projectEndDate, 'MMM d, yyyy') : 'Calculating...'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Duration</div>
            <div className="text-lg font-semibold">
              ~{projectDuration} weeks
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Dates are calculated based on the 104-step playbook with dependencies. 
          You can override specific milestone dates below if needed.
        </AlertDescription>
      </Alert>
      
      {/* Timeline by Category */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Project Phases</h3>
        
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Calculating timeline...
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(stagesByCategory).map(([category, categoryStages]) => {
              if (categoryStages.length === 0) return null;
              
              const isExpanded = expandedCategory === category;
              const firstStage = categoryStages[0];
              const lastStage = categoryStages[categoryStages.length - 1];
              const deliverables = categoryStages.filter(s => s.is_deliverable);
              
              return (
                <Card key={category}>
                  <CardContent className="p-4">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={CATEGORIES[category].color}>
                            {CATEGORIES[category].name}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {categoryStages.length} stages · {deliverables.length} deliverables
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            {firstStage.calculatedStartDate && 
                              format(firstStage.calculatedStartDate, 'MMM d')}
                            {' - '}
                            {lastStage.calculatedEndDate && 
                              format(lastStage.calculatedEndDate, 'MMM d, yyyy')}
                          </div>
                          <ChevronRight 
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </div>
                    </button>
                    
                    {/* Expanded Content - Key Milestones */}
                    {isExpanded && (
                      <div className="mt-4 space-y-2 border-t pt-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Key Milestones
                        </div>
                        {deliverables.slice(0, 5).map(stage => {
                          const hasOverride = projectData.milestoneOverrides?.[stage.id];
                          
                          return (
                            <div key={stage.id} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm font-medium">{stage.name}</span>
                                {hasOverride && (
                                  <Badge variant="outline" className="text-xs">
                                    {hasOverride.locked ? (
                                      <>
                                        <Lock className="w-3 h-3 mr-1" />
                                        Locked
                                      </>
                                    ) : (
                                      'Modified'
                                    )}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-xs">
                                      <CalendarIcon className="w-3 h-3 mr-1" />
                                      {stage.calculatedStartDate && 
                                        format(stage.calculatedStartDate, 'MMM d, yyyy')}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                      mode="single"
                                      selected={stage.calculatedStartDate}
                                      onSelect={(date) => date && overrideMilestone(stage.id, date)}
                                      initialFocus
                                    />
                                    {hasOverride && (
                                      <div className="p-3 border-t space-y-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => overrideMilestone(
                                            stage.id, 
                                            stage.calculatedStartDate, 
                                            !hasOverride.locked
                                          )}
                                          className="w-full text-xs"
                                        >
                                          {hasOverride.locked ? (
                                            <>
                                              <Unlock className="w-3 h-3 mr-1" />
                                              Unlock Date
                                            </>
                                          ) : (
                                            <>
                                              <Lock className="w-3 h-3 mr-1" />
                                              Lock Date
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeOverride(stage.id)}
                                          className="w-full text-xs"
                                        >
                                          Reset to Auto
                                        </Button>
                                      </div>
                                    )}
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          );
                        })}
                        {deliverables.length > 5 && (
                          <div className="text-xs text-gray-500 pt-2">
                            +{deliverables.length - 5} more deliverables
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Critical Path Summary */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Critical Path</h4>
              <p className="text-sm text-yellow-800 mt-1">
                The project has {stages.filter(s => s.dependencies?.length > 0).length} dependent stages. 
                Changes to early milestones will cascade to later stages automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}