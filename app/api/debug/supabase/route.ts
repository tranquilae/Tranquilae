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
    // Collect all environment variables related to Supabase
    const envVars = {
      // URLs
      NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'NOT_SET',
      NEXT_PUBLIC_SITE_URL: process.env['NEXT_PUBLIC_SITE_URL'] || 'NOT_SET',
      
      // Keys (showing only presence/absence and first few chars for security)
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ? 
        `SET (${process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'].substring(0, 10)}...)` : 'NOT_SET',
      
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] ? 
        `SET (${process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'].substring(0, 10)}...)` : 'NOT_SET',
      
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'] ? 
        `SET (${process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'].substring(0, 10)}...)` : 'NOT_SET',
      
      SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY'] ? 
        `SET (${process.env['SUPABASE_SERVICE_ROLE_KEY'].substring(0, 10)}...)` : 'NOT_SET',
      
      SUPABASE_SECRET_KEY: process.env['SUPABASE_SECRET_KEY'] ? 
        `SET (${process.env['SUPABASE_SECRET_KEY'].substring(0, 10)}...)` : 'NOT_SET',
      
      SUPABASE_JWT_SECRET: process.env['SUPABASE_JWT_SECRET'] ? 
        `SET (${process.env['SUPABASE_JWT_SECRET'].substring(0, 10)}...)` : 'NOT_SET',
    }

    // Test different key combinations
    const testResults = []

    // Test 1: Primary configuration
    const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
    
    if (url && anonKey) {
      try {
        const client = createClient(url, anonKey)
        const { data, error } = await client.auth.getSession()
        testResults.push({
          test: 'Primary Config (ANON_KEY)',
          success: !error,
          error: error?.message,
          clientCreated: true
        })
      } catch (error: any) {
        testResults.push({
          test: 'Primary Config (ANON_KEY)',
          success: false,
          error: error.message,
          clientCreated: false
        })
      }
    } else {
      testResults.push({
        test: 'Primary Config (ANON_KEY)',
        success: false,
        error: 'Missing URL or ANON_KEY',
        clientCreated: false
      })
    }

    // Test 2: Publishable key
    const pubKey = process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY']
    if (url && pubKey) {
      try {
        const client = createClient(url, pubKey)
        const { data, error } = await client.auth.getSession()
        testResults.push({
          test: 'Publishable Key Config',
          success: !error,
          error: error?.message,
          clientCreated: true
        })
      } catch (error: any) {
        testResults.push({
          test: 'Publishable Key Config',
          success: false,
          error: error.message,
          clientCreated: false
        })
      }
    } else {
      testResults.push({
        test: 'Publishable Key Config',
        success: false,
        error: 'Missing URL or PUBLISHABLE_KEY',
        clientCreated: false
      })
    }

    // Test 3: Service role key
    const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SECRET_KEY']
    if (url && serviceKey) {
      try {
        const adminClient = createClient(url, serviceKey)
        const { data, error } = await adminClient.auth.getSession()
        testResults.push({
          test: 'Service Role Config',
          success: !error,
          error: error?.message,
          clientCreated: true
        })
      } catch (error: any) {
        testResults.push({
          test: 'Service Role Config',
          success: false,
          error: error.message,
          clientCreated: false
        })
      }
    } else {
      testResults.push({
        test: 'Service Role Config',
        success: false,
        error: 'Missing URL or SERVICE_ROLE_KEY',
        clientCreated: false
      })
    }

    // Validate key formats
    const keyValidation = {
      anon_key_format: anonKey ? (anonKey.startsWith('eyJ') ? 'JWT format ✓' : 'Invalid JWT format ❌') : 'Not set',
      publishable_key_format: pubKey ? (pubKey.startsWith('sb_') ? 'New format ✓' : pubKey.startsWith('eyJ') ? 'Legacy JWT format' : 'Invalid format ❌') : 'Not set',
      service_key_format: serviceKey ? (serviceKey.startsWith('eyJ') ? 'JWT format ✓' : 'Invalid JWT format ❌') : 'Not set',
    }

    // Check URL format
    const urlValidation = {
      url_format: url ? (url.includes('.supabase.co') ? 'Valid Supabase URL ✓' : 'Invalid URL format ❌') : 'Not set',
      url_accessible: false
    }

    if (url) {
      try {
        const response = await fetch(`${url}/rest/v1/`, { method: 'HEAD' })
        urlValidation.url_accessible = response.status === 401 || response.status === 200 // 401 is expected without auth
      } catch (error) {
        urlValidation.url_accessible = false
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env['NODE_ENV'],
        VERCEL_ENV: process.env['VERCEL_ENV'] || 'NOT_VERCEL',
      },
      environmentVariables: envVars,
      connectionTests: testResults,
      validation: {
        ...keyValidation,
        ...urlValidation
      },
      recommendations: generateRecommendations(envVars, testResults, keyValidation)
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

function generateRecommendations(envVars: any, testResults: any[], keyValidation: any) {
  const recommendations = []

  // Check if URL is set
  if (envVars.NEXT_PUBLIC_SUPABASE_URL === 'NOT_SET') {
    recommendations.push('🔴 Set NEXT_PUBLIC_SUPABASE_URL in your .env.local file')
  }

  // Check for anon key
  if (envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'NOT_SET') {
    recommendations.push('🔴 Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
  }

  // Check key format issues
  if (keyValidation.anon_key_format === 'Invalid JWT format ❌') {
    recommendations.push('🔴 NEXT_PUBLIC_SUPABASE_ANON_KEY should be a JWT token starting with "eyJ"')
  }

  // Check for new publishable key format
  if (keyValidation.publishable_key_format === 'New format ✓') {
    recommendations.push('✅ Using new publishable key format (recommended)')
  } else if (envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== 'NOT_SET' || envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY !== 'NOT_SET') {
    recommendations.push('⚠️ Consider using the new publishable key format (starts with "sb_") instead of JWT tokens')
  }

  // Check for service role key
  if (envVars.SUPABASE_SERVICE_ROLE_KEY === 'NOT_SET' && envVars.SUPABASE_SECRET_KEY === 'NOT_SET') {
    recommendations.push('🔴 Set SUPABASE_SERVICE_ROLE_KEY for server-side operations')
  }

  // Check test results
  const failedTests = testResults.filter(test => !test.success)
  if (failedTests.length > 0) {
    recommendations.push(`🔴 ${failedTests.length} connection test(s) failed - check your Supabase configuration`)
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All checks passed! Your Supabase configuration looks good.')
  }

  return recommendations
}

