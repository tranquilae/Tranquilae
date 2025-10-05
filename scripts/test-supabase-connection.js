#!/usr/bin/env node

/**
 * Supabase Connection Diagnostic Script
 * 
 * This script tests your Supabase connection and validates environment variables.
 * Run with: node scripts/test-supabase-connection.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('\n🔍 Supabase Connection Diagnostic Tool\n');
console.log('='.repeat(60));

// Step 1: Check environment variables
console.log('\n📋 Step 1: Checking Environment Variables...\n');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                   process.env.SUPABASE_SECRET_KEY;

const checks = {
  url: { value: url, required: true },
  anonKey: { value: anonKey, required: true },
  serviceKey: { value: serviceKey, required: false }
};

let hasErrors = false;

for (const [name, check] of Object.entries(checks)) {
  const status = check.value ? '✅' : (check.required ? '❌' : '⚠️');
  const message = check.value 
    ? `${name}: ${check.value.substring(0, 20)}...` 
    : `${name}: MISSING ${check.required ? '(REQUIRED)' : '(OPTIONAL)'}`;
  
  console.log(`  ${status} ${message}`);
  
  if (check.required && !check.value) {
    hasErrors = true;
  }
}

if (hasErrors) {
  console.log('\n❌ ERROR: Missing required environment variables!');
  console.log('\n📝 Fix:');
  console.log('  1. Create .env.local file in your project root');
  console.log('  2. Add the following variables:');
  console.log('     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.log('\n💡 Get these values from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api');
  process.exit(1);
}

// Step 2: Validate URL format
console.log('\n🔗 Step 2: Validating URL Format...\n');

const urlPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co$/;
if (!urlPattern.test(url)) {
  console.log(`  ❌ Invalid URL format: ${url}`);
  console.log('  Expected format: https://your-project.supabase.co');
  hasErrors = true;
} else {
  console.log(`  ✅ URL format is valid`);
}

// Step 3: Validate key format
console.log('\n🔑 Step 3: Validating Key Format...\n');

const isJWT = anonKey.startsWith('eyJ');
const isNewFormat = anonKey.startsWith('sb_publishable_') || anonKey.startsWith('sb_');

if (isJWT || isNewFormat) {
  console.log(`  ✅ Key format is valid (${isJWT ? 'JWT' : 'New Format'})`);
} else {
  console.log(`  ⚠️  Key format might be invalid`);
  console.log(`  Key starts with: ${anonKey.substring(0, 10)}...`);
}

// Step 4: Test connection
console.log('\n🌐 Step 4: Testing Supabase Connection...\n');

const testConnection = async () => {
  try {
    console.log('  Creating Supabase client...');
    const supabase = createClient(url, anonKey);
    
    console.log('  Attempting to get session...');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
    );
    
    const sessionPromise = supabase.auth.getSession();
    
    const { data, error } = await Promise.race([sessionPromise, timeoutPromise]);
    
    if (error) {
      console.log(`  ❌ Session check failed: ${error.message}`);
      hasErrors = true;
    } else {
      console.log(`  ✅ Connection successful!`);
      console.log(`  ℹ️  Session status: ${data.session ? 'Active session found' : 'No active session (normal for first run)'}`);
    }
    
    // Try a simple query
    console.log('\n  Testing database query...');
    const { data: testData, error: queryError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (queryError) {
      // This is expected if the table doesn't exist or RLS is enabled
      console.log(`  ℹ️  Query test: ${queryError.message} (this is often normal)`);
    } else {
      console.log(`  ✅ Database query successful`);
    }
    
  } catch (error) {
    console.log(`  ❌ Connection failed: ${error.message}`);
    hasErrors = true;
  }
};

testConnection().then(() => {
  console.log('\n' + '='.repeat(60));
  
  if (hasErrors) {
    console.log('\n❌ DIAGNOSTIC FAILED - Issues found\n');
    console.log('Common solutions:');
    console.log('  1. Check your .env.local file exists and has correct values');
    console.log('  2. Verify keys from Supabase dashboard: Settings > API');
    console.log('  3. Ensure your Supabase project is active (not paused)');
    console.log('  4. Check your network connection');
    console.log('  5. Try regenerating your API keys if they\'re old\n');
    process.exit(1);
  } else {
    console.log('\n✅ ALL CHECKS PASSED!\n');
    console.log('Your Supabase configuration is working correctly.');
    console.log('If your app is still not loading, check the browser console for errors.\n');
    process.exit(0);
  }
}).catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
