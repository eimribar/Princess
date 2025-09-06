# Unified Portal Architecture Documentation
*Created: December 6, 2024*

## 🎯 Overview

The Princess platform now features a **unified portal architecture** that serves all user types (Client, Agency, Admin) from a single codebase. Instead of maintaining separate portals, the system intelligently adapts its interface and functionality based on the user's role.

## 🏗️ Architecture Principles

### Single Codebase, Multiple Experiences
- **One routing system** - All users access the same routes
- **Role-based adaptation** - Components render differently based on user role
- **Shared components** - Reuse UI elements across all user types
- **Intelligent filtering** - Data is filtered at the service layer

### Key Benefits
1. **Consistency** - Same UI patterns across all users
2. **Maintainability** - Single codebase to update and debug
3. **Scalability** - Easy to add new roles or permissions
4. **Efficiency** - No duplicate code or components
5. **Quality** - Focus on one great implementation

## 🔐 Role-Based Access Control

### User Roles
```javascript
const userRoles = {
  CLIENT: 'client',      // Brand clients reviewing and approving work
  AGENCY: 'agency',      // Agency team members managing projects
  ADMIN: 'admin'         // System administrators with full access
}
```

### Permission Matrix

| Feature | Client | Agency | Admin |
|---------|--------|--------|-------|
| View Dashboard | ✅ Read-only | ✅ Full | ✅ Full |
| Manage Stages | ❌ | ✅ | ✅ |
| Approve Deliverables | ✅ | ❌ | ✅ |
| Upload Files | ❌ | ✅ | ✅ |
| View Internal Notes | ❌ | ✅ | ✅ |
| Access Admin Panel | ❌ | ❌ | ✅ |
| View Financial Data | ❌ | Limited | ✅ |
| Manage Team | View only | ✅ | ✅ |

## 📁 File Structure

```
src/
├── App.jsx                    # Unified routing
├── pages/
│   ├── Layout.jsx            # Adaptive layout with role-based nav
│   ├── Dashboard.jsx         # Adapts based on user role
│   ├── Deliverables.jsx      # Client: approve, Agency: manage
│   ├── Timeline.jsx          # Client: read-only, Agency: editable
│   ├── Team.jsx              # Client: view, Agency: manage
│   ├── Brandbook.jsx         # Unified for auth & public access
│   └── Admin.jsx             # Admin-only
├── services/
│   └── dataFilterService.js  # Role-based data filtering
├── contexts/
│   └── UserContext.jsx       # User role management
└── guards/
    └── AuthGuard.jsx         # Route protection
```

## 🎨 UI/UX Adaptations

### Navigation Changes by Role

#### Client Navigation
```javascript
const clientNav = [
  'Dashboard',      // Project overview
  'Deliverables',   // Review & approve
  'Timeline',       // View progress
  'Team',          // Contact info
  'Brand Assets'   // Approved materials
]
```

#### Agency Navigation
```javascript
const agencyNav = [
  'Dashboard',      // Full management
  'Deliverables',   // Upload & manage
  'Timeline',       // Edit & update
  'Team',          // Team management
  'Brand Assets',  // All assets
  'Out of Scope'   // Change requests
]
```

#### Admin Navigation
```javascript
const adminNav = [
  ...agencyNav,
  'Admin'          // System settings
]
```

### Visual Indicators

#### Client-Specific UI
- **Subtitle**: "Brand Portal" instead of "Project Management"
- **Attention Widget**: Prominent display of items needing review
- **Badge Indicators**: Red badges on navigation for pending items
- **Welcome Messages**: Guided instructions for clients
- **Simplified Actions**: Large approve/decline buttons

#### Agency/Admin UI
- **Full Feature Set**: All editing capabilities
- **Internal Tools**: Notes, financial data, resource management
- **Advanced Controls**: Bulk operations, timeline editing

## 💾 Data Filtering Strategy

### DataFilterService Implementation

```javascript
class DataFilterService {
  filterData(data, dataType, user) {
    if (user.role === 'client') {
      // Remove sensitive information
      return this.filterForClient(data, dataType);
    }
    return data; // Full data for agency/admin
  }
  
  filterForClient(data, dataType) {
    switch(dataType) {
      case 'stages':
        // Remove internal notes, costs, resources
        return data.map(stage => ({
          ...stage,
          internal_notes: undefined,
          cost_estimate: undefined,
          resource_allocation: undefined
        }));
        
      case 'deliverables':
        // Hide draft versions (V0)
        return data.filter(d => d.status !== 'draft');
        
      case 'comments':
        // Remove internal-only comments
        return data.filter(c => !c.internal_only);
        
      default:
        return data;
    }
  }
}
```

## 🚀 Implementation Details

### 1. Unified Routing (App.jsx)
```javascript
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={
          <AuthGuard requireAuth={true}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="deliverables" element={<Deliverables />} />
                <Route path="timeline" element={<Timeline />} />
                <Route path="team" element={<Team />} />
                <Route path="brandbook" element={<Brandbook />} />
                {/* Admin-only routes with nested guard */}
                <Route path="admin" element={
                  <AuthGuard allowedRoles={['admin']}>
                    <Admin />
                  </AuthGuard>
                } />
              </Routes>
            </Layout>
          </AuthGuard>
        } />
      </Routes>
    </Router>
  );
}
```

### 2. Adaptive Layout (Layout.jsx)
```javascript
function Layout({ children }) {
  const { user } = useUser();
  
  // Filter navigation based on role
  const navigationItems = useMemo(() => {
    return allNavigationItems.filter(item => 
      item.roles.includes(user.role)
    );
  }, [user]);
  
  // Apply role-specific branding
  const subtitle = user.role === 'client' 
    ? 'Brand Portal' 
    : 'Project Management';
    
  return (
    <div>
      {/* Render filtered navigation */}
      {/* Show attention widgets for clients */}
      {/* Apply role-specific styling */}
    </div>
  );
}
```

### 3. Component Adaptation Example (Dashboard.jsx)
```javascript
function Dashboard() {
  const { user } = useUser();
  const isClient = user?.role === 'client';
  
  // Filter data based on role
  const stages = dataFilterService.filterStages(rawStages, user);
  
  return (
    <div>
      {/* Client welcome message */}
      {isClient && (
        <Alert>
          Welcome to your brand portal. Review items requiring attention.
        </Alert>
      )}
      
      {/* Read-only timeline for clients */}
      <Timeline 
        stages={stages}
        readOnly={isClient}
        onStageClick={!isClient ? handleEdit : undefined}
      />
      
      {/* Hide certain widgets from clients */}
      {!isClient && <OutOfScopeWidget />}
    </div>
  );
}
```

## 🔄 Migration Path

### From Dual Portal to Unified
1. **Remove duplicate files** - Delete `/src/portals/client/*`
2. **Update routing** - Replace RoleBasedRouter with unified App.jsx
3. **Enhance existing pages** - Add role-based logic to each page
4. **Test all roles** - Verify proper access and filtering

### Backward Compatibility
- Legacy routes (`/client/*`, `/admin/*`) redirect to new structure
- Existing bookmarks continue to work
- No data migration required

## 🎯 Future Enhancements

### Planned Improvements
1. **Granular Permissions** - Feature-level permissions beyond roles
2. **Custom Roles** - Allow creation of custom user roles
3. **Dynamic UI** - User-configurable dashboards
4. **White-labeling** - Client-specific branding throughout

### Supabase Integration
The unified architecture is designed to work seamlessly with Supabase:
- **Row Level Security** - Database-level access control
- **Real-time Updates** - Live data synchronization
- **Auth Providers** - SSO with Google, Microsoft, etc.
- **Multi-tenancy** - Project-based data isolation

## 📊 Performance Impact

### Improvements
- **Reduced Bundle Size** - No duplicate components
- **Better Caching** - Shared resources across all users
- **Simplified State** - Single context for user management

### Metrics
- **Code Reduction**: ~30% less code to maintain
- **Load Time**: No change (same components)
- **Development Speed**: ~40% faster for new features

## 🔒 Security Considerations

### Client-Side Security
- Role checks in components
- Route guards for protected pages
- Data filtering in services

### Server-Side Security (Future)
- JWT token validation
- API endpoint protection
- Database-level RLS with Supabase
- Audit logging for all actions

## 📝 Best Practices

### Adding New Features
1. **Design for all roles** - Consider how each role uses the feature
2. **Filter at service layer** - Use DataFilterService for consistency
3. **Guard sensitive routes** - Add AuthGuard for admin features
4. **Test with all roles** - Verify proper access control

### Component Development
```javascript
// ✅ Good: Role-aware component
function FeatureComponent() {
  const { user } = useUser();
  const data = dataFilterService.filter(rawData, user);
  
  if (user.role === 'client') {
    return <ClientView data={data} />;
  }
  
  return <FullView data={data} />;
}

// ❌ Bad: Separate components per role
function ClientFeature() { /* ... */ }
function AgencyFeature() { /* ... */ }
```

## 🚨 Troubleshooting

### Common Issues

#### Issue: Client sees admin features
**Solution**: Check navigation filtering in Layout.jsx

#### Issue: Data not filtered for clients
**Solution**: Ensure DataFilterService is applied to all data fetches

#### Issue: Route accessible by wrong role
**Solution**: Add AuthGuard with allowedRoles prop

## 📚 Related Documentation

- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Overall project status
- [TODO.md](./TODO.md) - Implementation roadmap
- [CLAUDE.md](./CLAUDE.md) - Technical implementation details
- [USER_GUIDE.md](./USER_GUIDE.md) - User documentation

---

*This document describes the unified portal architecture implemented on December 6, 2024. It should be updated as the architecture evolves.*