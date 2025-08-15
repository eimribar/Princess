import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, GitBranch, CheckCircle2, Circle, Lock } from "lucide-react";
import { getDependencyStatus } from "./DependencyUtils";

export default function MiniDependencyMap({ currentStage, allStages }) {
  // Find direct dependencies and dependents
  const { dependencies, dependents, relatedStages } = useMemo(() => {
    const deps = currentStage.dependencies || [];
    const depStages = deps.map(depId => allStages.find(s => s.id === depId)).filter(Boolean);
    
    const depts = allStages.filter(s => s.dependencies?.includes(currentStage.id));
    
    // Get stages that are 2 levels away (dependencies of dependencies, etc.)
    const secondLevelDeps = new Set();
    depStages.forEach(dep => {
      (dep.dependencies || []).forEach(depId => {
        if (depId !== currentStage.id) secondLevelDeps.add(depId);
      });
    });
    
    const secondLevelDepts = new Set();
    depts.forEach(dept => {
      allStages.filter(s => s.dependencies?.includes(dept.id)).forEach(s => {
        if (s.id !== currentStage.id) secondLevelDepts.add(s.id);
      });
    });
    
    const allRelated = new Set([
      ...deps,
      ...depts.map(d => d.id),
      ...Array.from(secondLevelDeps),
      ...Array.from(secondLevelDepts)
    ]);
    
    return {
      dependencies: depStages,
      dependents: depts,
      relatedStages: Array.from(allRelated).map(id => allStages.find(s => s.id === id)).filter(Boolean)
    };
  }, [currentStage, allStages]);

  const getNodeColor = (stage) => {
    const status = getDependencyStatus(stage, allStages);
    switch (status) {
      case 'completed': return 'bg-emerald-500 border-emerald-600';
      case 'in_progress': return 'bg-blue-500 border-blue-600';
      case 'ready': return 'bg-green-100 border-green-400';
      case 'blocked': return 'bg-red-100 border-red-400';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getStatusIcon = (stage) => {
    const status = getDependencyStatus(stage, allStages);
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-3 h-3 text-white" />;
      case 'in_progress': return <Circle className="w-3 h-3 text-white animate-pulse" />;
      case 'blocked': return <Lock className="w-3 h-3 text-red-600" />;
      default: return <Circle className="w-3 h-3 text-gray-600" />;
    }
  };

  if (dependencies.length === 0 && dependents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <GitBranch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">This stage has no dependencies</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Dependencies Section */}
      {dependencies.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Depends On ({dependencies.length})
          </h4>
          <div className="space-y-2">
            {dependencies.map((dep, idx) => (
              <motion.div
                key={dep.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${getNodeColor(dep)}`}>
                  {getStatusIcon(dep)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {dep.number_index}. {dep.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getDependencyStatus(dep, allStages).replace('_', ' ')}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Current Stage Highlight */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl blur-xl" />
        <div className="relative flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${getNodeColor(currentStage)} shadow-lg`}>
            {getStatusIcon(currentStage)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">
              {currentStage.number_index}. {currentStage.name}
            </p>
            <p className="text-xs text-indigo-600 font-medium">
              Current Stage
            </p>
          </div>
        </div>
      </div>

      {/* Dependents Section */}
      {dependents.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Enables ({dependents.length})
          </h4>
          <div className="space-y-2">
            {dependents.map((dept, idx) => (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${getNodeColor(dept)}`}>
                  {getStatusIcon(dept)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {dept.number_index}. {dept.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getDependencyStatus(dept, allStages).replace('_', ' ')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Dependency Chain Visualization */}
      <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
          Dependency Chain
        </h4>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {dependencies.slice(0, 3).map((dep, idx) => (
            <React.Fragment key={dep.id}>
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full border ${getNodeColor(dep)}`} />
                <span className="text-xs text-gray-500 mt-1">{dep.number_index}</span>
              </div>
              {idx < Math.min(2, dependencies.length - 1) && (
                <ArrowRight className="w-3 h-3 text-gray-400" />
              )}
            </React.Fragment>
          ))}
          {dependencies.length > 3 && (
            <>
              <span className="text-xs text-gray-400">+{dependencies.length - 3}</span>
              <ArrowRight className="w-3 h-3 text-gray-400" />
            </>
          )}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full border-2 ${getNodeColor(currentStage)} ring-2 ring-indigo-400 ring-offset-2`} />
            <span className="text-xs font-bold text-indigo-600 mt-1">{currentStage.number_index}</span>
          </div>
          {dependents.length > 0 && (
            <>
              <ArrowRight className="w-3 h-3 text-gray-400" />
              {dependents.slice(0, 2).map((dept, idx) => (
                <React.Fragment key={dept.id}>
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border ${getNodeColor(dept)}`} />
                    <span className="text-xs text-gray-500 mt-1">{dept.number_index}</span>
                  </div>
                  {idx < Math.min(1, dependents.length - 1) && (
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                  )}
                </React.Fragment>
              ))}
              {dependents.length > 2 && (
                <span className="text-xs text-gray-400">+{dependents.length - 2}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}