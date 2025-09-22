/**
 * Schedule Rule Engine Service
 * Handles rule-based scheduling for stages without business day calculations
 * Supports Fixed dates, Offset from anchor, and Dependency-based scheduling
 */

import { addDays, addWeeks, parseISO, format, max, isAfter, isBefore } from 'date-fns';

class ScheduleRuleEngine {
  constructor() {
    this.rules = new Map();
    this.stages = [];
  }

  /**
   * Initialize with stages data
   */
  initialize(stages) {
    this.stages = stages;
    this.buildRuleMap();
  }

  /**
   * Build rule map from stages
   */
  buildRuleMap() {
    this.rules.clear();
    this.stages.forEach(stage => {
      this.rules.set(stage.id, {
        rule: stage.schedule_rule || 'fixed',
        anchorId: stage.anchor_stage_id,
        offsetValue: stage.offset_value || 0,
        offsetUnit: stage.offset_unit || 'days', // days/weeks
        useBusinessDays: stage.use_business_days !== false,
        constraints: {
          earliest: stage.earliest_date,
          latest: stage.latest_date,
          isLocked: stage.is_locked || false
        }
      });
    });
  }

  /**
   * Calculate date for a stage based on its rule
   * @returns {Object} { startDate, endDate, ruleString }
   */
  calculateStageDate(stageId, projectStartDate = new Date()) {
    const stage = this.stages.find(s => s.id === stageId);
    if (!stage) return null;

    const rule = this.rules.get(stageId);
    if (!rule) return this.fallbackDateCalculation(stage, projectStartDate);

    let startDate;
    let ruleString = '';

    switch (rule.rule) {
      case 'fixed':
        startDate = stage.start_date ? parseISO(stage.start_date) : projectStartDate;
        ruleString = `Fixed: ${format(startDate, 'MMM d, yyyy')}`;
        break;

      case 'offset_from_step':
        const anchor = this.stages.find(s => s.id === rule.anchorId);
        if (anchor) {
          const anchorEnd = anchor.end_date ? parseISO(anchor.end_date) : projectStartDate;
          startDate = this.applyOffset(anchorEnd, rule.offsetValue, rule.offsetUnit);
          const offsetStr = this.formatOffset(rule.offsetValue, rule.offsetUnit);
          ruleString = `${offsetStr} after "${anchor.name}"`;
        } else {
          startDate = projectStartDate;
          ruleString = 'Invalid anchor (using project start)';
        }
        break;

      case 'offset_from_previous':
        const previousStage = this.getPreviousStage(stage);
        if (previousStage) {
          const prevEnd = previousStage.end_date ? parseISO(previousStage.end_date) : projectStartDate;
          startDate = this.applyOffset(prevEnd, rule.offsetValue, rule.offsetUnit);
          const offsetStr = this.formatOffset(rule.offsetValue, rule.offsetUnit);
          ruleString = `${offsetStr} after previous step`;
        } else {
          startDate = projectStartDate;
          ruleString = 'First step (using project start)';
        }
        break;

      case 'offset_from_dependencies':
        const depDates = this.getDependencyEndDates(stage);
        if (depDates.length > 0) {
          const latestDep = max(depDates);
          startDate = this.applyOffset(latestDep, rule.offsetValue, rule.offsetUnit);
          const offsetStr = this.formatOffset(rule.offsetValue, rule.offsetUnit);
          ruleString = `${offsetStr} after all dependencies`;
        } else {
          startDate = projectStartDate;
          ruleString = 'No dependencies (using project start)';
        }
        break;

      default:
        startDate = stage.start_date ? parseISO(stage.start_date) : projectStartDate;
        ruleString = 'Default (fixed date)';
    }

    // Apply constraints
    startDate = this.applyConstraints(startDate, rule.constraints);

    // Calculate end date based on duration
    const duration = stage.estimated_duration || 3;
    const endDate = addDays(startDate, duration - 1);

    return {
      startDate,
      endDate,
      ruleString,
      isLocked: rule.constraints.isLocked,
      hasConstraints: !!(rule.constraints.earliest || rule.constraints.latest)
    };
  }

  /**
   * Apply offset to a date
   */
  applyOffset(date, value, unit) {
    if (!value || value === 0) return date;
    
    switch (unit) {
      case 'weeks':
      case 'wk':
        return addWeeks(date, value);
      case 'days':
      case 'd':
      default:
        return addDays(date, value);
    }
  }

  /**
   * Format offset for display
   */
  formatOffset(value, unit) {
    if (!value || value === 0) return 'Immediately';
    
    const absValue = Math.abs(value);
    const unitStr = unit === 'weeks' || unit === 'wk' ? 'week' : 'day';
    const plural = absValue !== 1 ? 's' : '';
    const direction = value > 0 ? '' : '-';
    
    return `${direction}${absValue} ${unitStr}${plural}`;
  }

  /**
   * Apply date constraints
   */
  applyConstraints(date, constraints) {
    if (!constraints) return date;

    let constrainedDate = date;

    if (constraints.earliest) {
      const earliest = parseISO(constraints.earliest);
      if (isBefore(constrainedDate, earliest)) {
        constrainedDate = earliest;
      }
    }

    if (constraints.latest) {
      const latest = parseISO(constraints.latest);
      if (isAfter(constrainedDate, latest)) {
        constrainedDate = latest;
      }
    }

    return constrainedDate;
  }

  /**
   * Get previous stage in sequence
   */
  getPreviousStage(stage) {
    const sorted = [...this.stages].sort((a, b) => a.number_index - b.number_index);
    const currentIndex = sorted.findIndex(s => s.id === stage.id);
    return currentIndex > 0 ? sorted[currentIndex - 1] : null;
  }

  /**
   * Get dependency end dates
   */
  getDependencyEndDates(stage) {
    if (!stage.dependencies || stage.dependencies.length === 0) return [];
    
    return stage.dependencies
      .map(depId => {
        const dep = this.stages.find(s => s.id === depId);
        return dep?.end_date ? parseISO(dep.end_date) : null;
      })
      .filter(Boolean);
  }

  /**
   * Fallback date calculation when no rule is defined
   */
  fallbackDateCalculation(stage, projectStartDate) {
    const startDate = stage.start_date ? parseISO(stage.start_date) : projectStartDate;
    const duration = stage.estimated_duration || 3;
    const endDate = addDays(startDate, duration - 1);
    
    return {
      startDate,
      endDate,
      ruleString: 'No rule defined',
      isLocked: false,
      hasConstraints: false
    };
  }

  /**
   * Update stage rule
   */
  updateStageRule(stageId, ruleUpdate) {
    const existingRule = this.rules.get(stageId);
    if (!existingRule) return false;

    this.rules.set(stageId, {
      ...existingRule,
      ...ruleUpdate
    });

    // Update the stage in the array as well
    const stageIndex = this.stages.findIndex(s => s.id === stageId);
    if (stageIndex !== -1) {
      this.stages[stageIndex] = {
        ...this.stages[stageIndex],
        schedule_rule: ruleUpdate.rule || this.stages[stageIndex].schedule_rule,
        anchor_stage_id: ruleUpdate.anchorId || this.stages[stageIndex].anchor_stage_id,
        offset_value: ruleUpdate.offsetValue !== undefined ? ruleUpdate.offsetValue : this.stages[stageIndex].offset_value,
        offset_unit: ruleUpdate.offsetUnit || this.stages[stageIndex].offset_unit,
        use_business_days: ruleUpdate.useBusinessDays !== undefined ? ruleUpdate.useBusinessDays : this.stages[stageIndex].use_business_days
      };
    }

    return true;
  }

  /**
   * Batch recalculate all stages based on rules
   */
  recalculateAllDates(projectStartDate = new Date()) {
    const updatedStages = [];
    
    // Sort stages by dependencies to ensure proper calculation order
    const sortedStages = this.topologicalSort();
    
    sortedStages.forEach(stage => {
      const calculated = this.calculateStageDate(stage.id, projectStartDate);
      if (calculated) {
        updatedStages.push({
          ...stage,
          start_date: calculated.startDate.toISOString(),
          end_date: calculated.endDate.toISOString(),
          rule_string: calculated.ruleString
        });
        
        // Update the stage in our internal array for subsequent calculations
        const index = this.stages.findIndex(s => s.id === stage.id);
        if (index !== -1) {
          this.stages[index].start_date = calculated.startDate.toISOString();
          this.stages[index].end_date = calculated.endDate.toISOString();
        }
      }
    });
    
    return updatedStages;
  }

  /**
   * Topological sort for dependency order
   */
  topologicalSort() {
    const visited = new Set();
    const sorted = [];
    
    const visit = (stage) => {
      if (visited.has(stage.id)) return;
      visited.add(stage.id);
      
      // Visit dependencies first
      if (stage.dependencies) {
        stage.dependencies.forEach(depId => {
          const dep = this.stages.find(s => s.id === depId);
          if (dep) visit(dep);
        });
      }
      
      sorted.push(stage);
    };
    
    this.stages.forEach(stage => visit(stage));
    return sorted;
  }

  /**
   * Validate all rules for consistency
   */
  validateRules() {
    const issues = [];
    
    this.stages.forEach(stage => {
      const rule = this.rules.get(stage.id);
      if (!rule) {
        issues.push({
          stageId: stage.id,
          type: 'missing_rule',
          message: `Stage "${stage.name}" has no scheduling rule`
        });
        return;
      }
      
      // Check anchor validity
      if (rule.rule === 'offset_from_step' && rule.anchorId) {
        if (!this.stages.find(s => s.id === rule.anchorId)) {
          issues.push({
            stageId: stage.id,
            type: 'invalid_anchor',
            message: `Stage "${stage.name}" has invalid anchor reference`
          });
        }
      }
      
      // Check for circular dependencies
      if (this.hasCircularDependency(stage.id)) {
        issues.push({
          stageId: stage.id,
          type: 'circular_dependency',
          message: `Stage "${stage.name}" has circular dependency`
        });
      }
    });
    
    return issues;
  }

  /**
   * Check for circular dependencies
   */
  hasCircularDependency(stageId, visited = new Set()) {
    if (visited.has(stageId)) return true;
    visited.add(stageId);
    
    const stage = this.stages.find(s => s.id === stageId);
    if (!stage || !stage.dependencies) return false;
    
    for (const depId of stage.dependencies) {
      if (this.hasCircularDependency(depId, new Set(visited))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get rule explanation in plain English
   */
  explainRule(stageId) {
    const stage = this.stages.find(s => s.id === stageId);
    if (!stage) return 'Stage not found';
    
    const rule = this.rules.get(stageId);
    if (!rule) return 'No scheduling rule defined';
    
    const calculated = this.calculateStageDate(stageId);
    if (!calculated) return 'Unable to calculate dates';
    
    let explanation = `This ${stage.is_deliverable ? 'deliverable' : 'step'} `;
    
    switch (rule.rule) {
      case 'fixed':
        explanation += `has a fixed date of ${format(calculated.startDate, 'MMMM d, yyyy')}`;
        break;
      case 'offset_from_step':
        const anchor = this.stages.find(s => s.id === rule.anchorId);
        explanation += `starts ${this.formatOffset(rule.offsetValue, rule.offsetUnit)} after "${anchor?.name || 'unknown step'}" completes`;
        break;
      case 'offset_from_previous':
        explanation += `starts ${this.formatOffset(rule.offsetValue, rule.offsetUnit)} after the previous step completes`;
        break;
      case 'offset_from_dependencies':
        explanation += `starts ${this.formatOffset(rule.offsetValue, rule.offsetUnit)} after all its dependencies are complete`;
        break;
    }
    
    if (rule.constraints.isLocked) {
      explanation += ' and is locked (cannot be moved)';
    }
    
    if (rule.constraints.earliest || rule.constraints.latest) {
      explanation += ' with constraints';
      if (rule.constraints.earliest) {
        explanation += ` (earliest: ${format(parseISO(rule.constraints.earliest), 'MMM d')})`;
      }
      if (rule.constraints.latest) {
        explanation += ` (latest: ${format(parseISO(rule.constraints.latest), 'MMM d')})`;
      }
    }
    
    return explanation + '.';
  }
}

// Create singleton instance
const scheduleRuleEngine = new ScheduleRuleEngine();

export default scheduleRuleEngine;