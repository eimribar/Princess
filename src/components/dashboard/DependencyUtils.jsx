// Utility functions for dependency management

export const CRITICAL_DEPENDENCIES = {
  CONTRACT_FOUNDATION: [1, 2, 3], // Price Quote → Signature → Invoice Planning
  INFRASTRUCTURE_SETUP: [4, 5, 6, 7, 12], // PM → Infrastructure → Kickoff
  KNOWLEDGE_GATHERING: [8, 11, 16], // Ask List → KYC → Research
  RESEARCH_FLOW: [16, 24, 26, 27, 28], // Research → Review → Memo → Approval → Delivery
  USP_WORKSHOP: [42, 43, 44, 45, 46, 47, 48, 49, 50, 51], // Most complex chain
};

export const ROEE_APPROVAL_POINTS = [27, 37, 43, 44, 46, 97];
export const CLIENT_DEPENDENCY_POINTS = [8, 30, 32, 33, 49, 50, 89];
export const MASTER_UNLOCKS = {
  51: "USP_MEMO", // Unlocks all creative work
  61: "TONE_AND_VOICE", // Unlocks all copywriting
  87: "VISUAL_IDENTITY", // Unlocks all production
};

export const getDependencyStatus = (stage, allStages) => {
  // If stage is already in progress or completed, return its actual status
  if (stage.status === 'in_progress' || stage.status === 'completed' || stage.status === 'blocked') {
    return stage.status;
  }

  // For not_started stages, check dependencies
  if (!stage.dependencies || stage.dependencies.length === 0) {
    // No dependencies = ready to start
    return 'ready';
  }

  // Check if all dependencies are completed
  const dependencyStages = stage.dependencies
    .map(depId => allStages.find(s => s.id === depId))
    .filter(Boolean);

  const allDependenciesComplete = dependencyStages.every(dep => dep.status === 'completed');

  if (allDependenciesComplete) {
    return 'ready';
  } else {
    return 'blocked';
  }
};

export const getBlockedStages = (stage, allStages) => {
  return allStages.filter(s => 
    s.dependencies && s.dependencies.includes(stage.id) && s.status === 'not_started'
  );
};

export const getCriticalPath = (allStages) => {
  const criticalStages = [];
  
  // Add known critical stages
  Object.values(CRITICAL_DEPENDENCIES).flat().forEach(stepNumber => {
    const stage = allStages.find(s => s.number_index === stepNumber);
    if (stage) {
      criticalStages.push({
        ...stage,
        criticality: 'high',
        reason: 'Part of critical dependency chain'
      });
    }
  });

  // Add stages that block many others
  allStages.forEach(stage => {
    const blockedStages = getBlockedStages(stage, allStages);
    if (blockedStages.length >= 5) {
      criticalStages.push({
        ...stage,
        criticality: 'high',
        reason: `Blocks ${blockedStages.length} stages`
      });
    }
  });

  return criticalStages;
};

export const getParallelOpportunities = (allStages) => {
  const parallelTracks = [];
  
  // After Contract Foundation (Step 2)
  const contractCompleted = allStages.find(s => s.number_index === 2)?.status === 'completed';
  if (contractCompleted) {
    parallelTracks.push({
      trigger: "Contract Signed",
      opportunities: allStages.filter(s => [4, 5, 6, 12].includes(s.number_index))
    });
  }

  return parallelTracks;
};

export const validateDependencyChain = (stages) => {
  const issues = [];
  
  stages.forEach(stage => {
    if (stage.dependencies) {
      stage.dependencies.forEach(depId => {
        const dependency = stages.find(s => s.id === depId);
        if (!dependency) {
          issues.push({
            type: 'missing_dependency',
            stage: stage.name,
            issue: `References non-existent dependency: ${depId}`
          });
        } else if (dependency.number_index > stage.number_index) {
          issues.push({
            type: 'circular_dependency',
            stage: stage.name,
            issue: `Depends on future stage: ${dependency.name}`
          });
        }
      });
    }
  });

  return issues;
};

/**
 * Get all stages that depend on a given stage (direct and transitive)
 */
export const getAllDependentStages = (stageId, allStages, includeTransitive = true) => {
  const dependents = new Set();
  const visited = new Set();
  
  const findDependents = (id) => {
    if (visited.has(id)) return;
    visited.add(id);
    
    // Find direct dependents
    const directDependents = allStages.filter(s => 
      s.dependencies && s.dependencies.includes(id)
    );
    
    directDependents.forEach(dep => {
      dependents.add(dep);
      // Recursively find transitive dependents
      if (includeTransitive) {
        findDependents(dep.id);
      }
    });
  };
  
  findDependents(stageId);
  
  // Debug logging
  const stage = allStages.find(s => s.id === stageId);
  if (stage?.number_index === 1) {
    console.log('Getting dependents for stage 1:', {
      stageId,
      totalStages: allStages.length,
      stagesWithDeps: allStages.filter(s => s.dependencies && s.dependencies.length > 0).length,
      foundDependents: dependents.size,
      dependentNumbers: Array.from(dependents).map(d => d.number_index)
    });
  }
  
  return Array.from(dependents);
};

/**
 * Evaluate cascade impact when a stage status changes
 */
export const evaluateCascadeImpact = (stageId, newStatus, allStages) => {
  const impact = {
    stageId,
    newStatus,
    directlyAffected: [],
    transitivelyAffected: [],
    conflicts: [],
    warnings: [],
    requiresConfirmation: false
  };
  
  const stage = allStages.find(s => s.id === stageId);
  if (!stage) return impact;
  
  // Get all dependent stages
  const dependents = getAllDependentStages(stageId, allStages, true);
  
  // Analyze impact based on status change
  if (newStatus === 'not_started' || newStatus === 'not_ready') {
    // Stage is being reset - check dependents
    dependents.forEach(dep => {
      const impactInfo = {
        stage: dep,
        currentStatus: dep.status,
        suggestedAction: null,
        severity: 'low'
      };
      
      if (dep.status === 'completed') {
        // Conflict: dependent is completed but dependency is being reset
        impactInfo.suggestedAction = 'review';
        impactInfo.severity = 'high';
        impact.conflicts.push({
          ...impactInfo,
          message: `${dep.name} is completed but depends on ${stage.name} which is being reset`
        });
        impact.requiresConfirmation = true;
      } else if (dep.status === 'in_progress') {
        // Warning: work in progress will be blocked
        impactInfo.suggestedAction = 'block';
        impactInfo.severity = 'medium';
        impact.warnings.push({
          ...impactInfo,
          message: `${dep.name} is in progress and will be blocked`
        });
        impact.requiresConfirmation = true;
      } else if (dep.status === 'not_started' || dep.status === 'not_ready') {
        // Will be automatically blocked
        impactInfo.suggestedAction = 'block';
        impactInfo.severity = 'low';
        impact.directlyAffected.push(impactInfo);
      }
    });
  } else if (newStatus === 'completed') {
    // Stage is being completed - check what gets unblocked
    dependents.forEach(dep => {
      if (dep.status === 'not_started' || dep.status === 'blocked') {
        // Check if ALL dependencies are met
        const allDepsComplete = dep.dependencies.every(depId => {
          if (depId === stageId) return true; // This one is being completed
          const depStage = allStages.find(s => s.id === depId);
          return depStage?.status === 'completed';
        });
        
        if (allDepsComplete) {
          impact.directlyAffected.push({
            stage: dep,
            currentStatus: dep.status,
            suggestedAction: 'unblock',
            severity: 'low',
            message: `${dep.name} will be ready to start`
          });
        }
      }
    });
  }
  
  return impact;
};

/**
 * Apply cascade blocking when a stage is reset
 */
export const cascadeBlockDependents = async (stageId, allStages, updateFunction) => {
  const updates = [];
  const dependents = getAllDependentStages(stageId, allStages, true);
  
  for (const dep of dependents) {
    if (dep.status === 'not_started' || dep.status === 'not_ready') {
      // Block stages that haven't started
      updates.push({
        stageId: dep.id,
        updates: { status: 'blocked' },
        reason: 'Dependency reset'
      });
    } else if (dep.status === 'in_progress') {
      // Optionally block in-progress stages (requires confirmation)
      updates.push({
        stageId: dep.id,
        updates: { status: 'blocked' },
        reason: 'Dependency reset - work interrupted',
        requiresConfirmation: true
      });
    }
    // Completed stages are left as-is but marked for review
  }
  
  // Apply updates if updateFunction provided
  if (updateFunction) {
    for (const update of updates) {
      if (!update.requiresConfirmation) {
        await updateFunction(update.stageId, update.updates);
      }
    }
  }
  
  return updates;
};

/**
 * Check if a stage can transition to a new status
 */
export const canTransitionToStatus = (stage, newStatus, allStages) => {
  const validation = {
    allowed: true,
    reason: null,
    warnings: []
  };
  
  // Check transitions TO in_progress
  if (newStatus === 'in_progress') {
    // Must have all dependencies completed
    if (stage.dependencies && stage.dependencies.length > 0) {
      const incompleteDeps = stage.dependencies
        .map(depId => allStages.find(s => s.id === depId))
        .filter(dep => dep && dep.status !== 'completed');
      
      if (incompleteDeps.length > 0) {
        validation.allowed = false;
        validation.reason = `Cannot start: ${incompleteDeps.length} dependencies not completed`;
      }
    }
  }
  
  // Check transitions FROM completed
  if (stage.status === 'completed' && newStatus !== 'completed') {
    const dependents = getAllDependentStages(stage.id, allStages, false);
    const affectedCount = dependents.filter(d => 
      d.status === 'in_progress' || d.status === 'completed'
    ).length;
    
    if (affectedCount > 0) {
      validation.warnings.push(`${affectedCount} dependent stages will be affected`);
    }
  }
  
  return validation;
};

/**
 * Automatically update stage statuses based on dependency changes
 */
export const autoUpdateStageStatuses = async (allStages, updateFunction) => {
  const updates = [];
  
  for (const stage of allStages) {
    // Skip stages that are already in progress or completed
    if (stage.status === 'in_progress' || stage.status === 'completed') {
      continue;
    }
    
    // Check if stage should be blocked or ready
    if (stage.dependencies && stage.dependencies.length > 0) {
      const allDepsComplete = stage.dependencies.every(depId => {
        const dep = allStages.find(s => s.id === depId);
        return dep?.status === 'completed';
      });
      
      const currentlyBlocked = stage.status === 'blocked' || stage.status === 'not_ready';
      const shouldBeBlocked = !allDepsComplete;
      
      if (currentlyBlocked && !shouldBeBlocked) {
        // Unblock the stage
        updates.push({
          stageId: stage.id,
          updates: { status: 'not_started' }
        });
      } else if (!currentlyBlocked && shouldBeBlocked) {
        // Block the stage
        updates.push({
          stageId: stage.id,
          updates: { status: 'blocked' }
        });
      }
    }
  }
  
  // Apply updates if updateFunction provided
  if (updateFunction) {
    for (const update of updates) {
      await updateFunction(update.stageId, update.updates);
    }
  }
  
  return updates;
};