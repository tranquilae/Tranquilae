const { createClient } = require('@supabase/supabase-js')

// Test with current environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fspoavmvfymlunmfubqp.supabase.co'
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_i490cr3a929wFuz286rVKA_3EbsFJ7N'
const secretKey = process.env.SUPABASE_SECRET_KEY || 'local-dev-dummy-secret'

console.log('🔍 Testing Supabase Configuration...')
console.log('URL:', supabaseUrl)
console.log('Publishable Key:', publishableKey?.substring(0, 30) + '...')
console.log('Secret Key:', secretKey?.substring(0, 30) + '...')

// Test client-side connection
console.log('\n📱 Testing Client-Side Connection...')
const clientSideSupabase = createClient(supabaseUrl, publishableKey)

clientSideSupabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Client-side auth error:', error.message)
  } else {
    console.log('✅ Client-side connection successful')
    console.log('Session:', data.session ? 'Active' : 'None')
  }
})

// Test server-side connection (only if we have a real secret key)
if (secretKey && secretKey !== 'local-dev-dummy-secret') {
  console.log('\n🔑 Testing Server-Side Connection...')
  const serverSideSupabase = createClient(supabaseUrl, secretKey)
  
  // Test a simple query
  serverSideSupabase
    .from('users')
    .select('count')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Server-side connection error:', error.message)
        console.error('Error details:', error)
        
        if (error.message.includes('JWT')) {
          console.log('\n🔄 Possible JWT Secret Issue Detected!')
          console.log('This might require JWT secret rotation in Supabase.')
        }
      } else {
        console.log('✅ Server-side connection successful')
      }
    })
} else {
  console.log('\n⚠️  Skipping server-side test (no real secret key)')
}

// Test signup with a dummy email
console.log('\n📝 Testing Signup Functionality...')
setTimeout(() => {
  clientSideSupabase.auth.signUp({
    email: 'test-' + Date.now() + '@example.com',
    password: 'TestPassword123!@#',
    options: {
      data: {
        first_name: 'Test',
        last_name: 'User'
      }
    }
  }).then(({ data, error }) => {
    if (error) {
      console.error('❌ Signup test failed:', error.message)
      console.error('Error details:', error)
      
      if (error.message.includes('Invalid API key')) {
        console.log('\n🔑 API Key Issue Detected!')
        console.log('The publishable key might be invalid or expired.')
      }
      
      if (error.message.includes('JWT')) {
        console.log('\n🔄 JWT Secret Issue Detected!')
        console.log('You may need to rotate the JWT secret in Supabase.')
      }
      
      if (error.message.includes('redirect')) {
        console.log('\n🔗 Redirect URL Issue Detected!')
        console.log('Check your Supabase redirect URLs configuration.')
      }
    } else {
      console.log('✅ Signup test successful')
      console.log('User created:', data.user ? 'Yes' : 'No')
      console.log('Email confirmation required:', !data.session)
    }
    
    process.exit(0)
  })
}, 1000)
