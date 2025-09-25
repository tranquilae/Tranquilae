import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function createClient() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!;

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: async (key: string) => {
          const cookieStore = await cookies();
          const cookie = cookieStore.get(key);
          return cookie?.value || null;
        },
        setItem: async (key: string, value: string) => {
          const cookieStore = await cookies();
          cookieStore.set(key, value, {
            httpOnly: true,
            secure: process.env['NODE_ENV'] === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          });
        },
        removeItem: async (key: string) => {
          const cookieStore = await cookies();
          cookieStore.delete(key);
        }
      }
    }
  });
}

// Alternative server client using service role key for admin operations
export function createServerClient() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;

  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
