import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/lib/database';
import { sendEmail } from '@/lib/email';
import { assessPaymentRisk, analyzeSubscriptionPatterns } from '@/lib/stripe-radar';
import { logPaymentEvent, logSecurityEvent } from '@/lib/supabase-logger';
import * as Sentry from '@sentry/nextjs';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!);

const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']!;

/**
 * Handle Stripe webhooks with comprehensive event processing
 * POST /api/webhooks/stripe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Log webhook event for security monitoring
    await logPaymentEvent({
      event_type: 'WEBHOOK_RECEIVED',
      success: true,
      metadata: {
        stripe_event_id: event.id,
        stripe_event_type: event.type,
        created: event.created,
        livemode: event.livemode,
      }
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
        break;

      // Stripe Radar events
      case 'radar.early_fraud_warning.created':
        await handleRadarFraudWarning(event.data.object as Stripe.Radar.EarlyFraudWarning);
        break;

      case 'review.opened':
        await handleReviewOpened(event.data.object as Stripe.Review);
        break;

      case 'review.closed':
        await handleReviewClosed(event.data.object as Stripe.Review);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id);

  const userId = session.metadata?.['user_id'];
  if (!userId) {
    console.error('No user_id in session metadata');
    return;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    // Analyze subscription patterns for potential fraud
    const subscriptionAnalysis = await analyzeSubscriptionPatterns(userId);
    if (subscriptionAnalysis.suspicious) {
      console.warn(`Suspicious subscription patterns detected for user ${userId}:`, subscriptionAnalysis.patterns);
      
      await logSecurityEvent({
        event_type: 'SUSPICIOUS_ACTIVITY',
        user_id: userId,
        success: false,
        metadata: {
          patterns: subscriptionAnalysis.patterns,
          risk_factors: subscriptionAnalysis.risk_factors,
          stripe_session_id: session.id,
          context: 'checkout_completion'
        }
      });

      // Alert team about suspicious activity
      Sentry.captureMessage('Suspicious subscription patterns detected', {
        level: 'warning',
        tags: {
          component: 'fraud-detection',
          event: 'checkout_completed'
        },
        user: { id: userId },
        extra: {
          session_id: session.id,
          patterns: subscriptionAnalysis.patterns,
          risk_factors: subscriptionAnalysis.risk_factors
        }
      });
    }

    // Update subscription in database
    const updateData: any = {
      plan: 'pathfinder',
      status: subscription.status === 'trialing' ? 'trialing' : 'active',
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      current_period_start: new Date((subscription as any).current_period_start * 1000),
      current_period_end: new Date((subscription as any).current_period_end * 1000),
    };
    
    if ((subscription as any).trial_end) {
      updateData.trial_end = new Date((subscription as any).trial_end * 1000);
    }
    
    await db.updateSubscription(userId, updateData);

    // Update user
    await db.updateUser(userId, {
      plan: 'pathfinder',
      onboarding_complete: true,
    });

    // Log successful checkout
    await logPaymentEvent({
      event_type: 'SUBSCRIPTION_CREATED',
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      success: true,
      metadata: {
        session_id: session.id,
        plan: 'pathfinder',
        trial_end: (subscription as any).trial_end
      }
    });

    console.log(`Checkout completed for user ${userId}, subscription ${subscription.id}`);
  } catch (error) {
    console.error('Error processing checkout completion:', error);
    
    await logPaymentEvent({
      event_type: 'SUBSCRIPTION_CREATED',
      user_id: userId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        session_id: session.id
      }
    });

    Sentry.captureException(error, {
      tags: { component: 'webhooks', operation: 'checkout-completion' },
      user: { id: userId },
      extra: { session_id: session.id }
    });
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_succeeded:', invoice.id);

  const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
  const userId = (subscription as any).metadata?.['user_id'];

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  try {
    // Perform fraud risk assessment on payment
    if ((invoice as any).payment_intent) {
      const riskAssessment = await assessPaymentRisk((invoice as any).payment_intent as string, userId, {
        invoice_id: invoice.id,
        billing_reason: (invoice as any).billing_reason,
        amount: invoice.amount_paid,
        context: 'recurring_payment'
      });

      if (!riskAssessment.passed) {
        console.warn(`High-risk payment detected for user ${userId}:`, riskAssessment.risk_assessment);
        
        await logSecurityEvent({
          event_type: 'SUSPICIOUS_ACTIVITY',
          user_id: userId,
          success: false,
          error: 'High-risk payment detected',
          metadata: {
            payment_intent_id: (invoice as any).payment_intent,
            risk_level: riskAssessment.risk_assessment.risk_level,
            risk_score: riskAssessment.risk_assessment.risk_score,
            reasons: riskAssessment.risk_assessment.reasons,
            context: 'recurring_payment_success'
          }
        });

        // Consider additional actions for high-risk payments
        if (riskAssessment.risk_assessment.risk_level === 'very_high') {
          Sentry.captureMessage('Very high-risk payment succeeded - manual review required', {
            level: 'error',
            tags: {
              component: 'fraud-detection',
              event: 'payment_succeeded'
            },
            user: { id: userId },
            extra: {
              invoice_id: invoice.id,
              payment_intent_id: (invoice as any).payment_intent,
              risk_assessment: riskAssessment.risk_assessment
            }
          });
        }
      }
    }

    // Update subscription status to active
    await db.updateSubscription(userId, {
      status: 'active',
      current_period_start: new Date((subscription as any).current_period_start * 1000),
      current_period_end: new Date((subscription as any).current_period_end * 1000),
    });

    // Log successful payment
    await logPaymentEvent({
      event_type: 'PAYMENT_SUCCESS',
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      success: true,
      metadata: {
        invoice_id: invoice.id,
        billing_reason: (invoice as any).billing_reason,
        payment_intent_id: (invoice as any).payment_intent
      }
    });

    // If this was the first payment after trial, send confirmation
    if ((invoice as any).billing_reason === 'subscription_cycle') {
      const user = await db.getUserById(userId);
      if (user?.email) {
        try {
          await sendEmail({
            to: user.email,
            subject: 'Payment successful - Welcome to Pathfinder! 💳',
            template: 'payment-success',
            data: {
              name: user.name || 'there',
              amount: (invoice.amount_paid / 100).toFixed(2),
              currency: invoice.currency.toUpperCase(),
              nextBillingDate: new Date((subscription as any).current_period_end * 1000).toLocaleDateString(),
              dashboardUrl: `${process.env['NEXT_PUBLIC_APP_URL']}/dashboard`,
            }
          });
        } catch (error) {
          console.error('Failed to send payment success email:', error);
        }
      }
    }

    console.log(`Payment succeeded for user ${userId}, subscription ${subscription.id}`);
  } catch (error) {
    console.error('Error processing payment success:', error);
    
    await logPaymentEvent({
      event_type: 'PAYMENT_SUCCESS',
      user_id: userId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        invoice_id: invoice.id
      }
    });

    Sentry.captureException(error, {
      tags: { component: 'webhooks', operation: 'payment-success' },
      user: { id: userId },
      extra: { invoice_id: invoice.id }
    });
  }
}

/**
 * Handle failed invoice payment - implement automatic downgrade
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id);

  const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
  const userId = subscription.metadata?.['user_id'];

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  const user = await db.getUserById(userId);
  if (!user) {
    console.error(`User not found: ${userId}`);
    return;
  }

  // Check if this is the first payment failure or recurring
  const attemptCount = invoice.attempt_count || 1;
  const isFirstFailure = attemptCount === 1;
  const isTrialSubscription = subscription.status === 'trialing';

  // For trial subscriptions or first payment failures, downgrade immediately
  if (isTrialSubscription || isFirstFailure) {
    console.log(`Downgrading user ${userId} from Pathfinder to Explorer due to payment failure`);

    // Update subscription to Explorer - omit fields to clear them
    const updateData: any = {
      plan: 'explorer',
      status: 'active',
      stripe_customer_id: subscription.customer as string, // Keep customer ID
      cancel_at_period_end: false,
    };
    
    // Explicitly set fields to clear them if the database method supports it
    if ('stripe_subscription_id' in updateData) {
      updateData.stripe_subscription_id = null;
    }
    if ('trial_end' in updateData) {
      updateData.trial_end = null;
    }
    if ('current_period_start' in updateData) {
      updateData.current_period_start = null;
    }
    if ('current_period_end' in updateData) {
      updateData.current_period_end = null;
    }
    
    await db.updateSubscription(userId, updateData);

    // Update user plan
    await db.updateUser(userId, {
      plan: 'explorer',
    });

    // Cancel Stripe subscription
    try {
      await stripe.subscriptions.cancel(subscription.id);
    } catch (error) {
      console.error('Failed to cancel Stripe subscription:', error);
    }

    // Send downgrade notification email
    if (user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Payment issue - Switched to Explorer plan 💳',
          template: 'payment-failure-downgrade',
          data: {
            name: user.name || 'there',
            reason: isTrialSubscription 
              ? 'Card verification failed during your trial period'
              : 'Payment method was declined',
            dashboardUrl: `${process.env['NEXT_PUBLIC_APP_URL']}/dashboard`,
            upgradeUrl: `${process.env['NEXT_PUBLIC_APP_URL']}/account/billing`,
            supportUrl: `${process.env['NEXT_PUBLIC_APP_URL']}/support`,
          }
        });

        // Send follow-up email after 3 days
        setTimeout(async () => {
          try {
            await sendEmail({
              to: user.email!,
              subject: 'Missing Pathfinder? Easy upgrade available 🚀',
              template: 'upgrade-reminder',
              data: {
                name: user.name || 'there',
                upgradeUrl: `${process.env['NEXT_PUBLIC_APP_URL']}/account/billing`,
                featuresUrl: `${process.env['NEXT_PUBLIC_APP_URL']}/plans`,
              }
            });
          } catch (error) {
            console.error('Failed to send upgrade reminder:', error);
          }
        }, 3 * 24 * 60 * 60 * 1000); // 3 days

      } catch (error) {
        console.error('Failed to send downgrade email:', error);
      }
    }

    console.log(`User ${userId} downgraded to Explorer due to payment failure`);
  } else {
    // For subsequent failures, just update status
    await db.updateSubscription(userId, {
      status: 'past_due',
    });

    console.log(`Subscription ${subscription.id} marked as past_due`);
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.updated:', subscription.id);

  const userId = subscription.metadata?.['user_id'];
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Update subscription details
  await db.updateSubscription(userId, {
    status: subscription.status,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000),
    cancel_at_period_end: subscription.cancel_at_period_end,
  });

  console.log(`Subscription ${subscription.id} updated for user ${userId}`);
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.deleted:', subscription.id);

  const userId = subscription.metadata?.['user_id'];
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Downgrade to Explorer
  await db.updateSubscription(userId, {
    plan: 'explorer',
    status: 'active',
    stripe_subscription_id: null,
    trial_end: null,
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
  });

  await db.updateUser(userId, {
    plan: 'explorer',
  });

  console.log(`Subscription ${subscription.id} deleted, user ${userId} downgraded to Explorer`);
}

/**
 * Handle payment method attachment
 */
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log('Processing payment_method.attached:', paymentMethod.id);
  
  // You might want to update user records or send notifications
  // This confirms the £0 verification was successful
}

/**
 * Handle setup intent success (card verification)
 */
async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  console.log('Processing setup_intent.succeeded:', setupIntent.id);
  
  // Card verification was successful
  const userId = setupIntent.metadata?.['user_id'];
  if (userId) {
  console.log(`Card verification successful for user ${userId}`);
  }
}

/**
 * Handle Stripe Radar fraud warnings
 */
async function handleRadarFraudWarning(warning: Stripe.Radar.EarlyFraudWarning) {
  console.warn('Processing radar.early_fraud_warning.created:', warning.id);
  
  const charge = warning.charge as string;
  const chargeDetails = await stripe.charges.retrieve(charge);
  const paymentIntent = chargeDetails.payment_intent as string;
  
  // Extract user info from payment metadata if available
  let userId: string | undefined;
  if (paymentIntent) {
    const pi = await stripe.paymentIntents.retrieve(paymentIntent);
    userId = pi.metadata?.['user_id'];
  }

  // Log fraud warning
  await logSecurityEvent({
    event_type: 'SUSPICIOUS_ACTIVITY',
    user_id: userId,
    success: false,
    error: 'Early fraud warning received from Stripe Radar',
    metadata: {
      charge_id: charge,
      payment_intent_id: paymentIntent,
      fraud_type: warning.fraud_type,
      actionable: warning.actionable,
      created: warning.created
    }
  });

  // Alert team immediately
  Sentry.captureMessage('Stripe Radar fraud warning received', {
    level: 'error',
    tags: {
      component: 'fraud-detection',
      event: 'radar_fraud_warning'
    },
    user: { id: userId },
    extra: {
      warning_id: warning.id,
      charge_id: charge,
      fraud_type: warning.fraud_type,
      actionable: warning.actionable
    }
  });

  // If we have user information and warning is actionable, take preventive action
  if (userId && warning.actionable) {
    try {
      // Suspend user account temporarily
      await db.updateUser(userId, {
        account_status: 'suspended',
        suspended_reason: 'fraud_warning',
        suspended_at: new Date()
      });

      // Send notification email to user
      const user = await db.getUserById(userId);
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: 'Account Security Alert - Verification Required',
          template: 'fraud-alert',
          data: {
            name: user.name || 'there',
            supportUrl: `${process.env['NEXT_PUBLIC_APP_URL']}/support`,
          }
        });
      }

      console.log(`User ${userId} account suspended due to fraud warning`);
    } catch (error) {
      console.error('Error taking action on fraud warning:', error);
      Sentry.captureException(error);
    }
  }

  console.log(`Fraud warning processed: ${warning.id}`);
}

/**
 * Handle review opened (manual review triggered by Radar)
 */
async function handleReviewOpened(review: Stripe.Review) {
  console.log('Processing review.opened:', review.id);
  
  const charge = review.charge as string;
  const chargeDetails = await stripe.charges.retrieve(charge);
  const paymentIntent = chargeDetails.payment_intent as string;
  
  let userId: string | undefined;
  if (paymentIntent) {
    const pi = await stripe.paymentIntents.retrieve(paymentIntent);
    userId = pi.metadata?.['user_id'];
  }

  // Log review opening
  await logSecurityEvent({
    event_type: 'SUSPICIOUS_ACTIVITY',
    user_id: userId,
    success: false,
    error: 'Payment under manual review',
    metadata: {
      review_id: review.id,
      charge_id: charge,
      payment_intent_id: paymentIntent,
      reason: review.reason,
      opened_reason: review.opened_reason
    }
  });

  // Alert team for manual review
  Sentry.captureMessage('Payment under manual review', {
    level: 'warning',
    tags: {
      component: 'fraud-detection',
      event: 'review_opened'
    },
    user: { id: userId },
    extra: {
      review_id: review.id,
      charge_id: charge,
      reason: review.reason,
      opened_reason: review.opened_reason
    }
  });

  console.log(`Review opened: ${review.id} for charge ${charge}`);
}

/**
 * Handle review closed
 */
async function handleReviewClosed(review: Stripe.Review) {
  console.log('Processing review.closed:', review.id);
  
  const charge = review.charge as string;
  const chargeDetails = await stripe.charges.retrieve(charge);
  const paymentIntent = chargeDetails.payment_intent as string;
  
  let userId: string | undefined;
  if (paymentIntent) {
    const pi = await stripe.paymentIntents.retrieve(paymentIntent);
    userId = pi.metadata?.['user_id'];
  }

  // Log review closure
  await logSecurityEvent({
    event_type: 'SUSPICIOUS_ACTIVITY',
    user_id: userId,
    success: review.reason === 'approved',
    error: review.reason === 'approved' ? undefined : `Review closed: ${review.reason}`,
    metadata: {
      review_id: review.id,
      charge_id: charge,
      payment_intent_id: paymentIntent,
      reason: review.reason,
      closed_reason: review.closed_reason
    }
  });

  // Handle based on review outcome
  if (review.reason === 'approved') {
    console.log(`Review approved: ${review.id}`);
    
    // If user was suspended, restore their account
    if (userId) {
      try {
        const user = await db.getUserById(userId);
        if (user?.account_status === 'suspended') {
          await db.updateUser(userId, {
            account_status: 'active',
            suspended_reason: null,
            suspended_at: null
          });
          
          // Send restoration notification
          if (user.email) {
            await sendEmail({
              to: user.email,
              subject: 'Account Restored - Welcome Back!',
              template: 'account-restored',
              data: {
                name: user.name || 'there',
                dashboardUrl: `${process.env['NEXT_PUBLIC_APP_URL']}/dashboard`,
              }
            });
          }
        }
      } catch (error) {
        console.error('Error restoring user account:', error);
      }
    }
  } else {
    // Review was declined
    Sentry.captureMessage('Payment review declined', {
      level: 'error',
      tags: {
        component: 'fraud-detection',
        event: 'review_declined'
      },
      user: { id: userId },
      extra: {
        review_id: review.id,
        charge_id: charge,
        reason: review.reason,
        closed_reason: review.closed_reason
      }
    });
  }

  console.log(`Review closed: ${review.id} with reason: ${review.reason}`);
}

