/**
 * Notification Service
 * Handles sending alerts via multiple channels: Email, Webhook, SMS
 */

import { Resend } from 'resend';
import { Twilio } from 'twilio';

// Email configuration
const resend = new Resend(process.env['RESEND_API_KEY']);

// SMS configuration
const twilio = new Twilio(
  process.env['TWILIO_ACCOUNT_SID'],
  process.env['TWILIO_AUTH_TOKEN']
);

// Notification interfaces
export interface EmailConfig {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface WebhookConfig {
  url: string;
  payload: any;
  headers?: Record<string, string>;
}

export interface SMSConfig {
  to: string;
  message: string;
}

export interface NotificationDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email notification
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  html?: string
): Promise<NotificationDeliveryResult> {
  try {
    if (!process.env['RESEND_API_KEY']) {
      console.warn('RESEND_API_KEY not configured, skipping email alert');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = html || `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🚨 Security Alert</h1>
            </div>
            <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <pre style="white-space: pre-wrap; font-family: monospace; background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #d1d5db;">${body}</pre>
              <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; color: #92400e;">
                  <strong>⚠️ Important:</strong> Please review this security event immediately and take appropriate action if necessary.
                </p>
              </div>
              <div style="margin-top: 20px; text-align: center;">
                <a href="${process.env['NEXT_PUBLIC_SITE_URL']}/admin/security" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                  View Security Dashboard
                </a>
              </div>
            </div>
            <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
              <p>This is an automated security alert from ${process.env['NEXT_PUBLIC_SITE_NAME'] || 'Admin Panel'}</p>
              <p>Timestamp: ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: process.env['FROM_EMAIL'] || 'security@yourapp.com',
      to: [to],
      subject: `[SECURITY] ${subject}`,
      html: emailHtml,
      text: body
    });

    const response: NotificationDeliveryResult = {
      success: true
    };
    
    if (result.data?.id) {
      response.messageId = result.data.id;
    }
    
    return response;
  } catch (error) {
    console.error('Failed to send email alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}

/**
 * Send webhook notification
 */
export async function sendWebhookAlert(
  url: string,
  payload: any,
  headers?: Record<string, string>
): Promise<NotificationDeliveryResult> {
  try {
    if (!url) {
      return { success: false, error: 'Webhook URL not provided' };
    }

    // Add timestamp and signature for verification
    const timestamp = Date.now();
    const enhancedPayload = {
      ...payload,
      timestamp,
      source: 'admin-security-monitor',
      version: '1.0'
    };

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SecurityMonitor/1.0',
      'X-Source': 'admin-security-monitor',
      ...headers
    };

    // Create signature if webhook secret is available
    if (process.env['WEBHOOK_SECRET']) {
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', process.env['WEBHOOK_SECRET'])
        .update(JSON.stringify(enhancedPayload))
        .digest('hex');
      defaultHeaders['X-Signature'] = `sha256=${signature}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(enhancedPayload),
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`);
    }

    return {
      success: true,
      messageId: `webhook-${timestamp}`
    };
  } catch (error) {
    console.error('Failed to send webhook alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown webhook error'
    };
  }
}

/**
 * Send SMS notification
 */
export async function sendSMSAlert(
  to: string,
  message: string
): Promise<NotificationDeliveryResult> {
  try {
    if (!process.env['TWILIO_ACCOUNT_SID'] || !process.env['TWILIO_AUTH_TOKEN']) {
      console.warn('Twilio credentials not configured, skipping SMS alert');
      return { success: false, error: 'SMS service not configured' };
    }

    if (!process.env['TWILIO_PHONE_NUMBER']) {
      console.warn('TWILIO_PHONE_NUMBER not configured, skipping SMS alert');
      return { success: false, error: 'SMS phone number not configured' };
    }

    // Ensure phone number is in E.164 format
    const phoneNumber = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;

    const smsMessage = `${process.env['NEXT_PUBLIC_SITE_NAME'] || 'Admin Panel'} - ${message}`;

    const result = await twilio.messages.create({
      body: smsMessage.substring(0, 1600), // SMS length limit
      from: process.env['TWILIO_PHONE_NUMBER'],
      to: phoneNumber
    });

    return {
      success: true,
      messageId: result.sid
    };
  } catch (error) {
    console.error('Failed to send SMS alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMS error'
    };
  }
}

/**
 * Send notification to multiple channels
 */
export async function sendMultiChannelAlert(
  channels: {
    email?: { to: string; subject: string; body: string };
    webhook?: { url: string; payload: any };
    sms?: { to: string; message: string };
  }
): Promise<{
  email?: NotificationDeliveryResult;
  webhook?: NotificationDeliveryResult;
  sms?: NotificationDeliveryResult;
}> {
  const results: any = {};

  // Send email if configured
  if (channels.email) {
    results.email = await sendEmail(
      channels.email.to,
      channels.email.subject,
      channels.email.body
    );
  }

  // Send webhook if configured
  if (channels.webhook) {
    results.webhook = await sendWebhookAlert(
      channels.webhook.url,
      channels.webhook.payload
    );
  }

  // Send SMS if configured
  if (channels.sms) {
    results.sms = await sendSMSAlert(
      channels.sms.to,
      channels.sms.message
    );
  }

  return results;
}

/**
 * Test notification channels
 */
export async function testNotificationChannels(): Promise<{
  email: NotificationDeliveryResult;
  webhook: NotificationDeliveryResult;
  sms: NotificationDeliveryResult;
}> {
  const testTimestamp = new Date().toISOString();
  
  return {
    email: await sendEmail(
      process.env['TEST_EMAIL'] || 'test@example.com',
      'Test Email Alert',
      `This is a test email alert sent at ${testTimestamp}`
    ),
    webhook: await sendWebhookAlert(
      process.env['TEST_WEBHOOK_URL'] || 'https://httpbin.org/post',
      {
        test: true,
        message: 'Test webhook alert',
        timestamp: testTimestamp
      }
    ),
    sms: await sendSMSAlert(
      process.env['TEST_PHONE_NUMBER'] || '+1234567890',
      `Test SMS alert sent at ${testTimestamp}`
    )
  };
}

/**
 * Format security event for notifications
 */
export function formatSecurityEventForNotification(event: {
  eventType: string;
  severity: string;
  description: string;
  ipAddress?: string;
  userId?: string;
  eventData?: any;
}) {
  const severity = event.severity.toUpperCase();
  const timestamp = new Date().toISOString();
  
  const subject = `${severity} Security Alert: ${event.eventType.replace('_', ' ')}`;
  
  const body = `
SECURITY ALERT DETAILS
======================

Event Type: ${event.eventType.replace('_', ' ').toUpperCase()}
Severity: ${severity}
Time: ${timestamp}
Description: ${event.description}

${event.ipAddress ? `IP Address: ${event.ipAddress}` : ''}
${event.userId ? `User ID: ${event.userId}` : ''}

${event.eventData && Object.keys(event.eventData).length > 0 
  ? `Additional Data:\n${JSON.stringify(event.eventData, null, 2)}`
  : ''}

RECOMMENDED ACTIONS
==================
${getRecommendedActions(event.eventType, event.severity)}

This alert was generated automatically by the security monitoring system.
Please investigate this event promptly.
  `.trim();

  const smsMessage = `${severity} ALERT: ${event.description}`;

  const webhookPayload = {
    alert_type: 'security_event',
    event: {
      type: event.eventType,
      severity: event.severity,
      description: event.description,
      timestamp,
      ip_address: event.ipAddress,
      user_id: event.userId,
      data: event.eventData
    },
    recommended_actions: getRecommendedActions(event.eventType, event.severity)
  };

  return {
    subject,
    body,
    smsMessage,
    webhookPayload
  };
}

function getRecommendedActions(eventType: string, severity: string): string {
  const actions: Record<string, string> = {
    failed_login: 'Monitor for additional failed attempts. Consider IP blocking if pattern continues.',
    brute_force_attempt: 'IP has been automatically blocked. Review logs for additional suspicious activity.',
    privilege_escalation: 'IMMEDIATE ACTION REQUIRED: Review user permissions and disable account if necessary.',
    sql_injection_attempt: 'IP has been blocked. Review application logs and check for data integrity.',
    suspicious_activity: 'Review user behavior patterns and consider additional monitoring.',
    session_hijack_attempt: 'Force user logout and require re-authentication with MFA.',
    api_abuse: 'Review API usage patterns and consider rate limiting adjustments.',
    ip_blocked: 'IP address has been blocked. Monitor for attempts from related IPs.',
    unusual_location: 'Verify login authenticity with user. Consider requiring MFA for location changes.'
  };

  const defaultAction = severity === 'critical' 
    ? 'IMMEDIATE ACTION REQUIRED: Review this event and take appropriate security measures.'
    : 'Review this security event and monitor for related activity.';

  return actions[eventType] || defaultAction;
}

/**
 * Batch send notifications (useful for digest alerts)
 */
export async function sendBatchNotifications(
  notifications: Array<{
    type: 'email' | 'webhook' | 'sms';
    config: any;
  }>
): Promise<NotificationDeliveryResult[]> {
  const promises = notifications.map(async (notification) => {
    switch (notification.type) {
      case 'email':
        return sendEmail(
          notification.config.to,
          notification.config.subject,
          notification.config.body,
          notification.config.html
        );
      case 'webhook':
        return sendWebhookAlert(
          notification.config.url,
          notification.config.payload,
          notification.config.headers
        );
      case 'sms':
        return sendSMSAlert(
          notification.config.to,
          notification.config.message
        );
      default:
        return { success: false, error: 'Unknown notification type' };
    }
  });

  return Promise.all(promises);
}
