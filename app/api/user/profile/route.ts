import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { createClient } from '@/utils/supabase/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from middleware header or verify auth directly
    let userId = request.headers.get('x-user-id')
    
    // If no user ID from middleware, try to get it directly from Supabase
    if (!userId) {
      try {
        // Try Authorization header first (for API calls)
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7)
          const { data: { user }, error: tokenError } = await supabase.auth.getUser(token)
          if (user && !tokenError) {
            userId = user.id
          }
        }
        
        // If no token auth, try server client with cookies
        if (!userId) {
          const serverClient = await createClient()
          const { data: { user }, error: authError } = await serverClient.auth.getUser()
          
          if (authError || !user) {
            return NextResponse.json(
              { error: 'Authentication required' },
              { status: 401 }
            )
          }
          
          userId = user.id
        }
      } catch (error) {
        console.error('API - Auth verification error:', error)
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        )
      }
    }

    // Get user profile from database
    const profile = await db.getUserById(userId)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
