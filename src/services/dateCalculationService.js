/**
 * Date Calculation Service
 * Calculates stage start/end dates based on dependencies and durations
 */

import { addDays, max, parseISO, startOfDay } from 'date-fns';

class DateCalculationService {
  /**
   * Calculate dates for all stages based on dependencies
   * @param {Array} stages - Array of stages with dependencies
   * @param {Date} projectStartDate - Project start date
   * @returns {Array} Stages with calculated start_date and end_date
   */
  calculateProjectSchedule(stages, projectStartDate = new Date()) {
    // Create a map for quick lookup
    const stageMap = new Map(stages.map(s => [s.id, { ...s }]));
    const calculatedDates = new Map();
    const visitedStages = new Set();
    
    // Topological sort to process stages in dependency order
    const sortedStages = this.topologicalSort(stages);
    
    // Calculate dates for each stage
    sortedStages.forEach(stage => {
      const { startDate, endDate } = this.calculateStageDates(
        stage,
        stageMap,
        calculatedDates,
        projectStartDate
      );
      
      calculatedDates.set(stage.id, { startDate, endDate });
      
      // Update the stage with calculated dates
      stage.start_date = startDate.toISOString();
      stage.end_date = endDate.toISOString();
    });
    
    return sortedStages;
  }
  
  /**
   * Calculate dates for a single stage based on its dependencies
   */
  calculateStageDates(stage, stageMap, calculatedDates, projectStartDate) {
    // Get estimated duration (default 3 days if not specified)
    const duration = stage.estimated_duration || this.getDefaultDuration(stage);
    
    // If no dependencies, start at project start date or based on logical sequence
    if (!stage.dependencies || stage.dependencies.length === 0) {
      // For stages with no dependencies, space them out more intelligently
      // First few stages (onboarding) can start immediately
      if (stage.category === 'onboarding' && stage.number_index <= 5) {
        const startDate = addDays(startOfDay(projectStartDate), Math.max(0, stage.number_index - 1));
        const endDate = addDays(startDate, duration - 1);
        return { startDate, endDate };
      }
      
      // Later phases should start later to allow proper sequencing
      let phaseOffset = 0;
      if (stage.category === 'research') phaseOffset = 14;
      else if (stage.category === 'strategy') phaseOffset = 45;
      else if (stage.category === 'brand_building') phaseOffset = 70;
      else if (stage.category === 'brand_collaterals') phaseOffset = 100;
      else if (stage.category === 'brand_activation') phaseOffset = 120;
      
      // Add some spacing within the phase
      const withinPhaseOffset = Math.floor((stage.number_index - 1) / 10) * 3;
      const startDate = addDays(startOfDay(projectStartDate), phaseOffset + withinPhaseOffset);
      const endDate = addDays(startDate, duration - 1);
      return { startDate, endDate };
    }
    
    // Calculate based on dependencies
    const dependencyEndDates = [];
    stage.dependencies.forEach(depId => {
      const depDates = calculatedDates.get(depId);
      if (depDates) {
        dependencyEndDates.push(depDates.endDate);
      } else {
        // If dependency not calculated yet, use a default
        const depStage = stageMap.get(depId);
        if (depStage) {
          const depCalc = this.calculateStageDates(depStage, stageMap, calculatedDates, projectStartDate);
          calculatedDates.set(depId, depCalc);
          dependencyEndDates.push(depCalc.endDate);
        }
      }
    });
    
    // Start after all dependencies complete (with configurable buffer)
    const bufferDays = this.getBufferDays(stage);
    const startDate = dependencyEndDates.length > 0
      ? addDays(max(dependencyEndDates), bufferDays)
      : startOfDay(projectStartDate);
      
    const endDate = addDays(startDate, duration - 1);
    
    return { startDate, endDate };
  }
  
  /**
   * Get default duration based on stage type
   */
  getDefaultDuration(stage) {
    // Deliverables typically take longer
    if (stage.is_deliverable) {
      // Key deliverables take more time
      if (stage.name?.includes('Strategy') || stage.name?.includes('Brand')) {
        return 7;
      }
      return 5;
    }
    
    // Internal tasks are usually quicker
    if (stage.category === 'onboarding') {
      return 2;
    }
    
    // Research and strategy phases take longer
    if (stage.category === 'research' || stage.category === 'strategy') {
      return 5;
    }
    
    // Default duration
    return 3;
  }
  
  /**
   * Get buffer days between dependent tasks
   */
  getBufferDays(stage) {
    // Deliverables need more buffer for review and approval
    if (stage.is_deliverable) {
      return 2;
    }
    
    // Phase transitions need more time
    if (stage.category !== this.previousCategory) {
      this.previousCategory = stage.category;
      return 3;
    }
    
    // External tasks need buffer for client response
    if (stage.type === 'External') {
      return 2;
    }
    
    // Critical tasks need immediate follow-up
    if (stage.blocking_priority === 'critical') {
      return 1;
    }
    
    // Default buffer
    return 1;
  }
  
  /**
   * Topological sort to process stages in dependency order
   */
  topologicalSort(stages) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();
    
    // Build adjacency list
    const graph = new Map();
    stages.forEach(stage => {
      graph.set(stage.id, stage.dependencies || []);
    });
    
    // DFS helper
    const visit = (stageId) => {
      if (visited.has(stageId)) return;
      if (visiting.has(stageId)) {
        console.warn('Circular dependency detected at stage:', stageId);
        return;
      }
      
      visiting.add(stageId);
      
      const deps = graph.get(stageId) || [];
      deps.forEach(depId => visit(depId));
      
      visiting.delete(stageId);
      visited.add(stageId);
      
      const stage = stages.find(s => s.id === stageId);
      if (stage) sorted.push(stage);
    };
    
    // Visit all stages
    stages.forEach(stage => visit(stage.id));
    
    return sorted;
  }
  
  /**
   * Recalculate dates when a stage changes
   */
  recalculateDownstream(stageId, newStartDate, newEndDate, stages) {
    const stageMap = new Map(stages.map(s => [s.id, s]));
    const updatedStages = [];
    const visited = new Set();
    
    const recalculate = (id, adjustment) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      // Find all stages that depend on this one
      const dependents = stages.filter(s => 
        s.dependencies && s.dependencies.includes(id)
      );
      
      dependents.forEach(dependent => {
        const oldStart = parseISO(dependent.start_date);
        const oldEnd = parseISO(dependent.end_date);
        const duration = Math.ceil((oldEnd - oldStart) / (1000 * 60 * 60 * 24)) + 1;
        
        // Calculate new dates
        const parentEnd = id === stageId ? newEndDate : parseISO(stageMap.get(id).end_date);
        const newStart = addDays(parentEnd, 1);
        const newEnd = addDays(newStart, duration - 1);
        
        // Update the stage
        dependent.start_date = newStart.toISOString();
        dependent.end_date = newEnd.toISOString();
        
        updatedStages.push({
          id: dependent.id,
          name: dependent.name,
          oldStart,
          oldEnd,
          newStart,
          newEnd,
          adjustment: Math.ceil((newStart - oldStart) / (1000 * 60 * 60 * 24))
        });
        
        // Recursively update further dependents
        recalculate(dependent.id, adjustment);
      });
    };
    
    // Start the cascade
    const stage = stageMap.get(stageId);
    if (stage) {
      stage.start_date = newStartDate.toISOString();
      stage.end_date = newEndDate.toISOString();
      recalculate(stageId, 0);
    }
    
    return updatedStages;
  }
}

// Export singleton instance
const dateCalculationService = new DateCalculationService();
export default dateCalculationService;