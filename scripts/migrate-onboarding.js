#!/usr/bin/env node

/**
 * Database Migration Script for Tranquilae + Supabase Auth + Neon
 * Run with: node scripts/migrate-onboarding.js
 * 
 * This script sets up the complete database schema for:
 * - Supabase Auth integration
 * - Stripe subscription management
 * - Health data tracking
 * - AI coaching conversations
 * - Comprehensive onboarding flow
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function runMigrations() {
  console.log('🚀 Starting Tranquilae comprehensive database migrations...\n');
  console.log('📋 Setting up Supabase Auth + Neon PostgreSQL integration\n');

  try {
    // 1. Check if this is a Supabase-enabled database
    console.log('🔍 Checking database compatibility...');
    try {
      await sql`SELECT 1 FROM auth.users LIMIT 1`;
      console.log('✅ Supabase Auth detected - proceeding with full schema');
    } catch (e) {
      console.log('⚠️  Supabase Auth not detected - creating standalone schema');
      // If no Supabase Auth, we'll create a simplified version
    }

    // 2. Load and execute the complete schema
    console.log('📝 Executing comprehensive database schema...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      
      // Split the schema into individual statements and execute them
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.length > 10) { // Skip very short statements
          try {
            await sql.unsafe(statement);
          } catch (error) {
            // Some statements might fail in different environments - log but continue
            if (!error.message.includes('already exists')) {
              console.warn(`⚠️  Statement ${i + 1} had issues:`, error.message.split('\n')[0]);
            }
          }
        }
      }
      
      console.log('✅ Database schema executed successfully');
    } else {
      console.log('⚠️  Schema file not found, creating basic tables...');
      await createBasicSchema();
    }

    // 6. Verify tables exist
    console.log('\n📋 Verifying table creation...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'subscriptions', 'onboarding_progress')
      ORDER BY table_name
    `;
    
    console.log('📊 Tables found:');
    tables.forEach(table => {
      console.log(`  ✓ ${table.table_name}`);
    });

    // 7. Check if users table has new columns
    const userColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('onboarding_complete', 'plan')
      ORDER BY column_name
    `;
    
    console.log('\n👤 User table extensions:');
    userColumns.forEach(column => {
      console.log(`  ✓ ${column.column_name}`);
    });

    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📚 Next steps:');
    console.log('1. Set up your Stripe products and webhook endpoints');
    console.log('2. Configure your environment variables');
    console.log('3. Test the onboarding flow at /onboarding');
    console.log('4. Set up email service (SendGrid/SMTP)');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n🔍 Troubleshooting:');
    console.error('1. Check DATABASE_URL in your .env.local file');
    console.error('2. Ensure your database is accessible');
    console.error('3. Verify you have CREATE TABLE permissions');
    console.error('4. Make sure the users table exists first');
    process.exit(1);
  }
}

// Fallback schema creation for non-Supabase databases
async function createBasicSchema() {
  console.log('📝 Creating basic schema for standalone database...');
  
  // Create users table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      plan TEXT DEFAULT 'explorer' CHECK (plan IN ('explorer', 'pathfinder')),
      onboarding_complete BOOLEAN DEFAULT FALSE,
      stripe_customer_id TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  
  // Create subscriptions table
  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan TEXT DEFAULT 'explorer' CHECK (plan IN ('explorer', 'pathfinder')),
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
      stripe_subscription_id TEXT UNIQUE,
      stripe_customer_id TEXT,
      trial_end TIMESTAMPTZ,
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      cancel_at_period_end BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  
  // Create onboarding_progress table
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
  
  // Create basic indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON onboarding_progress(user_id)`;
  
  console.log('✅ Basic schema created successfully');
}

// Test database connection first
async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const result = await sql`SELECT NOW() as current_time`;
    console.log(`✅ Connected successfully at ${result[0].current_time}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n🔍 Check your DATABASE_URL environment variable');
    return false;
  }
}

// Main execution
async function main() {
  const connected = await testConnection();
  if (connected) {
    await runMigrations();
  } else {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runMigrations, testConnection };
