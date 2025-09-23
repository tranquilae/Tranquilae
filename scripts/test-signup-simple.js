#!/usr/bin/env node

/**
 * 🔬 Simple Signup Test
 * 
 * Basic test to see what's happening with signup
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

async function main() {
  log('🔬 Testing Signup Process', 'cyan');
  
  const testEmail = `test.${Date.now()}@gmail.com`; // Use valid email format
  const testData = {
    email: testEmail,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  };

  log(`📧 Using email: ${testEmail}`, 'blue');

  try {
    log('🔄 Sending signup request...', 'blue');
    
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    log(`📊 Response Status: ${response.status}`, 'blue');
    
    const responseText = await response.text();
    log(`📄 Raw Response:`, 'blue');
    console.log(responseText);
    
    try {
      const data = JSON.parse(responseText);
      log(`📋 Parsed Response:`, 'blue');
      console.log(JSON.stringify(data, null, 2));
      
      if (response.ok && data.success) {
        log('✅ Signup appears successful!', 'green');
        if (data.user) {
          log(`👤 User ID: ${data.user.id}`, 'green');
          log(`✉️ Email: ${data.user.email}`, 'green');
          log(`✅ Email confirmed: ${data.user.emailConfirmed ? 'Yes' : 'No'}`, data.user.emailConfirmed ? 'green' : 'yellow');
        }
      } else {
        log('❌ Signup failed', 'red');
        log(`Error: ${data.error || 'Unknown error'}`, 'red');
        if (data.code) {
          log(`Code: ${data.code}`, 'red');
        }
        if (data.details) {
          log('Details:', 'red');
          console.log(JSON.stringify(data.details, null, 2));
        }
      }
    } catch (parseError) {
      log('❌ Could not parse response as JSON', 'red');
      log('This might be an HTML error page or server issue', 'yellow');
    }
    
  } catch (error) {
    log(`❌ Network error: ${error.message}`, 'red');
    
    if (error.code === 'ECONNREFUSED') {
      log('💡 The development server is not running!', 'yellow');
      log('   Run: npm run dev', 'cyan');
    }
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  log('❌ This script requires Node.js 18+ for fetch support', 'red');
  process.exit(1);
}

main().catch(error => {
  log(`❌ Test failed: ${error.message}`, 'red');
});
