import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role key for server-side operations
export const supabaseAdmin = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SECRET_KEY']!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to verify and get user from token
export const getAuthenticatedUser = async (token: string) => {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) throw error;
  return data.user;
};

// Admin database operations
export const createUserProfile = async (userId: string, email: string, displayName?: string) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      supabase_user_id: userId,
      email,
      display_name: displayName,
      onboarded: false,
      explorer: false
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('supabase_user_id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

export const updateUserOnboardingStatus = async (userId: string, onboarded: boolean, explorer?: boolean) => {
  const updateData: any = { onboarded, updated_at: new Date().toISOString() };
  if (explorer !== undefined) updateData.explorer = explorer;
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('supabase_user_id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export default supabaseAdmin;
