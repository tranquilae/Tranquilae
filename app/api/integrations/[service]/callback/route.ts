import { NextRequest, NextResponse } from 'next/server';
import { 
  validateOAuthState, 
  cleanupOAuthState, 
  exchangeCodeForTokens, 
  storeIntegrationTokens,
  getCallbackUrl
} from '@/lib/integrations/oauth';
import { HEALTH_SERVICE_CONFIGS, HealthServiceName, OAuthError } from '@/lib/integrations/types';

/**
 * Handle OAuth callback from health services
 * GET /api/integrations/[service]/callback?code=...&state=...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  try {
    // Validate service
    const serviceName = params.service as HealthServiceName;
    const serviceConfig = HEALTH_SERVICE_CONFIGS[serviceName];
    
    if (!serviceConfig) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_error=invalid_service`
      );
    }

    // Check for OAuth errors
    if (error) {
      console.error(`OAuth error from ${serviceName}:`, error, errorDescription);
      
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_error=oauth_error&details=${encodeURIComponent(error)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_error=missing_params`
      );
    }

    // Validate and retrieve OAuth state
    const oauthState = await validateOAuthState(state);
    
    if (!oauthState) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_error=invalid_state`
      );
    }

    // Verify the service matches
    if (oauthState.serviceName !== serviceName) {
      await cleanupOAuthState(state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_error=service_mismatch`
      );
    }

    console.log(`Processing OAuth callback for user ${oauthState.userId} with ${serviceName}`);

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(
      serviceConfig.oauth.tokenUrl,
      serviceConfig.oauth.clientId,
      serviceConfig.oauth.clientSecret,
      code,
      oauthState.codeVerifier!,
      getCallbackUrl(serviceName)
    );

    console.log(`Successfully obtained tokens for user ${oauthState.userId} from ${serviceName}`);

    // Store tokens securely in database
    await storeIntegrationTokens(
      oauthState.userId,
      serviceName,
      tokens,
      serviceConfig.oauth.scopes
    );

    // Clean up OAuth state
    await cleanupOAuthState(state);

    console.log(`Integration complete for user ${oauthState.userId} with ${serviceName}`);

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_success=${serviceName}&service_name=${encodeURIComponent(serviceConfig.displayName)}`
    );

  } catch (error: any) {
    console.error(`Error processing OAuth callback for ${params.service}:`, error);

    // Clean up state if we have it
    if (state) {
      try {
        await cleanupOAuthState(state);
      } catch (cleanupError) {
        console.error('Error cleaning up OAuth state:', cleanupError);
      }
    }

    // Handle specific error types
    let errorCode = 'callback_error';
    
    if (error instanceof OAuthError) {
      errorCode = error.code;
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_error=${errorCode}&details=${encodeURIComponent(error.message)}`
    );
  }
}

/**
 * Handle OAuth callback errors and edge cases
 * This can also handle POST requests for some services that send data via POST
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const body = await request.json();
    
    // Some services (like webhooks) might use POST for callbacks
    // Handle service-specific POST callback logic here
    
    console.log(`POST callback from ${params.service}:`, body);
    
    return NextResponse.json(
      { error: 'POST callbacks not implemented for this service' },
      { status: 501 }
    );
    
  } catch (error: any) {
    console.error(`Error handling POST callback for ${params.service}:`, error);
    
    return NextResponse.json(
      { error: 'Failed to process POST callback', details: error.message },
      { status: 500 }
    );
  }
}
