require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Test Supabase connection with current keys
async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Your current environment variables
  const SUPABASE_URL = 'https://fspoavmvfymlunmfubqp.supabase.co';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Environment Check:');
  console.log(`SUPABASE_URL: ${SUPABASE_URL}`);
  console.log(`ANON_KEY: ${SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT SET'}`);
  console.log(`SERVICE_KEY: ${SUPABASE_SERVICE_KEY ? `${SUPABASE_SERVICE_KEY.substring(0, 20)}...` : 'NOT SET'}`);
  console.log('');

  if (!SUPABASE_ANON_KEY) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    console.log('Please set it in your .env.local file');
    return;
  }

  if (!SUPABASE_SERVICE_KEY) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
    console.log('Please set it in your .env.local file');
    return;
  }

  // Test client connection (anon key)
  try {
    console.log('Testing client connection (anon key)...');
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test a simple query
    const { data, error } = await supabaseClient
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Client connection failed:', error.message);
    } else {
      console.log('✅ Client connection successful');
    }
  } catch (err) {
    console.log('❌ Client connection error:', err.message);
  }

  // Test admin connection (service key)
  try {
    console.log('Testing admin connection (service key)...');
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Test admin query
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Admin connection failed:', error.message);
    } else {
      console.log('✅ Admin connection successful');
    }
  } catch (err) {
    console.log('❌ Admin connection error:', err.message);
  }

  console.log('\n🔧 Next Steps:');
  console.log('1. If connections failed, get new keys from Supabase Dashboard');
  console.log('2. Go to Settings → API in your Supabase project');
  console.log('3. Copy the "anon public" and "service_role" keys');
  console.log('4. Update your environment variables');
}

// Run the test
testSupabaseConnection().catch(console.error);
