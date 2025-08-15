
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { getDependencyStatus } from "./DependencyUtils";
import DependencyIndicator from "./DependencyIndicator";

const StageCard = ({ stage, onClick, isSelected, teamMembers, allStages }) => {
  const dependencyStatus = getDependencyStatus(stage, allStages);
  const isBlocked = dependencyStatus === 'blocked';

  const getStatusConfig = (status, isDeliverable) => {
    const configs = {
      completed: {
        bg: isDeliverable ? 'bg-emerald-500' : 'bg-emerald-500',
        border: 'border-emerald-600',
        text: 'text-white',
        shadow: 'shadow-emerald-200'
      },
      in_progress: {
        bg: isDeliverable ? 'bg-blue-500' : 'bg-blue-500',
        border: 'border-blue-600',
        text: 'text-white',
        shadow: 'shadow-blue-200'
      },
      ready: {
        bg: 'bg-green-100',
        border: 'border-green-400',
        text: 'text-green-700',
        shadow: 'shadow-green-100'
      },
      blocked: {
        bg: 'bg-red-100',
        border: 'border-red-400',
        text: 'text-red-600',
        shadow: 'shadow-red-100'
      },
      not_started: {
        bg: 'bg-white',
        border: 'border-gray-300',
        text: 'text-gray-600',
        shadow: 'shadow-gray-100'
      }
    };
    // The status passed here is dependencyStatus, which `getDependencyStatus` function
    // in DependencyUtils.ts must be designed to return 'completed', 'in_progress', 'ready', 'blocked', or 'not_started'
    // for this mapping to work correctly.
    return configs[status] || configs.not_started;
  };

  const config = getStatusConfig(dependencyStatus, stage.is_deliverable);
  const isActive = isSelected;
  const assignedMember = teamMembers?.find(member => member.email === stage.assigned_to);

  return (
    <motion.div
      className={`flex flex-col items-center gap-2 relative transition-opacity duration-300 ${isBlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} pb-12`}
      onClick={() => !isBlocked && onClick(stage.id)}
      whileHover={!isBlocked ? { scale: 1.05 } : {}}
      whileTap={!isBlocked ? { scale: 0.95 } : {}}
    >
      <div className={`
        relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
        ${config.bg} ${config.border} border-2 ${config.shadow} shadow-lg
        ${isActive ? 'ring-4 ring-indigo-500 ring-offset-2' : ''}
      `}>
        <span className={`text-sm font-bold ${config.text}`}>
          {stage.number_index}
        </span>

        <DependencyIndicator
          status={dependencyStatus}
          dependencies={stage.dependencies}
          stages={allStages}
        />

        {stage.is_deliverable && !isBlocked && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
            <Star className="w-2.5 h-2.5 text-white fill-current" />
          </div>
        )}
      </div>

      {/* Step Name */}
      <div className="text-center max-w-20">
        <p className="text-xs font-medium text-gray-700 leading-tight line-clamp-2">
          {stage.name}
        </p>
      </div>

      {/* Assigned Member - Fixed positioning */}
      {assignedMember && (
        <div className="flex flex-col items-center gap-1 mt-2">
          <Avatar className="w-5 h-5 border border-white shadow-sm">
            <AvatarImage src={assignedMember.profile_image} />
            <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
              {assignedMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs text-slate-500 text-center whitespace-nowrap max-w-16 truncate">
            {assignedMember.name.split(' ')[0]}
          </p>
        </div>
      )}
    </motion.div>
  );
};

const PhaseSection = ({ phase, stages, onStageClick, selectedStageId, teamMembers }) => {
  const phaseStages = stages
    .filter(stage => stage.category === phase.id)
    .sort((a, b) => a.number_index - b.number_index);

  if (phaseStages.length === 0) return null;

  return (
    <Card className="p-8 bg-white/80 backdrop-blur-sm border border-gray-200/60 shadow-sm">
      <div className="space-y-8">
        {/* Phase Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
            <div className={`w-4 h-4 rounded-full ${phase.color}`}></div>
            <h3 className="text-xl font-bold text-gray-900">
              {phase.title}
            </h3>
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
              {phaseStages.length} steps
            </Badge>
          </div>
        </div>

        {/* Steps Grid - with proper spacing for assignee names */}
        <div className="flex flex-wrap justify-center gap-8 py-4">
          {phaseStages.map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              onClick={onStageClick}
              isSelected={selectedStageId === stage.id}
              teamMembers={teamMembers}
              allStages={stages} // Pass all stages for dependency checks
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default function VisualTimeline({ stages, onStageClick, selectedStageId, teamMembers }) {
  // Removed hoveredStageId state as it's no longer managed globally for stage card hover effects.

  const phases = [
    {
      id: 'onboarding',
      title: 'Phase 1: Project Initiation & Setup',
      color: 'bg-purple-500',
      steps: '1-15'
    },
    {
      id: 'research',
      title: 'Phase 2: Research & Discovery',
      color: 'bg-blue-500',
      steps: '16-48'
    },
    {
      id: 'strategy',
      title: 'Phase 3: Strategy & USP Development',
      color: 'bg-indigo-500',
      steps: '49-63'
    },
    {
      id: 'brand_building',
      title: 'Phase 4a: Brand Building',
      color: 'bg-green-500',
      steps: '64-87'
    },
    {
      id: 'brand_collaterals',
      title: 'Phase 4b: Brand Collaterals',
      color: 'bg-amber-500',
      steps: '76-96'
    },
    {
      id: 'brand_activation',
      title: 'Phase 4c: Brand Activation',
      color: 'bg-red-500',
      steps: '71-99'
    },
    {
      id: 'employer_branding',
      title: 'Phase 4d: Employer Branding',
      color: 'bg-pink-500',
      steps: '97-98'
    },
    {
      id: 'project_closure',
      title: 'Phase 5: Project Closure & Handover',
      color: 'bg-gray-500',
      steps: '100-104'
    }
  ];

  // Calculate dependency-aware stats
  const dependencyAwareStats = {
    total: stages.length,
    ready: stages.filter(s => getDependencyStatus(s, stages) === 'ready').length,
    blocked: stages.filter(s => getDependencyStatus(s, stages) === 'blocked').length,
    completed: stages.filter(s => s.status === 'completed').length,
    in_progress: stages.filter(s => s.status === 'in_progress').length,
  };

  return (
    <div className="space-y-8">
      {phases.map((phase) => (
        <PhaseSection
          key={phase.id}
          phase={phase}
          stages={stages}
          onStageClick={onStageClick}
          selectedStageId={selectedStageId}
          teamMembers={teamMembers}
        />
      ))}

      {/* Summary Stats with Dependency Awareness */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-8"
      >
        <div className="inline-flex items-center gap-6 px-8 py-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{dependencyAwareStats.total}</p>
            <p className="text-sm text-gray-600">Total Steps</p>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{dependencyAwareStats.ready}</p>
            <p className="text-sm text-gray-600">Ready to Start</p>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{dependencyAwareStats.in_progress}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{dependencyAwareStats.completed}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{dependencyAwareStats.blocked}</p>
            <p className="text-sm text-gray-600">Blocked</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
