#!/usr/bin/env node

/**
 * 🧪 Authentication Flow Tester
 * 
 * This script helps test your authentication flows without hitting email limits.
 * It can create test users and simulate various auth scenarios.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(50)}`);
  console.log(` ${title}`);
  console.log(`${'='.repeat(50)}${colors.reset}\n`);
}

async function testSignup(email, password, baseUrl = 'http://localhost:3000') {
  try {
    log('🔄 Testing signup...', 'blue');
    
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✅ Signup successful!', 'green');
      log(`📧 User: ${data.user?.email || 'Unknown'}`, 'green');
      log(`🆔 ID: ${data.user?.id || 'Unknown'}`, 'green');
      
      if (data.user?.email_confirmed_at) {
        log('✅ Email already confirmed', 'green');
      } else {
        log('⏳ Email confirmation pending', 'yellow');
      }
    } else {
      log(`❌ Signup failed: ${data.error || response.statusText}`, 'red');
      
      if (data.error && data.error.includes('rate limit')) {
        log('\n💡 SOLUTION: Email rate limit hit!', 'yellow');
        log('1. Wait 1 hour, OR', 'yellow');
        log('2. Disable email confirmation in Supabase Dashboard, OR', 'yellow');
        log('3. Use a different email address, OR', 'yellow');
        log('4. Set up custom SMTP provider', 'yellow');
        log('\nSee SUPABASE_EMAIL_LIMITS_GUIDE.md for details', 'cyan');
      }
    }
    
    return { success: response.ok, data };
  } catch (error) {
    log(`❌ Network error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testLogin(email, password, baseUrl = 'http://localhost:3000') {
  try {
    log('🔄 Testing login...', 'blue');
    
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✅ Login successful!', 'green');
      log(`📧 User: ${data.user?.email || 'Unknown'}`, 'green');
      log(`🔑 Session: ${data.session?.access_token ? 'Active' : 'None'}`, 'green');
    } else {
      log(`❌ Login failed: ${data.error || response.statusText}`, 'red');
    }
    
    return { success: response.ok, data };
  } catch (error) {
    log(`❌ Network error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testSupabaseConfig(baseUrl = 'http://localhost:3000') {
  try {
    log('🔄 Testing Supabase configuration...', 'blue');
    
    const response = await fetch(`${baseUrl}/api/debug/supabase`);
    const data = await response.json();
    
    if (response.ok) {
      log('✅ Supabase config test completed', 'green');
      log('📊 Check the full response for detailed results:', 'blue');
      console.log(JSON.stringify(data, null, 2));
    } else {
      log(`❌ Config test failed: ${data.error || response.statusText}`, 'red');
    }
    
    return { success: response.ok, data };
  } catch (error) {
    log(`❌ Network error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

function generateTestEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test.${timestamp}.${random}@example.com`;
}

async function quickTest() {
  logHeader('🚀 QUICK AUTHENTICATION TEST');
  
  const testEmail = generateTestEmail();
  const testPassword = 'TestPassword123!';
  
  log(`📧 Using test email: ${testEmail}`, 'cyan');
  log(`🔐 Using password: ${testPassword}`, 'cyan');
  
  // Test signup
  const signupResult = await testSignup(testEmail, testPassword);
  
  if (signupResult.success) {
    // Test login with same credentials
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await testLogin(testEmail, testPassword);
  }
}

async function interactiveTest() {
  logHeader('🎯 INTERACTIVE AUTHENTICATION TEST');
  
  return new Promise((resolve) => {
    rl.question('📧 Enter email to test: ', async (email) => {
      rl.question('🔐 Enter password: ', async (password) => {
        rl.question('🔄 Test [S]ignup, [L]ogin, or [B]oth? (S/L/B): ', async (choice) => {
          const lowerChoice = choice.toLowerCase();
          
          if (lowerChoice === 's' || lowerChoice === 'both' || lowerChoice === 'b') {
            await testSignup(email, password);
          }
          
          if (lowerChoice === 'l' || lowerChoice === 'both' || lowerChoice === 'b') {
            if (lowerChoice === 'b') {
              await new Promise(r => setTimeout(r, 1000)); // Brief pause
            }
            await testLogin(email, password);
          }
          
          rl.close();
          resolve();
        });
      });
    });
  });
}

async function main() {
  logHeader('🧪 TRANQUILAE AUTHENTICATION TESTER');
  
  log('This script helps test your authentication without email limits.', 'blue');
  log('Make sure your development server is running on http://localhost:3000\n', 'yellow');
  
  // First, test Supabase configuration
  await testSupabaseConfig();
  
  console.log('\n');
  
  return new Promise((resolve) => {
    rl.question('Choose test mode:\n1️⃣  Quick test (auto-generated email)\n2️⃣  Interactive test (custom email)\n3️⃣  Config test only\n\nEnter choice (1/2/3): ', async (choice) => {
      switch (choice.trim()) {
        case '1':
          await quickTest();
          break;
        case '2':
          await interactiveTest();
          break;
        case '3':
          log('✅ Configuration test completed above', 'green');
          break;
        default:
          log('❌ Invalid choice. Running quick test by default.', 'yellow');
          await quickTest();
      }
      
      log('\n🎉 Testing complete!', 'green');
      log('💡 Remember: If you hit email rate limits, check SUPABASE_EMAIL_LIMITS_GUIDE.md', 'cyan');
      rl.close();
      resolve();
    });
  });
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  log('❌ This script requires Node.js 18+ for fetch support', 'red');
  log('💡 Alternative: Use curl or Postman to test the endpoints manually', 'yellow');
  process.exit(1);
}

// Run the script
main().catch(error => {
  log(`❌ Script failed: ${error.message}`, 'red');
  process.exit(1);
});
