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
      // Auto-create minimal profile if missing to avoid onboarding loops
      try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) throw new Error('No user in session')
        const created = await db.createUser({ id: user.id, email: user.email || '', name: user.email?.split('@')[0] || null, onboarding_complete: false })
        const res = NextResponse.json(created)
        // Ensure cookie reflects incomplete onboarding
        res.cookies.set('onb', '0', { httpOnly: true, sameSite: 'lax', path: '/' })
        return res
      } catch (createErr) {
        console.error('Failed to auto-create profile:', createErr)
        return NextResponse.json(
          { error: 'Profile not found and could not be created' },
          { status: 404 }
        )
      }
    }

    const res = NextResponse.json(profile)
    res.cookies.set('onb', profile.onboarding_complete ? '1' : '0', { httpOnly: true, sameSite: 'lax', path: '/' })
    return res

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update profile settings (dashboard settings persistence)
export async function PATCH(request: NextRequest) {
  try {
    const serverClient = await createClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const allowed: any = {}
    if ('name' in body) allowed.name = body.name
    if ('first_name' in body) allowed.first_name = body.first_name
    if ('last_name' in body) allowed.last_name = body.last_name
    if ('plan' in body) allowed.plan = body.plan
    if ('onboarding_complete' in body) allowed.onboarding_complete = body.onboarding_complete

    const updated = await db.updateUser(user.id, allowed)
    const res = NextResponse.json(updated)
    if (typeof allowed.onboarding_complete === 'boolean') {
      res.cookies.set('onb', allowed.onboarding_complete ? '1' : '0', { httpOnly: true, sameSite: 'lax', path: '/' })
    }
    return res
  } catch (error: any) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

