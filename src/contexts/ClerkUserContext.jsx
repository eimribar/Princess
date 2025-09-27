import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser as useClerkUser, useAuth, useClerk } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';

const UserContext = createContext({});

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
  const { isSignedIn, signOut: clerkSignOut } = useAuth();
  const { openSignIn, openSignUp } = useClerk();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseMode] = useState(true); // Always true since we're using Supabase for data

  // Sync Clerk user with our database
  useEffect(() => {
    const syncUser = async () => {
      if (!clerkLoaded) {
        return;
      }

      if (isSignedIn && clerkUser) {
        try {
          // First, try to find user by clerk_user_id (most reliable)
          let { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('clerk_user_id', clerkUser.id)
            .single();

          // If not found by clerk_user_id, try by email (for backwards compatibility)
          if (fetchError && fetchError.code === 'PGRST116') {
            const emailResult = await supabase
              .from('users')
              .select('*')
              .eq('email', clerkUser.primaryEmailAddress?.emailAddress)
              .single();
            
            existingUser = emailResult.data;
            fetchError = emailResult.error;

            // If found by email but no clerk_user_id, update it
            if (existingUser && !existingUser.clerk_user_id) {
              const { error: updateError } = await supabase
                .from('users')
                .update({ clerk_user_id: clerkUser.id })
                .eq('id', existingUser.id);
              
              if (updateError) {
                console.error('Error updating clerk_user_id:', updateError);
              } else {
                existingUser.clerk_user_id = clerkUser.id;
              }
            }
          }

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user from Supabase:', fetchError);
            // Fallback: Create a temporary user object from Clerk data
            const fallbackUser = {
              id: 'temp-' + clerkUser.id,
              email: clerkUser.primaryEmailAddress?.emailAddress,
              full_name: clerkUser.fullName || clerkUser.firstName || 'User',
              role: clerkUser.publicMetadata?.role || 'client',
              organization_id: clerkUser.publicMetadata?.organization_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
              is_active: true,
              clerk_user_id: clerkUser.id
            };
            setUser(fallbackUser);
            setLoading(false);
            console.warn('Using fallback user data due to Supabase error');
            return;
          }

          let userData = existingUser;

          // If user doesn't exist, create them
          if (!existingUser) {
            console.log('Creating new user in Supabase for Clerk user:', clerkUser.id);
            
            // Generate a proper UUID for consistency with existing data
            const generateUUID = () => {
              return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
              });
            };

            // Check if user came from an invitation (has metadata)
            const isFromInvitation = !!clerkUser.publicMetadata?.project_id;
            
            const newUser = {
              id: generateUUID(), // Use UUID for internal consistency
              clerk_user_id: clerkUser.id, // Store Clerk ID for authentication
              email: clerkUser.primaryEmailAddress?.emailAddress,
              full_name: clerkUser.fullName || clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress.split('@')[0],
              role: clerkUser.publicMetadata?.role || 'client',
              organization_id: clerkUser.publicMetadata?.organization_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
              avatar_url: clerkUser.imageUrl || null,
              phone: clerkUser.primaryPhoneNumber?.phoneNumber || null,
              notification_preferences: {
                email: true,
                sms: false,
                level: 'all'
              },
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              onboarding_completed: false,
              onboarding_progress: {},
              onboarding_started_at: null,
              onboarding_completed_at: null,
              profile_image: clerkUser.imageUrl || null,
              title: null,
              department: null,
              bio: null,
              needs_onboarding: true,
              invitation_token: null,
              invited_by: clerkUser.publicMetadata?.invited_by || null
            };

            const { data: createdUser, error: createError } = await supabase
              .from('users')
              .insert([newUser])
              .select()
              .single();

            if (createError) {
              console.error('Error creating user in Supabase:', createError);
              console.error('Attempted data:', newUser);
              
              // Still set a fallback user so the app doesn't break
              const fallbackUser = {
                ...newUser,
                id: 'temp-' + clerkUser.id
              };
              setUser(fallbackUser);
              setLoading(false);
              return;
            }

            console.log('Successfully created user in Supabase:', createdUser);
            userData = createdUser;

            // If user came from invitation, create team_member record
            if (isFromInvitation && clerkUser.publicMetadata?.project_id) {
              console.log('Creating team member from invitation metadata');
              console.log('Invitation metadata:', clerkUser.publicMetadata);
              
              // Use team_type from metadata if available, otherwise determine based on role
              const teamType = clerkUser.publicMetadata.team_type || 
                              (clerkUser.publicMetadata.role === 'agency' ? 'agency' : 'client');
              
              const teamMemberData = {
                project_id: clerkUser.publicMetadata.project_id,
                user_id: createdUser.id,
                name: createdUser.full_name,
                email: createdUser.email,
                role: createdUser.role,
                team_type: teamType,
                is_decision_maker: clerkUser.publicMetadata.is_decision_maker === true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const { error: teamError } = await supabase
                .from('team_members')
                .insert([teamMemberData]);

              if (teamError) {
                console.error('Error creating team member:', teamError);
              } else {
                console.log('Team member created successfully');
              }

              // Update invitation tracking to mark as accepted
              if (clerkUser.publicMetadata?.clerk_invitation_id) {
                const { error: trackingError } = await supabase
                  .from('invitation_tracking')
                  .update({
                    status: 'accepted',
                    accepted_at: new Date().toISOString()
                  })
                  .eq('clerk_invitation_id', clerkUser.publicMetadata.clerk_invitation_id);

                if (trackingError) {
                  console.error('Error updating invitation tracking:', trackingError);
                }
              }
            }
          } else {
            // For existing users, check if they have team_member info
            // This is important for determining decision maker status
            if (userData && clerkUser.publicMetadata?.project_id) {
              const { data: teamMember } = await supabase
                .from('team_members')
                .select('*')
                .eq('user_id', userData.id)
                .eq('project_id', clerkUser.publicMetadata.project_id)
                .single();
              
              if (teamMember) {
                // Attach team member info to user object for easy access
                userData.currentTeamMember = teamMember;
                console.log('User team member info:', teamMember);
              } else {
                // If no team member exists but user has invitation metadata, create one
                console.log('No team member found for user with invitation metadata, creating one...');
                const teamType = clerkUser.publicMetadata.team_type || 
                                (clerkUser.publicMetadata.role === 'agency' ? 'agency' : 'client');
                
                const teamMemberData = {
                  project_id: clerkUser.publicMetadata.project_id,
                  user_id: userData.id,
                  name: userData.full_name,
                  email: userData.email,
                  role: userData.role,
                  team_type: teamType,
                  is_decision_maker: clerkUser.publicMetadata.is_decision_maker === true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };

                const { data: newTeamMember, error: teamError } = await supabase
                  .from('team_members')
                  .insert([teamMemberData])
                  .select()
                  .single();

                if (teamError) {
                  console.error('Error creating team member for existing user:', teamError);
                } else {
                  console.log('Team member created successfully for existing user');
                  userData.currentTeamMember = newTeamMember;
                }
              }
            }
          }

          setUser(userData);
        } catch (error) {
          console.error('Error syncing user:', error);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    syncUser();
  }, [clerkUser, clerkLoaded, isSignedIn]);

  // Sign in function
  const signIn = async () => {
    openSignIn();
    return { success: true };
  };

  // Sign up function
  const signUp = async () => {
    openSignUp();
    return { success: true };
  };

  // Sign out function
  const signOut = async () => {
    await clerkSignOut();
    setUser(null);
    return { success: true };
  };

  // Update user profile
  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      return { success: true, data };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Define permission mappings
    const permissions = {
      'manage_team': ['admin', 'agency'],
      'manage_projects': ['admin', 'agency'],
      'view_all_deliverables': ['admin', 'agency', 'client'],
      'edit_deliverables': ['admin', 'agency'],
      'approve_deliverables': ['admin', 'agency', 'client']
    };
    
    return permissions[permission]?.includes(user.role) || false;
  };

  const value = {
    user,
    loading: loading || !clerkLoaded,
    isAuthenticated: isSignedIn,
    isSupabaseMode,
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasPermission,
    // Clerk-specific helpers
    clerkUser,
    openSignIn,
    openSignUp
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};