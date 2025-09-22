import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure Supabase is configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'princess-auth',
    // Production stability settings
    flowType: 'pkce',
    debug: false
  }
  // Removed the broken global fetch override
});

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!supabase;
};

// Auth helpers
export const signUp = async (email, password, metadata = {}) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) throw error;
  return data;
};

export const signIn = async (email, password) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async () => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  
  // Clear all localStorage data on signout
  localStorage.removeItem('princess-auth');
  localStorage.removeItem('project_data');
  localStorage.removeItem('notifications');
};

export const getCurrentUser = async () => {
  if (!supabase) return null;
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getSession = async () => {
  if (!supabase) return null;
  
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Database helpers
export const from = (table) => {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase.from(table);
};

// Storage helpers
export const storage = () => {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase.storage;
};

// Realtime subscription helpers
export const channel = (name) => {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase.channel(name);
};