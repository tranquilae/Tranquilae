// Mock Supabase client for when Supabase is unavailable
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Supabase unavailable' } }),
    signUp: async () => ({ data: null, error: { message: 'Supabase unavailable' } }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } }
    })
  }
};

export const signInWithPassword = supabase.auth.signInWithPassword;
export const signUp = supabase.auth.signUp;
export const signOut = supabase.auth.signOut;
export const getSession = supabase.auth.getSession;
export const getUser = supabase.auth.getUser;
export const onAuthStateChange = supabase.auth.onAuthStateChange;

export default supabase;
