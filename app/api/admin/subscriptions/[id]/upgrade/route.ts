export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin, checkAdminAccess } from '@/lib/supabase'
import { logPaymentEvent, logDatabaseEvent } from '@/lib/supabase-logger'
import Stripe from 'stripe'

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await checkAdminAccess(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { newPlan, reason } = body // newPlan: 'explorer' or 'pathfinder'

    if (!newPlan || !['explorer', 'pathfinder'].includes(newPlan)) {
      return NextResponse.json({ error: 'Invalid plan specified' }, { status: 400 })
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available')
      return NextResponse.json({ error: 'Admin operations not configured' }, { status: 503 })
    }

    // Get subscription details
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        users!inner(
          id,
          name,
          email,
          plan
        )
      `)
      .eq('id', params.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    const currentPlan = subscription.plan
    const targetUser = subscription.users

    if (currentPlan === newPlan) {
      return NextResponse.json({ 
        error: `User is already on ${newPlan} plan` 
      }, { status: 400 })
    }

    try {
      let stripeSubscription = null

      // Handle Stripe subscription changes
      if (subscription.stripe_subscription_id) {
        if (newPlan === 'pathfinder') {
          // Upgrade to Pathfinder - modify Stripe subscription
          const priceId = process.env['STRIPE_PRICE_ID_PATHFINDER_MONTHLY']

          if (!priceId) {
            return NextResponse.json({ 
              error: 'Stripe price ID not configured for Pathfinder plan' 
            }, { status: 500 })
          }

          // Get current subscription first
          const currentSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
          const currentItemId = currentSubscription.items.data[0]?.id
          
          if (!currentItemId) {
            return NextResponse.json({ 
              error: 'Unable to find current subscription item to upgrade' 
            }, { status: 500 })
          }
          
          stripeSubscription = await stripe.subscriptions.update(
            subscription.stripe_subscription_id,
            {
              items: [
                {
                  id: currentItemId,
                  price: priceId,
                }
              ],
              proration_behavior: 'create_prorations',
            }
          )
        } else {
          // Downgrade to Explorer - cancel Stripe subscription
          stripeSubscription = await stripe.subscriptions.update(
            subscription.stripe_subscription_id,
            {
              cancel_at_period_end: true
            }
          )
        }
      } else if (newPlan === 'pathfinder') {
        // Creating new Pathfinder subscription for user without existing Stripe subscription
        // This would typically require creating a customer and payment method first
        // For now, we'll just update the database and create a trial
        
        // Get or create Stripe customer
        let customerId = subscription.stripe_customer_id
        
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: targetUser.email,
            name: targetUser.name || undefined,
            metadata: {
              user_id: targetUser.id
            }
          })
          customerId = customer.id
        }

        // Update subscription with customer ID
        await supabaseAdmin
          .from('subscriptions')
          .update({ 
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id)
      }

      // Update database records
      const now = new Date().toISOString()
      
      // Update subscription
      const subscriptionUpdate: any = {
        plan: newPlan,
        updated_at: now
      }

      if (stripeSubscription) {
        const sub = stripeSubscription as any
        subscriptionUpdate.current_period_start = new Date(sub.current_period_start * 1000).toISOString()
        subscriptionUpdate.current_period_end = new Date(sub.current_period_end * 1000).toISOString()
        subscriptionUpdate.cancel_at_period_end = sub.cancel_at_period_end
      }

      const { error: updateSubError } = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionUpdate)
        .eq('id', params.id)

      if (updateSubError) {
        console.error('Error updating subscription:', updateSubError)
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
      }

      // Update user plan
      const { error: updateUserError } = await supabaseAdmin
        .from('users')
        .update({ 
          plan: newPlan,
          updated_at: now
        })
        .eq('id', subscription.user_id)

      if (updateUserError) {
        console.error('Error updating user plan:', updateUserError)
        return NextResponse.json({ error: 'Failed to update user plan' }, { status: 500 })
      }

      // Log the plan change
      await logPaymentEvent({
        event_type: 'SUBSCRIPTION_UPDATED',
        user_id: subscription.user_id,
        stripe_subscription_id: subscription.stripe_subscription_id || undefined,
        success: true,
        metadata: {
          admin_action: 'plan_change',
          admin_user_id: user.id,
          old_plan: currentPlan,
          new_plan: newPlan,
          reason: reason || 'Admin override',
          target_user_email: targetUser.email
        }
      })

      await logDatabaseEvent({
        table_name: 'subscriptions',
        operation: 'UPDATE',
        user_id: user.id,
        record_id: params.id,
        old_data: { plan: currentPlan },
        new_data: { plan: newPlan },
        metadata: {
          admin_action: 'upgrade_downgrade_plan',
          target_user_id: subscription.user_id,
          reason: reason || 'Admin override'
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

      return NextResponse.json({
        success: true,
        message: `Successfully ${newPlan === 'pathfinder' ? 'upgraded' : 'downgraded'} user to ${newPlan} plan`,
        subscription: {
          ...subscription,
          plan: newPlan,
          updated_at: now
        }
      })

    } catch (stripeError: any) {
      console.error('Stripe error during plan change:', stripeError)
      
      await logPaymentEvent({
        event_type: 'SUBSCRIPTION_UPDATED',
        user_id: subscription.user_id,
        stripe_subscription_id: subscription.stripe_subscription_id || undefined,
        success: false,
        error: stripeError.message,
        metadata: {
          admin_action: 'plan_change_failed',
          admin_user_id: user.id,
          attempted_plan: newPlan
        }
      })

      return NextResponse.json({ 
        error: 'Failed to update Stripe subscription', 
        details: stripeError.message 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Plan change API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
