const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fspoavmvfymlunmfubqp.supabase.co'
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_i490cr3a929wFuz286rVKA_3EbsFJ7N'

console.log('🔍 Diagnosing Supabase Auth Configuration...')
console.log('URL:', supabaseUrl)
console.log('Key:', publishableKey?.substring(0, 30) + '...')

const supabase = createClient(supabaseUrl, publishableKey)

async function diagnoseAuthConfig() {
  console.log('\n📊 Testing Auth Configuration...')
  
  // Test 1: Check if Auth is enabled
  console.log('\n1️⃣ Testing Auth Service Availability...')
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('❌ Auth service error:', error.message)
      if (error.message.includes('Auth service is disabled')) {
        console.log('🚨 AUTH IS DISABLED!')
        console.log('This explains why signup is failing.')
        console.log('You need to enable Auth in Supabase dashboard.')
        return
      }
    } else {
      console.log('✅ Auth service is available')
    }
  } catch (err) {
    console.error('❌ Auth service connection failed:', err.message)
    return
  }

  // Test 2: Check database connection (if using external DB)
  console.log('\n2️⃣ Testing Database Connection...')
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection error:', error.message)
      if (error.message.includes('relation "users" does not exist')) {
        console.log('🗃️ Users table does not exist!')
        console.log('This indicates database setup issues.')
      }
      if (error.message.includes('permission denied')) {
        console.log('🔒 Permission denied!')
        console.log('This indicates auth/RLS setup issues.')
      }
    } else {
      console.log('✅ Database connection works')
    }
  } catch (err) {
    console.error('❌ Database test failed:', err.message)
  }

  // Test 3: Check Auth settings
  console.log('\n3️⃣ Testing Auth Settings...')
  try {
    // Try to get auth settings (this will fail if auth is disabled)
    const { data, error } = await supabase.auth.signUp({
      email: 'test-check@example.com',
      password: 'TestPassword123!'
    })
    
    if (error) {
      console.error('❌ Signup test error:', error.message)
      
      if (error.message.includes('Email signups are disabled')) {
        console.log('📧 Email signups are disabled!')
        console.log('Enable email signups in Auth settings.')
      }
      
      if (error.message.includes('Auth service is disabled')) {
        console.log('🚨 AUTH SERVICE IS DISABLED!')
        console.log('Enable Auth in Supabase dashboard.')
      }
      
      if (error.message.includes('Invalid API key')) {
        console.log('🔑 API key issue (but you said keys are correct)')
      }
      
      if (error.message.includes('rate limit')) {
        console.log('✅ Rate limit (means auth is working)')
      }
    } else {
      console.log('✅ Signup functionality works')
    }
  } catch (err) {
    console.error('❌ Auth settings test failed:', err.message)
  }

  console.log('\n🔧 Next Steps Based on Results:')
  console.log('1. If AUTH IS DISABLED: Enable Auth in Supabase dashboard')
  console.log('2. If Users table missing: Set up proper database schema')
  console.log('3. If Permission denied: Configure RLS policies')
  console.log('4. If Email signups disabled: Enable in Auth settings')
}

diagnoseAuthConfig().then(() => {
  process.exit(0)
}).catch(err => {
  console.error('Diagnosis failed:', err)
  process.exit(1)
})
