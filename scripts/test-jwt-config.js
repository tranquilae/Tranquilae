#!/usr/bin/env node

/**
 * 🔐 Supabase JWT Configuration Test Script
 * 
 * This script validates your new Supabase JWT configuration
 * and ensures all environment variables are properly formatted.
 */

const { createClient } = require('@supabase/supabase-js');

// ANSI color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

function success(message) {
  log('green', '✅', message);
}

function error(message) {
  log('red', '❌', message);
}

function warning(message) {
  log('yellow', '⚠️ ', message);
}

function info(message) {
  log('blue', 'ℹ️ ', message);
}

function validateJWTStructure(token, keyName) {
  info(`Validating ${keyName} structure...`);
  
  if (!token) {
    error(`${keyName} is missing or empty`);
    return false;
  }

  // Check if it's a proper JWT (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    error(`${keyName} is not a valid JWT format (should have 3 parts)`);
    return false;
  }

  try {
    // Decode the payload (middle part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check for required Supabase fields
    if (!payload.iss || payload.iss !== 'supabase') {
      error(`${keyName} is not a Supabase JWT (missing 'iss: supabase')`);
      return false;
    }

    if (!payload.role) {
      error(`${keyName} is missing 'role' field`);
      return false;
    }

    if (!payload.ref) {
      error(`${keyName} is missing 'ref' (project ID) field`);
      return false;
    }

    success(`${keyName} has valid JWT structure`);
    info(`  - Role: ${payload.role}`);
    info(`  - Project: ${payload.ref}`);
    info(`  - Issuer: ${payload.iss}`);
    
    // Check expiration (if present)
    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      const now = new Date();
      if (expDate < now) {
        warning(`${keyName} has expired on ${expDate.toISOString()}`);
      } else {
        info(`  - Expires: ${expDate.toISOString()}`);
      }
    }

    return true;
  } catch (e) {
    error(`Failed to decode ${keyName}: ${e.message}`);
    return false;
  }
}

function validateEnvironmentVariables() {
  console.log(`${colors.bold}${colors.blue}🔐 Supabase JWT Configuration Test${colors.reset}\n`);

  let allValid = true;
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET'
  ];

  // Check if all required variables exist
  info('Checking required environment variables...');
  for (const varName of required) {
    if (!process.env[varName]) {
      error(`Missing required environment variable: ${varName}`);
      allValid = false;
    } else {
      success(`${varName} is set`);
    }
  }

  if (!allValid) {
    error('\nPlease set all required environment variables before continuing.');
    process.exit(1);
  }

  console.log('');

  // Validate URL format
  info('Validating Supabase URL format...');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('supabase.co')) {
      warning('URL does not appear to be a standard Supabase URL');
    } else {
      success('Supabase URL format is valid');
    }
  } catch (e) {
    error(`Invalid Supabase URL format: ${e.message}`);
    allValid = false;
  }

  console.log('');

  // Validate JWT keys
  const anonValid = validateJWTStructure(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('');
  
  const serviceValid = validateJWTStructure(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
  console.log('');

  // Validate JWT Secret
  info('Validating JWT secret...');
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (jwtSecret.length < 32) {
    error('SUPABASE_JWT_SECRET should be at least 32 characters long');
    allValid = false;
  } else {
    success(`JWT secret length is adequate (${jwtSecret.length} characters)`);
  }

  // Check that anon and service role keys have different roles
  try {
    const anonPayload = JSON.parse(Buffer.from(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.')[1], 'base64').toString());
    const servicePayload = JSON.parse(Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY.split('.')[1], 'base64').toString());
    
    if (anonPayload.role === 'anon' && servicePayload.role === 'service_role') {
      success('JWT keys have correct roles (anon and service_role)');
    } else {
      error(`JWT keys have incorrect roles: anon=${anonPayload.role}, service=${servicePayload.role}`);
      allValid = false;
    }
    
    if (anonPayload.ref === servicePayload.ref) {
      success('Both keys belong to the same project');
    } else {
      error('JWT keys belong to different projects!');
      allValid = false;
    }
  } catch (e) {
    error('Failed to compare JWT key roles');
    allValid = false;
  }

  return allValid && anonValid && serviceValid;
}

async function testSupabaseConnection() {
  console.log(`\n${colors.bold}Testing Supabase Connection...${colors.reset}\n`);

  try {
    // Test anon client
    info('Testing anonymous client connection...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.from('nonexistent_table').select('*').limit(1);
    
    // We expect this to fail with a table not found error, not an auth error
    if (error && error.message.includes('relation "nonexistent_table" does not exist')) {
      success('Anonymous client can connect to Supabase (table error expected)');
    } else if (error && error.message.includes('JWT')) {
      error(`JWT authentication failed: ${error.message}`);
      return false;
    } else {
      warning(`Unexpected response: ${error?.message || 'Success'}`);
    }

    // Test service role client
    info('Testing service role client connection...');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: adminData, error: adminError } = await supabaseAdmin.from('nonexistent_table').select('*').limit(1);
    
    if (adminError && adminError.message.includes('relation "nonexistent_table" does not exist')) {
      success('Service role client can connect to Supabase (table error expected)');
    } else if (adminError && adminError.message.includes('JWT')) {
      error(`Service role JWT authentication failed: ${adminError.message}`);
      return false;
    } else {
      warning(`Unexpected admin response: ${adminError?.message || 'Success'}`);
    }

    return true;
  } catch (e) {
    error(`Connection test failed: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('🌿 Tranquilae - Supabase JWT Configuration Test\n');

  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  // Run validation tests
  const envValid = validateEnvironmentVariables();
  
  if (!envValid) {
    console.log(`\n${colors.red}${colors.bold}❌ Configuration validation failed!${colors.reset}`);
    console.log('\n📚 Please check the migration guide:');
    console.log('   documentation/SUPABASE_JWT_MIGRATION_GUIDE.md\n');
    process.exit(1);
  }

  const connectionValid = await testSupabaseConnection();

  console.log(`\n${colors.bold}📋 Test Results:${colors.reset}`);
  console.log(`Environment Variables: ${envValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`Supabase Connection: ${connectionValid ? '✅ Working' : '❌ Failed'}`);

  if (envValid && connectionValid) {
    console.log(`\n${colors.green}${colors.bold}🎉 All tests passed!${colors.reset}`);
    console.log('Your Supabase JWT configuration is working correctly.');
    console.log('\n📚 Next steps:');
    console.log('1. Update your Vercel environment variables');
    console.log('2. Deploy and test in production');
    console.log('3. Monitor authentication flows');
    console.log('4. Check the security dashboard');
  } else {
    console.log(`\n${colors.red}${colors.bold}⚠️  Some tests failed!${colors.reset}`);
    console.log('Please fix the issues above before deploying.');
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  error(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

main().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});
