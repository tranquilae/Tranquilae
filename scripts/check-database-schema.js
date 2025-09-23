#!/usr/bin/env node

/**
 * 🗄️ Database Schema Checker
 * 
 * This script checks your Neon database schema and creates missing tables
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}`);
  console.log(` ${title}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

async function checkDatabaseConnection() {
  logHeader('🔌 TESTING DATABASE CONNECTION');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    log('❌ DATABASE_URL environment variable is missing', 'red');
    return { connected: false, error: 'Missing DATABASE_URL' };
  }
  
  if (databaseUrl.includes('placeholder') || databaseUrl.includes('YOUR-PASSWORD')) {
    log('❌ DATABASE_URL contains placeholder values', 'red');
    return { connected: false, error: 'Placeholder DATABASE_URL' };
  }
  
  try {
    log(`🔗 Connecting to database...`, 'blue');
    const sql = neon(databaseUrl);
    
    // Test connection with simple query
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version`;
    
    log('✅ Database connection successful!', 'green');
    log(`📅 Server time: ${result[0].current_time}`, 'green');
    log(`🐘 PostgreSQL version: ${result[0].postgres_version.split(' ')[0]} ${result[0].postgres_version.split(' ')[1]}`, 'green');
    
    return { connected: true, sql };
    
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    return { connected: false, error: error.message };
  }
}

async function checkTables(sql) {
  logHeader('📋 CHECKING EXISTING TABLES');
  
  try {
    // Check what tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    log('📊 Existing tables:', 'blue');
    if (tables.length === 0) {
      log('  No tables found', 'yellow');
    } else {
      tables.forEach(table => {
        log(`  • ${table.table_name}`, 'white');
      });
    }
    
    // Check specifically for profiles and users tables
    const hasProfiles = tables.some(t => t.table_name === 'profiles');
    const hasUsers = tables.some(t => t.table_name === 'users');
    
    return { tables, hasProfiles, hasUsers };
    
  } catch (error) {
    log(`❌ Error checking tables: ${error.message}`, 'red');
    return { tables: [], hasProfiles: false, hasUsers: false, error: error.message };
  }
}

async function createProfilesTable(sql) {
  logHeader('🏗️ CREATING PROFILES TABLE');
  
  try {
    log('🔨 Creating profiles table...', 'blue');
    
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        plan VARCHAR(20) DEFAULT 'explorer',
        onboarding_complete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        CONSTRAINT profiles_plan_check CHECK (plan IN ('explorer', 'pathfinder'))
      )
    `;
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email)`;
    await sql`CREATE INDEX IF NOT EXISTS profiles_plan_idx ON profiles(plan)`;
    
    log('✅ Profiles table created successfully', 'green');
    return { success: true };
    
  } catch (error) {
    log(`❌ Error creating profiles table: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function createSupportingTables(sql) {
  logHeader('🏗️ CREATING SUPPORTING TABLES');
  
  try {
    // Create subscriptions table
    log('🔨 Creating subscriptions table...', 'blue');
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
    
    await sql`CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id)`;
    
    // Create onboarding_progress table
    log('🔨 Creating onboarding_progress table...', 'blue');
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
    
    await sql`CREATE INDEX IF NOT EXISTS onboarding_progress_user_id_idx ON onboarding_progress(user_id)`;
    
    log('✅ Supporting tables created successfully', 'green');
    return { success: true };
    
  } catch (error) {
    log(`❌ Error creating supporting tables: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testUserCreation(sql) {
  logHeader('🧪 TESTING USER CREATION');
  
  try {
    const testUserId = 'test-user-' + Date.now();
    const testEmail = `test.${Date.now()}@example.com`;
    
    log(`🔄 Creating test user: ${testEmail}`, 'blue');
    
    const result = await sql`
      INSERT INTO profiles (
        id, email, name, plan, onboarding_complete
      )
      VALUES (
        ${testUserId}, 
        ${testEmail}, 
        'Test User', 
        'explorer', 
        false
      )
      RETURNING *
    `;
    
    if (result.length > 0) {
      log('✅ User creation test successful!', 'green');
      log(`👤 Created user: ${result[0].email} (${result[0].id})`, 'green');
      
      // Clean up test user
      await sql`DELETE FROM profiles WHERE id = ${testUserId}`;
      log('🧹 Test user cleaned up', 'blue');
      
      return { success: true };
    } else {
      log('❌ User creation test failed - no result returned', 'red');
      return { success: false, error: 'No result returned' };
    }
    
  } catch (error) {
    log(`❌ User creation test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function main() {
  logHeader('🗄️ DATABASE SCHEMA CHECKER & FIXER');
  
  // Check database connection
  const connectionResult = await checkDatabaseConnection();
  if (!connectionResult.connected) {
    log('🔴 Cannot proceed without database connection', 'red');
    return;
  }
  
  const sql = connectionResult.sql;
  
  // Check existing tables
  const tableCheck = await checkTables(sql);
  
  // Create profiles table if missing
  if (!tableCheck.hasProfiles) {
    log('⚠️ Profiles table is missing - this is needed for user creation', 'yellow');
    const profilesResult = await createProfilesTable(sql);
    if (!profilesResult.success) {
      log('🔴 Cannot proceed without profiles table', 'red');
      return;
    }
  } else {
    log('✅ Profiles table exists', 'green');
  }
  
  // Create supporting tables
  const supportingResult = await createSupportingTables(sql);
  if (!supportingResult.success) {
    log('⚠️ Some supporting tables may be missing', 'yellow');
  }
  
  // Test user creation
  const userCreationResult = await testUserCreation(sql);
  
  logHeader('📋 SUMMARY');
  
  log('Database Schema Status:', 'blue');
  log(`🔌 Connection: ${connectionResult.connected ? '✅' : '❌'}`, connectionResult.connected ? 'green' : 'red');
  log(`📋 Profiles Table: ${tableCheck.hasProfiles || 'created' ? '✅' : '❌'}`, 'green');
  log(`🏗️ Supporting Tables: ${supportingResult?.success ? '✅' : '⚠️'}`, supportingResult?.success ? 'green' : 'yellow');
  log(`🧪 User Creation: ${userCreationResult?.success ? '✅' : '❌'}`, userCreationResult?.success ? 'green' : 'red');
  
  if (connectionResult.connected && (tableCheck.hasProfiles || supportingResult?.success) && userCreationResult?.success) {
    log('\n🎉 Database is ready for user creation!', 'green');
    log('💡 Your signup flow should now work properly', 'blue');
  } else {
    log('\n🔴 Database setup needs attention', 'red');
    log('💡 Please fix the issues above before testing signup', 'yellow');
  }
}

main().catch(error => {
  log(`❌ Schema check failed: ${error.message}`, 'red');
  process.exit(1);
});
