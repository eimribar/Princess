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
- UserContext for role-based permissions
- Notification system with real-time updates

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

### Team Member Model
```javascript
const TeamMemberStructure = {
  id: string,
  name: string,
  email: string,
  role: string,
  team_type: 'agency' | 'client',
  is_decision_maker: boolean,
  profile_image: string, // blob URL or uploaded image
  linkedin_url: string,
  bio: string, // auto-generated professional bio
  shortBio: string, // condensed version for cards
  expertise: string, // role-based expertise areas
  personal: string, // personal touch/humanizing element
  notification_preferences: {
    email: boolean,
    sms: boolean,
    level: 'all' | 'deliverables_only' | 'actions_required'
  }
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

### Team Page Components
```javascript
// Team page components (✅ Completed):
const TeamMemberCard = ({ member, index, onEdit }) => {
  // Premium expandable cards with gradient backgrounds
  // Edit functionality with role-based permissions
  // Professional bios and personal touches
  // Fixed animation bugs (no layoutId)
};

const EditTeamMemberDialog = ({ member, open, onOpenChange, onMemberUpdated }) => {
  // Comprehensive team member editing
  // Profile picture upload with validation
  // Notification preferences management
  // Decision maker toggle with business rules
};

const AddTeamMemberDialog = ({ open, onOpenChange, onMemberAdded }) => {
  // Team member creation workflow
  // Role assignment and permissions
  // Profile picture upload functionality
};
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

// Team member management
const createTeamMember = async (memberData) => {
  const enhancedData = {
    ...memberData,
    bio: generateBio(memberData),
    shortBio: generateShortBio(memberData),
    expertise: generateExpertise(memberData),
    personal: generatePersonalTouch(memberData)
  };
  return await TeamMember.create(enhancedData);
};

// Dependency checking
const checkDependencies = async (stageId) => {
  const stage = await Stage.get(stageId);
  const dependencies = await Stage.filter({ id: { in: stage.dependencies } });
  return dependencies.every(dep => dep.status === 'completed');
};
```

### File Upload Integration
```javascript
// Enhanced UploadFile implementation (✅ Completed)
const UploadFile = {
  upload: async (fileOrObject) => {
    const file = fileOrObject.file || fileOrObject;
    
    // Validation
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are supported');
    }
    
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }
    
    // Create blob URL for local development
    const url = URL.createObjectURL(file);
    return { 
      file_url: url, 
      id: `file_${Date.now()}`,
      filename: file.name,
      size: file.size,
      type: file.type
    };
  }
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

## 🎯 Implementation Status

### Phase 1: Visual Timeline (✅ Completed)
1. ✅ **Update Dashboard.jsx** - Visual timeline component implemented
2. ✅ **Create TimelineVisualization.jsx** - Circles/stars rendering complete
3. ✅ **Implement dependency highlighting** - Interactive hover effects working
4. ✅ **Add progress calculation** - Overall project percentage functional

### Phase 2: Enhanced Interactions (✅ Completed)
1. ✅ **Sidebar component** - Stage details with wireframe examples
2. ✅ **Attention Required widget** - Real notifications management system
3. ✅ **Comment system** - Enhanced with full notification integration
4. ✅ **Status management** - Improved workflow state handling
5. ✅ **UI Simplification** - Reduced information density, cleaner design
6. ✅ **Notification System** - Complete real-time notification system

### Phase 3: Deliverable Workflow (✅ Completed)
1. ✅ **Version control system** - V0→V1→V2 implementation complete
2. ✅ **Approval interface** - Client approval workflow functional
3. ✅ **Feedback collection** - Structured feedback forms implemented
4. ✅ **File preview system** - Multi-format file preview and download
5. ✅ **Version comparison** - Side-by-side version comparison tool
6. ✅ **Export functionality** - HTML, CSV, JSON export capabilities
7. ✅ **Version rollback** - Rollback to previous approved versions

### Phase 4: UI Optimization (✅ Completed)
1. ✅ **UI Density Optimization** - Simplified tab navigation (4→3 tabs)
2. ✅ **Streamlined Version Cards** - Minimal design with essential info only
3. ✅ **Notification Bell Integration** - Real-time notification badge system
4. ✅ **Layout Improvements** - Fixed container spacing and overflow issues
5. ✅ **Component Cleanup** - Removed unused components and imports
6. ✅ **Mobile Responsiveness** - Enhanced mobile experience

### Phase 5: Project Management Integration (✅ Completed)
1. ✅ **Overview Tab Action Buttons** - Status-based Submit/Approve/Decline buttons
2. ✅ **Approval Dialog System** - Modal with feedback requirements
3. ✅ **Quick Comment Integration** - Expandable comment section in Overview
4. ✅ **Recent Activity Preview** - Team visibility with comment history
5. ✅ **Status Normalization** - Case-insensitive status handling
6. ✅ **Enhanced Status Support** - Full support for all status types (draft, submitted, pending_approval, approved, declined)

### Phase 6: Team Management Redesign (✅ Completed - Aug 19, 2025)
1. ✅ **Premium Team Page Redesign** - Replaced "childish" components with sophisticated design
2. ✅ **Grid Layout Implementation** - Responsive grid (1-4 columns) replacing carousel
3. ✅ **TeamMemberCard Component** - Premium expandable cards with gradient backgrounds
4. ✅ **Professional Bio Generation** - Role-based bios, expertise, and personal touches
5. ✅ **Edit Functionality** - Edit button in expanded view with role-based permissions
6. ✅ **Profile Picture Upload** - Full validation, error handling, and blob URL support
7. ✅ **Animation Bug Fixes** - Removed problematic layoutId causing disappearing cards
8. ✅ **UserContext Integration** - Role-based permissions throughout team management
9. ✅ **Enhanced Dialogs** - AddTeamMemberDialog and EditTeamMemberDialog with full functionality
10. ✅ **Toast Notifications** - Comprehensive feedback for all user actions

### Phase 7: Timeline Enhancement (✅ Completed - Aug 22, 2025)
1. ✅ **GanttChart Component** - Interactive Gantt chart with drag-and-drop functionality
2. ✅ **GanttBar Component** - Individual stage bars with resize handles and hover effects
3. ✅ **Timeline Page Integration** - Complete Timeline page with Gantt/List view tabs
4. ✅ **Interactive Timeline Editing** - Drag-and-drop stage scheduling with validation
5. ✅ **Dependency Visualization** - Smart cascade system with conflict detection
6. ✅ **PhaseBar Component** - Phase-level visualization for macro project management
7. ✅ **StageDetailsDialog** - Comprehensive stage information with dependencies
8. ✅ **ProjectContext** - Central dependency validation and state management
9. ✅ **Undo/Redo System** - Timeline change history management
10. ✅ **Client-Friendly UX** - Simplified interface with clear impact dialogs

## 🚀 Next Development Priorities

### Phase 8: Admin Panel Enhancement (⏳ Pending)
1. **Playbook Template Management** - Create and edit process templates
2. **Dependency Configuration** - Visual editor for stage dependencies
3. **Team Role Management** - Assign permissions and access levels
4. **Notification Settings** - Global notification preferences
5. **Project Templates** - Reusable project configurations

### Phase 9: Advanced Features (⏳ Future)
1. **Email Integration** - Real email notifications and approvals
2. **Advanced Reporting** - Performance analytics and insights
3. **Client Portal** - Dedicated client view with limited access
4. **API Documentation** - Complete API endpoints documentation
5. **Mobile App** - React Native mobile application

### Phase 10: Production Readiness (⏳ Future)
1. **Performance Optimization** - Code splitting and lazy loading
2. **Security Hardening** - Authentication and authorization
3. **Error Monitoring** - Sentry integration and error tracking
4. **Database Migration** - Production database setup
5. **Deployment Pipeline** - CI/CD with automated testing

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

## 📚 Key Files and Components

### Core Application Files
1. **src/main.jsx** - Application entry point with UserContext provider
2. **src/pages/Layout.jsx** - Main layout with navigation and notification bell
3. **src/contexts/UserContext.jsx** - User state and role management
4. **src/lib/permissions.js** - Role-based permission utilities

### Enhanced Pages (Completed)
1. **src/pages/Dashboard.jsx** - Visual timeline with interactive elements
2. **src/pages/Deliverables.jsx** - Version control and approval workflow
3. **src/pages/DeliverableDetail.jsx** - Detailed deliverable management
4. **src/pages/Team.jsx** - Premium team management with grid layout
5. **src/pages/Timeline.jsx** - Gantt chart and timeline visualization

### Key Components Created
#### Dashboard Components
- ✅ **src/components/timeline/TimelineVisualization.jsx** - Visual timeline rendering
- ✅ **src/components/timeline/StageCircle.jsx** - Circle visualization for stages
- ✅ **src/components/timeline/DeliverableStar.jsx** - Star visualization for deliverables

#### Timeline Components (Complete System)
- ✅ **src/components/timeline/GanttChart.jsx** - Interactive Gantt chart with drag-and-drop
- ✅ **src/components/timeline/GanttBar.jsx** - Individual stage bars with resize handles
- ✅ **src/components/timeline/PhaseBar.jsx** - Phase-level visualization for monthly view
- ✅ **src/components/timeline/StageDetailsDialog.jsx** - Comprehensive stage information modal
- ✅ **src/components/timeline/ClientFriendlyImpactDialog.jsx** - User-friendly change confirmation
- ✅ **src/components/timeline/TimelineRow.jsx** - Timeline grid row component
- ✅ **src/components/timeline/DependencyHoverCard.jsx** - Interactive dependency tooltips
- ✅ **src/contexts/ProjectContext.jsx** - Central dependency validation and state management
- ✅ **src/services/dateCalculationService.js** - Date calculation and validation service
- ✅ **src/services/dependencyEngine.js** - Topological sorting and dependency resolution

#### Team Management Components
- ✅ **src/components/team/TeamMemberCard.jsx** - Premium expandable team cards
- ✅ **src/components/team/AddTeamMemberDialog.jsx** - Team member creation dialog
- ✅ **src/components/team/EditTeamMemberDialog.jsx** - Team member editing dialog

#### Deliverable Components
- ✅ **src/components/deliverables/VersionControl.jsx** - Version management
- ✅ **src/components/deliverables/ApprovalWorkflow.jsx** - Approval process workflow
- ✅ **src/components/deliverables/VersionComparison.jsx** - Version comparison tool
- ✅ **src/components/deliverables/VersionReport.jsx** - Export functionality
- ✅ **src/components/deliverables/FilePreview.jsx** - File preview system
- ✅ **src/components/deliverables/StatusIndicator.jsx** - Visual status indicators
- ✅ **src/components/deliverables/FileTypeIcon.jsx** - File type detection and icons

#### Notification Components
- ✅ **src/components/notifications/NotificationBell.jsx** - Notification bell with badge
- ✅ **src/components/notifications/NotificationCenter.jsx** - Notification management

#### Service Files
- ✅ **src/services/notificationService.js** - Notification business logic
- ✅ **src/api/integrations.js** - Enhanced with working file upload
- ✅ **src/api/initializeData.js** - Enhanced with comprehensive test data

## 🎨 Design Language

### Visual Consistency
- Maintain the existing modern, clean aesthetic
- Use consistent spacing (multiples of 4px/8px)
- Implement smooth transitions with Framer Motion
- Keep the professional color palette
- Premium gradient backgrounds for enhanced visual appeal

### Interactive Elements
- Hover states for all interactive elements
- Loading states for async operations
- Clear visual feedback for user actions
- Accessibility compliance (keyboard navigation, screen readers)

### Team Page Design Principles
- **Professional Premium Aesthetic** - Sophisticated design suitable for high-end agency clients
- **Grid-based Layout** - Responsive grid system (1-4 columns based on screen size)
- **Expandable Cards** - Detailed view with professional bios and personal touches
- **Role-based Permissions** - Edit functionality based on user permissions
- **Visual Hierarchy** - Clear distinction between decision makers and team members

## 📝 Recent Changes Summary

### Phase 7: Timeline System Implementation (Aug 22, 2025)
**Problem**: Timeline page needed comprehensive project management functionality with dependency tracking.

**Solution**: Complete timeline system with advanced dependency management:
- Interactive Gantt chart with drag-and-drop stage scheduling
- Smart dependency cascade system with automatic date adjustments
- Phase-level visualization for macro project management
- Real-time dependency validation and conflict detection
- User-friendly change confirmation dialogs
- Undo/redo functionality for timeline modifications

### Major Technical Achievements
- **ProjectContext**: Central state management for timeline with dependency validation
- **Dependency Engine**: Topological sorting and cascade update algorithms
- **Date Calculation Service**: Comprehensive date handling and validation
- **Interactive Components**: Drag-and-drop with visual feedback and constraints
- **Phase Grouping**: Monthly view with phase-level progress tracking
- **Client-Friendly UX**: Simplified interface with clear impact explanations

### User Experience Improvements
- **Default Week View**: Changed from monthly to weekly for micro-level management
- **Persistent Zoom**: Timeline zoom settings maintained across interactions
- **Clickable Stages**: Comprehensive stage details with dependency information
- **Simplified Layout**: Removed statistics and filters for focused timeline view
- **Real-time Feedback**: Immediate validation with clear error messages
- **Overall Progress**: Project completion tracking at page level

### Team Page Complete Redesign (Aug 19, 2025)
**Previous Achievement**: Transformed "childish" components into sophisticated premium design:
- Responsive grid layout with expandable premium cards
- Professional bio generation with role-based expertise
- Profile picture upload with comprehensive validation
- Role-based permissions and decision maker management
- Fixed animation bugs and enhanced mobile responsiveness

## 🎯 Recently Completed Development (September 3, 2025)

### Phase 8: Feedback Loop Management ✅ COMPLETE
**Implementation Details:**
1. **FeedbackManager Component** (`/src/components/deliverables/FeedbackManager.jsx`)
   - Central feedback hub with iteration tracking
   - Automatic deadline adjustment (3 days per feedback round)
   - Required feedback for decline actions
   - Integration with notification system
   - Handles edge cases with safe defaults

2. **FeedbackLimitIndicator Component** (`/src/components/deliverables/FeedbackLimitIndicator.jsx`)
   - Shows "X of Y iterations used" with remaining count
   - Smart display logic (no "0 remaining" for new deliverables)
   - Compact and full display modes
   - Visual progress bars and iteration dots

3. **DeadlineImpactWarning Component** (`/src/components/deliverables/DeadlineImpactWarning.jsx`)
   - Timeline visualization with severity levels
   - Breakdown of impact per feedback round
   - Projected impact calculations
   - Summary statistics grid

4. **ApprovalFinality Component** (`/src/components/deliverables/ApprovalFinality.jsx`)
   - One-way approval messaging
   - Lock icons for finalized items
   - Audit trail with approval metadata
   - Warning dialogs before final approval

### Phase 9: Playbook Template Editor (Admin) ✅ COMPLETE
**Implementation Details:**
1. **TemplateManager Component** (`/src/components/admin/PlaybookEditor/TemplateManager.jsx`)
   - Complete CRUD operations for templates
   - Import/Export as JSON files
   - Template categories and search
   - localStorage persistence
   - Tab navigation between views

2. **StageBuilder Component** (`/src/components/admin/PlaybookEditor/StageBuilder.jsx`)
   - Drag-and-drop with @hello-pangea/dnd
   - Inline editing of stage properties
   - Bulk operations (add 5 stages)
   - Phase grouping with expand/collapse
   - Visual indicators (stars/circles)

3. **DependencyBuilder Component** (`/src/components/admin/PlaybookEditor/DependencyBuilder.jsx`)
   - Visual dependency configuration
   - Circular dependency detection (DFS algorithm)
   - Auto-generate based on phase order
   - Validation with error reporting
   - Shows dependencies and dependents

4. **TemplateVersioning Component** (`/src/components/admin/PlaybookEditor/TemplateVersioning.jsx`)
   - Version snapshots with notes
   - Complete history timeline
   - Restore to previous versions
   - Export specific versions
   - Change tracking visualization

## ✅ Recently Completed: Project Initialization Wizard (December 6, 2024)

### Phase 10: Project Initialization Wizard ✅ COMPLETE
1. **ProjectSetup.jsx** - Main wizard container with animated stepper
2. **TemplateSelector** - Visual gallery with comparison mode
3. **StageCustomizer** - Drag-and-drop with bulk operations
4. **TeamConfiguration** - Role-based assignment with capacity tracking
5. **TimelineSetup** - Interactive timeline with feasibility analysis
6. **ClientPreferences** - Notifications, branding, and integrations
7. **ProjectReview** - Comprehensive summary with cost estimation

## 🚀 Next Development Priorities

### Phase 11: Production Deployment (Next Priority)
1. **Authentication System** - User login and session management
2. **Database Migration** - Move from localStorage to production DB
3. **API Development** - RESTful endpoints with documentation
4. **Security Implementation** - SSL, CORS, input validation
5. **Performance Optimization** - Code splitting, CDN, caching

### Phase 12: Email/SMS Notifications
1. **Email Service** - SendGrid or AWS SES integration
2. **HTML Templates** - Responsive email designs
3. **SMS Provider** - Twilio for critical alerts
4. **Action Links** - Direct approve/decline URLs
5. **Tracking** - Analytics and delivery monitoring

### Phase 12: Public Brandbook Page
1. **Public Routes** - No-auth required pages
2. **Asset Gallery** - Visual grid display
3. **Download Center** - Bulk download support
4. **Sharing** - Social and email sharing
5. **SEO** - Meta tags and sitemap

## 🔧 Technical Implementation Notes

### New Dependencies Added
```json
{
  "@hello-pangea/dnd": "^18.0.1"  // Drag-and-drop for stage builder
}
```

### Data Model Enhancements
```javascript
// Deliverable model additions
{
  max_iterations: 3,              // Maximum feedback rounds
  current_iteration: 0,            // Current iteration count
  iteration_history: [],           // Complete feedback log
  deadline_impact_total: 0,        // Cumulative delay in days
  is_final: false,                 // Locked approval status
  original_deadline: null,         // Original target date
  adjusted_deadline: null          // Current adjusted date
}
```

### localStorage Keys
- `playbook_templates` - Template definitions
- `template_versions_{id}` - Version history per template
- `notifications` - User notifications
- `project_data` - Main project data
- `projectSetupDraft` - Auto-saved wizard progress

### Performance Optimizations
- Memoized expensive calculations in feedback components
- Debounced drag operations in StageBuilder
- Lazy loading for template versions
- Virtual scrolling ready for 200+ stages

## 🏗️ Unified Portal Architecture (December 6, 2024 - Evening)

### Architecture Decision
Moved from separate client/agency portals to a **unified portal architecture** where the same codebase intelligently adapts based on user role.

### Key Implementation Details

#### Routing Simplification
```javascript
// Before: Separate routes
<Route path="/client/*" element={<ClientPortal />} />
<Route path="/admin/*" element={<AdminPortal />} />

// After: Unified routes
<Route path="/*" element={
  <Layout> {/* Adapts based on user.role */}
    <Routes>
      <Route path="dashboard" element={<Dashboard />} />
      {/* Same routes for all, different content */}
    </Routes>
  </Layout>
} />
```

#### Role-Based Adaptations
```javascript
// Components adapt based on role
function Dashboard() {
  const { user } = useUser();
  const isClient = user?.role === 'client';
  
  // Filter data
  const data = dataFilterService.filter(rawData, user);
  
  // Render based on role
  return isClient ? <ClientView /> : <FullView />;
}
```

#### Navigation Filtering
```javascript
// Dynamic navigation based on role
const navigationItems = allItems.filter(item => 
  item.roles.includes(user.role)
);
```

### Benefits Achieved
- **30% code reduction** - No duplicate components
- **Consistent UX** - Same patterns for all users
- **Easier maintenance** - Single codebase
- **Better scalability** - Easy to add new roles

### Files Modified
- `App.jsx` - Unified routing structure
- `Layout.jsx` - Role-based navigation and UI
- `Dashboard.jsx` - Adaptive rendering
- `DataFilterService.js` - Enhanced filtering
- `Brandbook.jsx` - Unified for auth/public

### Files Removed (To Be Cleaned)
- `/src/portals/client/*` - Duplicate client portal
- `/src/guards/RoleBasedRouter.jsx` - No longer needed

---

*Last updated: December 6, 2024 - Evening*
*Version: 5.0.0 - Unified Portal Architecture*

This document should be updated as the project evolves. Always maintain these guidelines when implementing new features.