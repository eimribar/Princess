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