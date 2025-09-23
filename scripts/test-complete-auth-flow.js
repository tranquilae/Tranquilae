#!/usr/bin/env node

/**
 * 🧪 Complete Auth Flow Tester
 * 
 * This script tests the entire authentication flow end-to-end
 */

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

async function testSignup() {
  logHeader('🔐 TESTING SIGNUP FLOW');
  
  const testData = {
    email: `flowtest.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Flow',
    lastName: 'Test'
  };

  log(`📧 Testing with email: ${testData.email}`, 'cyan');

  try {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const data = await response.json();
    
    log(`📊 Signup Response Status: ${response.status}`, 'blue');
    log(`📄 Response Data:`, 'blue');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      log('✅ Signup successful', 'green');
      return { success: true, user: data.user, session: data.session, testData };
    } else {
      log(`❌ Signup failed: ${data.error}`, 'red');
      return { success: false, error: data.error, details: data };
    }
    
  } catch (error) {
    log(`❌ Signup network error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testDirectSupabaseConnection(testData) {
  logHeader('🔗 TESTING DIRECT SUPABASE CONNECTION');
  
  const { createClient } = require('@supabase/supabase-js');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                       process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      log('❌ Missing Supabase environment variables', 'red');
      return { success: false, error: 'Missing env vars' };
    }
    
    log(`🔗 Connecting to: ${supabaseUrl}`, 'blue');
    log(`🔑 Using key: ${supabaseKey.substring(0, 20)}...`, 'blue');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test direct signup
    log('🔄 Attempting direct Supabase signup...', 'blue');
    
    const { data, error } = await supabase.auth.signUp({
      email: testData.email,
      password: testData.password,
      options: {
        data: {
          first_name: testData.firstName,
          last_name: testData.lastName
        }
      }
    });
    
    if (error) {
      log(`❌ Direct signup failed: ${error.message}`, 'red');
      return { success: false, error: error.message, details: error };
    } else {
      log('✅ Direct Supabase signup successful', 'green');
      log(`👤 User created: ${data.user?.email}`, 'green');
      log(`🆔 User ID: ${data.user?.id}`, 'green');
      log(`✉️ Email confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`, data.user?.email_confirmed_at ? 'green' : 'yellow');
      
      return { success: true, user: data.user, session: data.session };
    }
    
  } catch (error) {
    log(`❌ Direct connection error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testSupabaseUsersList() {
  logHeader('👥 CHECKING SUPABASE USERS');
  
  const { createClient } = require('@supabase/supabase-js');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey || serviceKey.includes('dummy')) {
      log('⚠️ No valid service role key - cannot check users', 'yellow');
      return { success: false, error: 'No service key' };
    }
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    
    // List recent users
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      log(`❌ Failed to list users: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
    
    log(`📊 Total users in Supabase: ${authUsers.users.length}`, 'blue');
    
    // Show recent users
    const recentUsers = authUsers.users
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
    
    log('📋 Recent users:', 'blue');
    recentUsers.forEach((user, index) => {
      log(`  ${index + 1}. ${user.email} (${user.id})`, 'white');
      log(`     Created: ${user.created_at}`, 'white');
      log(`     Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`, 'white');
    });
    
    return { success: true, users: authUsers.users, recentUsers };
    
  } catch (error) {
    log(`❌ Error checking users: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testNeonDatabase() {
  logHeader('🐘 CHECKING NEON DATABASE');
  
  try {
    // Try to load database module
    const { db } = require('../lib/database');
    
    log('🔄 Testing Neon database connection...', 'blue');
    
    // This will depend on your database implementation
    // For now, just check if we can import it
    log('✅ Database module loaded successfully', 'green');
    log('💡 Note: Full database testing requires implementing test queries', 'blue');
    
    return { success: true, message: 'Database module accessible' };
    
  } catch (error) {
    log(`❌ Database error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function analyzeIssues(results) {
  logHeader('🔍 ISSUE ANALYSIS');
  
  const issues = [];
  const solutions = [];
  
  // Check signup API issues
  if (!results.signup?.success) {
    issues.push(`Signup API failing: ${results.signup?.error}`);
    solutions.push('Fix the signup API endpoint');
  }
  
  // Check Supabase connectivity
  if (!results.directSupabase?.success) {
    issues.push(`Direct Supabase connection failing: ${results.directSupabase?.error}`);
    solutions.push('Check Supabase configuration and keys');
  }
  
  // Check user creation
  if (results.directSupabase?.success && results.supabaseUsers?.success) {
    const userCreated = results.supabaseUsers.recentUsers?.some(u => 
      u.email === results.directSupabase?.user?.email
    );
    
    if (!userCreated) {
      issues.push('User not appearing in Supabase users list');
      solutions.push('Check if users are being created but not persisted');
    }
  }
  
  // Check database connectivity
  if (!results.neonDatabase?.success) {
    issues.push(`Neon database issue: ${results.neonDatabase?.error}`);
    solutions.push('Fix database configuration and connection');
  }
  
  if (issues.length === 0) {
    log('✅ No major issues detected in testing', 'green');
  } else {
    log('🔴 ISSUES FOUND:', 'red');
    issues.forEach((issue, index) => {
      log(`  ${index + 1}. ${issue}`, 'red');
    });
    
    log('\n💡 RECOMMENDED SOLUTIONS:', 'yellow');
    solutions.forEach((solution, index) => {
      log(`  ${index + 1}. ${solution}`, 'yellow');
    });
  }
}

async function main() {
  logHeader('🧪 COMPLETE AUTH FLOW TESTER');
  
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  require('dotenv').config();
  
  log('Testing the complete authentication flow...', 'blue');
  
  const results = {};
  
  // Test signup flow
  results.signup = await testSignup();
  
  // Test direct Supabase connection
  if (!results.signup.success) {
    const testData = {
      email: `directtest.${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Direct',
      lastName: 'Test'
    };
    results.directSupabase = await testDirectSupabaseConnection(testData);
  } else {
    results.directSupabase = { success: true, message: 'Signup API worked' };
  }
  
  // Check Supabase users
  results.supabaseUsers = await testSupabaseUsersList();
  
  // Check Neon database
  results.neonDatabase = await testNeonDatabase();
  
  // Analyze issues
  await analyzeIssues(results);
  
  logHeader('📋 SUMMARY');
  
  log('Test Results:', 'blue');
  log(`🔐 Signup API: ${results.signup?.success ? '✅' : '❌'}`, results.signup?.success ? 'green' : 'red');
  log(`🔗 Direct Supabase: ${results.directSupabase?.success ? '✅' : '❌'}`, results.directSupabase?.success ? 'green' : 'red');
  log(`👥 Supabase Users: ${results.supabaseUsers?.success ? '✅' : '❌'}`, results.supabaseUsers?.success ? 'green' : 'red');
  log(`🐘 Neon Database: ${results.neonDatabase?.success ? '✅' : '❌'}`, results.neonDatabase?.success ? 'green' : 'red');
  
  const overallSuccess = Object.values(results).every(r => r?.success);
  log(`\n🎯 Overall Status: ${overallSuccess ? 'WORKING' : 'NEEDS FIXES'}`, overallSuccess ? 'green' : 'red');
}

// Check dependencies
try {
  require('@supabase/supabase-js');
  require('dotenv');
} catch (error) {
  log('❌ Missing dependencies. Make sure to run: npm install', 'red');
  process.exit(1);
}

main().catch(error => {
  log(`❌ Test failed: ${error.message}`, 'red');
  process.exit(1);
});
