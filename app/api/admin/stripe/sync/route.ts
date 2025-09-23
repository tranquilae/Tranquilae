import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin, checkAdminAccess } from '@/lib/supabase'
import { logPaymentEvent } from '@/lib/supabase-logger'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await checkAdminAccess(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    let syncedCount = 0
    let errorCount = 0
    const errors: string[] = []

    try {
      // Get all subscriptions with Stripe IDs
      const { data: subscriptions } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .not('stripe_subscription_id', 'is', null)

      if (!subscriptions) {
        return NextResponse.json({ 
          success: true, 
          message: 'No subscriptions with Stripe IDs found',
          synced: 0,
          errors: 0
        })
      }

      // Sync each subscription
      for (const subscription of subscriptions) {
        try {
          // Get latest data from Stripe
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripe_subscription_id!
          )

          // Determine status mapping
          let dbStatus = subscription.status
          switch (stripeSubscription.status) {
            case 'active':
              dbStatus = 'active'
              break
            case 'trialing':
              dbStatus = 'trialing'
              break
            case 'past_due':
              dbStatus = 'past_due'
              break
            case 'canceled':
            case 'unpaid':
              dbStatus = 'canceled'
              break
            case 'incomplete':
            case 'incomplete_expired':
              dbStatus = 'incomplete'
              break
          }

          // Update subscription in database
          const updateData = {
            status: dbStatus,
            current_period_start: new Date((stripeSubscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((stripeSubscription as any).current_period_end * 1000).toISOString(),
            cancel_at_period_end: (stripeSubscription as any).cancel_at_period_end,
            trial_end: (stripeSubscription as any).trial_end 
              ? new Date((stripeSubscription as any).trial_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString()
          }

          const { error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update(updateData)
            .eq('id', subscription.id)

          if (updateError) {
            console.error(`Error updating subscription ${subscription.id}:`, updateError)
            errors.push(`Subscription ${subscription.id}: ${updateError.message}`)
            errorCount++
          } else {
            syncedCount++
          }

          // Also update user plan if necessary
          const planFromPrice = stripeSubscription.items.data[0]?.price?.id
          let userPlan = subscription.plan

          if (planFromPrice === process.env.STRIPE_PRICE_ID_PATHFINDER_MONTHLY ||
              planFromPrice === process.env.STRIPE_PRICE_ID_PATHFINDER_YEARLY) {
            userPlan = 'pathfinder'
          } else {
            userPlan = 'explorer'
          }

          // Update user plan if it changed
          if (userPlan !== subscription.plan) {
            await supabaseAdmin
              .from('users')
              .update({ 
                plan: userPlan,
                updated_at: new Date().toISOString()
              })
              .eq('id', subscription.user_id)
          }

        } catch (stripeError: any) {
          console.error(`Stripe error for subscription ${subscription.id}:`, stripeError)
          errors.push(`Subscription ${subscription.id}: ${stripeError.message}`)
          errorCount++
        }
      }

      // Log the sync action
      await logPaymentEvent({
        event_type: 'WEBHOOK_RECEIVED', // Using closest available type
        user_id: user.id,
        success: errorCount === 0,
        error: errorCount > 0 ? `${errorCount} sync errors` : undefined,
        metadata: {
          admin_action: 'stripe_sync',
          synced_count: syncedCount,
          error_count: errorCount,
          total_processed: subscriptions.length
        }
      })

      return NextResponse.json({
        success: true,
        message: `Sync completed. ${syncedCount} subscriptions synced successfully.`,
        synced: syncedCount,
        errors: errorCount,
        errorDetails: errors.length > 0 ? errors : undefined
      })

    } catch (error: any) {
      console.error('Stripe sync error:', error)
      
      await logPaymentEvent({
        event_type: 'WEBHOOK_RECEIVED',
        user_id: user.id,
        success: false,
        error: error.message,
        metadata: { admin_action: 'stripe_sync_failed' }
      })

      return NextResponse.json({ 
        error: 'Stripe sync failed', 
        details: error.message 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Stripe sync API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

