import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { rateLimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';
import { createClient } from '@/utils/supabase/server';

/**
 * Complete onboarding and activate plan
 * POST /api/onboarding/complete
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'onboarding-complete', 3, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get user ID from middleware header or verify auth directly
    let userId = request.headers.get('x-user-id');
    
    // If no user ID from middleware, try to get it directly from Supabase
    if (!userId) {
      try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('API - Authentication failed for /complete:', authError?.message || 'No user found');
          return NextResponse.json(
            { error: 'Authentication required', code: 'AUTH_REQUIRED' },
            { status: 401 }
          );
        }
        
        userId = user.id;
        console.log('API - Direct auth successful for /complete user:', userId);
      } catch (error) {
        console.error('API - Auth verification error for /complete:', error);
        return NextResponse.json(
          { error: 'Authentication failed', code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }
    } else {
      console.log('API - Using middleware auth for /complete user:', userId);
    }

    const body = await request.json();
    const { plan } = body;

    // Validate plan
    if (!plan || !['explorer', 'pathfinder'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be explorer or pathfinder.' },
        { status: 400 }
      );
    }

    // Get user data
    const user = await db.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    if (user.onboarding_complete) {
      return NextResponse.json(
        { error: 'Onboarding already completed' },
        { status: 400 }
      );
    }

    // Start transaction-like operations
    try {
      // Update user
      await db.updateUser(userId, {
        onboarding_complete: true,
        plan: plan as 'explorer' | 'pathfinder'
      });

      // Create subscription record
      const subscription = await db.createSubscription({
        user_id: userId,
        plan: plan as 'explorer' | 'pathfinder',
        status: 'active',
        cancel_at_period_end: false
      });

      // Clear onboarding progress
      await db.clearOnboardingProgress(userId);

      // Send welcome email
      if (user.email) {
        try {
          await sendEmail({
            to: user.email,
            subject: 'Welcome to Tranquilae! 🌿',
            template: 'welcome',
            data: {
              name: user.name || 'there',
              plan: plan,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
            }
          });
        } catch (emailError) {
          console.warn('Failed to send welcome email:', emailError);
          // Don't fail the request if email fails
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Onboarding completed successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: plan,
          onboarding_complete: true
        },
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status
        },
        redirect: '/dashboard'
      });

    } catch (error) {
      console.error('Error completing onboarding:', error);
      
      // Try to rollback if possible
      try {
        await db.updateUser(userId, { 
          onboarding_complete: false,
          plan: 'explorer' // Safe fallback
        });
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }

      return NextResponse.json(
        { error: 'Failed to complete onboarding. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in onboarding completion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get onboarding completion status
 * GET /api/onboarding/complete
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from middleware header or verify auth directly
    let userId = request.headers.get('x-user-id');
    
    // If no user ID from middleware, try to get it directly from Supabase
    if (!userId) {
      try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('API - Authentication failed for GET /complete:', authError?.message || 'No user found');
          return NextResponse.json(
            { error: 'Authentication required', code: 'AUTH_REQUIRED' },
            { status: 401 }
          );
        }
        
        userId = user.id;
        console.log('API - Direct auth successful for GET /complete user:', userId);
      } catch (error) {
        console.error('API - Auth verification error for GET /complete:', error);
        return NextResponse.json(
          { error: 'Authentication failed', code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }
    } else {
      console.log('API - Using middleware auth for GET /complete user:', userId);
    }

    const user = await db.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const subscription = await db.getSubscriptionByUserId(userId);

    return NextResponse.json({
      onboarding_complete: user.onboarding_complete,
      plan: user.plan,
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        trial_end: subscription.trial_end,
        current_period_end: subscription.current_period_end
      } : null
    });

  } catch (error) {
    console.error('Error getting onboarding status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
