// API endpoint for tracking notification events
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TrackNotificationRequest {
  notificationId: string;
  action: 'displayed' | 'clicked' | 'closed' | 'dismissed';
  timestamp?: string;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackNotificationRequest = await request.json();
    const { notificationId, action, timestamp, metadata = {} } = body;

    if (!notificationId || !action) {
      return NextResponse.json(
        { success: false, error: 'Notification ID and action are required' },
        { status: 400 }
      );
    }

    // Validate action type
    const validActions = ['displayed', 'clicked', 'closed', 'dismissed'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action type' },
        { status: 400 }
      );
    }

    // Record the tracking event
    const { data, error } = await supabase
      .from('notification_tracking')
      .insert({
        notification_id: notificationId,
        action,
        timestamp: timestamp || new Date().toISOString(),
        metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to track notification event:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to track event' },
        { status: 500 }
      );
    }

    // Update notification analytics based on action
    await updateNotificationAnalytics(notificationId, action);

    console.log(`📊 Tracked notification event: ${notificationId} - ${action}`);

    return NextResponse.json({
      success: true,
      trackingEvent: data,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    console.error('❌ Track notification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve tracking data for a notification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!notificationId && !userId) {
      return NextResponse.json(
        { success: false, error: 'Either notification ID or user ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('notification_tracking')
      .select('*');

    // Filter by notification ID if provided
    if (notificationId) {
      query = query.eq('notification_id', notificationId);
    }

    // Filter by user ID if provided (requires joining with notification_logs)
    if (userId && !notificationId) {
      const { data: userNotifications } = await supabase
        .from('notification_logs')
        .select('tracking_id')
        .eq('user_id', userId);

      if (userNotifications && userNotifications.length > 0) {
        const trackingIds = userNotifications
          .map(n => n.tracking_id)
          .filter(id => id);

        if (trackingIds.length > 0) {
          query = query.in('notification_id', trackingIds);
        } else {
          // No tracking IDs found
          return NextResponse.json({
            success: true,
            trackingData: []
          });
        }
      }
    }

    // Filter by date range if provided
    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    // Order by timestamp
    query = query.order('timestamp', { ascending: false });

    const { data: trackingData, error } = await query;

    if (error) {
      console.error('❌ Failed to fetch tracking data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tracking data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trackingData: trackingData || []
    });

  } catch (error) {
    console.error('❌ Get tracking data API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update notification analytics
async function updateNotificationAnalytics(notificationId: string, action: string) {
  try {
    // Get existing analytics record
    const { data: existingAnalytics } = await supabase
      .from('notification_analytics')
      .select('*')
      .eq('notification_id', notificationId)
      .single();

    const updateData: any = {
      notification_id: notificationId,
      updated_at: new Date().toISOString()
    };

    if (existingAnalytics) {
      // Update existing record
      switch (action) {
        case 'displayed':
          updateData.display_count = (existingAnalytics.display_count || 0) + 1;
          break;
        case 'clicked':
          updateData.click_count = (existingAnalytics.click_count || 0) + 1;
          break;
        case 'closed':
          updateData.close_count = (existingAnalytics.close_count || 0) + 1;
          break;
        case 'dismissed':
          updateData.dismiss_count = (existingAnalytics.dismiss_count || 0) + 1;
          break;
      }

      // Calculate engagement rate
      const totalInteractions = (updateData.click_count || existingAnalytics.click_count || 0) +
                               (updateData.close_count || existingAnalytics.close_count || 0) +
                               (updateData.dismiss_count || existingAnalytics.dismiss_count || 0);
      const displays = updateData.display_count || existingAnalytics.display_count || 1;
      updateData.engagement_rate = totalInteractions / displays;

      await supabase
        .from('notification_analytics')
        .update(updateData)
        .eq('notification_id', notificationId);
    } else {
      // Create new record
      const newAnalytics = {
        notification_id: notificationId,
        display_count: action === 'displayed' ? 1 : 0,
        click_count: action === 'clicked' ? 1 : 0,
        close_count: action === 'closed' ? 1 : 0,
        dismiss_count: action === 'dismissed' ? 1 : 0,
        engagement_rate: action !== 'displayed' ? 1 : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('notification_analytics')
        .insert(newAnalytics);
    }

  } catch (error) {
    console.error('❌ Failed to update notification analytics:', error);
  }
}
