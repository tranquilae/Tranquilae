#!/usr/bin/env node

/**
 * 🗂️ Supabase Audit Logs Table Creator
 * 
 * Creates the missing audit_logs table in your Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

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

async function createAuditLogsTable() {
  logHeader('🗂️ CREATING SUPABASE AUDIT_LOGS TABLE');
  
  // Get Supabase service role key for admin operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  
  if (!serviceRoleKey || serviceRoleKey.includes('dummy') || serviceRoleKey.includes('local-dev')) {
    log('❌ No valid Supabase service role key found', 'red');
    log('💡 You need to set SUPABASE_SERVICE_ROLE_KEY in your environment', 'yellow');
    log('   Get it from: https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/settings/api', 'cyan');
    return { success: false, error: 'No service role key' };
  }
  
  log(`🔗 Connecting to Supabase: ${supabaseUrl}`, 'blue');
  log(`🔑 Using service role key: ${serviceRoleKey.substring(0, 15)}...`, 'blue');
  
  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // Create the audit_logs table using SQL
    log('🔨 Creating audit_logs table in Supabase...', 'blue');
    
    const { data, error } = await supabaseAdmin.rpc('create_audit_logs_table', {});
    
    // If the RPC doesn't exist, create the table directly
    if (error && error.message.includes('could not find function')) {
      log('📝 Creating table directly with SQL...', 'blue');
      
      const { data: tableData, error: tableError } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .limit(1);
      
      if (tableError && tableError.code === 'PGRST116') {
        // Table doesn't exist, we need to create it
        log('⚠️ Cannot create table directly via client - need SQL editor', 'yellow');
        
        const sqlScript = `
-- Create audit_logs table in Supabase
CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid,
  success boolean DEFAULT false,
  error text,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX audit_logs_user_id_idx ON public.audit_logs(user_id);
CREATE INDEX audit_logs_event_type_idx ON public.audit_logs(event_type);
CREATE INDEX audit_logs_created_at_idx ON public.audit_logs(created_at);

-- Enable Row Level Security (optional)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to insert/read
CREATE POLICY "Service role can manage audit logs" ON public.audit_logs
  FOR ALL USING (auth.role() = 'service_role');
`;
        
        log('\n📋 SQL SCRIPT TO RUN IN SUPABASE:', 'cyan');
        log('1. Go to: https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/sql', 'cyan');
        log('2. Copy and paste this SQL:', 'cyan');
        console.log('\n' + sqlScript);
        log('3. Click "Run" to execute', 'cyan');
        
        return { 
          success: false, 
          needsManualCreation: true, 
          sqlScript,
          instructions: [
            'Go to Supabase SQL Editor',
            'Run the provided SQL script',
            'Test again with this script'
          ]
        };
      } else if (!tableError) {
        log('✅ audit_logs table already exists!', 'green');
        return { success: true, message: 'Table already exists' };
      } else {
        log(`❌ Error checking table: ${tableError.message}`, 'red');
        return { success: false, error: tableError.message };
      }
    } else if (error) {
      log(`❌ Error creating table: ${error.message}`, 'red');
      return { success: false, error: error.message };
    } else {
      log('✅ audit_logs table created successfully!', 'green');
      return { success: true, data };
    }
    
  } catch (error) {
    log(`❌ Connection error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testTableAccess() {
  logHeader('🧪 TESTING AUDIT_LOGS TABLE ACCESS');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  
  if (!serviceRoleKey || serviceRoleKey.includes('dummy')) {
    log('⚠️ Skipping test - no service role key', 'yellow');
    return { success: false, error: 'No service key' };
  }
  
  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // Test inserting a log entry
    log('🔄 Testing audit log insertion...', 'blue');
    
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        event_type: 'TEST_EVENT',
        success: true,
        error: null,
        metadata: { test: true, timestamp: new Date().toISOString() }
      })
      .select()
      .single();
    
    if (error) {
      log(`❌ Failed to insert test log: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
    
    log('✅ Test log inserted successfully!', 'green');
    log(`📝 Log ID: ${data.id}`, 'green');
    
    // Clean up test entry
    await supabaseAdmin
      .from('audit_logs')
      .delete()
      .eq('id', data.id);
    
    log('🧹 Test log cleaned up', 'blue');
    
    return { success: true, data };
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function main() {
  logHeader('🗂️ SUPABASE AUDIT_LOGS TABLE SETUP');
  
  log('This script will create the missing audit_logs table in Supabase', 'blue');
  
  // Try to create the table
  const createResult = await createAuditLogsTable();
  
  if (createResult.needsManualCreation) {
    logHeader('📋 MANUAL SETUP REQUIRED');
    log('The table needs to be created manually through the Supabase SQL editor.', 'yellow');
    log('Follow the instructions shown above.', 'yellow');
    return;
  }
  
  if (!createResult.success) {
    log(`🔴 Failed to create table: ${createResult.error}`, 'red');
    return;
  }
  
  // Test table access
  const testResult = await testTableAccess();
  
  logHeader('📋 SUMMARY');
  
  if (createResult.success && testResult.success) {
    log('🎉 Audit logs table is ready!', 'green');
    log('✅ Table created/exists', 'green');
    log('✅ Write access working', 'green');
    log('✅ Your supabaseLogger should work now', 'green');
  } else {
    log('⚠️ Setup partially complete', 'yellow');
    log(`Table creation: ${createResult.success ? '✅' : '❌'}`, createResult.success ? 'green' : 'red');
    log(`Access test: ${testResult.success ? '✅' : '❌'}`, testResult.success ? 'green' : 'red');
    
    if (createResult.needsManualCreation) {
      log('\n💡 Next step: Run the SQL script in Supabase SQL editor', 'cyan');
    }
  }
}

main().catch(error => {
  log(`❌ Script failed: ${error.message}`, 'red');
  console.error(error);
});
