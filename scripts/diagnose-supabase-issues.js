#!/usr/bin/env node

/**
 * 🔍 Supabase Issues Diagnostic Tool
 * 
 * This script helps diagnose timeout issues and database problems
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

async function checkSupabaseStatus() {
  log('🔄 Checking Supabase service status...', 'blue');
  
  try {
    const response = await fetch('https://status.supabase.com/api/v2/status.json');
    const data = await response.json();
    
    if (data.status?.indicator === 'none') {
      log('✅ Supabase services are operational', 'green');
      return true;
    } else {
      log(`⚠️ Supabase status: ${data.status?.description || 'Unknown'}`, 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Could not check Supabase status', 'red');
    return false;
  }
}

async function testSupabaseConnection() {
  log('🔄 Testing direct Supabase connection...', 'blue');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fspoavmvfymlunmfubqp.supabase.co';
  
  try {
    const start = Date.now();
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      timeout: 10000 // 10 second timeout
    });
    const duration = Date.now() - start;
    
    if (response.ok) {
      log(`✅ Direct connection successful (${duration}ms)`, 'green');
      if (duration > 3000) {
        log('⚠️ Connection is slow - this may cause timeouts', 'yellow');
      }
      return { success: true, duration };
    } else {
      log(`❌ Connection failed with status: ${response.status}`, 'red');
      return { success: false, status: response.status, duration };
    }
  } catch (error) {
    log(`❌ Connection error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testAuthEndpoint() {
  log('🔄 Testing auth endpoint with timeout...', 'blue');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fspoavmvfymlunmfubqp.supabase.co';
  const authUrl = `${supabaseUrl}/auth/v1/signup`;
  
  try {
    const start = Date.now();
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''
      },
      body: JSON.stringify({
        email: `test.timeout.${Date.now()}@example.com`,
        password: 'TestPassword123!'
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - start;
    
    log(`📊 Auth endpoint responded in ${duration}ms with status ${response.status}`, 'blue');
    
    if (response.status === 504) {
      log('🔴 504 Gateway Timeout detected!', 'red');
      return { timeout: true, duration, status: 504 };
    } else if (response.status === 429) {
      log('🟡 429 Rate Limited (expected during testing)', 'yellow');
      return { rateLimited: true, duration, status: 429 };
    } else {
      log('✅ Auth endpoint is responding', 'green');
      return { success: true, duration, status: response.status };
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      log('🔴 Auth endpoint timed out after 30 seconds', 'red');
      return { timeout: true, error: 'Request timeout' };
    } else {
      log(`❌ Auth endpoint error: ${error.message}`, 'red');
      return { error: error.message };
    }
  }
}

function provideSolutions(results) {
  logHeader('💡 SOLUTIONS FOR STATUS 504 ERRORS');
  
  if (results.timeout || results.authResult?.timeout) {
    log('🔴 TIMEOUT ISSUES DETECTED', 'red');
    
    log('\n1️⃣ IMMEDIATE SOLUTIONS:', 'yellow');
    log('   • Wait 5-10 minutes - Supabase may be experiencing load', 'white');
    log('   • Try again during off-peak hours', 'white');
    log('   • Check Supabase Status: https://status.supabase.com', 'white');
    
    log('\n2️⃣ DISABLE EMAIL CONFIRMATION (QUICK FIX):', 'yellow');
    log('   • Go to: https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/auth/settings', 'cyan');
    log('   • Turn OFF "Enable email confirmations"', 'cyan');
    log('   • This reduces server load and eliminates email timeouts', 'cyan');
    
    log('\n3️⃣ INCREASE TIMEOUT IN YOUR CODE:', 'yellow');
    log('   • The signup process may need more time', 'white');
    log('   • Consider implementing retry logic', 'white');
    
    log('\n4️⃣ CHECK YOUR REGION:', 'yellow');
    log('   • Your Supabase project may be in a distant region', 'white');
    log('   • Consider switching regions if consistently slow', 'white');
    
    log('\n5️⃣ UPGRADE TO SUPABASE PRO:', 'yellow');
    log('   • Free tier has lower resource allocation', 'white');
    log('   • Pro tier gets priority and better performance', 'white');
    
  } else if (results.slowConnection) {
    log('🟡 SLOW CONNECTION DETECTED', 'yellow');
    log('• Connection is slow but working', 'white');
    log('• Monitor for consistent timeouts', 'white');
    log('• Consider the solutions above if timeouts persist', 'white');
    
  } else {
    log('✅ No obvious timeout issues detected', 'green');
    log('• If you still get 504 errors, they may be intermittent', 'blue');
    log('• Monitor Supabase status and try again', 'blue');
  }
  
  logHeader('💡 SOLUTIONS FOR AUDIT_LOGS TABLE ERROR');
  
  log('The audit_logs table error is not critical for signup, but here\'s how to fix it:', 'blue');
  
  log('\n1️⃣ CREATE THE MISSING TABLE:', 'yellow');
  log('   • Go to: https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/editor', 'cyan');
  log('   • Run this SQL to create the table:', 'cyan');
  log('   ```sql', 'white');
  log('   CREATE TABLE public.audit_logs (', 'white');
  log('     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,', 'white');
  log('     event_type text NOT NULL,', 'white');
  log('     user_id uuid,', 'white');
  log('     success boolean DEFAULT false,', 'white');
  log('     error text,', 'white');
  log('     ip_address text,', 'white');
  log('     user_agent text,', 'white');
  log('     metadata jsonb DEFAULT \'{}\',', 'white');
  log('     created_at timestamp with time zone DEFAULT now()', 'white');
  log('   );', 'white');
  log('   ```', 'white');
  
  log('\n2️⃣ OR DISABLE AUDIT LOGGING TEMPORARILY:', 'yellow');
  log('   • The current code already handles missing table gracefully', 'cyan');
  log('   • Audit logging will just show warnings in logs', 'cyan');
}

async function main() {
  logHeader('🔍 SUPABASE ISSUES DIAGNOSTIC TOOL');
  
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  require('dotenv').config();
  
  log('Diagnosing Supabase 504 timeout and audit_logs issues...', 'blue');
  
  const results = {};
  
  // Check Supabase status
  results.statusOk = await checkSupabaseStatus();
  
  // Test direct connection
  results.connectionResult = await testSupabaseConnection();
  if (results.connectionResult.duration > 3000) {
    results.slowConnection = true;
  }
  
  // Test auth endpoint
  results.authResult = await testAuthEndpoint();
  
  // Check for timeout patterns
  if (results.authResult?.timeout || results.authResult?.status === 504) {
    results.timeout = true;
  }
  
  // Provide solutions
  provideSolutions(results);
  
  logHeader('📋 DIAGNOSTIC SUMMARY');
  
  if (results.timeout) {
    log('🔴 STATUS: Timeout issues detected', 'red');
    log('🎯 PRIORITY: Disable email confirmation for immediate relief', 'yellow');
  } else if (results.slowConnection) {
    log('🟡 STATUS: Slow but functional', 'yellow');
    log('🎯 ACTION: Monitor for timeouts', 'yellow');
  } else {
    log('✅ STATUS: Connection seems healthy', 'green');
    log('🎯 ACTION: 504 errors may be intermittent', 'blue');
  }
  
  log('\n🔧 IMMEDIATE RECOMMENDATIONS:', 'cyan');
  log('1. Disable email confirmation in Supabase settings', 'white');
  log('2. Create audit_logs table (optional)', 'white');
  log('3. Monitor https://status.supabase.com for incidents', 'white');
  log('4. Retry signup in a few minutes', 'white');
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  log('❌ This script requires Node.js 18+ for fetch support', 'red');
  process.exit(1);
}

main().catch(error => {
  log(`❌ Diagnostic failed: ${error.message}`, 'red');
  process.exit(1);
});
