#!/usr/bin/env node

/**
 * 🔧 Supabase Configuration Validator
 * 
 * This script helps validate your Supabase configuration and guides you 
 * through fixing any issues with keys, URLs, or format problems.
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for better output
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

function logHeader(message) {
  console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan} ${message}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Load environment variables from multiple sources
function loadEnvironmentVariables() {
  const envFiles = ['.env.local', '.env', '.env.new-supabase'];
  let envVars = {};
  
  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`📄 Loading ${file}...`, 'blue');
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=').replace(/^"(.*)"$/, '$1');
          if (key && value) {
            envVars[key.trim()] = value.trim();
          }
        }
      });
    }
  });
  
  // Override with actual process.env
  Object.keys(process.env).forEach(key => {
    if (key.includes('SUPABASE') || key === 'DATABASE_URL') {
      envVars[key] = process.env[key];
    }
  });
  
  return envVars;
}

// Validate Supabase URL format
function validateSupabaseUrl(url) {
  const issues = [];
  
  if (!url) {
    issues.push('URL is missing');
    return issues;
  }
  
  if (url.includes('placeholder')) {
    issues.push('URL contains placeholder value');
  }
  
  if (!url.startsWith('https://')) {
    issues.push('URL should start with https://');
  }
  
  if (!url.includes('.supabase.co')) {
    issues.push('URL should contain .supabase.co');
  }
  
  const urlPattern = /^https:\/\/[a-zA-Z0-9]{20}\.supabase\.co$/;
  if (!urlPattern.test(url)) {
    issues.push('URL format is invalid (should be https://[20-char-id].supabase.co)');
  }
  
  return issues;
}

// Validate API key format
function validateApiKey(key, keyType) {
  const issues = [];
  
  if (!key) {
    issues.push(`${keyType} is missing`);
    return issues;
  }
  
  if (key.includes('placeholder')) {
    issues.push(`${keyType} contains placeholder value`);
  }
  
  if (key.includes('dummy')) {
    issues.push(`${keyType} contains dummy value (expected for local development)`);
  }
  
  // Check for new format keys
  if (keyType === 'Publishable Key' && !key.startsWith('sb_publishable_')) {
    issues.push(`${keyType} should start with 'sb_publishable_' for new format`);
  }
  
  if (keyType === 'Secret Key' && !key.startsWith('sb_secret_')) {
    issues.push(`${keyType} should start with 'sb_secret_' for new format`);
  }
  
  // Check for truncated keys (incomplete keys)
  if (key.includes('...')) {
    issues.push(`${keyType} appears to be truncated (contains '...')`);
  }
  
  // Validate key length (Supabase keys are typically very long)
  if (keyType === 'Publishable Key' && key.length < 50) {
    issues.push(`${keyType} seems too short (expected 100+ characters)`);
  }
  
  if (keyType === 'Secret Key' && key.length < 50 && !key.includes('dummy')) {
    issues.push(`${keyType} seems too short (expected 100+ characters)`);
  }
  
  return issues;
}

// Validate JWT secret format
function validateJwtSecret(secret) {
  const issues = [];
  
  if (!secret) {
    issues.push('JWT Secret is missing');
    return issues;
  }
  
  if (secret.includes('placeholder')) {
    issues.push('JWT Secret contains placeholder value');
  }
  
  // New format is UUID-like
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(secret)) {
    issues.push('JWT Secret should be in UUID format for new system');
  }
  
  return issues;
}

// Main validation function
async function validateConfiguration() {
  logHeader('🔍 SUPABASE CONFIGURATION VALIDATOR');
  
  const envVars = loadEnvironmentVariables();
  
  log('Found environment variables:', 'blue');
  Object.keys(envVars).forEach(key => {
    if (key.includes('SUPABASE') || key === 'DATABASE_URL') {
      const value = envVars[key];
      // Mask sensitive values
      const maskedValue = key.includes('SECRET') || key.includes('SERVICE_ROLE') ? 
        `${value.substring(0, 10)}...${value.substring(value.length - 4)}` : value;
      log(`  ${key}: ${maskedValue}`, 'white');
    }
  });
  
  console.log('\n');
  
  let totalIssues = 0;
  
  // Validate Supabase URL
  logHeader('🌐 VALIDATING SUPABASE URL');
  const urlIssues = validateSupabaseUrl(envVars.NEXT_PUBLIC_SUPABASE_URL);
  if (urlIssues.length === 0) {
    logSuccess('Supabase URL format is valid');
  } else {
    urlIssues.forEach(issue => logError(`URL: ${issue}`));
    totalIssues += urlIssues.length;
  }
  
  // Validate Publishable Key
  logHeader('🔑 VALIDATING PUBLISHABLE KEY');
  const pubKeyIssues = validateApiKey(envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Publishable Key');
  if (pubKeyIssues.length === 0) {
    logSuccess('Publishable Key format is valid');
  } else {
    pubKeyIssues.forEach(issue => logError(`Publishable Key: ${issue}`));
    totalIssues += pubKeyIssues.length;
  }
  
  // Validate Secret Key
  logHeader('🔐 VALIDATING SECRET KEY');
  const secretKeyIssues = validateApiKey(envVars.SUPABASE_SERVICE_ROLE_KEY, 'Secret Key');
  if (secretKeyIssues.length === 0) {
    logSuccess('Secret Key format is valid');
  } else {
    secretKeyIssues.forEach(issue => {
      if (issue.includes('dummy')) {
        logWarning(`Secret Key: ${issue}`);
      } else {
        logError(`Secret Key: ${issue}`);
        totalIssues += 1;
      }
    });
  }
  
  // Validate JWT Secret
  logHeader('🎫 VALIDATING JWT SECRET');
  const jwtIssues = validateJwtSecret(envVars.SUPABASE_JWT_SECRET);
  if (jwtIssues.length === 0) {
    logSuccess('JWT Secret format is valid');
  } else {
    jwtIssues.forEach(issue => logError(`JWT Secret: ${issue}`));
    totalIssues += jwtIssues.length;
  }
  
  // Check database URL
  logHeader('🗄️ VALIDATING DATABASE CONNECTION');
  if (!envVars.DATABASE_URL) {
    logError('DATABASE_URL is missing');
    totalIssues += 1;
  } else if (envVars.DATABASE_URL.includes('placeholder') || envVars.DATABASE_URL.includes('[YOUR-PASSWORD]')) {
    logError('DATABASE_URL contains placeholder values');
    totalIssues += 1;
  } else {
    logSuccess('Database URL is configured');
  }
  
  // Summary
  logHeader('📋 VALIDATION SUMMARY');
  
  if (totalIssues === 0) {
    logSuccess('🎉 All Supabase configuration looks good!');
  } else {
    logError(`Found ${totalIssues} configuration issues that need to be fixed.`);
    
    console.log('\n');
    logInfo('🛠️ HOW TO FIX THESE ISSUES:');
    console.log('\n1. Go to your Supabase Dashboard:');
    log(`   https://supabase.com/dashboard/project/${envVars.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'YOUR_PROJECT'}/settings/api`, 'cyan');
    
    console.log('\n2. Copy the COMPLETE keys (click the eye icon to reveal):');
    log('   • Publishable key → NEXT_PUBLIC_SUPABASE_ANON_KEY', 'cyan');
    log('   • Secret keys → default → SUPABASE_SERVICE_ROLE_KEY', 'cyan');
    
    console.log('\n3. For JWT Secret, go to JWT Settings:');
    log(`   https://supabase.com/dashboard/project/${envVars.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'YOUR_PROJECT'}/settings/api`, 'cyan');
    log('   Copy the current JWT Key ID', 'cyan');
    
    console.log('\n4. Update your .env.local file with the complete values');
    
    console.log('\n5. Restart your development server');
  }
  
  // Test connection if configuration looks good
  if (totalIssues === 0) {
    logHeader('🔌 TESTING CONNECTION');
    logInfo('Configuration looks good. You can now test your debug endpoint:');
    log('   npm run dev', 'cyan');
    log('   # In another terminal:', 'cyan');
    log('   curl http://localhost:3000/api/debug/supabase', 'cyan');
  }
}

// Run validation
validateConfiguration().catch(error => {
  logError(`Validation failed: ${error.message}`);
  process.exit(1);
});
