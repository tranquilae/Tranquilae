// API endpoint for sending push notifications
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:' + (process.env['VAPID_EMAIL'] || 'admin@tranquilae.com'),
  process.env['NEXT_PUBLIC_VAPID_PUBLIC_KEY']!,
  process.env['VAPID_PRIVATE_KEY']!
);

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
);

interface PushNotificationRequest {
  userIds: string[];
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    actions?: Array<{
      action: string;
      title: string;
      icon?: string;
    }>;
    url?: string;
    workoutId?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    vibrate?: number[];
    tag?: string;
    trackingId?: string;
    customData?: Record<string, any>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PushNotificationRequest = await request.json();
    const { userIds, notification } = body;

    if (!userIds || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User IDs are required' },
        { status: 400 }
      );
    }

    if (!notification.title || !notification.body) {
      return NextResponse.json(
        { success: false, error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Get push subscriptions for the specified users
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subscriptionsError) {
      console.error('❌ Failed to fetch push subscriptions:', subscriptionsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No push subscriptions found for users:', userIds);
      return NextResponse.json(
        { success: true, message: 'No subscriptions found', sent: 0 },
        { status: 200 }
      );
    }

    // Check user notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('user_id, push_notifications, quiet_hours_enabled, quiet_hours_start, quiet_hours_end')
      .in('user_id', userIds);

    // Filter subscriptions based on user preferences
    const filteredSubscriptions = subscriptions.filter(sub => {
      const userPrefs = preferences?.find(p => p.user_id === sub.user_id);
      
      // Check if user has push notifications enabled
      if (userPrefs && !userPrefs.push_notifications) {
        console.log(`🔕 Push notifications disabled for user: ${sub.user_id}`);
        return false;
      }
      
      // Check quiet hours
      if (userPrefs?.quiet_hours_enabled) {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        const quietStart = userPrefs.quiet_hours_start;
        const quietEnd = userPrefs.quiet_hours_end;
        
        if (quietStart && quietEnd) {
          const isInQuietHours = (quietStart <= quietEnd) 
            ? (currentTime >= quietStart && currentTime <= quietEnd)
            : (currentTime >= quietStart || currentTime <= quietEnd);
            
          if (isInQuietHours) {
            console.log(`🔕 Quiet hours active for user: ${sub.user_id}`);
            return false;
          }
        }
      }
      
      return true;
    });

    if (filteredSubscriptions.length === 0) {
      console.log('⚠️ All subscriptions filtered out due to user preferences');
      return NextResponse.json(
        { success: true, message: 'All notifications filtered by user preferences', sent: 0 },
        { status: 200 }
      );
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/badge-72x72.png',
      image: notification.image,
      actions: notification.actions || [],
      url: notification.url || '/dashboard',
      workoutId: notification.workoutId,
      requireInteraction: notification.requireInteraction || false,
      silent: notification.silent || false,
      vibrate: notification.vibrate || [200, 100, 200],
      tag: notification.tag || 'tranquilae-notification',
      trackingId: notification.trackingId || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customData: notification.customData || {}
    });

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      filteredSubscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key
            }
          };

          await webpush.sendNotification(pushSubscription, payload);
          
          // Log successful notification
          const logData: any = {
            userId: subscription.user_id,
            type: 'push',
            title: notification.title,
            body: notification.body,
            status: 'sent'
          };
          
          if (notification.trackingId !== undefined) {
            logData.trackingId = notification.trackingId;
          }
          
          await logNotification(logData);

          return { userId: subscription.user_id, success: true };
        } catch (error: any) {
          console.error(`❌ Failed to send notification to user ${subscription.user_id}:`, error);
          
          // Handle invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 413) {
            console.log(`🗑️ Removing invalid subscription for user: ${subscription.user_id}`);
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', subscription.user_id)
              .eq('endpoint', subscription.endpoint);
          }

          // Log failed notification
          const logData: any = {
            userId: subscription.user_id,
            type: 'push',
            title: notification.title,
            body: notification.body,
            status: 'failed',
            error: error.message
          };
          
          if (notification.trackingId !== undefined) {
            logData.trackingId = notification.trackingId;
          }
          
          await logNotification(logData);

          return { userId: subscription.user_id, success: false, error: error.message };
        }
      })
    );

    // Count successful sends
    const successCount = results.filter(
      result => result.status === 'fulfilled' && result.value.success
    ).length;

    const failedCount = results.length - successCount;

    console.log(`📊 Push notifications sent: ${successCount} successful, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failedCount,
      results: results.map(result => 
        result.status === 'fulfilled' 
          ? result.value 
          : { success: false, error: 'Promise rejected' }
      )
    });

  } catch (error) {
    console.error('❌ Push notification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Log notification for analytics
async function logNotification(data: {
  userId: string;
  type: string;
  title: string;
  body: string;
  status: 'sent' | 'failed';
  error?: string;
  trackingId?: string;
}) {
  try {
    await supabase
      .from('notification_logs')
      .insert({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        status: data.status,
        error_message: data.error,
        tracking_id: data.trackingId,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('❌ Failed to log notification:', error);
  }
}
