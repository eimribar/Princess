/**
 * Dependency Visualization Component
 * Renders visual indicators for stage dependencies and critical path
 */

import React from 'react';
import { motion } from 'framer-motion';

export default function DependencyVisualization({
  stages,
  visibleStageIds = [],
  criticalPathIds = [],
  hoveredStageId = null,
  onStageHover = () => {},
  zoom = 'week'
}) {
  if (!stages || stages.length === 0) return null;

  // Create stage position map for drawing connections
  const stagePositions = new Map();
  stages.forEach((stage, index) => {
    if (visibleStageIds.includes(stage.id)) {
      stagePositions.set(stage.id, {
        x: index * 100, // Will be calculated based on timeline position
        y: index * 40,  // Row height
        stage
      });
    }
  });

  // Generate dependency lines
  const dependencyLines = [];
  stages.forEach(stage => {
    if (!stage.dependencies || !visibleStageIds.includes(stage.id)) return;
    
    stage.dependencies.forEach(depId => {
      if (!visibleStageIds.includes(depId)) return;
      
      const fromPos = stagePositions.get(depId);
      const toPos = stagePositions.get(stage.id);
      
      if (fromPos && toPos) {
        const isCritical = criticalPathIds.includes(depId) && criticalPathIds.includes(stage.id);
        const isHighlighted = hoveredStageId === stage.id || hoveredStageId === depId;
        
        dependencyLines.push({
          id: `${depId}-${stage.id}`,
          fromId: depId,
          toId: stage.id,
          fromPos,
          toPos,
          isCritical,
          isHighlighted
        });
      }
    });
  });

  // Render dependency arrows/lines
  const renderDependencyLine = (line) => {
    const { fromPos, toPos, isCritical, isHighlighted } = line;
    
    // Calculate SVG path for curved arrow
    const x1 = fromPos.x + 80; // End of source stage
    const y1 = fromPos.y + 20; // Middle of stage height
    const x2 = toPos.x - 10;   // Start of target stage
    const y2 = toPos.y + 20;   // Middle of stage height
    
    // Control points for bezier curve
    const cp1x = x1 + (x2 - x1) * 0.3;
    const cp1y = y1;
    const cp2x = x2 - (x2 - x1) * 0.3;
    const cp2y = y2;
    
    const pathData = `M ${x1} ${y1} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x2} ${y2}`;
    
    let strokeColor = '#94a3b8'; // Default gray
    let strokeWidth = 2;
    let opacity = 0.6;
    
    if (isCritical) {
      strokeColor = '#ef4444'; // Red for critical path
      strokeWidth = 3;
      opacity = 0.8;
    }
    
    if (isHighlighted) {
      strokeColor = '#3b82f6'; // Blue for highlighted
      strokeWidth = 3;
      opacity = 1;
    }
    
    return (
      <g key={line.id}>
        {/* Main dependency line */}
        <motion.path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          strokeDasharray={isCritical ? "none" : "5,5"}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="pointer-events-none"
        />
        
        {/* Arrow head */}
        <motion.polygon
          points={`${x2-8},${y2-4} ${x2},${y2} ${x2-8},${y2+4}`}
          fill={strokeColor}
          opacity={opacity}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="pointer-events-none"
        />
        
        {/* Hover area for interaction */}
        <motion.path
          d={pathData}
          fill="none"
          stroke="transparent"
          strokeWidth="20"
          className="cursor-pointer"
          onMouseEnter={() => {
            onStageHover(line.fromId);
          }}
          onMouseLeave={() => {
            onStageHover(null);
          }}
        />
      </g>
    );
  };

  // Critical Path Indicators
  const renderCriticalPathIndicators = () => {
    return criticalPathIds.map(stageId => {
      const pos = stagePositions.get(stageId);
      if (!pos) return null;
      
      return (
        <motion.rect
          key={`critical-${stageId}`}
          x={pos.x - 5}
          y={pos.y - 5}
          width={90}
          height={30}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeDasharray="3,3"
          rx="8"
          opacity={0.7}
          initial={{ scale: 0, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="pointer-events-none"
        />
      );
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0"
        style={{ minHeight: stages.length * 40 }}
      >
        {/* Dependency lines */}
        {dependencyLines.map(renderDependencyLine)}
        
        {/* Critical path indicators */}
        {renderCriticalPathIndicators()}
        
        {/* Legend */}
        <g transform="translate(10, 10)" className="text-xs">
          <rect x="0" y="0" width="200" height="80" fill="white" fillOpacity="0.9" rx="4" stroke="#e2e8f0" />
          
          {/* Critical path legend */}
          <line x1="10" y1="20" x2="30" y2="20" stroke="#ef4444" strokeWidth="3" />
          <text x="35" y="24" fill="#374151">Critical Path</text>
          
          {/* Regular dependency legend */}
          <line x1="10" y1="40" x2="30" y2="40" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />
          <text x="35" y="44" fill="#374151">Dependencies</text>
          
          {/* Hover state legend */}
          <line x1="10" y1="60" x2="30" y2="60" stroke="#3b82f6" strokeWidth="3" />
          <text x="35" y="64" fill="#374151">Highlighted</text>
        </g>
      </svg>
    </div>
  );
}