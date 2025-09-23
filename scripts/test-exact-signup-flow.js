#!/usr/bin/env node

/**
 * 🎯 Exact Signup Flow Tester
 * 
 * This tests the exact same flow as your signup API to isolate the issue
 */

const { createClient } = require('@supabase/supabase-js');
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

async function testExactSignupFlow() {
  logHeader('🎯 TESTING EXACT SIGNUP FLOW');
  
  const testData = {
    email: `exactflow.${Date.now()}@gmail.com`,
    password: 'TestPassword123!',
    firstName: 'Exact',
    lastName: 'Flow'
  };

  log(`📧 Testing with: ${testData.email}`, 'cyan');

  // Step 1: Create Supabase client exactly like signup route
  log('🔄 Step 1: Creating Supabase client...', 'blue');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Missing Supabase credentials', 'red');
    return { success: false, error: 'Missing credentials' };
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    }
  });

  log('✅ Supabase client created', 'green');

  // Step 2: Attempt Supabase signup exactly like the API
  log('🔄 Step 2: Attempting Supabase Auth signup...', 'blue');
  
  try {
    const result = await supabaseAuth.auth.signUp({
      email: testData.email,
      password: testData.password,
      options: {
        data: {
          first_name: testData.firstName,
          last_name: testData.lastName,
          full_name: `${testData.firstName} ${testData.lastName}`,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
      }
    });

    const authData = result.data;
    const authError = result.error;

    log('📊 Supabase Auth Response:', 'blue');
    console.log({
      hasUser: !!authData?.user,
      hasSession: !!authData?.session,
      hasError: !!authError,
      errorMessage: authError?.message || 'None',
      userId: authData?.user?.id || 'None',
      userEmail: authData?.user?.email || 'None'
    });

    if (authError) {
      log(`❌ Supabase Auth Error: ${authError.message}`, 'red');
      return { success: false, error: authError.message, step: 'supabase_auth' };
    }

    if (!authData.user) {
      log('❌ No user returned from Supabase', 'red');
      return { success: false, error: 'No user returned', step: 'supabase_auth' };
    }

    log('✅ Supabase Auth signup successful!', 'green');
    log(`👤 User ID: ${authData.user.id}`, 'green');
    log(`📧 User Email: ${authData.user.email}`, 'green');

    // Step 3: Test Neon database connection and profile creation
    log('🔄 Step 3: Testing Neon database profile creation...', 'blue');

    const sql = neon(process.env.DATABASE_URL);

    // Test the exact same database operation as your signup API
    try {
      const profileData = {
        id: authData.user.id,
        email: authData.user.email,
        first_name: testData.firstName,
        last_name: testData.lastName,
        name: `${testData.firstName} ${testData.lastName}`,
        plan: 'explorer',
        onboarding_complete: false
      };

      log('📝 Profile data to insert:', 'blue');
      console.log(profileData);

      // This is exactly what your db.createUser does
      const result = await sql`
        INSERT INTO profiles (
          id, email, name, plan, onboarding_complete
        )
        VALUES (
          ${profileData.id}, 
          ${profileData.email}, 
          ${profileData.name || null}, 
          ${profileData.plan || 'explorer'}, 
          ${profileData.onboarding_complete || false}
        )
        RETURNING *
      `;

      if (result.length > 0) {
        log('✅ Neon database profile created successfully!', 'green');
        log('👤 Profile created:', 'green');
        console.log(result[0]);

        // Clean up test data
        await sql`DELETE FROM profiles WHERE id = ${authData.user.id}`;
        log('🧹 Test profile cleaned up', 'blue');

        return { 
          success: true, 
          supabaseUserId: authData.user.id,
          neonProfile: result[0]
        };
      } else {
        log('❌ Profile creation returned no results', 'red');
        return { success: false, error: 'No results from profile creation', step: 'neon_profile' };
      }

    } catch (dbError) {
      log('❌ Neon database error:', 'red');
      console.error(dbError);
      return { success: false, error: dbError.message, step: 'neon_profile', details: dbError };
    }

  } catch (supabaseError) {
    log('❌ Supabase signup error:', 'red');
    console.error(supabaseError);
    return { success: false, error: supabaseError.message, step: 'supabase_auth' };
  }
}

async function main() {
  logHeader('🎯 EXACT SIGNUP FLOW TESTER');
  
  log('Testing the exact same flow as your signup API...', 'blue');
  
  const result = await testExactSignupFlow();
  
  logHeader('📋 TEST RESULTS');
  
  if (result.success) {
    log('🎉 Complete signup flow working perfectly!', 'green');
    log('✅ Supabase Auth: Working', 'green');
    log('✅ Neon Database: Working', 'green');
    log('✅ Profile Creation: Working', 'green');
    log('\n💡 Your signup should be working. Check your production logs for specific errors.', 'blue');
  } else {
    log('❌ Signup flow has issues', 'red');
    log(`🔴 Failed at step: ${result.step}`, 'red');
    log(`📝 Error: ${result.error}`, 'red');
    
    if (result.step === 'supabase_auth') {
      log('\n💡 Issue is with Supabase authentication', 'yellow');
      log('• Check your Supabase project status', 'yellow');
      log('• Verify environment variables are correct', 'yellow');
      log('• Check rate limits and project configuration', 'yellow');
    } else if (result.step === 'neon_profile') {
      log('\n💡 Issue is with Neon database profile creation', 'yellow');
      log('• Check DATABASE_URL is correct', 'yellow');
      log('• Verify profiles table exists and has correct schema', 'yellow');
      log('• Check for UUID format issues', 'yellow');
    }
    
    if (result.details) {
      log('\n🔍 Detailed error information:', 'cyan');
      console.log(result.details);
    }
  }
}

main().catch(error => {
  log(`❌ Test failed: ${error.message}`, 'red');
  console.error(error);
});
