export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db, Subscription } from '@/lib/database';
import { sendEmail } from '@/lib/email';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!);

/**
 * Handle successful checkout - verify session and update subscription
 * GET /api/checkout/success?session_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.redirect(
        `${process.env['NEXT_PUBLIC_APP_URL']}/onboarding?error=missing_session`
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    if (!session.metadata?.['user_id']) {
      console.error('No user_id in session metadata');
      return NextResponse.redirect(
        `${process.env['NEXT_PUBLIC_APP_URL']}/onboarding?error=invalid_session`
      );
    }

    const userId = session.metadata['user_id'];

    // Get user and subscription data
    const user = await db.getUserById(userId);
    if (!user) {
      console.error(`User not found: ${userId}`);
      return NextResponse.redirect(
        `${process.env['NEXT_PUBLIC_APP_URL']}/onboarding?error=user_not_found`
      );
    }

    const subscription = session.subscription as Stripe.Subscription;
    if (!subscription) {
      console.error('No subscription in session');
      return NextResponse.redirect(
        `${process.env['NEXT_PUBLIC_APP_URL']}/onboarding?error=no_subscription`
      );
    }

    // Update subscription in database
    const updateData: Partial<Subscription> = {
      plan: 'pathfinder',
      status: subscription.status === 'trialing' ? 'trialing' : 'active',
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      current_period_start: new Date((subscription as any).current_period_start * 1000),
      current_period_end: new Date((subscription as any).current_period_end * 1000),
      cancel_at_period_end: (subscription as any).cancel_at_period_end,
    };

    // Only include trial_end if it exists
    if (subscription.trial_end) {
      updateData.trial_end = new Date(subscription.trial_end * 1000);
    }

    await db.updateSubscription(userId, updateData);

    // Update user plan
    await db.updateUser(userId, {
      plan: 'pathfinder',
      onboarding_complete: true,
    });

    // Clear onboarding progress
    await db.clearOnboardingProgress(userId);

    // Send welcome email for Pathfinder
    if (user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Welcome to Pathfinder! Your trial has started 🚀',
          template: 'pathfinder-welcome',
          data: {
            name: user.name || 'there',
            trialEndDate: subscription.trial_end 
              ? new Date(subscription.trial_end * 1000).toLocaleDateString()
              : 'in 7 days',
            dashboardUrl: `${process.env['NEXT_PUBLIC_APP_URL']}/dashboard`,
            billingPortalUrl: `${process.env['NEXT_PUBLIC_APP_URL']}/account/billing`
          }
        });
      } catch (emailError) {
        console.warn('Failed to send Pathfinder welcome email:', emailError);
      }
    }

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      `${process.env['NEXT_PUBLIC_APP_URL']}/dashboard?onboarding=complete&plan=pathfinder&trial=started`
    );

  } catch (error: any) {
    console.error('Error handling checkout success:', error);
    
    // Log specific Stripe errors
    if (error.type?.startsWith('Stripe')) {
      console.error('Stripe error:', error.type, error.message);
    }

const base = process.env['NEXT_PUBLIC_APP_URL'] || "";
return NextResponse.redirect(`${base}/onboarding?error=checkout_error`);
  }
}

