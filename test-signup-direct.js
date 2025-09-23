const { createClient } = require('@supabase/supabase-js')

// Test direct client-side signup (bypassing our API routes)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fspoavmvfymlunmfubqp.supabase.co'
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_i490cr3a929wFuz286rVKA_3EbsFJ7N'

console.log('🧪 Testing Direct Client-Side Signup (Bypassing Server API)...')
console.log('This will help confirm if the issue is server-side JWT secret.')

const supabase = createClient(supabaseUrl, publishableKey)

// Generate a unique email to avoid rate limits
const uniqueEmail = `test-direct-${Date.now()}@example.com`
console.log(`\n📧 Testing with email: ${uniqueEmail}`)

supabase.auth.signUp({
  email: uniqueEmail,
  password: 'TestPassword123!@#',
  options: {
    data: {
      first_name: 'Test',
      last_name: 'Direct'
    }
  }
}).then(({ data, error }) => {
  if (error) {
    console.error('❌ Direct signup failed:', error.message)
    console.error('Error code:', error.code)
    console.error('Error status:', error.status)
    
    if (error.code === 'over_email_send_rate_limit') {
      console.log('\n⏰ Rate limit hit - this is actually good!')
      console.log('It means the publishable key is working correctly.')
      console.log('The issue is likely server-side JWT secret.')
    }
  } else {
    console.log('✅ Direct signup successful!')
    console.log('User created:', !!data.user)
    console.log('Session created:', !!data.session)
    console.log('Email confirmation needed:', !data.session && !!data.user)
    
    if (data.user && !data.session) {
      console.log('\n📬 Check your email for confirmation link')
    }
    
    console.log('\n🎯 This confirms:')
    console.log('- Publishable key works correctly')
    console.log('- Direct Supabase auth works')
    console.log('- Issue is in your server-side API routes')
    console.log('- Most likely: JWT secret mismatch with new API keys')
  }
  
  console.log('\n🔧 Next steps:')
  console.log('1. Rotate JWT secret in Supabase dashboard')
  console.log('2. Update SUPABASE_JWT_SECRET environment variable')
  console.log('3. Get your real secret key (sb_secret_...)')
  console.log('4. Test server-side operations again')
  
  process.exit(0)
})
