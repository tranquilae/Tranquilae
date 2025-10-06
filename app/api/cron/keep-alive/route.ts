import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This API route will be called by Vercel Cron to keep Supabase active
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env['CRON_SECRET']
    
    // In production, verify the cron secret
    if (process.env['NODE_ENV'] === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Get Supabase credentials
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'] || 
                        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      )
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Perform a simple query to keep the connection alive
    // This queries the auth users table which is always available
    const { data: healthCheck, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine for our ping
      console.error('Supabase ping error:', error)
    }

    // Also ping the auth service
    const { error: authError } = await supabase.auth.getSession()
    
    const timestamp = new Date().toISOString()
    
    return NextResponse.json({
      success: true,
      message: 'Supabase project pinged successfully',
      timestamp,
      supabaseUrl: supabaseUrl.substring(0, 30) + '...',
      healthCheck: error ? 'query_error' : 'ok',
      authCheck: authError ? 'session_error' : 'ok'
    })

  } catch (error: any) {
    console.error('Keep-alive cron error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Allow GET requests without authentication for manual testing
export const dynamic = 'force-dynamic'
export const runtime = 'edge'
