import { neon } from '@neondatabase/serverless';

// Database connection
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Please configure it in .env.local');
}
const sql = neon(process.env.DATABASE_URL);

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
        integration_id UUID NOT NULL REFERENCES health_integrations(id) ON DELETE CASCADE,
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
    await this.createProfilesExtensions();
    await this.createSubscriptionsTable();
    await this.createOnboardingProgressTable();
    await this.createHealthIntegrationsTable();
    await this.createHealthDataPointsTable();
    await this.createOAuthStateTable();
  }
};

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
    const result = await sql`
      INSERT INTO profiles (
        id, email, name, plan, onboarding_complete
      )
      VALUES (
        ${data.id}, 
        ${data.email}, 
        ${data.name || null}, 
        ${data.plan || 'explorer'}, 
        ${data.onboarding_complete || false}
      )
      RETURNING *
    `;
    return result[0] as User;
  },

  async getUserById(userId: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM profiles WHERE id = ${userId}
    `;
    return result[0] as User || null;
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
      WHERE id = $${values.length + 1}
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
