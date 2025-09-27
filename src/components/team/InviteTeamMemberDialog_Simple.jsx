// Simplified version that uses Supabase Auth's built-in invitation system
// This sends emails automatically without needing Edge Functions

import React from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export async function sendInvitationEmail(email, invitationLink, metadata = {}) {
  try {
    // Use Supabase Auth's magic link feature
    // This sends an email automatically using Supabase's built-in service
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        data: metadata,
        shouldCreateUser: true,
        emailRedirectTo: invitationLink
      }
    });

    if (error) {
      if (error.message?.includes('rate')) {
        return { 
          success: false, 
          rateLimited: true,
          error: 'Rate limit reached (2 emails per hour). Copy the link manually.' 
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Email sent successfully!' };
  } catch (err) {
    console.error('Email error:', err);
    return { success: false, error: err.message };
  }
}