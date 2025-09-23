#!/usr/bin/env node

/**
 * Test script for Health Integrations Auto-Detection System
 * Run with: node scripts/test-health-integrations.js
 */

const { getHealthIntegrationStatus, logIntegrationStatus } = require('../lib/integrations/env-validator');

console.log('🧪 Testing Health Integrations Auto-Detection System\n');

try {
  // Test the integration status
  const status = getHealthIntegrationStatus();
  
  console.log('📊 Integration Status Summary:');
  console.log(`   Total Services: ${status.totalServices}`);
  console.log(`   Enabled Services: ${status.enabledServices}`);
  console.log(`   Coming Soon Services: ${status.disabledServices}`);
  console.log(`   Encryption Configured: ${status.encryptionConfigured ? '✅' : '❌'}`);
  console.log(`   Ready to Use: ${status.readyToUse ? '✅' : '❌'}\n`);
  
  console.log('📋 Individual Service Status:');
  Object.entries(status.serviceConfigs).forEach(([serviceName, config]) => {
    const icon = config.isConfigured ? '✅' : '🔄';
    const statusText = config.isConfigured ? 'READY' : 'COMING SOON';
    console.log(`   ${icon} ${serviceName.padEnd(15)} → ${statusText}`);
    
    if (!config.isConfigured && config.missingVars && config.missingVars.length > 0) {
      console.log(`      Missing: ${config.missingVars.join(', ')}`);
    }
  });
  
  console.log('\n🎯 To Enable Integrations:');
  console.log('   1. Set the missing environment variables in your .env.local or Vercel');
  console.log('   2. Restart your development server');
  console.log('   3. The integrations will automatically become available!\n');
  
  // Log the detailed status
  logIntegrationStatus();
  
} catch (error) {
  console.error('❌ Error testing integration status:', error);
  process.exit(1);
}

console.log('✅ Test completed successfully!');
