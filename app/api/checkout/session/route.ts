import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/database';
import { rateLimit } from '@/lib/rate-limit';
import { checkVelocityLimits, analyzeSubscriptionPatterns } from '@/lib/stripe-radar';
import { logPaymentEvent, logSecurityEvent } from '@/lib/supabase-logger';
import { createClient } from '@/utils/supabase/server';
import * as Sentry from '@sentry/nextjs';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!);

/**
 * Create Stripe Checkout Session for Pathfinder subscription with £0 verification
 * POST /api/checkout/session
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'checkout-session', 5, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get user ID from middleware header or verify auth directly
    let userId = request.headers.get('x-user-id');
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // If no user ID from middleware, try to get it directly from Supabase
    if (!userId) {
      try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('API - Authentication failed for checkout:', authError?.message || 'No user found');
          return NextResponse.json(
            { error: 'Authentication required', code: 'AUTH_REQUIRED' },
            { status: 401 }
          );
        }
        
        userId = user.id;
        console.log('API - Direct auth successful for checkout user:', userId);
      } catch (error) {
        console.error('API - Auth verification error for checkout:', error);
        return NextResponse.json(
          { error: 'Authentication failed', code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }
    } else {
      console.log('API - Using middleware auth for checkout user:', userId);
    }

    // Perform velocity and fraud checks
    try {
      const velocityCheck = await checkVelocityLimits(userId, ipAddress, 60);
      if (velocityCheck.exceeded) {
        await logSecurityEvent({
          event_type: 'RATE_LIMIT_EXCEEDED',
          user_id: userId,
          ip_address: ipAddress,
          success: false,
          error: 'Too many checkout attempts',
          metadata: {
            attempts_count: velocityCheck.count,
            recommendations: velocityCheck.recommendations
          }
        });

        return NextResponse.json(
          { error: 'Too many checkout attempts. Please wait and try again later.' },
          { status: 429 }
        );
      }

      // Analyze subscription patterns
      const subscriptionAnalysis = await analyzeSubscriptionPatterns(userId);
      if (subscriptionAnalysis.suspicious) {
        await logSecurityEvent({
          event_type: 'SUSPICIOUS_ACTIVITY',
          user_id: userId,
          ip_address: ipAddress,
          success: false,
          error: 'Suspicious subscription patterns detected',
          metadata: {
            patterns: subscriptionAnalysis.patterns,
            risk_factors: subscriptionAnalysis.risk_factors,
            context: 'checkout_attempt'
          }
        });

        // Log but don't block - let Stripe Radar handle it
        Sentry.captureMessage('Suspicious subscription patterns at checkout', {
          level: 'warning',
          tags: { component: 'fraud-prevention', event: 'checkout_attempt' },
          user: { id: userId },
          extra: {
            patterns: subscriptionAnalysis.patterns,
            risk_factors: subscriptionAnalysis.risk_factors,
            ip_address: ipAddress
          }
        });
      }
    } catch (error) {
      // Log error but don't block checkout
      console.error('Error performing fraud checks:', error);
      Sentry.captureException(error, {
        tags: { component: 'fraud-prevention', operation: 'checkout-checks' },
        user: { id: userId }
      });
    }

    const body = await request.json();
    const { plan } = body;

    // Validate plan
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be monthly or yearly.' },
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

    // Check if user already has active Pathfinder subscription
    const existingSubscription = await db.getSubscriptionByUserId(userId);
    if (existingSubscription && existingSubscription.plan === 'pathfinder' && 
        ['active', 'trialing'].includes(existingSubscription.status)) {
      return NextResponse.json(
        { error: 'User already has an active Pathfinder subscription' },
        { status: 400 }
      );
    }

    // Get price ID from environment
    const priceId = plan === 'monthly' 
      ? process.env['STRIPE_PRICE_ID_PATHFINDER_MONTHLY']
      : process.env['STRIPE_PRICE_ID_PATHFINDER_YEARLY'];

    if (!priceId) {
      console.error(`Missing price ID for plan: ${plan}`);
      return NextResponse.json(
        { error: 'Plan configuration error' },
        { status: 500 }
      );
    }

    let customerId = existingSubscription?.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || '',
        metadata: {
          user_id: userId,
        },
      });
      customerId = customer.id;
    } else {
      // Update existing customer if needed
      await stripe.customers.update(customerId, {
        email: user.email,
        name: user.name || '',
      });
    }

    // Calculate trial end (7 days from now)
    const trialEnd = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

    // Create Checkout Session with £0 verification and Radar metadata
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      
      // Require payment method for £0 verification
      payment_method_collection: 'always',
      
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      
      subscription_data: {
        trial_period_days: 7,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel'
          }
        },
        metadata: {
          user_id: userId,
          plan: 'pathfinder',
          billing_cycle: plan,
          ip_address: ipAddress,
          user_agent: userAgent,
          checkout_timestamp: new Date().toISOString(),
        },
      },

      // Setup future payments - this ensures card verification
      setup_intent_data: {
        metadata: {
          user_id: userId,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      },

      // Enhanced fraud prevention with customer details
      customer_update: {
        name: 'auto',
        address: 'auto'
      },

      // Billing and shipping address collection for Radar
      billing_address_collection: 'required',
      
      allow_promotion_codes: true,
      
      success_url: `${process.env['NEXT_PUBLIC_APP_URL']}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env['NEXT_PUBLIC_APP_URL']}/api/checkout/cancel`,
      
      metadata: {
        user_id: userId,
        plan: 'pathfinder',
        billing_cycle: plan,
        ip_address: ipAddress,
        user_agent: userAgent,
        checkout_source: 'web_onboarding',
        account_age_days: Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)).toString(),
      },
    });

    // Create pending subscription record
    await db.createSubscription({
      user_id: userId,
      plan: 'pathfinder',
      status: 'incomplete',
      stripe_customer_id: customerId,
      trial_end: new Date(trialEnd * 1000),
      cancel_at_period_end: false,
    });

    // Log checkout session creation
    await logPaymentEvent({
      event_type: 'PAYMENT_ATTEMPT',
      user_id: userId,
      stripe_customer_id: customerId,
      success: true,
      ip_address: ipAddress,
      metadata: {
        session_id: session.id,
        plan: 'pathfinder',
        billing_cycle: plan,
        trial_end: trialEnd,
        checkout_source: 'web_onboarding'
      }
    });

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    
    // Log checkout failure
    const userId = request.headers.get('x-user-id');
    if (userId) {
      await logPaymentEvent({
        event_type: 'PAYMENT_ATTEMPT',
        user_id: userId,
        success: false,
        error: error.message || 'Checkout session creation failed',
        metadata: {
          error_type: error.type || 'unknown',
          checkout_source: 'web_onboarding'
        }
      });
    }

    // Capture to Sentry with additional context
    Sentry.captureException(error, {
      tags: { 
        component: 'checkout', 
        operation: 'create-session',
        error_type: error.type || 'unknown'
      },
      user: { id: user.id || 'unknown' },
      extra: {
        stripe_error_type: error.type,
        stripe_error_code: error.code,
        request_id: error.request_id
      }
    });
    
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: 'Payment method declined. Please try a different card.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}

