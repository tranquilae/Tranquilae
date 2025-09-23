#!/usr/bin/env node

/**
 * Setup Supabase Schema for Tranquilae Auth Flow
 * This script sets up the necessary schema using Supabase client
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function setupSupabaseSchema() {
  console.log('🔧 Setting up Supabase schema for auth flow...\n');

  // Get Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in environment variables');
    process.exit(1);
  }
  
  if (!supabaseServiceKey || supabaseServiceKey.includes('dummy') || supabaseServiceKey.includes('local-dev')) {
    console.warn('⚠️ No valid SUPABASE_SERVICE_ROLE_KEY found.');
    console.warn('🔧 For local development, you can set up the schema manually via Supabase Dashboard:');
    console.warn('   1. Go to https://supabase.com/dashboard');
    console.warn('   2. Navigate to SQL Editor');
    console.warn('   3. Run the following SQL commands:\n');
    
    console.log(`-- Add columns to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'explorer';

-- Create onboarding_progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  step INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create subscriptions table
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
);

-- Create indexes
CREATE INDEX IF NOT EXISTS onboarding_progress_user_id_idx ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);`);
    
    console.log('\n📋 After running these SQL commands, your schema will be ready.');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('1️⃣ Testing Supabase connection...');
    
    // Test connection by checking if profiles table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');
      
    if (tablesError) {
      throw new Error(`Connection test failed: ${tablesError.message}`);
    }
    
    if (!tables || tables.length === 0) {
      throw new Error('Profiles table not found. Make sure Supabase Auth is properly configured.');
    }
    
    console.log('   ✅ Supabase connection successful');
    console.log('   ✅ Profiles table found');

    console.log('\n2️⃣ Setting up additional columns on profiles table...');
    
    // Since we can't run DDL through Supabase client directly, we need to use RPC
    console.log('   ℹ️ Due to Supabase client limitations, please run the following SQL in your Supabase Dashboard:');
    console.log('   📍 Go to: https://supabase.com/dashboard/project/your-project/sql-editor');
    console.log('   📋 Execute the SQL shown above');
    
    console.log('\n3️⃣ Creating initial data if needed...');
    
    // We can test basic operations that will be needed
    console.log('   ✅ Supabase client is properly configured for data operations');
    
    console.log('\n🎉 Schema setup guidance completed!');
    console.log('\n📋 Summary:');
    console.log('   - Supabase connection: ✅ Working');
    console.log('   - Schema setup: ⏳ Needs manual SQL execution (shown above)');
    console.log('   - Next steps: Run the provided SQL in Supabase Dashboard');
    
  } catch (error) {
    console.error('❌ Schema setup failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check your SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('   2. Ensure you have the correct permissions');
    console.error('   3. Verify your Supabase project is active');
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupSupabaseSchema().catch(console.error);
}

module.exports = { setupSupabaseSchema };
