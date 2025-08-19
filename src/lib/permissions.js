// Permission utility functions
export function hasPermission(user, permission) {
  return user?.permissions?.[permission] === true;
}

export function canEditStage(user, stage) {
  if (!user) return false;
  
  // Admin can edit anything
  if (user.role === 'admin') return true;
  
  // Agency can edit if not locked and they have edit permissions
  if (user.role === 'agency') {
    return hasPermission(user, 'canEdit') && stage.status !== 'completed';
  }
  
  // Clients cannot edit stages
  return false;
}

export function canApproveDeliverable(user, deliverable) {
  if (!user) return false;
  
  // Admin can approve anything
  if (user.role === 'admin') return true;
  
  // Clients can approve deliverables
  if (user.role === 'client') {
    return hasPermission(user, 'canApprove');
  }
  
  // Agency members cannot approve (conflict of interest)
  return false;
}

export function canManageTeamMember(user, teamMember) {
  if (!user) return false;
  
  // Admin can manage anyone
  if (user.role === 'admin') return true;
  
  // Agency can manage agency members, but not clients
  if (user.role === 'agency') {
    return hasPermission(user, 'canManageTeam') && 
           (teamMember?.team_type !== 'client');
  }
  
  // Clients cannot manage team
  return false;
}

export function canDeleteItem(user, item, itemType) {
  if (!user) return false;
  
  // Only admin can delete most items
  if (user.role === 'admin') return hasPermission(user, 'canDelete');
  
  // Special cases for specific items
  switch (itemType) {
    case 'comment':
      // Users can delete their own comments
      return item.author_email === user.email;
    
    case 'deliverable':
      // Agency can delete draft deliverables they created
      return user.role === 'agency' && 
             item.status === 'draft' && 
             hasPermission(user, 'canEdit');
    
    default:
      return false;
  }
}

export function getVisibleNavigationItems(user) {
  if (!user) return [];
  
  const allItems = [
    { name: 'Dashboard', path: '/', icon: 'LayoutDashboard', alwaysVisible: true },
    { name: 'Deliverables', path: '/deliverables', icon: 'Package', alwaysVisible: true },
    { name: 'Team', path: '/team', icon: 'Users', alwaysVisible: true },
    { name: 'Timeline', path: '/timeline', icon: 'Calendar', alwaysVisible: true },
    { name: 'Admin', path: '/admin', icon: 'Settings', requiresPermission: 'canViewAdmin' },
    { name: 'Brandbook', path: '/brandbook', icon: 'Book', alwaysVisible: true }
  ];
  
  return allItems.filter(item => 
    item.alwaysVisible || 
    (item.requiresPermission && hasPermission(user, item.requiresPermission))
  );
}

export function getRoleDisplayName(role) {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'agency': return 'Agency Team';
    case 'client': return 'Client Team';
    default: return 'Unknown Role';
  }
}

export function getRoleBadgeColor(role) {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-800 border-red-300';
    case 'agency': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'client': return 'bg-green-100 text-green-800 border-green-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

// Filter data based on user permissions
export function filterDataByPermissions(user, data, dataType) {
  if (!user || !data) return data;
  
  switch (dataType) {
    case 'stages':
      // Clients might have restricted view of certain stages
      if (user.role === 'client') {
        return data.filter(stage => stage.client_facing !== false);
      }
      return data;
    
    case 'deliverables':
      // All roles can see deliverables, but with different actions available
      return data;
    
    case 'comments':
      // Filter sensitive comments for clients
      if (user.role === 'client') {
        return data.filter(comment => !comment.internal_only);
      }
      return data;
    
    default:
      return data;
  }
}