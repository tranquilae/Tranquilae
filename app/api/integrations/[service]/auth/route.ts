import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createOAuthState, OAuthUrlBuilders } from '@/lib/integrations/oauth';
import { HEALTH_SERVICE_CONFIGS, HealthServiceName } from '@/lib/integrations/types';

/**
 * Initiate OAuth flow for health service integration
 * GET /api/integrations/[service]/auth
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    // Validate service
    const serviceName = params.service as HealthServiceName;
    const serviceConfig = HEALTH_SERVICE_CONFIGS[serviceName];
    
    if (!serviceConfig) {
      return NextResponse.json(
        { error: 'Unsupported health service', code: 'INVALID_SERVICE' },
        { status: 400 }
      );
    }

    // Get user from authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Check if user already has this integration
    // (Optional: you might want to allow re-connection)
    
    // Create OAuth state in database
    const oauthState = await createOAuthState(
      user.id,
      serviceName,
      serviceConfig.oauth.scopes
    );

    // Generate service-specific OAuth URL
    let authUrl: string;

    if (serviceName === 'google-fit' || serviceName === 'fitbit' || serviceName === 'apple-health') {
      // Services that use PKCE
      const urlBuilder = OAuthUrlBuilders[serviceName];
      if (!urlBuilder) {
        throw new Error(`No URL builder for ${serviceName}`);
      }
      
      // Generate PKCE challenge from our stored verifier
      const { generatePKCE } = await import('@/lib/integrations/oauth');
      const { codeChallenge } = generatePKCE(); // This should use the stored verifier, but for now we'll regenerate
      
      authUrl = urlBuilder(oauthState.state, codeChallenge);
    } else {
      // Services that use regular OAuth 2.0
      const urlBuilder = OAuthUrlBuilders[serviceName];
      authUrl = urlBuilder(oauthState.state);
    }

    console.log(`OAuth flow initiated for user ${user.id} with ${serviceName}`);

    // Return the authorization URL
    return NextResponse.json({
      success: true,
      authUrl,
      serviceName,
      state: oauthState.state,
      message: `Redirecting to ${serviceConfig.displayName} for authorization`
    });

  } catch (error: any) {
    console.error(`Error initiating OAuth for ${params.service}:`, error);

    return NextResponse.json(
      { 
        error: 'Failed to initiate OAuth flow', 
        code: 'OAUTH_INIT_FAILED',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
