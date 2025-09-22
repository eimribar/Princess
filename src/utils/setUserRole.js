// Development utility to update user role in Supabase
// Run in browser console: await window.setUserRole('admin')

import { supabase } from '../lib/supabase';

export async function setUserRole(role = 'admin') {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('No authenticated user found');
      return false;
    }
    
    console.log('Current user ID:', user.id);
    
    // Update user role in database
    const { data, error } = await supabase
      .from('users')
      .update({ role: role })
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating role:', error);
      
      // If user doesn't exist in users table, create them
      if (error.code === 'PGRST116') {
        console.log('User not found in database, creating profile...');
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.email.split('@')[0],
            role: role,
            organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' // Default org
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating user profile:', createError);
          return false;
        }
        
        console.log('✅ User profile created with role:', role);
        console.log('Please refresh the page to apply changes');
        return true;
      }
      
      return false;
    }
    
    console.log('✅ User role updated to:', role);
    console.log('Updated user data:', data);
    console.log('Please refresh the page to apply changes');
    return true;
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

// Make it available globally for development
if (typeof window !== 'undefined') {
  window.setUserRole = setUserRole;
}