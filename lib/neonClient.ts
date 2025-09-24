import { neon } from '@neondatabase/serverless';

// Get Neon client instance using Vercel environment variable
export const getNeonClient = () => {
  if (!process.env['NEON_DATABASE_URL']) {
    throw new Error('NEON_DATABASE_URL environment variable is not set');
  }
  return neon(process.env['NEON_DATABASE_URL']);
};

// Type definitions for common database operations
export interface User {
  id: number;
  supabase_user_id: string;
  email: string | null;
  display_name: string | null;
  onboarded: boolean;
  explorer: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingProgress {
  id: number;
  supabase_user_id: string;
  step: number;
  data: Record<string, any>;
  completed: boolean;
  updated_at: string;
}

export interface UserSettings {
  id: number;
  supabase_user_id: string;
  timezone: string;
  units: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Database helper functions
export const createUser = async (supabaseUserId: string, email: string, displayName?: string) => {
  const sql = getNeonClient();
  const result = await sql`
    INSERT INTO users (supabase_user_id, email, display_name)
    VALUES (${supabaseUserId}, ${email}, ${displayName || null})
    RETURNING *
  `;
  return result[0] as User;
};

export const getUserBySupabaseId = async (supabaseUserId: string) => {
  const sql = getNeonClient();
  const result = await sql`
    SELECT * FROM users WHERE supabase_user_id = ${supabaseUserId}
  `;
  return result[0] as User | undefined;
};

export const updateUserOnboardingStatus = async (supabaseUserId: string, onboarded: boolean, explorer?: boolean) => {
  const sql = getNeonClient();
  const updateFields: any = { onboarded };
  if (explorer !== undefined) updateFields.explorer = explorer;
  
  const result = await sql`
    UPDATE users 
    SET onboarded = ${onboarded}, 
        explorer = ${explorer || false}, 
        updated_at = now()
    WHERE supabase_user_id = ${supabaseUserId}
    RETURNING *
  `;
  return result[0] as User;
};

export const saveOnboardingProgress = async (supabaseUserId: string, step: number, data: Record<string, any>) => {
  const sql = getNeonClient();
  const result = await sql`
    INSERT INTO onboarding_progress (supabase_user_id, step, data, updated_at)
    VALUES (${supabaseUserId}, ${step}, ${JSON.stringify(data)}, now())
    ON CONFLICT (supabase_user_id) 
    DO UPDATE SET step = ${step}, data = ${JSON.stringify(data)}, updated_at = now()
    RETURNING *
  `;
  return result[0] as OnboardingProgress;
};

export const getOnboardingProgress = async (supabaseUserId: string) => {
  const sql = getNeonClient();
  const result = await sql`
    SELECT * FROM onboarding_progress WHERE supabase_user_id = ${supabaseUserId}
  `;
  return result[0] as OnboardingProgress | undefined;
};

export const createUserSettings = async (supabaseUserId: string, settings: Partial<UserSettings>) => {
  const sql = getNeonClient();
  const result = await sql`
    INSERT INTO user_settings (supabase_user_id, timezone, units, preferences)
    VALUES (${supabaseUserId}, ${settings.timezone || 'Europe/London'}, ${settings.units || 'metric'}, ${JSON.stringify(settings.preferences || {})})
    RETURNING *
  `;
  return result[0] as UserSettings;
};

export const getUserSettings = async (supabaseUserId: string) => {
  const sql = getNeonClient();
  const result = await sql`
    SELECT * FROM user_settings WHERE supabase_user_id = ${supabaseUserId}
  `;
  return result[0] as UserSettings | undefined;
};

export default getNeonClient;
