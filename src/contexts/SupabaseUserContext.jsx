import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  supabase, 
  isSupabaseConfigured, 
  getCurrentUser, 
  signIn as supabaseSignIn,
  signUp as supabaseSignUp,
  signOut as supabaseSignOut,
  signInWithGoogle as supabaseSignInWithGoogle
} from '../lib/supabase';

const UserContext = createContext();

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Default user for localStorage mode
// IMPORTANT: Default to 'client' role for security - users can upgrade role if needed
const DEFAULT_USER = {
  id: 'user_1',
  name: 'Current User',
  email: 'user@deutschco.com',
  role: 'client',  // Changed from 'admin' to 'client' for security
  team_type: 'client',  // Changed from 'agency' to 'client'
  is_decision_maker: false,
  notification_level: 3,
  notification_channels: ['email'],
  cover_image: null,
  profile_image: null,
  custom_buttons: [],
  permissions: {
    canEdit: false,  // Clients cannot edit
    canApprove: false,  // Non-decision-maker clients cannot approve
    canDelete: false,
    canViewFinancials: false,
    canManageTeam: false,
    canManageProject: false,
    canEditPlaybook: false,
    canViewAdmin: false
  }
};

export function UserProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  // Use Supabase when configured, fallback to localStorage
  const [isSupabaseMode, setIsSupabaseMode] = useState(isSupabaseConfigured())

  // Initialize user state
  useEffect(() => {
    let subscription;
    
    const initializeAuth = async () => {
      // console.log('Initializing auth, Supabase mode:', isSupabaseMode);
      setIsLoading(true);
      
      try {
        if (isSupabaseMode && supabase) {
          // console.log('Using Supabase authentication');
          // Get initial session from Supabase
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            // console.error('Session error:', sessionError);
            throw sessionError;
          }
          
          // console.log('Current session:', currentSession);
          setSession(currentSession);
          
          if (currentSession?.user) {
            // Fetch user profile from database
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();
            
            if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
              // console.error('Profile fetch error:', profileError);
            }
            
            if (profile) {
              const enrichedUser = {
                ...profile,
                name: profile.full_name || profile.email.split('@')[0], // Add name field
                permissions: getPermissionsByRole(profile.role)
              };
              setUser(enrichedUser);
              // console.log('User profile loaded:', enrichedUser);
              // console.log('User role:', enrichedUser.role);
              // console.log('User permissions:', enrichedUser.permissions);
            } else {
              // console.warn('No profile found for user, using defaults');
              // Create a default user profile if none exists
              const defaultUser = {
                id: currentSession.user.id,
                email: currentSession.user.email,
                name: currentSession.user.email.split('@')[0],
                role: 'viewer',
                permissions: getPermissionsByRole('viewer')
              };
              setUser(defaultUser);
            }
          }
          
          // Listen for auth changes - FIXED: No database operations in callback
          const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
            // console.log('Auth state changed:', event);
            setSession(newSession);
            
            // Set flags for useEffect to handle database operations
            if (event === 'SIGNED_IN' && newSession?.user) {
              // Store user info temporarily, fetch profile in useEffect
              setUser({
                id: newSession.user.id,
                email: newSession.user.email,
                name: newSession.user.email.split('@')[0],
                role: 'viewer',
                permissions: getPermissionsByRole('viewer'),
                needsProfileFetch: true // Flag to trigger profile fetch in useEffect
              });
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
            }
          });
          
          subscription = authListener?.subscription;
        } else {
          // console.log('Using localStorage fallback');
          // Use localStorage mode
          loadLocalStorageUser();
        }
      } catch (error) {
        // console.error('Auth initialization error:', error);
        // Fall back to localStorage mode
        setIsSupabaseMode(false);
        loadLocalStorageUser();
      } finally {
        // Always set loading to false
        setIsLoading(false);
        // console.log('Auth initialization complete');
      }
    };

    initializeAuth();
    
    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [isSupabaseMode]);

  // Load user from localStorage (fallback mode)
  const loadLocalStorageUser = () => {
    const saved = localStorage.getItem('princess_user');
    const localUser = saved ? JSON.parse(saved) : DEFAULT_USER;
    setUser(localUser);
  };

  // Save to localStorage in fallback mode
  useEffect(() => {
    if (!isSupabaseMode && user) {
      localStorage.setItem('princess_user', JSON.stringify(user));
    }
  }, [user, isSupabaseMode]);

  // Handle profile fetching separately from auth state changes to avoid hanging
  useEffect(() => {
    if (user?.needsProfileFetch && session?.user && supabase) {
      const fetchProfile = async () => {
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            const enrichedUser = {
              ...profile,
              name: profile.full_name || profile.email.split('@')[0],
              permissions: getPermissionsByRole(profile.role),
              needsProfileFetch: false // Clear the flag
            };
            setUser(enrichedUser);
            // console.log('User profile loaded:', enrichedUser);
          } else {
            // Just clear the flag if no profile found
            setUser(prev => ({ ...prev, needsProfileFetch: false }));
          }
        } catch (error) {
          // console.error('Error fetching user profile:', error);
          // Clear the flag on error
          setUser(prev => ({ ...prev, needsProfileFetch: false }));
        }
      };
      
      fetchProfile();
    }
  }, [user?.needsProfileFetch, session?.user]);

  // Authentication methods
  const signIn = useCallback(async (email, password) => {
    if (isSupabaseMode) {
      try {
        const { user: authUser } = await supabaseSignIn(email, password);
        // User state will be updated via onAuthStateChange
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Mock sign in for localStorage mode
      const mockUser = {
        ...DEFAULT_USER,
        email,
        name: email.split('@')[0]
      };
      setUser(mockUser);
      return { success: true };
    }
  }, [isSupabaseMode]);

  const signUp = async (email, password, metadata = {}) => {
    if (isSupabaseMode) {
      try {
        const { data, error } = await supabaseSignUp(email, password, metadata);
        
        if (error) throw error;
        
        // Create user profile in database
        if (data.user) {
          // Use default organization for now
          const defaultOrgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
          
          const { error: profileError } = await supabase.from('users').insert({
            id: data.user.id,
            email: data.user.email,
            full_name: metadata.full_name || email.split('@')[0],
            role: metadata.role || 'viewer',
            organization_id: defaultOrgId,
            notification_preferences: {
              email: true,
              sms: false,
              level: 'all'
            }
          });
          
          if (profileError) {
            // console.error('Error creating user profile:', profileError);
            // Don't fail signup if profile creation fails
          }
        }
        
        return { success: true, user: data.user };
      } catch (error) {
        // console.error('Signup error:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Mock sign up for localStorage mode
      const mockUser = {
        ...DEFAULT_USER,
        email,
        name: metadata.full_name || email.split('@')[0],
        role: metadata.role || 'viewer'
      };
      setUser(mockUser);
      return { success: true };
    }
  };

  const signInWithGoogle = async () => {
    if (isSupabaseMode) {
      try {
        await supabaseSignInWithGoogle();
        // User state will be updated via onAuthStateChange
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Mock Google sign in for localStorage mode
      const mockUser = {
        ...DEFAULT_USER,
        email: 'google.user@example.com',
        name: 'Google User'
      };
      setUser(mockUser);
      return { success: true };
    }
  };

  const signOut = async () => {
    if (isSupabaseMode) {
      try {
        await supabaseSignOut();
        setUser(null);
        setSession(null);
      } catch (error) {
        // console.error('Sign out error:', error);
      }
    } else {
      // Clear localStorage
      localStorage.removeItem('princess_user');
      setUser(null);
    }
  };

  const setUserRole = (role) => {
    console.log('🔄 setUserRole called - Changing role from', user?.role, 'to', role);
    const permissions = getPermissionsByRole(role);
    const updatedUser = {
      ...user,
      role,
      permissions
    };
    setUser(updatedUser);
    console.log('✅ User role updated to:', role, 'with permissions:', permissions);
    
    // Update in database if using Supabase
    if (isSupabaseMode && user?.id) {
      supabase
        .from('users')
        .update({ role })
        .eq('id', user.id)
        .then(() => {
          // Silently handle update - already logged by Supabase if needed
        });
    }
  };

  const updateUser = async (userData) => {
    const updatedUser = {
      ...user,
      ...userData
    };
    setUser(updatedUser);
    
    // Update in database if using Supabase
    if (isSupabaseMode && user?.id) {
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', user.id);
      
      if (error) {
        // console.error('Error updating user:', error);
        return { success: false, error: error.message };
      }
    }
    
    return { success: true };
  };

  const contextValue = useMemo(() => ({
    user,
    setUser,
    setUserRole,
    updateUser,
    isLoading,
    isAuthenticated: !!user,
    isSupabaseMode,
    session,
    signIn,
    signUp,
    signInWithGoogle,
    signOut
  }), [user, setUser, setUserRole, updateUser, isLoading, isSupabaseMode, session, signIn, signUp, signInWithGoogle, signOut]);

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
        canApprove: false,
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
        canApprove: true,
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