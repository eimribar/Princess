/**
 * Dependency Connections Component
 * Visual lines and arrows showing stage dependencies
 */

import React, { useEffect, useRef, useMemo } from 'react';

const DependencyConnections = ({ stages, selectedStageId, hoveredStageId }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  
  // Only recalculate when stages actually change
  const stageIds = useMemo(() => stages.map(s => s.id).join(','), [stages]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = svgRef.current;
    const container = containerRef.current;

    // Clear existing connections
    svg.innerHTML = '';

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    svg.setAttribute('width', containerRect.width);
    svg.setAttribute('height', containerRect.height);

    // Find stage elements and their positions
    const stageElements = Array.from(document.querySelectorAll('[data-stage-id]'));
    const stagePositions = new Map();

    stageElements.forEach(element => {
      const stageId = element.getAttribute('data-stage-id');
      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Calculate position relative to container
      const x = rect.left - containerRect.left + (rect.width / 2);
      const y = rect.top - containerRect.top + (rect.height / 2);
      
      stagePositions.set(stageId, { x, y, element });
    });

    // Draw connections based on selected or hovered stage
    const targetStageId = selectedStageId || hoveredStageId;
    if (targetStageId) {
      const targetStage = stages.find(s => s.id === targetStageId);
      if (targetStage) {
        drawStageConnections(svg, targetStage, stages, stagePositions);
      }
    }

  }, [stageIds, selectedStageId, hoveredStageId]);

  const drawStageConnections = (svg, targetStage, allStages, stagePositions) => {
    const targetPos = stagePositions.get(targetStage.id);
    if (!targetPos) return;

    // Draw dependencies (incoming connections)
    if (targetStage.dependencies) {
      targetStage.dependencies.forEach(depId => {
        const depStage = allStages.find(s => s.id === depId);
        const depPos = stagePositions.get(depId);
        
        if (depPos && depStage) {
          drawConnection(svg, depPos, targetPos, {
            type: 'dependency',
            status: depStage.status,
            isDirectDependency: true
          });
        }
      });
    }

    // Draw dependent stages (outgoing connections)
    const dependentStages = allStages.filter(s => 
      s.dependencies && s.dependencies.includes(targetStage.id)
    );

    dependentStages.forEach(depStage => {
      const depPos = stagePositions.get(depStage.id);
      if (depPos) {
        drawConnection(svg, targetPos, depPos, {
          type: 'dependent',
          status: depStage.status,
          isDirectDependency: true
        });
      }
    });

    // Highlight parallel tracks
    if (targetStage.parallel_tracks) {
      targetStage.parallel_tracks.forEach(parallelId => {
        const parallelPos = stagePositions.get(parallelId);
        if (parallelPos) {
          drawConnection(svg, targetPos, parallelPos, {
            type: 'parallel',
            status: 'parallel'
          });
        }
      });
    }
  };

  const drawConnection = (svg, startPos, endPos, options) => {
    const { type, status, isDirectDependency } = options;

    // Create SVG group for the connection
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('dependency-connection');

    // Calculate connection style based on type and status
    const connectionStyle = getConnectionStyle(type, status, isDirectDependency);

    // Create curved path
    const path = createCurvedPath(startPos, endPos, connectionStyle);
    group.appendChild(path);

    // Add arrow marker
    if (type === 'dependency' || type === 'dependent') {
      const marker = createArrowMarker(endPos, connectionStyle, type);
      group.appendChild(marker);
    }

    // Add connection to SVG
    svg.appendChild(group);
  };

  const getConnectionStyle = (type, status, isDirectDependency) => {
    const baseStyles = {
      dependency: {
        color: '#ef4444', // red
        width: isDirectDependency ? 3 : 2,
        opacity: isDirectDependency ? 0.8 : 0.5,
        dashArray: status === 'completed' ? 'none' : '5,5'
      },
      dependent: {
        color: '#3b82f6', // blue
        width: isDirectDependency ? 3 : 2,
        opacity: isDirectDependency ? 0.8 : 0.5,
        dashArray: 'none'
      },
      parallel: {
        color: '#10b981', // green
        width: 2,
        opacity: 0.6,
        dashArray: '3,3'
      }
    };

    // Adjust color based on status
    let color = baseStyles[type].color;
    if (status === 'completed') {
      color = '#10b981'; // green for completed
    } else if (status === 'blocked') {
      color = '#ef4444'; // red for blocked
    } else if (status === 'in_progress') {
      color = '#f59e0b'; // amber for in progress
    }

    return {
      ...baseStyles[type],
      color
    };
  };

  const createCurvedPath = (startPos, endPos, style) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Calculate control points for smooth curve
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Create curved path with control points
    const controlOffset = Math.min(distance * 0.4, 100);
    const cp1x = startPos.x + (dx > 0 ? controlOffset : -controlOffset);
    const cp1y = startPos.y;
    const cp2x = endPos.x + (dx > 0 ? -controlOffset : controlOffset);
    const cp2y = endPos.y;

    const pathData = `M ${startPos.x} ${startPos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endPos.x} ${endPos.y}`;
    
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', style.color);
    path.setAttribute('stroke-width', style.width);
    path.setAttribute('stroke-opacity', style.opacity);
    path.setAttribute('fill', 'none');
    if (style.dashArray !== 'none') {
      path.setAttribute('stroke-dasharray', style.dashArray);
    }
    
    // Add hover effects
    path.classList.add('transition-all', 'duration-300');
    
    return path;
  };

  const createArrowMarker = (endPos, style, type) => {
    const arrowSize = 8;
    const arrowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Calculate arrow direction (pointing towards end)
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    
    // Arrow pointing right (will be rotated based on direction)
    const points = `${endPos.x - arrowSize},${endPos.y - arrowSize/2} ${endPos.x},${endPos.y} ${endPos.x - arrowSize},${endPos.y + arrowSize/2}`;
    
    arrow.setAttribute('points', points);
    arrow.setAttribute('fill', style.color);
    arrow.setAttribute('opacity', style.opacity);
    
    arrowGroup.appendChild(arrow);
    return arrowGroup;
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-5"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Define arrow markers */}
        <defs>
          <marker
            id="arrow-dependency"
            viewBox="0 0 10 10"
            refX="9"
            refY="3"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
          </marker>
          <marker
            id="arrow-dependent"
            viewBox="0 0 10 10"
            refX="9"
            refY="3"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

export default DependencyConnections;