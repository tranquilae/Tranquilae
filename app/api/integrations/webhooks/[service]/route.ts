/**
 * Health Integration Webhook Handler
 * Handles webhook notifications from health services
 * POST /api/integrations/webhooks/[service]
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthDataSyncEngine } from '@/lib/integrations/sync-engine';
import { HealthServiceName } from '@/lib/integrations/types';

// Service-specific webhook verification
const WEBHOOK_SECRETS = {
  'google-fit': process.env['GOOGLE_FIT_WEBHOOK_SECRET'],
  'fitbit': process.env['FITBIT_WEBHOOK_SECRET'],
  'apple-health': process.env['APPLE_HEALTH_WEBHOOK_SECRET'],
  'samsung-health': process.env['SAMSUNG_HEALTH_WEBHOOK_SECRET'],
  'garmin-connect': process.env['GARMIN_CONNECT_WEBHOOK_SECRET'],
} as const;

export async function POST(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  const serviceName = params.service as HealthServiceName;
  
  // Validate service name
  if (!Object.keys(WEBHOOK_SECRETS).includes(serviceName)) {
    return NextResponse.json(
      { error: 'Invalid service' },
      { status: 400 }
    );
  }

  try {
    // Get request headers and body
    const signature = request.headers.get('x-hub-signature') || 
                     request.headers.get('x-fitbit-signature') ||
                     request.headers.get('x-garmin-signature') ||
                     '';
    
    const body = await request.text();
    let payload: any;
    
    try {
      payload = JSON.parse(body);
    } catch {
      // Some webhooks might send form data or plain text
      payload = body;
    }

    console.log(`Received ${serviceName} webhook:`, {
      headers: Object.fromEntries(request.headers.entries()),
      payload: typeof payload === 'string' ? payload.substring(0, 200) : payload
    });

    // Handle special cases for different services
    switch (serviceName) {
      case 'fitbit':
        return handleFitbitWebhook(payload, signature);
        
      case 'google-fit':
        return handleGoogleFitWebhook(payload, signature);
        
      case 'apple-health':
        return handleAppleHealthWebhook(payload, signature);
        
      case 'samsung-health':
        return handleSamsungHealthWebhook(payload, signature);
        
      case 'garmin-connect':
        return handleGarminConnectWebhook(payload, signature);
        
      default:
        // Generic webhook handling
        await healthDataSyncEngine.handleWebhookNotification(
          serviceName,
          payload,
          signature
        );
        
        return NextResponse.json({ success: true });
    }

  } catch (error) {
    console.error(`Error handling ${serviceName} webhook:`, error);
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle Fitbit webhook verification and data updates
 */
async function handleFitbitWebhook(payload: any, signature: string): Promise<NextResponse> {
  // Fitbit sends a verification request during subscription setup
  if (Array.isArray(payload) && payload.length > 0) {
    const firstItem = payload[0];
    
    // Verification challenge
    if (firstItem.verification) {
      return NextResponse.json({}, { status: 204 }); // No content for verification
    }
    
    // Data update notification
    if (firstItem.collectionType && firstItem.date && firstItem.ownerId) {
      console.log('Fitbit data update:', firstItem);
      
      // Process the webhook notification
      await healthDataSyncEngine.handleWebhookNotification('fitbit', payload, signature);
      
      return NextResponse.json({}, { status: 204 });
    }
  }
  
  return NextResponse.json({ error: 'Invalid Fitbit webhook payload' }, { status: 400 });
}

/**
 * Handle Google Fit webhook push notifications
 */
async function handleGoogleFitWebhook(payload: any, signature: string): Promise<NextResponse> {
  // Google Fit sends Cloud Pub/Sub messages
  if (payload.message && payload.message.data) {
    try {
      const data = JSON.parse(Buffer.from(payload.message.data, 'base64').toString());
      console.log('Google Fit notification:', data);
      
      await healthDataSyncEngine.handleWebhookNotification('google-fit', data, signature);
      
      return NextResponse.json({}, { status: 204 });
    } catch (error) {
      console.error('Error parsing Google Fit webhook data:', error);
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
  }
  
  return NextResponse.json({ error: 'Invalid Google Fit webhook payload' }, { status: 400 });
}

/**
 * Handle Apple Health webhook (HealthKit updates via Apple Health Records API)
 */
async function handleAppleHealthWebhook(payload: any, signature: string): Promise<NextResponse> {
  // Apple Health Records API webhook format
  if (payload.notification_type && payload.patient_id) {
    console.log('Apple Health notification:', payload);
    
    await healthDataSyncEngine.handleWebhookNotification('apple-health', payload, signature);
    
    return NextResponse.json({}, { status: 200 });
  }
  
  return NextResponse.json({ error: 'Invalid Apple Health webhook payload' }, { status: 400 });
}

/**
 * Handle Samsung Health webhook notifications
 */
async function handleSamsungHealthWebhook(payload: any, signature: string): Promise<NextResponse> {
  // Samsung Health webhook format (varies by implementation)
  if (payload.user_id && payload.data_type) {
    console.log('Samsung Health notification:', payload);
    
    await healthDataSyncEngine.handleWebhookNotification('samsung-health', payload, signature);
    
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: 'Invalid Samsung Health webhook payload' }, { status: 400 });
}

/**
 * Handle Garmin Connect webhook notifications
 */
async function handleGarminConnectWebhook(payload: any, signature: string): Promise<NextResponse> {
  // Garmin Connect IQ webhook format
  if (payload.userAccessToken && (payload.activities || payload.dailies)) {
    console.log('Garmin Connect notification:', payload);
    
    await healthDataSyncEngine.handleWebhookNotification('garmin-connect', payload, signature);
    
    return NextResponse.json({}, { status: 200 });
  }
  
  return NextResponse.json({ error: 'Invalid Garmin Connect webhook payload' }, { status: 400 });
}

/**
 * Handle webhook verification challenges (used by some services)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  const serviceName = params.service as HealthServiceName;
  const { searchParams } = new URL(request.url);
  
  // Handle verification challenges
  switch (serviceName) {
    case 'fitbit':
      // Fitbit sends a verification code during setup
      const verify = searchParams.get('verify');
      if (verify) {
        return new NextResponse(verify, { status: 200 });
      }
      break;
      
    case 'google-fit':
      // Google Fit doesn't use GET verification
      break;
      
    default:
      // Generic challenge response
      const challenge = searchParams.get('challenge') || searchParams.get('hub.challenge');
      if (challenge) {
        return new NextResponse(challenge, { status: 200 });
      }
  }
  
  return NextResponse.json(
    { error: 'No verification challenge provided' },
    { status: 400 }
  );
}
