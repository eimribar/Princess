import { useUser } from '@/contexts/SupabaseUserContext';
import { useProject } from '@/contexts/ProjectContext';

/**
 * Hook for role-based view management
 * Provides easy access to role checks and permissions for conditional rendering
 */
export function useViewMode() {
  const { user } = useUser();
  const { teamMembers } = useProject();
  
  // Find current user's team member record if they're a client
  const currentTeamMember = user?.role === 'client' && teamMembers ? 
    teamMembers.find(m => m.email === user.email || m.user_id === user.id) : null;
  
  return {
    // Role checks
    isClient: user?.role === 'client',
    isAgency: user?.role === 'agency',
    isAdmin: user?.role === 'admin',
    
    // Decision maker check for clients
    isDecisionMaker: currentTeamMember?.is_decision_maker === true,
    
    // Permission checks
    canEdit: user?.role === 'admin' || user?.role === 'agency',
    canApprove: user?.role === 'admin' || 
                (user?.role === 'client' && currentTeamMember?.is_decision_maker === true),
    canManageTeam: user?.role === 'admin' || 
                   (user?.role === 'agency' && user?.permissions?.canManageTeam),
    canViewInternal: user?.role === 'admin' || user?.role === 'agency',
    
    // View mode for styling/classes
    viewMode: user?.role || 'guest',
    
    // User and team member info
    user,
    teamMember: currentTeamMember
  };
}