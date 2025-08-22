/**
 * Dependency Engine Service
 * Core logic for managing stage dependencies, cascading changes, and impact analysis
 */

import { differenceInDays, addDays, max, min, isAfter, isBefore, isEqual, parseISO, format } from 'date-fns';

class DependencyEngine {
  constructor() {
    this.stages = [];
    this.dependencies = new Map(); // stageId -> [dependencyIds]
    this.dependents = new Map(); // stageId -> [dependentIds]
    this.criticalPath = [];
    this.bufferDays = 1; // Default buffer between dependent stages
  }

  /**
   * Initialize the engine with stages data
   */
  initialize(stages) {
    // Store stages with original field names but ensure consistency
    this.stages = stages.map(stage => ({
      ...stage,
      // Ensure dates are properly normalized
      start_date: stage.start_date || stage.start_date,
      end_date: stage.end_date || stage.end_date,
      dependencies: stage.dependencies || [],
      parallel_tracks: stage.parallel_tracks || []
    }));
    this.buildDependencyMaps(this.stages);
    this.calculateCriticalPath();
  }

  /**
   * Build bidirectional dependency maps for efficient traversal
   */
  buildDependencyMaps(stages) {
    this.dependencies.clear();
    this.dependents.clear();

    stages.forEach(stage => {
      const stageId = stage.id;
      const deps = stage.dependencies || [];
      
      this.dependencies.set(stageId, deps);
      
      // Build reverse map (dependents)
      deps.forEach(depId => {
        if (!this.dependents.has(depId)) {
          this.dependents.set(depId, []);
        }
        this.dependents.get(depId).push(stageId);
      });
    });
  }

  /**
   * Calculate the cascade effect of changing a stage's dates
   * @returns {Object} Impact analysis with affected stages and conflicts
   */
  calculateCascadeEffect(stageId, newStartDate, newEndDate) {
    const stage = this.stages.find(s => s.id === stageId);
    if (!stage) return { affected: [], conflicts: [], valid: false };

    const originalStart = typeof stage.start_date === 'string' ? parseISO(stage.start_date) : new Date(stage.start_date);
    const originalEnd = typeof stage.end_date === 'string' ? parseISO(stage.end_date) : new Date(stage.end_date);
    const newStart = typeof newStartDate === 'string' ? parseISO(newStartDate) : newStartDate;
    const newEnd = typeof newEndDate === 'string' ? parseISO(newEndDate) : newEndDate;

    const dayShift = differenceInDays(newStart, originalStart);
    const durationChange = differenceInDays(newEnd, newStart) - differenceInDays(originalEnd, originalStart);

    const affected = [];
    const conflicts = [];
    const visited = new Set();

    // Check if dependencies allow this change
    const dependencyViolations = this.checkDependencyViolations(stageId, newStart, newEnd);
    if (dependencyViolations.length > 0) {
      conflicts.push(...dependencyViolations);
    }

    // Calculate downstream impacts (stages that depend on this one)
    this.cascadeDownstream(stageId, dayShift, durationChange, affected, conflicts, visited);

    // Calculate upstream impacts if moving earlier
    if (dayShift < 0) {
      this.cascadeUpstream(stageId, newStart, affected, conflicts, visited);
    }

    // Check for resource conflicts
    const resourceConflicts = this.detectResourceConflicts(affected);
    conflicts.push(...resourceConflicts);

    // Check for deadline violations
    const deadlineViolations = this.checkDeadlineViolations(affected);
    conflicts.push(...deadlineViolations);

    return {
      affected: affected.filter(a => a.stageId !== stageId),
      conflicts,
      valid: conflicts.length === 0,
      summary: this.generateImpactSummary(affected, conflicts)
    };
  }

  /**
   * Check if moving a stage violates its dependencies
   */
  checkDependencyViolations(stageId, newStart, newEnd) {
    const violations = [];
    const deps = this.dependencies.get(stageId) || [];
    
    deps.forEach(depId => {
      const dependency = this.stages.find(s => s.id === depId);
      if (!dependency) return;

      const depEnd = typeof dependency.end_date === 'string' ? parseISO(dependency.end_date) : new Date(dependency.end_date);
      
      // Check if new start is before dependency end (with buffer)
      const requiredStart = addDays(depEnd, this.bufferDays);
      if (isBefore(newStart, requiredStart)) {
        violations.push({
          type: 'dependency_violation',
          severity: 'high',
          stageId,
          dependencyId: depId,
          message: `Cannot start before ${dependency.name} completes (${format(requiredStart, 'MMM d')})`
        });
      }
    });

    return violations;
  }

  /**
   * Cascade changes downstream (to dependent stages)
   */
  cascadeDownstream(stageId, dayShift, durationChange, affected, conflicts, visited) {
    if (visited.has(stageId)) return;
    visited.add(stageId);

    const stage = this.stages.find(s => s.id === stageId);
    const dependents = this.dependents.get(stageId) || [];
    
    dependents.forEach(depId => {
      const dependent = this.stages.find(s => s.id === depId);
      if (!dependent) return;

      const depStart = typeof dependent.start_date === 'string' ? parseISO(dependent.start_date) : dependent.start_date;
      const depEnd = typeof dependent.end_date === 'string' ? parseISO(dependent.end_date) : dependent.end_date;
      
      // Calculate required adjustment
      const stageEnd = typeof stage.end_date === 'string' ? parseISO(stage.end_date) : stage.end_date;
      const newStageEnd = addDays(stageEnd, dayShift + durationChange);
      const requiredStart = addDays(newStageEnd, this.bufferDays);
      
      if (isAfter(requiredStart, depStart)) {
        const adjustment = differenceInDays(requiredStart, depStart);
        const newDepStart = requiredStart;
        const newDepEnd = addDays(depEnd, adjustment);
        
        affected.push({
          stageId: depId,
          stageName: dependent.name,
          stage: dependent, // Include full stage data
          originalStart: depStart,
          originalEnd: depEnd,
          newStart: newDepStart,
          newEnd: newDepEnd,
          adjustment,
          reason: `Cascaded from ${stage.name}`
        });

        // Recursively cascade to further dependents
        this.cascadeDownstream(depId, adjustment, 0, affected, conflicts, visited);
      }
    });
  }

  /**
   * Cascade changes upstream (to dependencies) if moving earlier
   */
  cascadeUpstream(stageId, newStart, affected, conflicts, visited) {
    const deps = this.dependencies.get(stageId) || [];
    
    deps.forEach(depId => {
      if (visited.has(depId)) return;
      
      const dependency = this.stages.find(s => s.id === depId);
      if (!dependency) return;

      const depEnd = typeof dependency.end_date === 'string' ? parseISO(dependency.end_date) : new Date(dependency.end_date);
      const requiredEnd = addDays(newStart, -this.bufferDays);
      
      if (isAfter(depEnd, requiredEnd)) {
        // Dependency needs to finish earlier
        const adjustment = differenceInDays(requiredEnd, depEnd);
        const depStart = typeof dependency.start_date === 'string' ? parseISO(dependency.start_date) : new Date(dependency.start_date);
        const duration = differenceInDays(depEnd, depStart);
        const newDepStart = addDays(depStart, adjustment);
        const newDepEnd = requiredEnd;
        
        // Check if this is possible
        if (duration > differenceInDays(newDepEnd, newDepStart)) {
          conflicts.push({
            type: 'compression_conflict',
            severity: 'high',
            stageId: depId,
            message: `${dependency.name} cannot be compressed enough to accommodate change`
          });
        } else {
          affected.push({
            stageId: depId,
            stageName: dependency.name,
            stage: dependency, // Include full stage data
            originalStart: depStart,
            originalEnd: depEnd,
            newStart: newDepStart,
            newEnd: newDepEnd,
            adjustment,
            reason: 'Pulled earlier by dependent stage'
          });
        }
      }
    });
  }

  /**
   * Detect resource conflicts (team member double-booking)
   */
  detectResourceConflicts(affected) {
    const conflicts = [];
    const resourceSchedule = new Map();

    // Build resource schedule including affected changes
    [...this.stages, ...affected].forEach(item => {
      const stage = item.stageId ? 
        { ...this.stages.find(s => s.id === item.stageId), 
          start_date: item.newStart, 
          end_date: item.newEnd } : 
        item;
      
      if (!stage.assigned_to) return;
      
      if (!resourceSchedule.has(stage.assigned_to)) {
        resourceSchedule.set(stage.assigned_to, []);
      }
      
      resourceSchedule.get(stage.assigned_to).push({
        stageId: stage.id,
        stageName: stage.name,
        start: typeof stage.start_date === 'string' ? parseISO(stage.start_date) : stage.start_date,
        end: typeof stage.end_date === 'string' ? parseISO(stage.end_date) : stage.end_date
      });
    });

    // Check for overlaps
    resourceSchedule.forEach((schedule, resource) => {
      for (let i = 0; i < schedule.length; i++) {
        for (let j = i + 1; j < schedule.length; j++) {
          const a = schedule[i];
          const b = schedule[j];
          
          if (this.hasOverlap(a.start, a.end, b.start, b.end)) {
            conflicts.push({
              type: 'resource_conflict',
              severity: 'medium',
              resource,
              stages: [a.stageName, b.stageName],
              message: `${resource} is double-booked between "${a.stageName}" and "${b.stageName}"`
            });
          }
        }
      }
    });

    return conflicts;
  }

  /**
   * Check for project deadline violations
   */
  checkDeadlineViolations(affected) {
    const violations = [];
    const projectDeadline = this.getProjectDeadline();
    
    if (!projectDeadline) return violations;

    affected.forEach(item => {
      if (isAfter(item.newEnd, projectDeadline)) {
        violations.push({
          type: 'deadline_violation',
          severity: 'critical',
          stageId: item.stageId,
          stageName: item.stageName,
          message: `${item.stageName} would exceed project deadline (${format(projectDeadline, 'MMM d, yyyy')})`
        });
      }
    });

    return violations;
  }

  /**
   * Calculate the critical path through the project
   */
  calculateCriticalPath() {
    const startNodes = this.stages.filter(s => 
      !s.dependencies || s.dependencies.length === 0
    );

    let longestPath = [];
    let maxDuration = 0;

    startNodes.forEach(start => {
      const path = this.findLongestPath(start.id, []);
      const duration = this.calculatePathDuration(path);
      
      if (duration > maxDuration) {
        maxDuration = duration;
        longestPath = path;
      }
    });

    this.criticalPath = longestPath;
    return longestPath;
  }

  /**
   * Find longest path from a given stage (DFS)
   */
  findLongestPath(stageId, currentPath) {
    currentPath = [...currentPath, stageId];
    const dependents = this.dependents.get(stageId) || [];
    
    if (dependents.length === 0) {
      return currentPath;
    }

    let longestSubPath = [];
    let maxLength = 0;

    dependents.forEach(depId => {
      const subPath = this.findLongestPath(depId, currentPath);
      if (subPath.length > maxLength) {
        maxLength = subPath.length;
        longestSubPath = subPath;
      }
    });

    return longestSubPath;
  }

  /**
   * Calculate total duration of a path
   */
  calculatePathDuration(path) {
    if (path.length === 0) return 0;

    const stages = path.map(id => this.stages.find(s => s.id === id)).filter(Boolean);
    if (stages.length === 0) return 0;

    const firstStart = typeof stages[0].start_date === 'string' ? parseISO(stages[0].start_date) : stages[0].start_date;
    const lastEnd = typeof stages[stages.length - 1].end_date === 'string' ? parseISO(stages[stages.length - 1].end_date) : stages[stages.length - 1].end_date;
    
    return differenceInDays(lastEnd, firstStart);
  }

  /**
   * Check if a stage is on the critical path
   */
  isOnCriticalPath(stageId) {
    return this.criticalPath.includes(stageId);
  }

  /**
   * Get optimal schedule suggestion
   */
  suggestOptimalSchedule(constraints = {}) {
    const suggestions = [];
    const { targetEndDate, maxResourceLoad, priorityStages } = constraints;

    // Analyze current schedule
    const bottlenecks = this.identifyBottlenecks();
    const underutilizedPeriods = this.findUnderutilizedPeriods();

    // Generate suggestions
    bottlenecks.forEach(bottleneck => {
      suggestions.push({
        type: 'bottleneck_resolution',
        stage: bottleneck.stage,
        suggestion: `Consider parallelizing ${bottleneck.stage.name} with other stages or adding resources`,
        impact: 'high'
      });
    });

    underutilizedPeriods.forEach(period => {
      suggestions.push({
        type: 'resource_optimization',
        period,
        suggestion: `Move non-critical stages to ${format(period.start, 'MMM d')} - ${format(period.end, 'MMM d')}`,
        impact: 'medium'
      });
    });

    return suggestions;
  }

  /**
   * Identify schedule bottlenecks
   */
  identifyBottlenecks() {
    const bottlenecks = [];
    
    this.stages.forEach(stage => {
      const dependents = this.dependents.get(stage.id) || [];
      
      if (dependents.length > 3) { // Many stages waiting on this one
        bottlenecks.push({
          stage,
          dependentCount: dependents.length,
          type: 'high_dependency'
        });
      }
      
      if (this.isOnCriticalPath(stage.id) && stage.estimated_duration > 7) {
        bottlenecks.push({
          stage,
          duration: stage.estimated_duration,
          type: 'critical_path_duration'
        });
      }
    });

    return bottlenecks;
  }

  /**
   * Find periods with low resource utilization
   */
  findUnderutilizedPeriods() {
    const periods = [];
    const resourceLoad = this.calculateResourceLoad();
    
    // Find periods with < 50% resource utilization
    const averageLoad = resourceLoad.reduce((sum, load) => sum + load.count, 0) / resourceLoad.length;
    
    resourceLoad.forEach(load => {
      if (load.count < averageLoad * 0.5) {
        periods.push({
          start: load.date,
          end: addDays(load.date, 7),
          utilization: load.count / averageLoad
        });
      }
    });

    return periods;
  }

  /**
   * Calculate resource load over time
   */
  calculateResourceLoad() {
    const load = [];
    const projectStart = this.getProjectStart();
    const projectEnd = this.getProjectEnd();
    
    if (!projectStart || !projectEnd) return load;

    let current = projectStart;
    while (isBefore(current, projectEnd)) {
      const count = this.stages.filter(stage => {
        const start = typeof stage.start_date === 'string' ? parseISO(stage.start_date) : stage.start_date;
        const end = typeof stage.end_date === 'string' ? parseISO(stage.end_date) : stage.end_date;
        return isAfter(current, start) && isBefore(current, end);
      }).length;

      load.push({ date: current, count });
      current = addDays(current, 1);
    }

    return load;
  }

  /**
   * Generate human-readable impact summary
   */
  generateImpactSummary(affected, conflicts) {
    const summary = {
      totalAffected: affected.length,
      criticalPathImpact: affected.some(a => this.isOnCriticalPath(a.stageId)),
      maxDelay: Math.max(...affected.map(a => a.adjustment || 0)),
      conflictCount: conflicts.length,
      severity: this.calculateOverallSeverity(conflicts)
    };

    summary.message = this.buildSummaryMessage(summary);
    return summary;
  }

  /**
   * Calculate overall severity of conflicts
   */
  calculateOverallSeverity(conflicts) {
    if (conflicts.some(c => c.severity === 'critical')) return 'critical';
    if (conflicts.some(c => c.severity === 'high')) return 'high';
    if (conflicts.some(c => c.severity === 'medium')) return 'medium';
    return 'low';
  }

  /**
   * Build summary message
   */
  buildSummaryMessage(summary) {
    if (summary.conflictCount > 0) {
      return `This change would cause ${summary.conflictCount} conflict(s) and affect ${summary.totalAffected} other stage(s).`;
    }
    
    if (summary.totalAffected > 0) {
      return `This change would cascade to ${summary.totalAffected} stage(s), potentially delaying the project by ${summary.maxDelay} day(s).`;
    }
    
    return 'This change can be made without affecting other stages.';
  }

  /**
   * Utility functions
   */
  hasOverlap(start1, end1, start2, end2) {
    return isBefore(start1, end2) && isAfter(end1, start2);
  }

  getProjectStart() {
    const starts = this.stages.map(s => typeof s.start_date === 'string' ? parseISO(s.start_date) : s.start_date);
    return starts.length > 0 ? min(starts) : null;
  }

  getProjectEnd() {
    const ends = this.stages.map(s => typeof s.end_date === 'string' ? parseISO(s.end_date) : s.end_date);
    return ends.length > 0 ? max(ends) : null;
  }

  getProjectDeadline() {
    // This would come from project settings
    // For now, return project end + 30 days
    const projectEnd = this.getProjectEnd();
    return projectEnd ? addDays(projectEnd, 30) : null;
  }
}

// Export singleton instance
const dependencyEngine = new DependencyEngine();
export default dependencyEngine;