import { neon } from '@neondatabase/serverless';

// Database connection
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!')
  console.error('📝 Please configure it in .env.local or Vercel environment variables')
  console.error('🔗 Get your connection string from: https://console.neon.tech/app/projects')
  throw new Error('DATABASE_URL is not set. This will cause onboarding persistence issues!');
}

const sql = neon(process.env.DATABASE_URL);
console.log('✅ Database connection configured successfully');

// Test database connection on initialization
async function testConnection() {
  try {
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection test passed');
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    console.error('📝 Check your DATABASE_URL in environment variables');
  }
}
// Run connection test (but don't block initialization)
testConnection().catch(() => {});


/**
 * Database Schema Types
 */
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  onboarding_complete: boolean;
  plan: 'explorer' | 'pathfinder';
  created_at: Date;
  updated_at: Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'explorer' | 'pathfinder';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  trial_end?: Date;
  current_period_start?: Date;
  current_period_end?: Date;
  cancel_at_period_end: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OnboardingProgress {
  id: string;
  user_id: string;
  step: number;
  data: {
    goals?: string[];
    devicesConnected?: boolean;
    selectedHealthServices?: string[];
    personalData?: {
      name?: string;
      dateOfBirth?: string;
      sex?: 'male' | 'female' | 'other';
      height?: number;
      weight?: number;
    };
    selectedPlan?: 'explorer' | 'pathfinder';
    paymentStatus?: 'pending' | 'success' | 'failed';
  };
  created_at: Date;
  updated_at: Date;
}

export interface HealthIntegration {
  id: string;
  user_id: string;
  service_name: 'apple-health' | 'google-fit' | 'fitbit' | 'samsung-health' | 'garmin-connect';
  status: 'connected' | 'pending' | 'disconnected' | 'error';
  access_token: string; // Encrypted
  refresh_token?: string; // Encrypted
  token_expires_at?: Date;
  scopes: string[];
  last_sync_at?: Date;
  sync_status: 'idle' | 'syncing' | 'error';
  error_message?: string;
  settings: {
    auto_sync: boolean;
    data_types: string[];
    sync_frequency: 'hourly' | 'daily' | 'weekly';
  };
  created_at: Date;
  updated_at: Date;
}

export interface HealthDataPoint {
  id: string;
  user_id: string;
  integration_id: string;
  data_type: 'steps' | 'heart_rate' | 'sleep' | 'weight' | 'calories' | 'exercise' | 'blood_pressure';
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: {
    source?: string;
    device?: string;
    confidence?: number;
    additional_data?: Record<string, any>;
  };
  created_at: Date;
}

export interface OAuthState {
  id: string;
  user_id: string;
  service_name: string;
  state: string;
  code_verifier?: string; // For PKCE
  redirect_url?: string;
  expires_at: Date;
  created_at: Date;
}

/**
 * Database Migration Scripts
 */
export const migrations = {
  // Try to acquire an advisory lock so only one worker runs migrations
  async tryAcquireLock(): Promise<boolean> {
    try {
      const lockKey = 729384; // arbitrary project-specific key
      const rs = await sql`SELECT pg_try_advisory_lock(${lockKey}) as locked` as any
      return !!(rs && rs[0] && rs[0].locked)
    } catch {
      return false
    }
  },
  async releaseLock(): Promise<void> {
    try {
      const lockKey = 729384;
      await sql`SELECT pg_advisory_unlock(${lockKey})`;
    } catch {}
  },

  // Create profiles table extensions (Supabase standard)
  async createProfilesExtensions() {
    await sql`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'explorer'
    `;
  },

  // Create subscriptions table
  async createSubscriptionsTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        plan VARCHAR(20) NOT NULL DEFAULT 'explorer',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        stripe_subscription_id VARCHAR(255),
        stripe_customer_id VARCHAR(255),
        trial_end TIMESTAMPTZ,
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        CONSTRAINT subscriptions_plan_check CHECK (plan IN ('explorer', 'pathfinder')),
        CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete'))
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id)`;
  },

  // Create onboarding_progress table
  async createOnboardingProgressTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS onboarding_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        step INTEGER NOT NULL DEFAULT 0,
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(user_id)
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS onboarding_progress_user_id_idx ON onboarding_progress(user_id)`;
  },

  // Create health integrations table
  async createHealthIntegrationsTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS health_integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        service_name VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'disconnected',
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expires_at TIMESTAMPTZ,
        scopes TEXT[] NOT NULL DEFAULT '{}',
        last_sync_at TIMESTAMPTZ,
        sync_status VARCHAR(20) NOT NULL DEFAULT 'idle',
        error_message TEXT,
        settings JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        CONSTRAINT health_integrations_service_check CHECK (service_name IN ('apple-health', 'google-fit', 'fitbit', 'samsung-health', 'garmin-connect')),
        CONSTRAINT health_integrations_status_check CHECK (status IN ('connected', 'pending', 'disconnected', 'error')),
        CONSTRAINT health_integrations_sync_status_check CHECK (sync_status IN ('idle', 'syncing', 'error')),
        UNIQUE(user_id, service_name)
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS health_integrations_user_id_idx ON health_integrations(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS health_integrations_service_idx ON health_integrations(service_name)`;
    await sql`CREATE INDEX IF NOT EXISTS health_integrations_status_idx ON health_integrations(status)`;
  },

  // Create health data points table
  async createHealthDataPointsTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS health_data_points (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        integration_id UUID REFERENCES health_integrations(id) ON DELETE SET NULL,
        data_type VARCHAR(50) NOT NULL,
        value DECIMAL NOT NULL,
        unit VARCHAR(20) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        
        CONSTRAINT health_data_points_type_check CHECK (data_type IN ('steps', 'heart_rate', 'sleep', 'weight', 'calories', 'exercise', 'blood_pressure'))
      )
    `;

    // Create indexes for efficient querying
    await sql`CREATE INDEX IF NOT EXISTS health_data_points_user_id_idx ON health_data_points(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS health_data_points_integration_id_idx ON health_data_points(integration_id)`;
    await sql`CREATE INDEX IF NOT EXISTS health_data_points_type_idx ON health_data_points(data_type)`;
    await sql`CREATE INDEX IF NOT EXISTS health_data_points_timestamp_idx ON health_data_points(timestamp)`;
    await sql`CREATE INDEX IF NOT EXISTS health_data_points_user_type_timestamp_idx ON health_data_points(user_id, data_type, timestamp)`;
  },

  // Notes table
  async createNotesTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        title TEXT,
        content TEXT NOT NULL,
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at)`;
  },

  // Mindfulness sessions table
  async createMindfulnessSessionsTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS mindfulness_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        duration_minutes INTEGER NOT NULL DEFAULT 0,
        type VARCHAR(40) DEFAULT 'meditation',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS mindfulness_user_id_idx ON mindfulness_sessions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS mindfulness_started_at_idx ON mindfulness_sessions(started_at)`;
  },

  // AI conversations tables
  async createAIConversationsTables() {
    await sql`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        title TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS ai_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
        role VARCHAR(10) NOT NULL CHECK (role IN ('user','assistant')),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS ai_conversations_user_id_idx ON ai_conversations(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS ai_messages_conversation_id_idx ON ai_messages(conversation_id)`;
  },

  // AI usage table (for fallback budgeting)
  async createAIUsageTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS ai_usage (
        user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        month VARCHAR(7) NOT NULL,
        provider VARCHAR(20) NOT NULL,
        tokens_used INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, month, provider)
      )
    `;
  },

  // Check-ins table (mood/energy)
  async createCheckinsTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        mood TEXT,
        energy INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS checkins_user_id_idx ON checkins(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS checkins_created_at_idx ON checkins(created_at)`;
  },

  // Journal entries table
  async createJournalEntriesTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        prompt TEXT,
        mood TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS journal_user_id_idx ON journal_entries(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS journal_created_at_idx ON journal_entries(created_at)`;
  },

  // User settings/goals table
  async createUserSettingsTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
        daily_calorie_goal INTEGER DEFAULT 0,
        steps_goal INTEGER DEFAULT 0,
        water_goal INTEGER DEFAULT 0,
        sleep_goal INTEGER DEFAULT 0,
        active_minutes_goal INTEGER DEFAULT 0,
        macros_goal JSONB DEFAULT '{"carbs":0,"protein":0,"fat":0}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  },

  // Create OAuth state table
  async createOAuthStateTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS oauth_states (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        service_name VARCHAR(50) NOT NULL,
        state VARCHAR(255) NOT NULL,
        code_verifier VARCHAR(255),
        redirect_url TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(state)
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS oauth_states_user_id_idx ON oauth_states(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS oauth_states_state_idx ON oauth_states(state)`;
    await sql`CREATE INDEX IF NOT EXISTS oauth_states_expires_idx ON oauth_states(expires_at)`;
  },

  // Run all migrations
  async runAll() {
    // Ensure only one concurrent migrator
    const locked = await this.tryAcquireLock();
    if (!locked) {
      console.log('ℹ️ Skipping migrations: another worker holds the lock');
      return;
    }
    try {
      // Run each step defensively to tolerate parallel cold starts
      const steps = [
        this.createProfilesExtensions,
        this.createSubscriptionsTable,
        this.createOnboardingProgressTable,
        this.createHealthIntegrationsTable,
        this.createHealthDataPointsTable,
        this.createNotesTable,
        this.createMindfulnessSessionsTable,
        this.createAIConversationsTables,
        this.createAIUsageTable,
        this.createJournalEntriesTable,
        this.createUserSettingsTable,
        this.createCheckinsTable,
        this.createWorkoutsTables,
        this.createMealsTable,
        this.createOAuthStateTable,
      ];
      for (const step of steps.filter((s) => typeof s === 'function')) {
        try {
          await (step as any).call(this);
        } catch (e: any) {
          const msg = String(e?.message || e);
          // Ignore benign concurrency or already-exists issues
          if (
            msg.includes('already exists') ||
            msg.includes('duplicate key value') ||
            msg.includes('pg_type_typname_nsp_index')
          ) {
            console.warn('⚠️ Migration step non-fatal:', msg.split('\n')[0]);
            continue;
          }
          throw e;
        }
      }
    } finally {
      await this.releaseLock();
    }
  }
};

// Run idempotent migrations on module load to ensure required tables exist
(async () => {
  try {
    await migrations.runAll();
    console.log('✅ Database migrations ensured');
  } catch (e) {
    console.warn('⚠️ Failed to run migrations on init (will continue):', e);
  }
})();

/**
 * Database Operations
 */
export const db = {
  // Users
  async createUser(data: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    plan?: 'explorer' | 'pathfinder';
    onboarding_complete?: boolean;
  }): Promise<User> {
    try {
      console.log(`🆕 Creating/updating user profile:`, { id: data.id, email: data.email, plan: data.plan || 'explorer', onboardingComplete: data.onboarding_complete || false });
      const result = await sql`
        INSERT INTO profiles (
          user_id, email, name, plan, onboarding_complete
        )
        VALUES (
          ${data.id}, 
          ${data.email}, 
          ${data.name || null}, 
          ${data.plan || 'explorer'}, 
          ${data.onboarding_complete || false}
        )
        ON CONFLICT (user_id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          updated_at = NOW()
        RETURNING *
      `;
      const user = result[0] as User;
      console.log(`✅ User profile created/updated successfully:`, { id: user.id, onboardingComplete: user.onboarding_complete });
      return user;
    } catch (error) {
      console.error(`❌ Database error creating user (${data.id}):`, error);
      console.error('📝 Check if profiles table exists and DATABASE_URL is correct');
      throw error;
    }
  },

  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await sql`
        SELECT * FROM profiles WHERE user_id = ${userId}
      `;
      const user = result[0] as User || null;
      console.log(`📊 getUserById(${userId}):`, user ? { onboardingComplete: user.onboarding_complete, plan: user.plan } : 'Not found');
      return user;
    } catch (error) {
      console.error(`❌ Error getting user by ID (${userId}):`, error);
      throw error;
    }
  },

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    // Build a parameterized SET clause safely
    const fields: string[] = [];
    const values: any[] = [];
    
    const pushField = (key: string, value: any) => {
      fields.push(`${key} = $${values.length + 1}`);
      values.push(value);
    };
    
    if (data.email !== undefined) pushField('email', data.email);
    if (data.first_name !== undefined) pushField('first_name', data.first_name);
    if (data.last_name !== undefined) pushField('last_name', data.last_name);
    if (data.name !== undefined) pushField('name', data.name);
    if (data.onboarding_complete !== undefined) pushField('onboarding_complete', data.onboarding_complete);
    if (data.plan !== undefined) pushField('plan', data.plan);
    
    // Always update updated_at
    fields.push(`updated_at = NOW()`);
    
    const query = `
      UPDATE profiles
      SET ${fields.join(', ')}
      WHERE user_id = $${values.length + 1}
      RETURNING *
    `;
    const result = await sql.unsafe(query, [...values, userId]);
    return result[0] as User;
  },

  // Subscriptions
  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    const result = await sql`
      SELECT * FROM subscriptions WHERE user_id = ${userId}
    `;
    return result[0] as Subscription || null;
  },

  async createSubscription(data: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription> {
    const result = await sql`
      INSERT INTO subscriptions (
        user_id, plan, status, stripe_subscription_id, stripe_customer_id,
        trial_end, current_period_start, current_period_end, cancel_at_period_end
      )
      VALUES (
        ${data.user_id}, ${data.plan}, ${data.status}, ${data.stripe_subscription_id || null},
        ${data.stripe_customer_id || null}, ${data.trial_end || null}, ${data.current_period_start || null},
        ${data.current_period_end || null}, ${data.cancel_at_period_end}
      )
      RETURNING *
    `;
    return result[0] as Subscription;
  },

  async updateSubscription(userId: string, data: Partial<Subscription>): Promise<Subscription> {
    const result = await sql`
      UPDATE subscriptions 
      SET 
        plan = COALESCE(${data.plan || null}, plan),
        status = COALESCE(${data.status || null}, status),
        stripe_subscription_id = COALESCE(${data.stripe_subscription_id || null}, stripe_subscription_id),
        stripe_customer_id = COALESCE(${data.stripe_customer_id || null}, stripe_customer_id),
        trial_end = COALESCE(${data.trial_end || null}, trial_end),
        current_period_start = COALESCE(${data.current_period_start || null}, current_period_start),
        current_period_end = COALESCE(${data.current_period_end || null}, current_period_end),
        cancel_at_period_end = COALESCE(${data.cancel_at_period_end ?? null}, cancel_at_period_end),
        updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING *
    `;
    return result[0] as Subscription;
  },

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const result = await sql`
      SELECT * FROM subscriptions WHERE stripe_subscription_id = ${stripeSubscriptionId}
    `;
    return result[0] as Subscription || null;
  },

  // Onboarding Progress
  async getOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
    const result = await sql`
      SELECT * FROM onboarding_progress WHERE user_id = ${userId}
    `;
    return result[0] as OnboardingProgress || null;
  },

  async saveOnboardingProgress(
    userId: string, 
    step: number, 
    data: OnboardingProgress['data']
  ): Promise<OnboardingProgress> {
    try {
      const result = await sql`
        INSERT INTO onboarding_progress (user_id, step, data)
        VALUES (${userId}, ${step}, ${JSON.stringify(data)})
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          step = ${step},
          data = ${JSON.stringify(data)},
          updated_at = NOW()
        RETURNING *
      `;
      return result[0] as OnboardingProgress;
    } catch (error) {
      console.error('Database - Error saving onboarding progress:', error, 'userId:', userId, 'step:', step);
      throw error;
    }
  },

  async clearOnboardingProgress(userId: string): Promise<void> {
    await sql`DELETE FROM onboarding_progress WHERE user_id = ${userId}`;
  },

  // Health Integrations
  async getHealthIntegrations(userId: string): Promise<HealthIntegration[]> {
    const result = await sql`
      SELECT * FROM health_integrations 
      WHERE user_id = ${userId}
      ORDER BY created_at ASC
    `;
    return result as HealthIntegration[];
  },

  async getHealthIntegration(userId: string, serviceName: string): Promise<HealthIntegration | null> {
    const result = await sql`
      SELECT * FROM health_integrations 
      WHERE user_id = ${userId} AND service_name = ${serviceName}
    `;
    return result[0] as HealthIntegration || null;
  },

  async createHealthIntegration(data: Omit<HealthIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<HealthIntegration> {
    const result = await sql`
      INSERT INTO health_integrations (
        user_id, service_name, status, access_token, refresh_token, 
        token_expires_at, scopes, settings
      )
      VALUES (
        ${data.user_id}, ${data.service_name}, ${data.status}, ${data.access_token}, 
        ${data.refresh_token || null}, ${data.token_expires_at || null}, 
        ${data.scopes}, ${JSON.stringify(data.settings)}
      )
      ON CONFLICT (user_id, service_name) 
      DO UPDATE SET 
        status = ${data.status},
        access_token = ${data.access_token},
        refresh_token = ${data.refresh_token || null},
        token_expires_at = ${data.token_expires_at || null},
        scopes = ${data.scopes},
        settings = ${JSON.stringify(data.settings)},
        updated_at = NOW()
      RETURNING *
    `;
    return result[0] as HealthIntegration;
  },

  async updateHealthIntegration(
    userId: string, 
    serviceName: string, 
    data: Partial<HealthIntegration>
  ): Promise<HealthIntegration> {
    const result = await sql`
      UPDATE health_integrations 
      SET 
        status = COALESCE(${data.status || null}, status),
        access_token = COALESCE(${data.access_token || null}, access_token),
        refresh_token = COALESCE(${data.refresh_token || null}, refresh_token),
        token_expires_at = COALESCE(${data.token_expires_at || null}, token_expires_at),
        scopes = COALESCE(${data.scopes || null}, scopes),
        last_sync_at = COALESCE(${data.last_sync_at || null}, last_sync_at),
        sync_status = COALESCE(${data.sync_status || null}, sync_status),
        error_message = COALESCE(${data.error_message || null}, error_message),
        settings = COALESCE(${data.settings ? JSON.stringify(data.settings) : null}, settings),
        updated_at = NOW()
      WHERE user_id = ${userId} AND service_name = ${serviceName}
      RETURNING *
    `;
    return result[0] as HealthIntegration;
  },

  async deleteHealthIntegration(userId: string, serviceName: string): Promise<void> {
    await sql`DELETE FROM health_integrations WHERE user_id = ${userId} AND service_name = ${serviceName}`;
  },

  // Notes CRUD
  async listNotes(userId: string): Promise<Array<{id:string; title:string|null; content:string; tags:string[]; created_at: Date; updated_at: Date}>> {
    const result = await sql`
      SELECT id, title, content, tags, created_at, updated_at
      FROM notes WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return result as any;
  },

  async createNote(userId: string, note: { title?: string|null; content: string; tags?: string[] }): Promise<any> {
    const result = await sql`
      INSERT INTO notes (user_id, title, content, tags)
      VALUES (${userId}, ${note.title || null}, ${note.content}, ${note.tags || []})
      RETURNING *
    `;
    return result[0];
  },

  async updateNote(userId: string, id: string, note: { title?: string|null; content?: string; tags?: string[] }): Promise<any> {
    const result = await sql`
      UPDATE notes SET 
        title = COALESCE(${note.title ?? null}, title),
        content = COALESCE(${note.content ?? null}, content),
        tags = COALESCE(${note.tags ?? null}, tags),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    return result[0];
  },

  async deleteNote(userId: string, id: string): Promise<void> {
    await sql`DELETE FROM notes WHERE id = ${id} AND user_id = ${userId}`;
  },

  // Journal entries
  async listJournalEntries(userId: string): Promise<Array<{id:string; content:string; prompt:string|null; mood:string|null; created_at: Date}>> {
    const result = await sql`
      SELECT id, content, prompt, mood, created_at
      FROM journal_entries
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return result as any;
  },

  async createJournalEntry(userId: string, data: { content: string; prompt?: string|null; mood?: string|null }): Promise<any> {
    const result = await sql`
      INSERT INTO journal_entries (user_id, content, prompt, mood)
      VALUES (${userId}, ${data.content}, ${data.prompt || null}, ${data.mood || null})
      RETURNING *
    `;
    return result[0];
  },

  // Health Data Points
  async saveHealthDataPoints(dataPoints: Omit<HealthDataPoint, 'id' | 'created_at'>[]): Promise<void> {
    if (dataPoints.length === 0) return;

    const values = dataPoints.map(point => (
      `(${sql.unsafe(point.user_id)}, ${sql.unsafe(point.integration_id)}, ${sql.unsafe(point.data_type)}, ${point.value}, ${sql.unsafe(point.unit)}, ${sql.unsafe(point.timestamp.toISOString())}, ${sql.unsafe(JSON.stringify(point.metadata || {}))})`
    )).join(', ');

    await sql.unsafe(`
      INSERT INTO health_data_points (user_id, integration_id, data_type, value, unit, timestamp, metadata)
      VALUES ${values}
      ON CONFLICT DO NOTHING
    `);
  },

  async getHealthDataPoints(
    userId: string, 
    dataType: string, 
    fromDate: Date, 
    toDate: Date
  ): Promise<HealthDataPoint[]> {
    const result = await sql`
      SELECT * FROM health_data_points 
      WHERE user_id = ${userId} 
        AND data_type = ${dataType} 
        AND timestamp BETWEEN ${fromDate} AND ${toDate}
      ORDER BY timestamp ASC
    `;
    return result as HealthDataPoint[];
  },

  // Mindfulness CRUD
  async listMindfulnessSessions(userId: string): Promise<Array<{id:string; started_at: Date; duration_minutes: number; type: string; notes: string|null}>> {
    const result = await sql`
      SELECT id, started_at, duration_minutes, type, notes
      FROM mindfulness_sessions
      WHERE user_id = ${userId}
      ORDER BY started_at DESC
    `;
    return result as any;
  },

  async createMindfulnessSession(userId: string, data: { started_at?: Date; duration_minutes?: number; type?: string; notes?: string|null }): Promise<any> {
    const result = await sql`
      INSERT INTO mindfulness_sessions (user_id, started_at, duration_minutes, type, notes)
      VALUES (
        ${userId},
        ${data.started_at || new Date()},
        ${data.duration_minutes ?? 0},
        ${data.type || 'meditation'},
        ${data.notes || null}
      )
      RETURNING *
    `;
    return result[0];
  },

  async deleteMindfulnessSession(userId: string, id: string): Promise<void> {
    await sql`DELETE FROM mindfulness_sessions WHERE id = ${id} AND user_id = ${userId}`;
  },

  // AI Conversations & Messages
  async listAIMessages(userId: string): Promise<Array<{id:string; role:'user'|'assistant'; content:string; created_at: Date;}>> {
    // Return messages from the most recent conversation or empty if none
    const conv = await sql`
      SELECT id FROM ai_conversations WHERE user_id = ${userId}
      ORDER BY created_at DESC LIMIT 1
    `;
    if (!conv[0]) return [] as any;
    const cid = conv[0].id as string;
    const messages = await sql`
      SELECT id, role, content, created_at FROM ai_messages
      WHERE conversation_id = ${cid}
      ORDER BY created_at ASC
    `;
    return messages as any;
  },

  async addAIUserMessage(userId: string, content: string): Promise<{conversation_id:string; message_id:string}> {
    // Ensure a conversation exists
    let conv = await sql`
      SELECT id FROM ai_conversations WHERE user_id = ${userId}
      ORDER BY created_at DESC LIMIT 1
    `;
    if (!conv[0]) {
      conv = await sql`
        INSERT INTO ai_conversations (user_id, title) VALUES (${userId}, ${'Conversation'}) RETURNING id
      `;
    }
    const conversation_id = conv[0].id as string;
    const msg = await sql`
      INSERT INTO ai_messages (conversation_id, role, content)
      VALUES (${conversation_id}, ${'user'}, ${content}) RETURNING id
    `;
    return { conversation_id, message_id: msg[0].id as string };
  },

  // Workouts schema
  async createWorkoutsTables() {
    await sql`
      CREATE TABLE IF NOT EXISTS workouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT,
        scheduled_at TIMESTAMPTZ,
        duration_min INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS workout_exercises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sets INTEGER NOT NULL DEFAULT 3,
        reps INTEGER NOT NULL DEFAULT 10,
        rest INTEGER NOT NULL DEFAULT 60
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        date DATE NOT NULL,
        duration_min INTEGER,
        calories INTEGER,
        type TEXT
      )`;
    await sql`CREATE INDEX IF NOT EXISTS workouts_user_idx ON workouts(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS workout_logs_user_date_idx ON workout_logs(user_id, date)`;
  },

  // Check-in ops
  async listCheckins(userId: string, limit = 10): Promise<Array<{id:string; mood:string|null; energy:number|null; created_at: Date}>> {
    const result = await sql`
      SELECT id, mood, energy, created_at FROM checkins
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result as any;
  },
  async createCheckin(userId: string, data: { mood?: string|null; energy?: number|null }): Promise<any> {
    const result = await sql`
      INSERT INTO checkins (user_id, mood, energy)
      VALUES (${userId}, ${data.mood || null}, ${data.energy ?? null})
      RETURNING *
    `;
    return result[0];
  },

  // Meals schema
  async createMealsTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS meals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        date DATE NOT NULL,
        name TEXT NOT NULL,
        time TEXT,
        type VARCHAR(20) NOT NULL CHECK (type IN ('breakfast','lunch','dinner','snack')),
        calories INTEGER NOT NULL DEFAULT 0,
        foods JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`;
    await sql`CREATE INDEX IF NOT EXISTS meals_user_date_idx ON meals(user_id, date)`;
  },

  // Meals ops
  async addMeal(userId: string, meal: { date: string; name: string; time?: string|null; type: 'breakfast'|'lunch'|'dinner'|'snack'; calories: number; foods: any[] }): Promise<any> {
    const result = await sql`
      INSERT INTO meals (user_id, date, name, time, type, calories, foods)
      VALUES (${userId}, ${meal.date}, ${meal.name}, ${meal.time || null}, ${meal.type}, ${meal.calories}, ${JSON.stringify(meal.foods)})
      RETURNING *
    `;
    return result[0];
  },
  async listMealsByDate(userId: string, date: string): Promise<any[]> {
    const result = await sql`
      SELECT * FROM meals WHERE user_id = ${userId} AND date = ${date} ORDER BY created_at ASC
    `;
    return result as any[];
  },

  // Workout history ops
  async logWorkout(userId: string, data: { name: string; date: Date; duration_min?: number|null; calories?: number|null; type?: string|null }): Promise<any> {
    const result = await sql`
      INSERT INTO workout_logs (user_id, name, date, duration_min, calories, type)
      VALUES (${userId}, ${data.name}, ${data.date}, ${data.duration_min ?? null}, ${data.calories ?? null}, ${data.type ?? null})
      RETURNING *
    `;
    return result[0];
  },

  async listWorkoutHistory(userId: string, limit = 50): Promise<Array<{id:string; name:string; date:string; duration_min:number|null; calories:number|null; type:string|null}>> {
    const result = await sql`
      SELECT id, name, date, duration_min, calories, type
      FROM workout_logs
      WHERE user_id = ${userId}
      ORDER BY date DESC
      LIMIT ${limit}
    `;
    return result as any;
  },

  // AI usage helpers
  async getAIUsage(userId: string, provider: 'openai'|'grok'): Promise<{ tokens_used:number } | null> {
    const month = new Date().toISOString().slice(0,7)
    const result = await sql`SELECT tokens_used FROM ai_usage WHERE user_id = ${userId} AND provider = ${provider} AND month = ${month}`
    return result[0] || null
  },
  async addAIUsage(userId: string, provider: 'openai'|'grok', tokens: number): Promise<void> {
    const month = new Date().toISOString().slice(0,7)
    await sql`
      INSERT INTO ai_usage (user_id, month, provider, tokens_used)
      VALUES (${userId}, ${month}, ${provider}, ${tokens})
      ON CONFLICT (user_id, month, provider)
      DO UPDATE SET tokens_used = ai_usage.tokens_used + ${tokens}
    `
  },

  // User Settings
  async getUserSettings(userId: string): Promise<any | null> {
    const result = await sql`
      SELECT user_id, daily_calorie_goal, steps_goal, water_goal, sleep_goal, active_minutes_goal, macros_goal
      FROM user_settings WHERE user_id = ${userId}
    `;
    return (result[0] as any) || null;
  },

  async upsertUserSettings(userId: string, data: Partial<{ daily_calorie_goal:number; steps_goal:number; water_goal:number; sleep_goal:number; active_minutes_goal:number; macros_goal:any }>): Promise<any> {
    const result = await sql`
      INSERT INTO user_settings (user_id, daily_calorie_goal, steps_goal, water_goal, sleep_goal, active_minutes_goal, macros_goal)
      VALUES (
        ${userId},
        ${data.daily_calorie_goal ?? 0},
        ${data.steps_goal ?? 0},
        ${data.water_goal ?? 0},
        ${data.sleep_goal ?? 0},
        ${data.active_minutes_goal ?? 0},
        ${data.macros_goal ?? { carbs:0, protein:0, fat:0 }}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        daily_calorie_goal = COALESCE(EXCLUDED.daily_calorie_goal, user_settings.daily_calorie_goal),
        steps_goal = COALESCE(EXCLUDED.steps_goal, user_settings.steps_goal),
        water_goal = COALESCE(EXCLUDED.water_goal, user_settings.water_goal),
        sleep_goal = COALESCE(EXCLUDED.sleep_goal, user_settings.sleep_goal),
        active_minutes_goal = COALESCE(EXCLUDED.active_minutes_goal, user_settings.active_minutes_goal),
        macros_goal = COALESCE(EXCLUDED.macros_goal, user_settings.macros_goal),
        updated_at = NOW()
      RETURNING *
    `;
    return result[0] as any;
  },

  // Exercise media ops
  async listExerciseMedia(): Promise<Array<{ name:string; video_url:string }>> {
    const rs = await sql`SELECT name, video_url FROM exercise_media ORDER BY name ASC`;
    return rs as any
  },
  async upsertExerciseMedia(name: string, video_url: string): Promise<any> {
    const rs = await sql`
      INSERT INTO exercise_media (name, video_url)
      VALUES (${name}, ${video_url})
      ON CONFLICT (name) DO UPDATE SET video_url = EXCLUDED.video_url
      RETURNING name, video_url
    `;
    return rs[0]
  },

  // OAuth State Management
  async createOAuthState(data: Omit<OAuthState, 'id' | 'created_at'>): Promise<OAuthState> {
    const result = await sql`
      INSERT INTO oauth_states (
        user_id, service_name, state, code_verifier, redirect_url, expires_at
      )
      VALUES (
        ${data.user_id}, ${data.service_name}, ${data.state}, 
        ${data.code_verifier || null}, ${data.redirect_url || null}, ${data.expires_at}
      )
      RETURNING *
    `;
    return result[0] as OAuthState;
  },

  async getOAuthState(state: string): Promise<OAuthState | null> {
    const result = await sql`
      SELECT * FROM oauth_states WHERE state = ${state} AND expires_at > NOW()
    `;
    return result[0] as OAuthState || null;
  },

  async deleteOAuthState(state: string): Promise<void> {
    await sql`DELETE FROM oauth_states WHERE state = ${state}`;
  },

  async cleanupExpiredOAuthStates(): Promise<void> {
    await sql`DELETE FROM oauth_states WHERE expires_at < NOW()`;
  }
};

export default db;
