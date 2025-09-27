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
              console.error('[Auth] Profile fetch error:', profileError);
            }
            
            if (profile) {
              const enrichedUser = {
                ...profile,
                name: profile.full_name || profile.email.split('@')[0], // Add name field
                permissions: getPermissionsByRole(profile.role)
              };
              setUser(enrichedUser);
              console.log('[Auth] User profile loaded:', enrichedUser.email);
            } else {
              // No profile found - create one with default values
              console.log('[Auth] No profile found for user, creating default profile');
              
              // Get metadata from auth user
              const metadata = currentSession.user.user_metadata || {};
              const defaultOrgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
              
              // Create profile using upsert to handle existing emails
              const { data: newProfile, error: createError } = await supabase
                .from('users')
                .upsert({
                  id: currentSession.user.id,
                  email: currentSession.user.email,
                  full_name: metadata.full_name || currentSession.user.email.split('@')[0],
                  role: metadata.role || 'viewer',
                  organization_id: metadata.organization_id || defaultOrgId,
                  invitation_token: metadata.invitation_token,
                  needs_onboarding: metadata.needs_onboarding !== false, // Default true unless explicitly false
                  onboarding_completed: false,
                  notification_preferences: {
                    email: true,
                    sms: false,
                    level: 'all'
                  }
                }, {
                  onConflict: 'id',
                  ignoreDuplicates: false
                })
                .select()
                .single();
              
              if (createError) {
                console.error('[Auth] Failed to create profile:', createError);
                // Use minimal user object if profile creation fails
                const minimalUser = {
                  id: currentSession.user.id,
                  email: currentSession.user.email,
                  name: currentSession.user.email.split('@')[0],
                  role: metadata.role || 'viewer',
                  permissions: getPermissionsByRole(metadata.role || 'viewer'),
                  needs_onboarding: true
                };
                setUser(minimalUser);
              } else if (newProfile) {
                const enrichedUser = {
                  ...newProfile,
                  name: newProfile.full_name || newProfile.email.split('@')[0],
                  permissions: getPermissionsByRole(newProfile.role)
                };
                setUser(enrichedUser);
                console.log('[Auth] Profile created successfully for:', newProfile.email);
              }
            }
          }
          
          // Listen for auth changes - FIXED: No database operations in callback
          const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
            console.log('[Auth] State changed:', event, 'Session:', !!newSession);
            setSession(newSession);
            
            // Handle PASSWORD_RECOVERY event
            if (event === 'PASSWORD_RECOVERY') {
              console.log('[Auth] Password recovery event detected');
              // Don't set user or fetch profile during password recovery
              // The user should stay on the reset password page
              return;
            }
            
            // Set flags for useEffect to handle database operations
            if (event === 'SIGNED_IN' && newSession?.user) {
              // Check if this is from a password reset link
              const hashParams = new URLSearchParams(window.location.hash.substring(1));
              const type = hashParams.get('type');
              
              if (type === 'recovery') {
                console.log('[Auth] Signed in from password recovery link - skipping profile fetch');
                // Don't fetch profile yet, let the reset password page handle it
                return;
              }
              
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
        const { user: authUser, session } = await supabaseSignIn(email, password);
        
        // Explicitly set session and user to ensure immediate availability
        if (session) {
          setSession(session);
          console.log('[SupabaseUserContext] Sign in successful, session established');
          return { success: true, session, user: authUser };
        } else if (authUser) {
          // User exists but no session - likely email not confirmed
          console.log('[SupabaseUserContext] User authenticated but no session - email not confirmed');
          return { 
            success: false, 
            error: 'Please confirm your email address before signing in',
            emailNotConfirmed: true 
          };
        }
        
        // No user or session - login failed
        return { success: false, error: 'Invalid login credentials' };
      } catch (error) {
        console.error('[SupabaseUserContext] Sign in error:', error);
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
        console.log('[SupabaseUserContext] SignUp called for:', email);
        
        // CLIENT-SIDE VALIDATION: Temporarily disabled for testing
        // We'll re-enable this once the basic flow works
        if (!metadata.invitation_token) {
          console.warn('[SupabaseUserContext] No invitation token provided - allowing for testing');
        }
        
        // Enhanced metadata to include invitation details
        const enhancedMetadata = {
          ...metadata,
          signup_source: 'invitation',
          signup_timestamp: new Date().toISOString()
        };
        
        // supabaseSignUp returns the data object directly
        const data = await supabaseSignUp(email, password, enhancedMetadata);
        
        console.log('[SupabaseUserContext] SignUp response received');
        
        if (data?.user) {
          console.log('[SupabaseUserContext] User created successfully:', data.user.id);
          
          // Check if we got a session back
          if (data?.session) {
            setSession(data.session);
            console.log('[SupabaseUserContext] Session established - email confirmation is OFF');
            return { success: true, user: data.user, session: data.session };
          } else {
            // No session usually means email confirmation is required
            // But for invited users, this shouldn't happen with our trigger
            console.log('[SupabaseUserContext] No session returned - checking if email confirmation is required');
            
            // Check the user's email confirmation status
            if (data.user.email_confirmed_at) {
              console.log('[SupabaseUserContext] Email is confirmed but no session - this is unusual');
              return { 
                success: true, 
                user: data.user, 
                session: null,
                message: 'Account created. Please sign in.'
              };
            } else {
              console.log('[SupabaseUserContext] Email confirmation required (trigger may have failed)');
              return { 
                success: true, 
                user: data.user, 
                session: null,
                requiresEmailConfirmation: true,
                message: 'Please check your email to confirm your account'
              };
            }
          }
        }
        
        // No user returned - signup failed
        console.error('[SupabaseUserContext] No user returned from signup');
        return { success: false, error: 'Failed to create user account' };
      } catch (error) {
        console.error('[SupabaseUserContext] Signup error:', error);
        
        // Check for specific error cases
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          return {
            success: false,
            error: 'This email is already registered. Please sign in with your existing password.',
            userExists: true
          };
        }
        
        if (error.message?.includes('invitation')) {
          return {
            success: false,
            error: error.message,
            invitationError: true
          };
        }
        
        return { success: false, error: error.message || 'Failed to create account' };
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
    try {
      // Update local state first
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
          console.error('[SupabaseUserContext] Error updating user profile:', error);
          // Provide more specific error messages
          if (error.code === '42703') {
            return { 
              success: false, 
              error: 'Database schema not updated. Please run migration 013_user_profile_onboarding.sql' 
            };
          }
          return { success: false, error: error.message };
        }
        
        // Fetch updated profile to ensure consistency
        const { data: updatedProfile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!fetchError && updatedProfile) {
          setUser(updatedProfile);
        }
      } else if (!isSupabaseMode) {
        // In localStorage mode, just save to localStorage
        localStorage.setItem('princess_user', JSON.stringify(updatedUser));
      }
      
      return { success: true };
    } catch (error) {
      console.error('[SupabaseUserContext] Unexpected error in updateUser:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update profile' 
      };
    }
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