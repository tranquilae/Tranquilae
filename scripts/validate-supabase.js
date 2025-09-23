#!/usr/bin/env node
/**
 * Supabase Configuration Validator
 * 
 * This script helps you validate your Supabase configuration
 * and debug common authentication issues.
 * 
 * Usage: node scripts/validate-supabase.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Supabase Configuration Validator\n')

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function success(message) {
  log(`✅ ${message}`, 'green')
}

function error(message) {
  log(`❌ ${message}`, 'red')
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue')
}

async function validateSupabaseConfig() {
  let hasErrors = false

  // Step 1: Check environment variables
  log('\n📋 Step 1: Checking Environment Variables', 'cyan')
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (url) {
    if (url.includes('.supabase.co')) {
      success(`NEXT_PUBLIC_SUPABASE_URL: ${url}`)
    } else {
      error(`NEXT_PUBLIC_SUPABASE_URL: Invalid format - ${url}`)
      hasErrors = true
    }
  } else {
    error('NEXT_PUBLIC_SUPABASE_URL: Missing')
    hasErrors = true
  }

  if (anonKey) {
    if (anonKey.startsWith('eyJ')) {
      success(`NEXT_PUBLIC_SUPABASE_ANON_KEY: Set (${anonKey.substring(0, 20)}...)`)
    } else {
      error(`NEXT_PUBLIC_SUPABASE_ANON_KEY: Invalid format - should start with "eyJ"`)
      hasErrors = true
    }
  } else {
    error('NEXT_PUBLIC_SUPABASE_ANON_KEY: Missing')
    hasErrors = true
  }

  if (serviceKey) {
    if (serviceKey.startsWith('eyJ')) {
      success(`SUPABASE_SERVICE_ROLE_KEY: Set (${serviceKey.substring(0, 20)}...)`)
    } else {
      error(`SUPABASE_SERVICE_ROLE_KEY: Invalid format - should start with "eyJ"`)
      hasErrors = true
    }
  } else {
    warning('SUPABASE_SERVICE_ROLE_KEY: Not set (optional for basic auth)')
  }

  if (siteUrl) {
    success(`NEXT_PUBLIC_SITE_URL: ${siteUrl}`)
  } else {
    warning('NEXT_PUBLIC_SITE_URL: Not set (will use localhost)')
  }

  // Step 2: Test client creation
  log('\n🔧 Step 2: Testing Client Creation', 'cyan')
  
  if (!url || !anonKey) {
    error('Cannot test client creation - missing required environment variables')
    return false
  }

  try {
    const client = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
    success('Supabase client created successfully')

    // Step 3: Test connectivity
    log('\n🌐 Step 3: Testing Connectivity', 'cyan')
    
    try {
      const { data, error } = await client.auth.getSession()
      
      if (!error) {
        success('Successfully connected to Supabase Auth')
      } else {
        error(`Connection test failed: ${error.message}`)
        hasErrors = true
      }
    } catch (connectError) {
      error(`Connection test failed: ${connectError.message}`)
      hasErrors = true
    }

    // Step 4: Test signup validation
    log('\n🧪 Step 4: Testing Signup Validation', 'cyan')
    
    try {
      // Test with invalid email to see if validation works
      const { data, error } = await client.auth.signUp({
        email: 'invalid-email-format',
        password: 'testpass'
      })
      
      if (error) {
        if (error.message.includes('Invalid') || error.message.includes('valid email')) {
          success('Signup validation is working correctly')
        } else {
          warning(`Unexpected signup error: ${error.message}`)
        }
      } else {
        warning('Signup succeeded with invalid email - this may indicate an issue')
      }
    } catch (signupError) {
      error(`Signup test failed: ${signupError.message}`)
      hasErrors = true
    }

  } catch (clientError) {
    error(`Failed to create Supabase client: ${clientError.message}`)
    hasErrors = true
  }

  // Step 5: Summary and recommendations
  log('\n📊 Summary', 'cyan')
  
  if (hasErrors) {
    error('Configuration issues detected!')
    log('\n🔧 Recommendations:', 'yellow')
    
    if (!url) {
      log('• Set NEXT_PUBLIC_SUPABASE_URL in your .env.local file')
    }
    if (!anonKey) {
      log('• Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
    }
    if (url && !url.includes('.supabase.co')) {
      log('• Check your Supabase project URL format')
    }
    if (anonKey && !anonKey.startsWith('eyJ')) {
      log('• Verify your anon key is correct (should be a JWT token)')
    }
    
    log('\n📚 Getting your keys:', 'blue')
    log('1. Go to https://supabase.com/dashboard')
    log('2. Select your project')
    log('3. Go to Settings → API')
    log('4. Copy the URL and anon/public key')
    log('5. Add them to your .env.local file')
    
  } else {
    success('All configuration checks passed!')
    log('\n🎉 Your Supabase setup looks good!', 'green')
    log('\nNext steps:', 'blue')
    log('• Try signing up through your app')
    log('• Check your browser console for any client-side errors')
    log('• Monitor your server logs for authentication issues')
  }

  return !hasErrors
}

// Run validation
validateSupabaseConfig()
  .then(success => {
    if (!success) {
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n❌ Validation script failed:', error.message)
    process.exit(1)
  })
