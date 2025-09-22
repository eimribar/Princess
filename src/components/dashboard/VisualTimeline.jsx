
import React, { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { getDependencyStatus } from "./DependencyUtils";
import DependencyIndicator from "./DependencyIndicator";
import DeliverableTooltip from "@/components/deliverables/DeliverableTooltip";

const StageCard = ({ stage, onClick, isSelected, teamMembers, allStages, setHoveredStageId, hoveredStageId, deliverables }) => {
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);
  
  const dependencyStatus = getDependencyStatus(stage, allStages);
  const isBlocked = dependencyStatus === 'blocked';
  
  // Get associated deliverable if this stage is a deliverable
  const associatedDeliverable = useMemo(() => {
    if (!stage.is_deliverable) return null;
    // First check if stage has deliverable_id
    if (stage.deliverable_id) {
      return deliverables?.find(d => d.id === stage.deliverable_id);
    }
    // Fallback to checking by stage_id
    return deliverables?.find(d => d.stage_id === stage.id);
  }, [stage, deliverables]);
  
  // Get deliverable-specific status for coloring
  const getDeliverableStatus = () => {
    if (!stage.is_deliverable || !associatedDeliverable) {
      return dependencyStatus;
    }
    
    // Map deliverable status to visual status
    switch (associatedDeliverable.status) {
      case 'approved':
        return 'completed';
      case 'pending_approval':
      case 'submitted':
        return 'pending_approval';
      case 'declined':
        return 'declined';
      case 'wip':
      case 'in_iterations':
        return 'in_progress';
      case 'draft':
      case 'not_started':
      default:
        return dependencyStatus === 'blocked' ? 'blocked' : 'not_started';
    }
  };
  
  // Check if this stage is related to the hovered stage
  const isRelated = useMemo(() => {
    if (!hoveredStageId) return null;
    const hoveredStage = allStages.find(s => s.id === hoveredStageId);
    if (!hoveredStage) return null;
    
    // Check if this stage is a dependency of hovered stage
    if (hoveredStage.dependencies?.includes(stage.id)) return 'dependency';
    
    // Check if hovered stage is a dependency of this stage
    if (stage.dependencies?.includes(hoveredStageId)) return 'dependent';
    
    return null;
  }, [hoveredStageId, stage.id, stage.dependencies, allStages]);

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
      pending_approval: {
        bg: 'bg-amber-500',
        border: 'border-amber-600',
        text: 'text-white',
        shadow: 'shadow-amber-200'
      },
      declined: {
        bg: 'bg-red-500',
        border: 'border-red-600',
        text: 'text-white',
        shadow: 'shadow-red-200'
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
    return configs[status] || configs.not_started;
  };

  // Use deliverable status for deliverables, dependency status for regular stages
  const displayStatus = stage.is_deliverable ? getDeliverableStatus() : dependencyStatus;
  const config = getStatusConfig(displayStatus, stage.is_deliverable);
  const isActive = isSelected;
  const assignedMember = teamMembers?.find(member => member.id === stage.assigned_to);

  // Apply glow effect based on relationship
  const getGlowEffect = () => {
    if (!isRelated) return '';
    if (isRelated === 'dependency') return 'ring-4 ring-purple-400 ring-opacity-60';
    if (isRelated === 'dependent') return 'ring-4 ring-blue-400 ring-opacity-60';
    return '';
  };

  // Handle mouse enter for tooltip
  const handleMouseEnter = (e) => {
    setHoveredStageId && setHoveredStageId(stage.id);
    
    if (stage.is_deliverable && associatedDeliverable) {
      // Get position of the stage element
      const rect = stageRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPosition({ 
          x: rect.left + rect.width / 2, 
          y: rect.top 
        });
        
        // Show tooltip after a short delay
        tooltipTimeoutRef.current = setTimeout(() => {
          setShowTooltip(true);
        }, 500);
      }
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredStageId && setHoveredStageId(null);
    
    // Clear timeout and hide tooltip
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setShowTooltip(false);
  };

  // Handle click - always open sidebar for all stages
  const handleClick = () => {
    onClick(stage.id);
  };

  return (
    <>
      <motion.div
        ref={stageRef}
        className={`flex flex-col items-center gap-2 relative transition-all duration-300 cursor-pointer ${isBlocked ? 'opacity-75' : ''} pb-12`}
        data-stage-id={stage.id}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
      <div className={`
        relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
        ${config.bg} ${config.border} border-2 ${config.shadow} shadow-lg
        ${isActive ? 'ring-4 ring-indigo-500 ring-offset-2' : getGlowEffect()}
      `}>
        {dependencyStatus === 'blocked' ? (
          <Lock className={`w-5 h-5 ${config.text}`} />
        ) : (
          <span className={`text-sm font-bold ${config.text}`}>
            {stage.number_index}
          </span>
        )}

        <DependencyIndicator
          status={dependencyStatus}
          dependencies={stage.dependencies}
          stages={allStages}
        />

        {stage.is_deliverable && (
          <>
            {/* Star Badge with Animation */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
              associatedDeliverable?.status === 'pending_approval' ? 'animate-pulse' : ''
            } ${
              associatedDeliverable?.status === 'approved' ? 'bg-green-500' :
              associatedDeliverable?.status === 'pending_approval' ? 'bg-amber-400' :
              associatedDeliverable?.status === 'declined' ? 'bg-red-500' :
              'bg-amber-400'
            }`}>
              <Star className="w-2.5 h-2.5 text-white fill-current" />
            </div>
            
            {/* Iteration Badge */}
            {associatedDeliverable?.current_iteration > 0 && (
              <div className="absolute -top-2 -right-2 bg-white rounded-full border-2 border-gray-300 px-1 min-w-[20px] h-5 flex items-center justify-center">
                <span className={`text-xs font-bold ${
                  associatedDeliverable.current_iteration >= (associatedDeliverable.max_iterations || 3) 
                    ? 'text-red-600' 
                    : 'text-gray-700'
                }`}>
                  {associatedDeliverable.current_iteration}/{associatedDeliverable.max_iterations || 3}
                </span>
              </div>
            )}
            
            {/* Progress Ring for Pending Approval */}
            {associatedDeliverable?.status === 'pending_approval' && (
              <svg className="absolute inset-0 w-12 h-12 -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="22"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-amber-400 opacity-30"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="22"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * 0.25}`}
                  className="text-amber-500 animate-pulse"
                />
              </svg>
            )}
          </>
        )}
        
        {isBlocked && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-white" />
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
          <div className="relative">
            <Avatar className={`w-5 h-5 border ${
              dependencyStatus === 'blocked' 
                ? 'border-amber-400 shadow-amber-200' 
                : 'border-white shadow-sm'
            }`}>
              <AvatarImage src={assignedMember.profile_image} />
              <AvatarFallback className={`text-xs ${
                dependencyStatus === 'blocked'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {assignedMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <p className={`text-xs text-center whitespace-nowrap max-w-16 truncate ${
            dependencyStatus === 'blocked'
              ? 'text-amber-600 font-medium'
              : 'text-slate-500'
          }`}>
            {assignedMember.name.split(' ')[0]}
          </p>
        </div>
      )}
      </motion.div>
      
      {/* Deliverable Tooltip */}
      <DeliverableTooltip
        stage={stage}
        deliverable={associatedDeliverable}
        isVisible={showTooltip}
        position={tooltipPosition}
      />
    </>
  );
};

const PhaseSection = ({ phase, stages, onStageClick, selectedStageId, teamMembers, setHoveredStageId, hoveredStageId, deliverables }) => {
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
              setHoveredStageId={setHoveredStageId}
              hoveredStageId={hoveredStageId}
              deliverables={deliverables} // Pass deliverables for status checking
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default function VisualTimeline({ stages, onStageClick, selectedStageId, teamMembers, deliverables }) {
  const [hoveredStageId, setHoveredStageId] = React.useState(null);

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

  // Calculate dependency-aware stats - memoized to prevent recalculation
  const dependencyAwareStats = useMemo(() => ({
    total: stages.length,
    ready: stages.filter(s => getDependencyStatus(s, stages) === 'ready').length,
    blocked: stages.filter(s => getDependencyStatus(s, stages) === 'blocked').length,
    completed: stages.filter(s => s.status === 'completed').length,
    in_progress: stages.filter(s => s.status === 'in_progress').length,
  }), [stages]);

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
          setHoveredStageId={setHoveredStageId}
          hoveredStageId={hoveredStageId}
          deliverables={deliverables}
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
