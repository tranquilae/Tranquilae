// API endpoint for scheduling push notifications
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
);

interface ScheduleNotificationRequest {
  userId: string;
  scheduledTime: string; // ISO string
  template: string;
  customData?: {
    title?: string;
    body?: string;
    icon?: string;
    url?: string;
    workoutId?: string;
    requireInteraction?: boolean;
    vibrate?: number[];
    customData?: Record<string, any>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleNotificationRequest = await request.json();
    const { userId, scheduledTime, template, customData = {} } = body;

    if (!userId || !scheduledTime || !template) {
      return NextResponse.json(
        { success: false, error: 'User ID, scheduled time, and template are required' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledTime);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Store scheduled notification in database
    const { data: scheduledNotification, error } = await supabase
      .from('scheduled_notifications')
      .insert({
        user_id: userId,
        scheduled_time: scheduledDate.toISOString(),
        template_type: template,
        title: customData.title,
        body: customData.body,
        icon: customData.icon,
        url: customData.url,
        workout_id: customData.workoutId,
        require_interaction: customData.requireInteraction || false,
        vibrate: customData.vibrate,
        custom_data: customData.customData || {},
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to schedule notification:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to schedule notification' },
        { status: 500 }
      );
    }

    console.log(`✅ Notification scheduled for user ${userId} at ${scheduledTime}`);

    return NextResponse.json({
      success: true,
      scheduledNotification,
      message: 'Notification scheduled successfully'
    });

  } catch (error) {
    console.error('❌ Schedule notification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve scheduled notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'pending';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: notifications, error } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('❌ Failed to fetch scheduled notifications:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || []
    });

  } catch (error) {
    console.error('❌ Get scheduled notifications API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to cancel a scheduled notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!notificationId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID and User ID are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('scheduled_notifications')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Failed to cancel notification:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to cancel notification' },
        { status: 500 }
      );
    }

    console.log(`✅ Notification ${notificationId} cancelled for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Notification cancelled successfully'
    });

  } catch (error) {
    console.error('❌ Cancel notification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
