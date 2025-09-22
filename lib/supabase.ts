import { createClient } from '@supabase/supabase-js'

// Regular client for client-side operations
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Admin client for server-side operations with service role key
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Types for admin operations
export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'super_admin' | 'user';
  plan: 'explorer' | 'pathfinder';
  onboarding_complete: boolean;
  status?: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

export interface AdminSubscription {
  id: string;
  user_id: string;
  plan: 'explorer' | 'pathfinder';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  trial_end?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  event_type: string;
  user_id?: string;
  admin_id?: string;
  table_name?: string;
  event_data: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Admin permission check
export async function checkAdminAccess(userId: string): Promise<boolean> {
  try {
    // Check if user ID is in the allowed admin list from environment
    const allowedAdmins = process.env.ADMIN_USER_IDS?.split(',') || [];
    
    if (allowedAdmins.includes(userId)) {
      return true;
    }

    // Alternative: Check user role in database if using role column
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking admin access:', error);
      return false;
    }

    return user?.role === 'admin' || user?.role === 'super_admin';
  } catch (error) {
    console.error('Error in checkAdminAccess:', error);
    return false;
  }
}

// Get user session and verify admin access
export async function getAdminSession() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, isAdmin: false };
  }

  const isAdmin = await checkAdminAccess(user.id);
  
  return { user, isAdmin };
}
