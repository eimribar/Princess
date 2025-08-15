# Princess Project - AI Development Guidelines

This document contains specific instructions for AI-assisted development of the Princess brand development management platform.

## 🎯 Project Context

Princess is a sophisticated project management system for brand development agencies (specifically Deutsch & Co.). It manages a complex ~100-step branding workflow, providing transparency and structured communication between agencies and clients.

**Key Philosophy**: Transform the existing UI components into a sophisticated process management system while maintaining the clean, modern interface.

## 🏗️ Architecture Overview

### Current Foundation
- React 18 + Vite application
- Base44 SDK for backend operations
- TailwindCSS + shadcn/ui components
- Existing pages: Dashboard, Deliverables, Team, Admin, Timeline, Brandbook
- Well-structured component hierarchy

### Enhancement Strategy
Build upon existing components rather than rebuilding from scratch. Focus on adding sophisticated logic and interactions to the existing UI foundation.

## 🎨 UI/UX Requirements

### Visual Timeline System
The core feature that needs implementation:

```javascript
// Required visual elements:
// - Circles for regular steps (numbered)
// - Stars for deliverables (numbered) 
// - Color coding: Gray (not ready), Yellow (in progress), Red (blocked), Green (completed)
// - Interactive dependency highlighting on hover
// - Phase grouping with clear visual separation
```

### Status Color System
```javascript
const statusColors = {
  not_ready: 'bg-gray-100 text-gray-600 border-gray-300',
  in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-300', 
  blocked: 'bg-red-100 text-red-700 border-red-300',
  completed: 'bg-green-100 text-green-700 border-green-300'
};
```

### Interactive Dependencies
- Hover over any step/deliverable should highlight all prerequisite items
- Use different highlight colors for direct vs indirect dependencies
- Smooth transitions with Framer Motion

## 📊 Data Structure Requirements

### Enhanced Stage Model
```javascript
const StageStructure = {
  id: string,
  number_index: number,
  name: string,
  formal_name: string,
  is_deliverable: boolean,
  category: 'onboarding' | 'research' | 'strategy' | 'brand_building' | 'brand_collaterals' | 'brand_activation',
  status: 'not_ready' | 'in_progress' | 'blocked' | 'completed',
  dependencies: [stage_id], // Array of prerequisite stage IDs
  parallel_tracks: [stage_id], // Stages that can run in parallel
  blocking_priority: 'low' | 'medium' | 'high' | 'critical',
  resource_dependency: 'none' | 'client_materials' | 'external_vendor',
  description: string,
  wireframe_example: string, // URL or base64 image
  estimated_duration: number, // in days
  deadline_type: 'fixed_date' | 'relative_to_stage' | 'relative_to_previous',
  deadline_value: string | number,
  assigned_to: string, // team member email
  client_facing: boolean
};
```

### Enhanced Deliverable Model  
```javascript
const DeliverableStructure = {
  ...existing_fields,
  versions: [{
    version_number: string, // 'V0', 'V1', 'V2'
    status: 'draft' | 'submitted' | 'approved' | 'declined',
    submitted_date: date,
    feedback: string,
    feedback_counter: number,
    max_iterations: number,
    approval_date: date,
    approved_by: string
  }],
  include_in_brandbook: boolean,
  type: 'research' | 'strategy' | 'creative',
  priority: 'low' | 'medium' | 'high' | 'critical'
};
```

## 🔧 Component Development Guidelines

### Dashboard Component Enhancement
```javascript
// Required additions to src/pages/Dashboard.jsx:
// 1. Visual timeline rendering (circles/stars)
// 2. Dependency highlighting logic
// 3. Attention Required widget with real notifications
// 4. Progress percentage calculation
// 5. Interactive sidebar with stage details

// Key functions to implement:
const calculateProgress = (stages) => { /* logic */ };
const getDependencies = (stageId) => { /* logic */ };
const highlightDependencies = (stageId) => { /* visual highlighting */ };
const getAttentionItems = () => { /* pending approvals */ };
```

### Deliverables Enhancement
```javascript
// Required additions to src/pages/Deliverables.jsx:
// 1. Version control system (V0→V1→V2)
// 2. Approval workflow UI
// 3. Feedback collection interface
// 4. Email notification triggers
// 5. Iteration counter display

// Key components to build:
const VersionControl = ({ deliverable }) => { /* component */ };
const ApprovalWorkflow = ({ deliverable, onApprove, onDecline }) => { /* component */ };
const FeedbackInterface = ({ deliverable, onSubmitFeedback }) => { /* component */ };
```

### Admin Panel Enhancement
```javascript
// Required additions to src/pages/Admin.jsx:
// 1. Playbook template editor
// 2. Dependency configuration interface  
// 3. Team member role assignment
// 4. Notification settings management
// 5. Project template creation

// Key components to build:
const PlaybookEditor = () => { /* template management */ };
const DependencyManager = () => { /* visual dependency editor */ };
const NotificationSettings = () => { /* per-user preferences */ };
```

## 📡 API Integration Patterns

### Base44 SDK Usage
```javascript
// Use existing patterns but extend for new features:

// Enhanced stage management
const updateStageStatus = async (stageId, status) => {
  await Stage.update(stageId, { 
    status, 
    updated_at: new Date(),
    status_changed_by: currentUser.id 
  });
  // Trigger notifications
  await triggerNotifications(stageId, status);
};

// Deliverable version management
const createDeliverableVersion = async (deliverableId, versionData) => {
  const deliverable = await Deliverable.get(deliverableId);
  const updatedVersions = [...deliverable.versions, versionData];
  await Deliverable.update(deliverableId, { versions: updatedVersions });
};

// Dependency checking
const checkDependencies = async (stageId) => {
  const stage = await Stage.get(stageId);
  const dependencies = await Stage.filter({ id: { in: stage.dependencies } });
  return dependencies.every(dep => dep.status === 'completed');
};
```

### Email Integration (Future)
```javascript
// Placeholder for email notification system
const emailService = {
  sendApprovalRequest: async (deliverable, recipients) => {
    // Implementation with approval/decline links
  },
  sendStatusUpdate: async (stage, teamMembers) => {
    // Status change notifications
  },
  sendFeedbackRequest: async (deliverable, clientContacts) => {
    // Request for client feedback
  }
};
```

## 🎯 Implementation Priority

### Phase 1: Visual Timeline (Immediate)
1. **Update Dashboard.jsx** - Add visual timeline component
2. **Create TimelineVisualization.jsx** - Circles/stars rendering
3. **Implement dependency highlighting** - Interactive hover effects
4. **Add progress calculation** - Overall project percentage

### Phase 2: Enhanced Interactions
1. **Sidebar component** - Stage details with wireframe examples
2. **Attention Required widget** - Real notifications management
3. **Comment system** - Enhanced with notifications
4. **Status management** - Improved workflow state handling

### Phase 3: Deliverable Workflow
1. **Version control system** - V0→V1→V2 implementation  
2. **Approval interface** - Client approval workflow
3. **Feedback collection** - Structured feedback forms
4. **Email notifications** - Integration planning

## 🚀 Development Best Practices

### Component Structure
```javascript
// Follow this pattern for new components:
const ComponentName = ({ prop1, prop2, onAction }) => {
  // 1. State management (hooks)
  // 2. Effect hooks for data loading
  // 3. Event handlers
  // 4. Render logic with proper error boundaries
  // 5. Proper TypeScript types (gradual migration)
};

// Export with proper naming
export default ComponentName;
```

### State Management
- Use React hooks for component state
- Base44 SDK for server state with proper error handling  
- Context API for shared application state (theme, user, project)
- Avoid prop drilling - use context for deeply nested props

### Styling Guidelines
- Maintain existing TailwindCSS patterns
- Use shadcn/ui components as base, customize with Tailwind
- Implement consistent spacing and color schemes
- Ensure mobile responsiveness for all new features

### Error Handling
```javascript
// Implement proper error boundaries and loading states
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

try {
  setIsLoading(true);
  const result = await apiCall();
  // handle success
} catch (err) {
  setError(err.message);
  // show user-friendly error message
} finally {
  setIsLoading(false);
}
```

## 🔍 Testing Strategy

### Component Testing
- Test user interactions (clicks, hovers, form submissions)
- Mock Base44 SDK calls for predictable testing
- Test responsive behavior across screen sizes
- Verify accessibility compliance

### Integration Testing  
- Test complete workflows (stage progression, deliverable approval)
- Verify dependency logic correctness
- Test notification triggering
- Validate data persistence

## 📚 Key Files to Focus On

### Priority Files for Enhancement
1. **src/pages/Dashboard.jsx** - Main visual timeline implementation
2. **src/components/dashboard/VisualTimeline.jsx** - Create this new component
3. **src/pages/Deliverables.jsx** - Version control system
4. **src/components/dashboard/RequiresAttentionWidget.jsx** - Enhance notifications
5. **src/pages/Admin.jsx** - Playbook configuration features

### New Components to Create
- **src/components/timeline/TimelineVisualization.jsx** 
- **src/components/timeline/StageCircle.jsx**
- **src/components/timeline/DeliverableStar.jsx**
- **src/components/deliverables/VersionControl.jsx**
- **src/components/deliverables/ApprovalWorkflow.jsx**

## 🎨 Design Language

### Visual Consistency
- Maintain the existing modern, clean aesthetic
- Use consistent spacing (multiples of 4px/8px)
- Implement smooth transitions with Framer Motion
- Keep the professional color palette

### Interactive Elements
- Hover states for all interactive elements
- Loading states for async operations
- Clear visual feedback for user actions
- Accessibility compliance (keyboard navigation, screen readers)

---

*This document should be updated as the project evolves. Always maintain these guidelines when implementing new features.*