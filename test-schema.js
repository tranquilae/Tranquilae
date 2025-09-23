const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fspoavmvfymlunmfubqp.supabase.co'
const secretKey = process.env.SUPABASE_SECRET_KEY || 'dummy'

console.log('🧪 Testing Database Schema...')

if (secretKey === 'dummy') {
  console.log('⚠️ Using dummy secret key - this test needs real secret key to work properly')
}

const supabase = createClient(supabaseUrl, secretKey)

async function testSchema() {
  console.log('\n1️⃣ Testing users table...')
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, plan')
      .limit(1)
    
    if (error) {
      console.error('❌ Users table error:', error.message)
    } else {
      console.log('✅ Users table exists and accessible')
      console.log('Users found:', data?.length || 0)
    }
  } catch (err) {
    console.error('❌ Users table test failed:', err.message)
  }

  console.log('\n2️⃣ Testing subscriptions table...')
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan, status')
      .limit(1)
    
    if (error) {
      console.error('❌ Subscriptions table error:', error.message)
    } else {
      console.log('✅ Subscriptions table exists and accessible')
    }
  } catch (err) {
    console.error('❌ Subscriptions table test failed:', err.message)
  }

  console.log('\n3️⃣ Testing audit_logs table...')
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, event_type, created_at')
      .limit(1)
    
    if (error) {
      console.error('❌ Audit logs table error:', error.message)
    } else {
      console.log('✅ Audit logs table exists and accessible')
    }
  } catch (err) {
    console.error('❌ Audit logs table test failed:', err.message)
  }

  console.log('\n🎯 Schema Test Complete!')
  console.log('If all tables show as accessible, signup should work now.')
}

testSchema().then(() => {
  process.exit(0)
}).catch(err => {
  console.error('Schema test failed:', err)
  process.exit(1)
})
