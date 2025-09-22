import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export function UserProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(() => {
    // Load user from localStorage on initialization
    const saved = localStorage.getItem('princess_user');
    return saved ? JSON.parse(saved) : {
      id: 'user_1',
      name: 'Current User',
      email: 'user@deutschco.com',
      role: 'admin', // 'admin', 'agency', 'client'
      team_type: 'agency', // 'agency' or 'client'
      is_decision_maker: false,
      notification_level: 3, // 1: all, 2: deliverables, 3: actions only
      notification_channels: ['email'], // ['email', 'sms']
      cover_image: null,
      profile_image: null,
      custom_buttons: [],
      permissions: {
        canEdit: true,
        canApprove: true,
        canDelete: true,
        canViewFinancials: true,
        canManageTeam: true,
        canManageProject: true,
        canEditPlaybook: true,
        canViewAdmin: true
      }
    };
  });

  // Simulate initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      // Simulate API call to verify session
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // Save to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('princess_user', JSON.stringify(user));
    }
  }, [user]);

  const setUserRole = (role) => {
    const permissions = getPermissionsByRole(role);
    setUser(prev => ({
      ...prev,
      role,
      permissions
    }));
  };

  const updateUser = (userData) => {
    setUser(prev => ({
      ...prev,
      ...userData
    }));
  };

  const contextValue = {
    user,
    setUser,
    setUserRole,
    updateUser,
    isLoading
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// Define permissions by role
function getPermissionsByRole(role) {
  switch (role) {
    case 'admin':
      return {
        canEdit: true,
        canApprove: true,
        canDelete: true,
        canViewFinancials: true,
        canManageTeam: true,
        canManageProject: true,
        canEditPlaybook: true,
        canViewAdmin: true
      };
    
    case 'agency':
      return {
        canEdit: true,
        canApprove: false, // Only for deliverables they own
        canDelete: false,
        canViewFinancials: false,
        canManageTeam: true,
        canManageProject: true,
        canEditPlaybook: false,
        canViewAdmin: true  // Fixed: Allow agency to view admin
      };
    
    case 'client':
      return {
        canEdit: false,
        canApprove: true, // Only for deliverables
        canDelete: false,
        canViewFinancials: false,
        canManageTeam: false,
        canManageProject: false,
        canEditPlaybook: false,
        canViewAdmin: false
      };
    
    default:
      return {
        canEdit: false,
        canApprove: false,
        canDelete: false,
        canViewFinancials: false,
        canManageTeam: false,
        canManageProject: false,
        canEditPlaybook: false,
        canViewAdmin: false
      };
  }
}

export default UserContext;