#!/usr/bin/env node

/**
 * 🚦 Supabase Rate Limit Checker & Troubleshooter
 * 
 * This script helps diagnose rate limit issues and provides solutions.
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

async function testSignupEndpoint() {
  try {
    const testData = {
      email: `test.${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };

    log('🔄 Testing signup endpoint...', 'blue');
    log(`📧 Using email: ${testData.email}`, 'cyan');

    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const data = await response.json();
    
    if (response.status === 429) {
      log('🔴 RATE LIMIT HIT!', 'red');
      log(`Error: ${data.error}`, 'red');
      
      if (data.details?.nextRetryTime) {
        log(`⏰ Next retry time: ${data.details.nextRetryTime}`, 'yellow');
      }
      
      if (data.retryAfter) {
        log(`🕐 Retry after: ${data.retryAfter} seconds (${Math.round(data.retryAfter / 60)} minutes)`, 'yellow');
      }
      
      return { rateLimited: true, data };
    } else if (response.ok) {
      log('✅ Signup successful!', 'green');
      return { rateLimited: false, success: true, data };
    } else {
      log(`⚠️ Other error (${response.status}): ${data.error}`, 'yellow');
      return { rateLimited: false, success: false, data };
    }
    
  } catch (error) {
    log(`❌ Network error: ${error.message}`, 'red');
    return { error: error.message };
  }
}

async function checkSupabaseConfig() {
  try {
    log('🔄 Checking Supabase configuration...', 'blue');
    
    const response = await fetch('http://localhost:3000/api/debug/supabase');
    const data = await response.json();
    
    if (response.ok) {
      log('✅ Supabase configuration check completed', 'green');
      
      // Show key findings
      if (data.environment) {
        log('🌍 Environment variables:', 'blue');
        Object.keys(data.environment).forEach(key => {
          const status = data.environment[key] ? '✅' : '❌';
          log(`  ${status} ${key}`, data.environment[key] ? 'green' : 'red');
        });
      }
      
      if (data.connectionTests) {
        log('\n🔗 Connection tests:', 'blue');
        data.connectionTests.forEach(test => {
          const status = test.success ? '✅' : '❌';
          log(`  ${status} ${test.name}: ${test.message}`, test.success ? 'green' : 'red');
        });
      }
      
      return { success: true, data };
    } else {
      log(`❌ Configuration check failed: ${data.error}`, 'red');
      return { success: false, data };
    }
    
  } catch (error) {
    log(`❌ Network error: ${error.message}`, 'red');
    return { error: error.message };
  }
}

function provideSolutions(result) {
  logHeader('💡 SOLUTIONS & NEXT STEPS');
  
  if (result.rateLimited) {
    log('🔴 RATE LIMIT DETECTED - Here are your options:', 'red');
    
    log('\n1️⃣ IMMEDIATE SOLUTIONS (choose one):', 'yellow');
    log('   a) Wait for rate limit to reset (1 hour from last attempt)', 'white');
    log('   b) Increase rate limits in Supabase dashboard', 'white');
    log('   c) Temporarily disable email confirmation', 'white');
    log('   d) Use different email addresses for testing', 'white');
    
    log('\n2️⃣ INCREASE RATE LIMITS IN SUPABASE:', 'yellow');
    log('   • Go to: https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/auth/rate-limits', 'cyan');
    log('   • Increase "Email sending rate limit" to 500/hour', 'cyan');
    log('   • Increase "Sign ups and sign ins" to 100 per 5min', 'cyan');
    log('   • Save changes and wait 1-2 minutes', 'cyan');
    
    log('\n3️⃣ DISABLE EMAIL CONFIRMATION (Development):', 'yellow');
    log('   • Go to: https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/auth/settings', 'cyan');
    log('   • Turn OFF "Enable email confirmations"', 'cyan');
    log('   • Save changes', 'cyan');
    log('   ⚠️ Remember to re-enable before production!', 'red');
    
    log('\n4️⃣ SET UP CUSTOM SMTP (Long-term):', 'yellow');
    log('   • Sign up for Resend (https://resend.com)', 'cyan');
    log('   • Configure SMTP in Supabase Auth settings', 'cyan');
    log('   • Bypass Supabase email limits entirely', 'cyan');
    
  } else if (result.success) {
    log('✅ Signup is working! No rate limit detected.', 'green');
    log('💡 If you hit limits later, refer to the solutions above.', 'blue');
    
  } else {
    log('⚠️ Other issues detected:', 'yellow');
    log('• Check the error messages above', 'white');
    log('• Verify your environment variables are correct', 'white');
    log('• Make sure your development server is running', 'white');
  }
}

async function main() {
  logHeader('🚦 SUPABASE RATE LIMIT CHECKER');
  
  log('This script will test your signup endpoint and check for rate limits.', 'blue');
  log('Make sure your development server is running on http://localhost:3000\n', 'yellow');
  
  // Check Supabase configuration first
  const configResult = await checkSupabaseConfig();
  
  console.log('\n');
  
  // Test signup endpoint
  const signupResult = await testSignupEndpoint();
  
  console.log('\n');
  
  // Provide solutions based on results
  provideSolutions(signupResult);
  
  logHeader('📋 SUMMARY');
  
  if (signupResult.rateLimited) {
    log('🔴 STATUS: Rate limited', 'red');
    log('🎯 ACTION: Follow solutions above to resolve', 'yellow');
  } else if (signupResult.success) {
    log('✅ STATUS: Working correctly', 'green');
    log('🎯 ACTION: No immediate action needed', 'green');
  } else if (signupResult.error) {
    log('❌ STATUS: Network/server error', 'red');
    log('🎯 ACTION: Check that your dev server is running', 'yellow');
  } else {
    log('⚠️ STATUS: Other issues detected', 'yellow');
    log('🎯 ACTION: Review error messages above', 'yellow');
  }
  
  log('\n📚 For detailed guides, see:', 'blue');
  log('• SUPABASE_RATE_LIMITS_OPTIMIZATION.md', 'cyan');
  log('• SUPABASE_EMAIL_LIMITS_GUIDE.md', 'cyan');
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  log('❌ This script requires Node.js 18+ for fetch support', 'red');
  process.exit(1);
}

// Run the script
main().catch(error => {
  log(`❌ Script failed: ${error.message}`, 'red');
  process.exit(1);
});
