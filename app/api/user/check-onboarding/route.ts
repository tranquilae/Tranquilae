import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getNeonClient } from '@/lib/neonClient';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user session
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user exists in Neon DB and has completed onboarding
    const sql = getNeonClient();
    const userResult = await sql`
      SELECT 
        id,
        email,
        full_name,
        onboarding_completed,
        plan,
        created_at
      FROM users 
      WHERE supabase_user_id = ${user.id}
    `;

    if (userResult.length === 0) {
      // User doesn't exist in Neon DB, needs onboarding
      return NextResponse.json({
        success: true,
        needsOnboarding: true,
        userExists: false
      });
    }

    const neonUser = userResult[0];
    if (!neonUser) {
      return NextResponse.json({
        success: true,
        needsOnboarding: true,
        userExists: false
      });
    }
    
    const needsOnboarding = !neonUser['onboarding_completed'];

    return NextResponse.json({
      success: true,
      needsOnboarding,
      userExists: true,
      user: {
        id: neonUser['id'],
        email: neonUser['email'],
        fullName: neonUser['full_name'],
        plan: neonUser['plan'],
        createdAt: neonUser['created_at']
      }
    });

  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'server_error', 
          message: process.env['NODE_ENV'] === 'production' 
            ? 'Internal server error' 
            : error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

