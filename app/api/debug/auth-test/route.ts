import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Only allow access in development
function isDevEnvironment() {
  return process.env['NODE_ENV'] === 'development' || process.env['VERCEL_ENV'] === 'preview'
}

export async function GET(request: NextRequest) {
  // Security: Only allow in development
  if (!isDevEnvironment()) {
    return NextResponse.json({ error: 'Debug endpoint only available in development' }, { status: 403 })
  }

  try {
    const tests = []
    
    // Test 1: Environment Variables
    const envTest = {
      name: 'Environment Variables',
      status: 'checking',
      details: {}
    }
    
    const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
    const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SECRET_KEY']
    
    envTest.details = {
      url: url ? '✅ Set' : '❌ Missing',
      anonKey: anonKey ? `✅ Set (${anonKey.substring(0, 10)}...)` : '❌ Missing',
      serviceKey: serviceKey ? `✅ Set (${serviceKey.substring(0, 10)}...)` : '❌ Missing'
    }
    
    envTest.status = (url && anonKey) ? 'passed' : 'failed'
    tests.push(envTest)
    
    // Test 2: Client Creation
    const clientTest = {
      name: 'Supabase Client Creation',
      status: 'checking',
      error: null,
      details: {}
    }
    
    let testClient = null
    try {
      if (url && anonKey) {
        testClient = createClient(url, anonKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
          }
        })
        clientTest.status = 'passed'
        clientTest.details.message = 'Client created successfully'
      } else {
        clientTest.status = 'failed'
        clientTest.error = 'Missing URL or anon key'
      }
    } catch (error: any) {
      clientTest.status = 'failed'
      clientTest.error = error.message
    }
    tests.push(clientTest)
    
    // Test 3: Auth Service Connectivity
    const connectivityTest = {
      name: 'Supabase Auth Connectivity',
      status: 'checking',
      error: null,
      details: {}
    }
    
    try {
      if (testClient) {
        // Try to get session (should return null/no error for valid connection)
        const { data, error } = await testClient.auth.getSession()
        
        if (!error) {
          connectivityTest.status = 'passed'
          connectivityTest.details = {
            message: 'Successfully connected to Supabase Auth',
            hasSession: !!data.session
          }
        } else {
          connectivityTest.status = 'failed'
          connectivityTest.error = error.message
        }
      } else {
        connectivityTest.status = 'failed'
        connectivityTest.error = 'No client available'
      }
    } catch (error: any) {
      connectivityTest.status = 'failed'
      connectivityTest.error = error.message
    }
    tests.push(connectivityTest)
    
    // Test 4: Test Signup (Mock - doesn't actually create user)
    const signupTest = {
      name: 'Signup Flow Test (Mock)',
      status: 'checking',
      error: null,
      details: {}
    }
    
    try {
      if (testClient) {
        // Test signup with invalid email to check if the API responds
        const { data, error } = await testClient.auth.signUp({
          email: 'test-invalid-email-format',
          password: 'testpassword'
        })
        
        // We expect this to fail with a validation error, which means the API is working
        if (error && error.message.includes('Invalid')) {
          signupTest.status = 'passed'
          signupTest.details.message = 'Signup API is responding correctly (validation working)'
        } else if (error) {
          signupTest.status = 'warning'
          signupTest.details.message = `Unexpected error: ${error.message}`
        } else {
          signupTest.status = 'warning'
          signupTest.details.message = 'Unexpected success with invalid email'
        }
      } else {
        signupTest.status = 'failed'
        signupTest.error = 'No client available'
      }
    } catch (error: any) {
      signupTest.status = 'failed'
      signupTest.error = error.message
    }
    tests.push(signupTest)
    
    // Test 5: Database Connection (if available)
    const dbTest = {
      name: 'Database Connection (via Supabase)',
      status: 'checking',
      error: null,
      details: {}
    }
    
    try {
      if (testClient && serviceKey) {
        const adminClient = createClient(url!, serviceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
          }
        })
        
        // Try to query a system table (should work with service key)
        const { data, error } = await adminClient
          .from('auth.users')
          .select('count(*)', { count: 'exact', head: true })
          .limit(1)
        
        if (!error) {
          dbTest.status = 'passed'
          dbTest.details.message = 'Database connection working'
        } else {
          dbTest.status = 'failed'
          dbTest.error = error.message
        }
      } else {
        dbTest.status = 'skipped'
        dbTest.details.message = 'Service key not available - skipped'
      }
    } catch (error: any) {
      dbTest.status = 'failed'
      dbTest.error = error.message
    }
    tests.push(dbTest)
    
    // Summary
    const passedTests = tests.filter(t => t.status === 'passed').length
    const failedTests = tests.filter(t => t.status === 'failed').length
    const totalTests = tests.length
    
    const summary = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      warnings: tests.filter(t => t.status === 'warning').length,
      skipped: tests.filter(t => t.status === 'skipped').length,
      overallStatus: failedTests === 0 ? 'healthy' : 'issues_detected'
    }
    
    // Recommendations
    const recommendations = []
    if (tests[0].status === 'failed') {
      recommendations.push('🔴 Set up your environment variables in .env.local')
    }
    if (tests[1].status === 'failed') {
      recommendations.push('🔴 Check your Supabase URL and anon key format')
    }
    if (tests[2].status === 'failed') {
      recommendations.push('🔴 Verify your Supabase project is active and accessible')
    }
    if (tests[3].status === 'failed') {
      recommendations.push('🔴 Check if Supabase Auth is enabled in your project')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ All tests passed! Your Supabase Auth setup looks good.')
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary,
      tests,
      recommendations,
      nextSteps: [
        '1. Fix any failed tests above',
        '2. Try the signup flow in your app',
        '3. Check the browser console for detailed errors',
        '4. Visit /api/debug/supabase for more detailed configuration info'
      ]
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Auth test endpoint failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Security: Only allow in development
  if (!isDevEnvironment()) {
    return NextResponse.json({ error: 'Debug endpoint only available in development' }, { status: 403 })
  }
  
  try {
    const { testEmail } = await request.json()
    
    if (!testEmail || !testEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid test email required' }, { status: 400 })
    }
    
    // Test actual signup flow
    const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
    
    if (!url || !anonKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 503 })
    }
    
    const testClient = createClient(url, anonKey)
    
    const { data, error } = await testClient.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    })
    
    return NextResponse.json({
      success: !error,
      error: error?.message,
      data: data ? {
        user: !!data.user,
        session: !!data.session,
        userId: data.user?.id
      } : null,
      message: error ? 
        'Signup test failed - this is expected if you haven\'t confirmed the test email' :
        'Signup test successful - check your email for confirmation'
    })
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test signup failed',
      message: error.message
    }, { status: 500 })
  }
}

