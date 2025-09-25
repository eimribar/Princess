import React from 'react';
import { AlertCircle, CheckCircle2, ArrowRight, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Get a human-readable explanation for why one stage depends on another
 */
const getDependencyReason = (currentStage, dependencyStage) => {
  // Map of common dependency reasons based on stage patterns
  const reasons = {
    'research': 'The research findings are needed to inform this stage',
    'strategy': 'The strategic direction must be established first',
    'brand': 'Brand elements must be defined before applying them here',
    'logo': 'The logo design is a prerequisite for this material',
    'color': 'Color palette must be finalized first',
    'typography': 'Typography guidelines are required for this design',
    'messaging': 'Brand messaging framework is needed for content creation',
    'guidelines': 'Brand guidelines provide the foundation for this work',
  };
  
  // Check dependency stage name for keywords
  const depName = dependencyStage.name.toLowerCase();
  for (const [key, reason] of Object.entries(reasons)) {
    if (depName.includes(key)) {
      return reason;
    }
  }
  
  // Default reason based on phase
  if (dependencyStage.category === 'research') {
    return 'Research insights are needed to proceed with this stage';
  } else if (dependencyStage.category === 'strategy') {
    return 'Strategic decisions must be made before this can begin';
  } else if (dependencyStage.category === 'brand_building') {
    return 'Core brand elements must be established first';
  }
  
  return 'This prerequisite provides essential inputs for this stage';
};

/**
 * Component to explain dependencies in a client-friendly way
 */
export default function DependencyExplainer({ stage, dependencies, isBlocked = false }) {
  if (!dependencies || dependencies.length === 0) {
    return null;
  }
  
  // Separate blocked and completed dependencies
  const blockedDeps = dependencies.filter(dep => dep.status !== 'completed');
  const completedDeps = dependencies.filter(dep => dep.status === 'completed');
  
  return (
    <div className="space-y-4">
      {/* Blocked Dependencies - Show when stage is blocked */}
      {isBlocked && blockedDeps.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Why is this waiting?</AlertTitle>
          <AlertDescription className="mt-3">
            <p className="text-sm text-amber-800 mb-3">
              {stage.name} requires these stages to be completed first:
            </p>
            <ul className="space-y-3">
              {blockedDeps.map(dep => (
                <li key={dep.id} className="flex items-start gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                      {dep.number_index}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-amber-900">
                        {dep.name}
                      </div>
                      <p className="text-xs text-amber-700 mt-1">
                        {getDependencyReason(stage, dep)}
                      </p>
                      {dep.assigned_to && (
                        <p className="text-xs text-amber-600 mt-1">
                          Currently assigned to: {dep.assigned_to_name || 'Team member'}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Completed Dependencies - Show what enabled this stage */}
      {completedDeps.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-900 mb-2">
                Prerequisites Completed
              </h4>
              <ul className="space-y-1">
                {completedDeps.map(dep => (
                  <li key={dep.id} className="flex items-center gap-2 text-xs text-green-700">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-medium">
                      {dep.number_index}
                    </span>
                    <span>{dep.name}</span>
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Educational note for clients */}
      {isBlocked && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Understanding Dependencies</p>
            <p>
              Each stage in your brand development process builds upon previous work. 
              This ensures quality and consistency throughout your project. 
              Dependencies help maintain the logical flow of your brand story.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Inline dependency indicator for compact views
 */
export function DependencyIndicator({ blockedByCount, completedCount }) {
  if (blockedByCount === 0 && completedCount === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2 text-xs">
      {blockedByCount > 0 && (
        <span className="flex items-center gap-1 text-amber-600">
          <AlertCircle className="h-3 w-3" />
          Waiting for {blockedByCount} stage{blockedByCount !== 1 ? 's' : ''}
        </span>
      )}
      {completedCount > 0 && blockedByCount === 0 && (
        <span className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Ready to proceed
        </span>
      )}
    </div>
  );
}