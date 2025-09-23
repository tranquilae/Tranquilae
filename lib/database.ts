import { neon } from '@neondatabase/serverless';

// Database connection
const sql = neon(process.env.DATABASE_URL!);

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

/**
 * Database Migration Scripts
 */
export const migrations = {
  // Create users table extensions
  async createUsersExtensions() {
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'explorer'
    `;
  },

  // Create subscriptions table
  async createSubscriptionsTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

  // Run all migrations
  async runAll() {
    await this.createUsersExtensions();
    await this.createSubscriptionsTable();
    await this.createOnboardingProgressTable();
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
    const updates = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${value}`)
      .join(', ');

    const result = await sql`
      UPDATE profiles 
      SET ${sql.unsafe(updates)}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `;
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
  }
};

export default db;
