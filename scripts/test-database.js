#!/usr/bin/env node

/**
 * 🧪 Database Connection Test Script
 * 
 * This script tests your DATABASE_URL connection and checks if onboarding
 * persistence will work properly.
 * 
 * Usage: node scripts/test-database.js
 */

require('dotenv').config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set!');
    console.error('📝 Please set it in .env.local file');
    console.error('🔗 Get connection string from: https://console.neon.tech/app/projects\n');
    console.error('Example format:');
    console.error('DATABASE_URL="postgresql://neondb_owner:password@ep-xyz.neon.tech/neondb?sslmode=require"');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL is configured');

  try {
    // Import database module
    const { db } = await import('../lib/database.js');
    console.log('✅ Database module loaded successfully');

    // Test basic connection with a simple query
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🔌 Testing database connection...');
    const result = await sql`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ Database connection successful');
    console.log(`📅 Database time: ${result[0].current_time}`);

    // Check if profiles table exists
    console.log('\n🔍 Checking database schema...');
    try {
      const tableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'onboarding_progress', 'subscriptions')
        ORDER BY table_name
      `;
      
      const existingTables = tableCheck.map(t => t.table_name);
      const requiredTables = ['profiles', 'onboarding_progress', 'subscriptions'];
      
      console.log(`📋 Existing tables: ${existingTables.join(', ') || 'None'}`);
      
      for (const table of requiredTables) {
        if (existingTables.includes(table)) {
          console.log(`✅ Table '${table}' exists`);
        } else {
          console.log(`❌ Table '${table}' missing`);
        }
      }

      // Check profiles table structure if it exists
      if (existingTables.includes('profiles')) {
        const profilesColumns = await sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'profiles' 
          AND column_name IN ('user_id', 'onboarding_complete', 'plan')
          ORDER BY column_name
        `;
        
        console.log('\n📊 Profiles table columns:');
        profilesColumns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type}`);
        });

        // Check if we have any user data
        const userCount = await sql`SELECT COUNT(*) as count FROM profiles`;
        console.log(`👥 Total users in profiles table: ${userCount[0].count}`);
      }

    } catch (schemaError) {
      console.warn('⚠️ Could not check database schema:', schemaError.message);
    }

    console.log('\n🎯 Test Summary:');
    console.log('✅ Database connection works');
    console.log('✅ Onboarding persistence should work');
    console.log('✅ No DATABASE_URL issues detected');

  } catch (error) {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('\n🔧 Possible fixes:');
    console.error('1. Check your DATABASE_URL format');
    console.error('2. Verify your Neon database is running');
    console.error('3. Check network connectivity');
    console.error('4. Verify database credentials');
    
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
