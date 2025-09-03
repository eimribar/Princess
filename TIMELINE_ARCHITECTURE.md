# Timeline System Architecture Documentation

## Overview
The Princess Timeline System is a comprehensive project management solution built with React, featuring interactive Gantt charts, smart dependency management, and real-time collaboration features.

## Core Architecture

### Component Hierarchy
```
Timeline.jsx (Main Page)
├── GanttChart.jsx (Interactive Timeline)
│   ├── TimelineRow.jsx (Grid Rows)
│   ├── GanttBar.jsx (Individual Stage Bars)
│   └── PhaseBar.jsx (Phase-level Visualization)
├── StageDetailsDialog.jsx (Stage Information Modal)
└── ClientFriendlyImpactDialog.jsx (Change Confirmation)
```

### State Management
```
ProjectContext.jsx
├── Stage Management
├── Dependency Validation
├── Cascade Updates
├── Undo/Redo System
└── Change History
```

### Service Layer
```
services/
├── dateCalculationService.js (Date Logic)
├── dependencyEngine.js (Topological Sorting)
└── notificationService.js (User Notifications)
```

## Key Features

### 1. Interactive Gantt Chart
- **Drag-and-Drop**: Move stages horizontally to reschedule
- **Resize Handles**: Adjust start/end dates by dragging bar edges
- **Visual Feedback**: Real-time preview during interactions
- **Validation**: Prevents invalid moves that would break dependencies

### 2. Smart Dependency System
- **Cascade Updates**: Moving a stage automatically adjusts dependent stages
- **Conflict Detection**: Prevents circular dependencies and impossible schedules
- **Topological Sorting**: Ensures proper execution order
- **Visual Indicators**: Shows dependency relationships with icons and colors

### 3. Phase-level Management
- **Monthly View**: Groups stages by project phases
- **Progress Tracking**: Shows completion percentage for each phase
- **Macro Planning**: High-level project overview for stakeholders
- **Phase Bars**: Visual representation of phase timelines

### 4. User Experience
- **Default Week View**: Optimized for micro-level management
- **Persistent Zoom**: Settings maintained across page reloads
- **Simplified Interface**: Clean layout focused on timeline visualization
- **Real-time Feedback**: Immediate validation with clear error messages

## Component Details

### GanttChart.jsx
**Purpose**: Main interactive timeline visualization

**Key Features**:
- Multiple zoom levels (day/week/month)
- Drag-and-drop functionality with react-dnd
- Phase grouping for monthly view
- Responsive grid layout
- Real-time updates

**Props**:
```javascript
{
  stages: Stage[],
  teamMembers: TeamMember[],
  onStageClick: (stageId) => void,
  onStageUpdate: (stageId, updates) => void,
  zoom: 'day' | 'week' | 'month',
  onZoomChange: (zoom) => void
}
```

### GanttBar.jsx
**Purpose**: Individual stage visualization and interaction

**Key Features**:
- Drag-and-drop stage movement
- Resize handles for date adjustment
- Status-based color coding
- Hover effects and tooltips
- Progress indicators

**Drag & Drop Implementation**:
```javascript
const [{ isDragging }, drag] = useDrag({
  type: 'gantt-bar',
  item: { 
    id: stage.id, 
    stage,
    originalStart: new Date(stage.start_date),
    originalEnd: new Date(stage.end_date)
  },
  canDrag: canEdit && !isResizing,
  collect: (monitor) => ({
    isDragging: monitor.isDragging(),
  }),
});
```

### PhaseBar.jsx
**Purpose**: Phase-level visualization for monthly view

**Key Features**:
- Progress percentage calculation
- Stage count display
- Phase-based color coding
- Click handlers for navigation
- Responsive width calculation

### ProjectContext.jsx
**Purpose**: Central state management and business logic

**Key Responsibilities**:
- Stage CRUD operations
- Dependency validation
- Cascade update calculations
- Undo/redo functionality
- Change history management

**Cascade Update Logic**:
```javascript
const handleCascadeUpdates = async (stageId, updates) => {
  // 1. Validate the proposed changes
  const validation = validateStageUpdate(stageId, updates);
  
  // 2. Calculate affected stages
  const affectedStages = calculateAffectedStages(stageId, updates);
  
  // 3. Show impact dialog if multiple stages affected
  if (affectedStages.length > 1) {
    setPendingChanges({ original: stageId, updates, affected: affectedStages });
    return false; // Wait for user confirmation
  }
  
  // 4. Apply changes immediately if no conflicts
  return await applyStageUpdates(stageId, updates);
};
```

## Data Flow

### 1. Stage Update Process
```
User Action (Drag/Resize)
    ↓
GanttBar.jsx (Local State)
    ↓
ProjectContext.updateStage()
    ↓
Dependency Validation
    ↓
Cascade Calculation
    ↓
Impact Dialog (if needed)
    ↓
Database Update
    ↓
UI Re-render
```

### 2. Dependency Resolution
```
Stage Move Request
    ↓
dependencyEngine.js
    ↓
Topological Sort
    ↓
Conflict Detection
    ↓
Cascade Calculation
    ↓
Date Adjustments
    ↓
Validation Complete
```

### 3. Date Calculations
```
Stage Date Change
    ↓
dateCalculationService.js
    ↓
Business Day Logic
    ↓
Weekend Adjustment
    ↓
Holiday Consideration
    ↓
Duration Preservation
    ↓
New Dates Calculated
```

## Technical Implementation

### Drag & Drop System
**Library**: react-dnd
**Implementation**: HTML5 Backend with custom drag previews

```javascript
// Drag Source (GanttBar)
const [{ isDragging }, drag] = useDrag({
  type: 'gantt-bar',
  item: { id, stage, originalStart, originalEnd },
  canDrag: canEdit && !isResizing
});

// Drop Target (TimelineRow)  
const [{ isOver }, drop] = useDrop({
  accept: 'gantt-bar',
  drop: handleDrop,
  collect: (monitor) => ({ isOver: monitor.isOver() })
});
```

### Date Handling
**Library**: date-fns
**Strategy**: Consistent ISO string storage, Date object calculations

```javascript
// Safe date conversion
const safeDateConversion = (date) => {
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return new Date(date).toISOString();
};
```

### Dependency Engine
**Algorithm**: Kahn's Algorithm for topological sorting
**Purpose**: Detect cycles, order dependencies, calculate cascades

```javascript
const topologicalSort = (stages) => {
  const graph = buildDependencyGraph(stages);
  const result = [];
  const queue = findNodesWithNoDependencies(graph);
  
  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node);
    
    for (const dependent of node.dependents) {
      dependent.dependencies.delete(node);
      if (dependent.dependencies.size === 0) {
        queue.push(dependent);
      }
    }
  }
  
  return result;
};
```

## Performance Considerations

### 1. Memoization
- `useMemo` for expensive calculations (date ranges, dependency graphs)
- `useCallback` for event handlers passed to children
- React.memo for pure components

### 2. Virtual Scrolling
- Not implemented yet, but recommended for projects with 200+ stages
- Consider react-window for large datasets

### 3. Debounced Updates
- Drag operations debounced to prevent excessive API calls
- 300ms debounce on resize operations

## Testing Strategy

### Unit Tests
- Dependency engine algorithms
- Date calculation functions
- Validation logic
- State management

### Integration Tests
- Drag and drop functionality
- Cascade update workflows
- Dialog interactions
- API integration

### User Experience Tests
- Timeline responsiveness
- Drag feedback accuracy
- Validation message clarity
- Mobile interaction

## Future Enhancements

### 1. Visual Dependency Lines
- SVG connections between dependent stages
- Animated flow indicators
- Collision detection and routing

### 2. Advanced Scheduling
- Resource allocation constraints
- Team member availability
- Critical path highlighting
- Schedule optimization algorithms

### 3. Real-time Collaboration
- WebSocket integration
- Live cursor tracking
- Conflict resolution
- Change broadcasting

### 4. Export Capabilities
- PDF timeline export
- MS Project integration
- Excel export with formulas
- PNG/SVG image export

## Troubleshooting

### Common Issues

**1. Blank Page on Timeline Changes**
- **Cause**: Date conversion errors in cascade updates
- **Solution**: Implemented safe date conversion in ProjectContext.jsx

**2. Stages Not Visible in Gantt**
- **Cause**: Date range mismatch between stage dates and timeline view
- **Solution**: Extended timeline range and fixed date comparison logic

**3. Dependency Cascade Not Working**
- **Cause**: Circular dependencies or invalid date calculations
- **Solution**: Added topological sorting and dependency validation

**4. Performance Issues with Large Projects**
- **Cause**: Excessive re-renders during drag operations
- **Solution**: Optimized useMemo dependencies and added debouncing

### Debug Tools
- Browser DevTools React Profiler
- Console logging for dependency calculations
- Timeline range debugging in GanttBar component
- Network tab for API call monitoring

## Maintenance Guidelines

### Code Style
- Follow existing React patterns
- Use TypeScript types (gradual migration)
- Maintain consistent naming conventions
- Add JSDoc comments for complex functions

### Version Control
- Feature branches for major changes
- Descriptive commit messages
- Regular pushes to prevent merge conflicts
- Tag releases with semantic versioning

### Documentation Updates
- Update this document for architectural changes
- Maintain CLAUDE.md with feature progress
- Document breaking changes in CHANGELOG.md
- Keep component props documentation current

---

*Last updated: August 22, 2025*
*Version: 1.0.0*