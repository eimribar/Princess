import React, { useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { parseISO } from 'date-fns';

export default function DependencyConnections({ 
  stages, 
  timePeriods, 
  zoom,
  highlightedStageId,
  onConnectionClick 
}) {
  const svgRef = useRef(null);
  
  // Calculate stage positions based on timeline
  const stagePositions = useMemo(() => {
    const positions = new Map();
    const totalPeriods = timePeriods.length;
    const periodWidth = 100 / totalPeriods;
    
    stages.forEach((stage, index) => {
      const startDate = parseISO(stage.start_date || stage.startDate);
      const endDate = parseISO(stage.end_date || stage.endDate);
      
      // Find position in timeline
      let startIndex = -1;
      let endIndex = -1;
      
      timePeriods.forEach((period, idx) => {
        const periodTime = period.getTime();
        if (startIndex === -1 && startDate.getTime() <= periodTime) {
          startIndex = idx;
        }
        if (endIndex === -1 && endDate.getTime() <= periodTime) {
          endIndex = idx;
        }
      });
      
      if (startIndex === -1) startIndex = 0;
      if (endIndex === -1) endIndex = totalPeriods - 1;
      
      const x = (startIndex + endIndex) / 2 * periodWidth;
      const y = index * 48 + 24; // 48px row height, centered
      
      positions.set(stage.id, { x, y, stage });
    });
    
    return positions;
  }, [stages, timePeriods]);
  
  // Calculate dependency paths
  const dependencyPaths = useMemo(() => {
    const paths = [];
    
    stages.forEach(stage => {
      if (!stage.dependencies || stage.dependencies.length === 0) return;
      
      const toPos = stagePositions.get(stage.id);
      if (!toPos) return;
      
      stage.dependencies.forEach(depId => {
        const fromPos = stagePositions.get(depId);
        if (!fromPos) return;
        
        // Determine if this is a critical path connection
        const isCritical = stage.is_critical_path && 
          stages.find(s => s.id === depId)?.is_critical_path;
        
        // Determine if this connection should be highlighted
        const isHighlighted = highlightedStageId === stage.id || 
                            highlightedStageId === depId;
        
        // Calculate bezier control points for smooth curves
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        
        // Horizontal connections
        if (Math.abs(dy) < 10) {
          paths.push({
            id: `${depId}-${stage.id}`,
            from: fromPos,
            to: toPos,
            path: `M ${fromPos.x}% ${fromPos.y} L ${toPos.x}% ${toPos.y}`,
            isCritical,
            isHighlighted,
            type: 'horizontal'
          });
        } else {
          // Curved connections
          const controlX = fromPos.x + dx * 0.5;
          const controlY1 = fromPos.y;
          const controlY2 = toPos.y;
          
          paths.push({
            id: `${depId}-${stage.id}`,
            from: fromPos,
            to: toPos,
            path: `M ${fromPos.x}% ${fromPos.y} 
                   C ${controlX}% ${controlY1}, 
                     ${controlX}% ${controlY2}, 
                     ${toPos.x}% ${toPos.y}`,
            isCritical,
            isHighlighted,
            type: 'curved'
          });
        }
      });
    });
    
    return paths;
  }, [stages, stagePositions, highlightedStageId]);
  
  // Calculate arrow markers
  const getArrowMarker = (isCritical, isHighlighted) => {
    if (isHighlighted) return 'url(#arrow-highlighted)';
    if (isCritical) return 'url(#arrow-critical)';
    return 'url(#arrow-normal)';
  };
  
  // Get path styling
  const getPathStyle = (path) => {
    const baseStyle = {
      fill: 'none',
      strokeWidth: path.isHighlighted ? 3 : 2,
      opacity: path.isHighlighted ? 1 : 0.4,
      transition: 'all 0.3s ease'
    };
    
    if (path.isHighlighted) {
      baseStyle.stroke = '#3b82f6'; // blue-500
      baseStyle.filter = 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))';
    } else if (path.isCritical) {
      baseStyle.stroke = '#f97316'; // orange-500
      baseStyle.strokeDasharray = '5 5';
    } else {
      baseStyle.stroke = '#94a3b8'; // slate-400
    }
    
    return baseStyle;
  };
  
  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      {/* Define arrow markers */}
      <defs>
        <marker
          id="arrow-normal"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill="#94a3b8"
            opacity="0.6"
          />
        </marker>
        
        <marker
          id="arrow-critical"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill="#f97316"
          />
        </marker>
        
        <marker
          id="arrow-highlighted"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill="#3b82f6"
          />
        </marker>
        
        {/* Gradient for critical path */}
        <linearGradient id="critical-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#f97316" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.2" />
        </linearGradient>
        
        {/* Filter for glow effect */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Render dependency paths */}
      <g className="dependency-paths">
        {dependencyPaths.map(path => (
          <motion.g
            key={path.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: Math.random() * 0.2 }}
          >
            {/* Path shadow for depth */}
            {path.isHighlighted && (
              <path
                d={path.path}
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth="8"
                fill="none"
                opacity="0.5"
              />
            )}
            
            {/* Main path */}
            <path
              d={path.path}
              style={getPathStyle(path)}
              markerEnd={getArrowMarker(path.isCritical, path.isHighlighted)}
              className="dependency-path"
              onClick={() => onConnectionClick && onConnectionClick(path)}
              style={{ ...getPathStyle(path), pointerEvents: 'stroke' }}
            />
            
            {/* Animated dots for active connections */}
            {path.isHighlighted && (
              <motion.circle
                r="3"
                fill="#3b82f6"
                filter="url(#glow)"
                animate={{
                  offsetDistance: ['0%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              >
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={path.path}
                />
              </motion.circle>
            )}
          </motion.g>
        ))}
      </g>
      
      {/* Render connection points */}
      <g className="connection-points">
        {Array.from(stagePositions.values()).map(({ x, y, stage }) => {
          const hasConnections = stage.dependencies?.length > 0 || 
            stages.some(s => s.dependencies?.includes(stage.id));
          
          if (!hasConnections) return null;
          
          return (
            <g key={stage.id}>
              <circle
                cx={`${x}%`}
                cy={y}
                r="4"
                fill={highlightedStageId === stage.id ? '#3b82f6' : '#e2e8f0'}
                stroke={highlightedStageId === stage.id ? '#3b82f6' : '#94a3b8'}
                strokeWidth="2"
                className="transition-all duration-300"
              />
              {highlightedStageId === stage.id && (
                <motion.circle
                  cx={`${x}%`}
                  cy={y}
                  r="4"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  initial={{ r: 4 }}
                  animate={{ r: 12, opacity: 0 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeOut'
                  }}
                />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}