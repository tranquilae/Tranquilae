// Tranquilae Notification Service - Push Notifications & In-App Notifications
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

// Types for notifications
export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  url?: string;
  action?: string;
  workoutId?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
  customData?: Record<string, any>;
  trackingId?: string;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationTemplate {
  type: 'workout_reminder' | 'achievement' | 'social_update' | 'system' | 'custom';
  title: string;
  body: string;
  defaultActions?: NotificationAction[];
  requireInteraction?: boolean;
  vibrate?: number[];
}

// Notification templates
export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  workout_reminder: {
    type: 'workout_reminder',
    title: '💪 Time for Your Workout!',
    body: 'Your scheduled workout is ready. Let\'s get moving!',
    defaultActions: [
      { action: 'start_workout', title: '▶️ Start Now', icon: '/icons/play.png' },
      { action: 'reschedule', title: '⏰ Reschedule', icon: '/icons/clock.png' },
      { action: 'dismiss', title: '❌ Dismiss' }
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200]
  },
  
  achievement_unlocked: {
    type: 'achievement',
    title: '🏆 Achievement Unlocked!',
    body: 'Congratulations! You\'ve reached a new milestone.',
    defaultActions: [
      { action: 'view_achievement', title: '👁️ View', icon: '/icons/eye.png' },
      { action: 'share', title: '📤 Share', icon: '/icons/share.png' }
    ],
    requireInteraction: false,
    vibrate: [100, 50, 100, 50, 300]
  },
  
  streak_milestone: {
    type: 'achievement',
    title: '🔥 Streak Milestone!',
    body: 'Amazing! You\'ve maintained your workout streak.',
    defaultActions: [
      { action: 'view_stats', title: '📊 View Stats' },
      { action: 'share_streak', title: '📤 Share Achievement' }
    ],
    requireInteraction: false,
    vibrate: [200, 100, 200]
  },
  
  friend_challenge: {
    type: 'social_update',
    title: '👫 Friend Challenge',
    body: 'A friend has challenged you to a workout!',
    defaultActions: [
      { action: 'view_challenge', title: '👁️ View Challenge' },
      { action: 'accept_challenge', title: '✅ Accept' },
      { action: 'decline_challenge', title: '❌ Decline' }
    ],
    requireInteraction: true,
    vibrate: [100, 100, 100]
  },
  
  workout_completed: {
    type: 'achievement',
    title: '✅ Workout Complete!',
    body: 'Great job! Your workout has been logged successfully.',
    defaultActions: [
      { action: 'view_summary', title: '📊 View Summary' },
      { action: 'share_workout', title: '📤 Share' }
    ],
    requireInteraction: false,
    vibrate: [200, 200]
  },
  
  system_update: {
    type: 'system',
    title: '🔄 System Update',
    body: 'New features and improvements are available!',
    defaultActions: [
      { action: 'view_updates', title: '👁️ What\'s New' },
      { action: 'dismiss', title: '❌ Dismiss' }
    ],
    requireInteraction: false,
    vibrate: [100, 100]
  }
};

// Notification service class
export class NotificationService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  private vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;

  // Check if notifications are supported and get permission status
  async getPermissionStatus(): Promise<NotificationPermission> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return 'denied';
    }
    
    return Notification.permission;
  }

  // Request notification permission from user
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('🚫 Notifications not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('🚫 Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      if (granted) {
        console.log('✅ Notification permission granted');
        await this.subscribeToNotifications();
      } else {
        console.warn('🚫 Notification permission denied by user');
      }
      
      return granted;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribeToNotifications(userId?: string): Promise<PushSubscription | null> {
    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.error('❌ Service worker not registered');
        return null;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      const pushSubscription: PushSubscription = {
        userId: userId || 'anonymous',
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
        }
      };

      // Save subscription to database
      await this.savePushSubscription(pushSubscription);
      
      console.log('✅ Push notification subscription successful');
      return pushSubscription;
    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromNotifications(userId?: string): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return true;

      const unsubscribed = await subscription.unsubscribe();
      
      if (unsubscribed && userId) {
        await this.removePushSubscription(userId);
        console.log('✅ Unsubscribed from push notifications');
      }

      return unsubscribed;
    } catch (error) {
      console.error('❌ Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Show local notification (immediate)
  async showLocalNotification(config: NotificationConfig): Promise<boolean> {
    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') {
      console.warn('🚫 Cannot show notification - permission not granted');
      return false;
    }

    try {
      const notification = new Notification(config.title, {
        body: config.body,
        icon: config.icon || '/icons/icon-192x192.png',
        badge: config.badge || '/icons/badge-72x72.png',
        image: config.image,
        tag: config.tag,
        requireInteraction: config.requireInteraction,
        silent: config.silent,
        vibrate: config.vibrate,
        data: {
          url: config.url,
          action: config.action,
          workoutId: config.workoutId,
          ...config.customData
        }
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        notification.close();
        
        if (config.url) {
          window.open(config.url, '_blank');
        }
        
        // Track click
        this.trackNotificationEvent(config.trackingId, 'clicked');
      };

      // Handle notification close
      notification.onclose = () => {
        this.trackNotificationEvent(config.trackingId, 'closed');
      };

      // Auto-close after delay (unless requireInteraction is true)
      if (!config.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Track display
      this.trackNotificationEvent(config.trackingId, 'displayed');
      
      console.log('✅ Local notification displayed');
      return true;
    } catch (error) {
      console.error('❌ Failed to show local notification:', error);
      return false;
    }
  }

  // Send push notification (via server)
  async sendPushNotification(
    userId: string | string[],
    templateType: keyof typeof NOTIFICATION_TEMPLATES,
    customData: Partial<NotificationConfig> = {}
  ): Promise<boolean> {
    try {
      const template = NOTIFICATION_TEMPLATES[templateType];
      if (!template) {
        console.error('❌ Invalid notification template:', templateType);
        return false;
      }

      const notificationData = {
        template: templateType,
        title: customData.title || template.title,
        body: customData.body || template.body,
        icon: customData.icon || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        actions: customData.actions || template.defaultActions,
        requireInteraction: customData.requireInteraction ?? template.requireInteraction,
        vibrate: customData.vibrate || template.vibrate,
        url: customData.url,
        workoutId: customData.workoutId,
        trackingId: this.generateTrackingId(),
        ...customData.customData
      };

      const response = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: Array.isArray(userId) ? userId : [userId],
          notification: notificationData
        })
      });

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.statusText}`);
      }

      console.log('✅ Push notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      return false;
    }
  }

  // Schedule notification for later
  async scheduleNotification(
    userId: string,
    scheduledTime: Date,
    templateType: keyof typeof NOTIFICATION_TEMPLATES,
    customData: Partial<NotificationConfig> = {}
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          scheduledTime: scheduledTime.toISOString(),
          template: templateType,
          customData
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to schedule notification: ${response.statusText}`);
      }

      console.log('✅ Notification scheduled successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      return false;
    }
  }

  // Get user notification preferences
  async getNotificationPreferences(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data || this.getDefaultNotificationPreferences();
    } catch (error) {
      console.error('❌ Failed to get notification preferences:', error);
      return this.getDefaultNotificationPreferences();
    }
  }

  // Update user notification preferences
  async updateNotificationPreferences(userId: string, preferences: any): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log('✅ Notification preferences updated');
      return true;
    } catch (error) {
      console.error('❌ Failed to update notification preferences:', error);
      return false;
    }
  }

  // Create workout reminder notifications
  async scheduleWorkoutReminder(
    userId: string,
    workoutId: string,
    workoutName: string,
    scheduledTime: Date,
    reminderMinutes: number = 15
  ): Promise<boolean> {
    const reminderTime = new Date(scheduledTime.getTime() - (reminderMinutes * 60 * 1000));
    
    if (reminderTime <= new Date()) {
      console.warn('⚠️ Reminder time is in the past, skipping');
      return false;
    }

    return this.scheduleNotification(
      userId,
      reminderTime,
      'workout_reminder',
      {
        body: `Time for "${workoutName}" in ${reminderMinutes} minutes!`,
        workoutId,
        url: `/workouts/${workoutId}`,
        customData: {
          workoutName,
          originalTime: scheduledTime.toISOString(),
          reminderMinutes
        }
      }
    );
  }

  // Send achievement notification
  async sendAchievementNotification(
    userId: string,
    achievementTitle: string,
    achievementDescription: string,
    achievementIcon?: string
  ): Promise<boolean> {
    return this.sendPushNotification(
      userId,
      'achievement_unlocked',
      {
        body: `🏆 ${achievementTitle}: ${achievementDescription}`,
        icon: achievementIcon,
        url: '/achievements',
        customData: {
          achievementTitle,
          achievementDescription
        }
      }
    );
  }

  // Send streak milestone notification
  async sendStreakMilestoneNotification(
    userId: string,
    streakDays: number,
    streakType: string = 'workout'
  ): Promise<boolean> {
    return this.sendPushNotification(
      userId,
      'streak_milestone',
      {
        body: `🔥 Amazing! You've maintained your ${streakType} streak for ${streakDays} days!`,
        url: '/dashboard',
        customData: {
          streakDays,
          streakType
        }
      }
    );
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  private generateTrackingId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultNotificationPreferences() {
    return {
      workout_reminders: true,
      achievements: true,
      social_updates: true,
      system_updates: false,
      email_notifications: true,
      push_notifications: true,
      reminder_minutes: 15,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00'
    };
  }

  private async savePushSubscription(subscription: PushSubscription): Promise<void> {
    const { error } = await this.supabase
      .from('push_subscriptions')
      .upsert({
        user_id: subscription.userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Failed to save push subscription:', error);
      throw error;
    }
  }

  private async removePushSubscription(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Failed to remove push subscription:', error);
      throw error;
    }
  }

  private trackNotificationEvent(trackingId?: string, action: string = 'unknown'): void {
    if (!trackingId) return;

    fetch('/api/notifications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: trackingId,
        action,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.log('📊 Failed to track notification event:', error);
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// React hook for notifications
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Check initial permission status
    notificationService.getPermissionStatus().then(setPermission);
    
    // Check if already subscribed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.pushManager.getSubscription().then(subscription => {
            setIsSubscribed(!!subscription);
          });
        }
      });
    }
  }, []);

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermission(granted ? 'granted' : 'denied');
    if (granted) {
      setIsSubscribed(true);
    }
    return granted;
  };

  const subscribe = async (userId: string) => {
    const subscription = await notificationService.subscribeToNotifications(userId);
    setIsSubscribed(!!subscription);
    return subscription;
  };

  const unsubscribe = async (userId: string) => {
    const success = await notificationService.unsubscribeFromNotifications(userId);
    if (success) {
      setIsSubscribed(false);
    }
    return success;
  };

  return {
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification: notificationService.showLocalNotification.bind(notificationService),
    sendPushNotification: notificationService.sendPushNotification.bind(notificationService),
    scheduleNotification: notificationService.scheduleNotification.bind(notificationService)
  };
}

// Hook for managing service worker
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      setIsRegistered(true);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          setIsUpdating(true);
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setNeedsUpdate(true);
              setIsUpdating(false);
            }
          });
        }
      });

      console.log('✅ Service worker registered successfully');
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
    }
  };

  const updateServiceWorker = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    isRegistered,
    isUpdating,
    needsUpdate,
    updateServiceWorker
  };
}
