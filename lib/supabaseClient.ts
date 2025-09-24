import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with new API keys (non-legacy)
export const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']!
);

// Auth helper functions using new API methods
export const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password 
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = () => supabase.auth.getSession();
export const getUser = () => supabase.auth.getUser();
export const onAuthStateChange = supabase.auth.onAuthStateChange;

// Database helpers for client-side queries (if needed)
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('supabase_user_id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

export default supabase;
