/**
 * OAuth utilities for health app integrations
 */

import { randomBytes, createHash } from 'crypto';
import { db } from '@/lib/database';
import { OAuthFlowState, OAuthTokenResponse, HealthServiceName, OAuthError } from './types';

/**
 * Generate PKCE code verifier and challenge
 */
export function generatePKCE(): { codeVerifier: string; codeChallenge: string; codeChallengeMethod: 'S256' } {
  // Generate a random code verifier (43-128 characters)
  const codeVerifier = randomBytes(32).toString('base64url');
  
  // Create SHA256 hash of the code verifier
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256'
  };
}

/**
 * Generate secure random state parameter
 */
export function generateState(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create OAuth state record in database
 */
export async function createOAuthState(
  userId: string,
  serviceName: HealthServiceName,
  scopes: string[],
  redirectUrl?: string
): Promise<OAuthFlowState> {
  const state = generateState();
  const { codeVerifier, codeChallenge, codeChallengeMethod } = generatePKCE();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Store in database
  await db.createOAuthState({
    user_id: userId,
    service_name: serviceName,
    state,
    code_verifier: codeVerifier,
    redirect_url: redirectUrl,
    expires_at: expiresAt
  });
  
  return {
    userId,
    serviceName,
    state,
    codeVerifier,
    codeChallengeMethod,
    redirectUrl,
    scopes,
    expiresAt
  };
}

/**
 * Retrieve and validate OAuth state
 */
export async function validateOAuthState(state: string): Promise<OAuthFlowState | null> {
  const oauthState = await db.getOAuthState(state);
  
  if (!oauthState) {
    throw new OAuthError('Invalid or expired OAuth state', 'invalid_state');
  }
  
  if (new Date() > oauthState.expires_at) {
    await db.deleteOAuthState(state);
    throw new OAuthError('OAuth state has expired', 'state_expired');
  }
  
  return {
    userId: oauthState.user_id,
    serviceName: oauthState.service_name as HealthServiceName,
    state: oauthState.state,
    codeVerifier: oauthState.code_verifier,
    codeChallengeMethod: 'S256',
    redirectUrl: oauthState.redirect_url || undefined,
    scopes: [], // Will be populated by service-specific logic
    expiresAt: oauthState.expires_at
  };
}

/**
 * Clean up OAuth state after use
 */
export async function cleanupOAuthState(state: string): Promise<void> {
  await db.deleteOAuthState(state);
}

/**
 * Token encryption/decryption utilities
 */
function getEncryptionKey(): string {
  const key = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;
  if (!key) {
    // Only throw error at runtime, not during build
    if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PHASE !== 'phase-production-build') {
      throw new Error('INTEGRATION_TOKEN_ENCRYPTION_KEY environment variable is required');
    }
    // Return a dummy key for build time
    return 'dummy-key-for-build-time-only-do-not-use-in-production';
  }
  return key;
}

export function encryptToken(token: string): string {
  // Ensure encryption key is available
  const encryptionKey = getEncryptionKey();
  
  // Simple base64 encoding for now - in production, use proper encryption
  // You should use something like node:crypto with AES-256-GCM
  return Buffer.from(token).toString('base64');
}

export function decryptToken(encryptedToken: string): string {
  // Ensure encryption key is available
  const encryptionKey = getEncryptionKey();
  
  // Simple base64 decoding for now - in production, use proper decryption
  return Buffer.from(encryptedToken, 'base64').toString('utf-8');
}

/**
 * Build OAuth authorization URL
 */
export function buildOAuthUrl(
  authUrl: string,
  clientId: string,
  scopes: string[],
  state: string,
  codeChallenge: string,
  redirectUri: string,
  additionalParams: Record<string, string> = {}
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    ...additionalParams
  });
  
  return `${authUrl}?${params.toString()}`;
}

/**
 * Exchange OAuth code for tokens
 */
export async function exchangeCodeForTokens(
  tokenUrl: string,
  clientId: string,
  clientSecret: string | undefined,
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier
  });
  
  // Add client secret for services that require it
  if (clientSecret) {
    body.append('client_secret', clientSecret);
  }
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'Tranquilae/1.0'
    },
    body: body.toString()
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new OAuthError(
      `Token exchange failed: ${response.status}`,
      'token_exchange_failed',
      errorText
    );
  }
  
  const tokens: OAuthTokenResponse = await response.json();
  
  if (!tokens.access_token) {
    throw new OAuthError('No access token in response', 'no_access_token');
  }
  
  return tokens;
}

/**
 * Refresh OAuth tokens
 */
export async function refreshOAuthTokens(
  tokenUrl: string,
  clientId: string,
  clientSecret: string | undefined,
  refreshToken: string
): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId
  });
  
  if (clientSecret) {
    body.append('client_secret', clientSecret);
  }
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'Tranquilae/1.0'
    },
    body: body.toString()
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new OAuthError(
      `Token refresh failed: ${response.status}`,
      'token_refresh_failed',
      errorText
    );
  }
  
  const tokens: OAuthTokenResponse = await response.json();
  
  if (!tokens.access_token) {
    throw new OAuthError('No access token in refresh response', 'no_access_token');
  }
  
  return tokens;
}

/**
 * Validate access token by making a test API call
 */
export async function validateAccessToken(
  testUrl: string,
  accessToken: string,
  tokenType: string = 'Bearer'
): Promise<boolean> {
  try {
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `${tokenType} ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Tranquilae/1.0'
      }
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Service-specific OAuth URL builders
 */
export const OAuthUrlBuilders = {
  'apple-health': (state: string, codeChallenge: string) => {
    // Apple Health uses a different OAuth flow - this is conceptual
    return buildOAuthUrl(
      'https://developer.apple.com/health/authorize',
      process.env.APPLE_HEALTH_CLIENT_ID!,
      ['healthkit.read'],
      state,
      codeChallenge,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/apple-health/callback`
    );
  },
  
  'google-fit': (state: string, codeChallenge: string) => {
    return buildOAuthUrl(
      'https://accounts.google.com/o/oauth2/v2/auth',
      process.env.GOOGLE_FIT_CLIENT_ID!,
      [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.body.read',
        'https://www.googleapis.com/auth/fitness.heart_rate.read'
      ],
      state,
      codeChallenge,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-fit/callback`,
      { access_type: 'offline', prompt: 'consent' }
    );
  },
  
  'fitbit': (state: string, codeChallenge: string) => {
    return buildOAuthUrl(
      'https://www.fitbit.com/oauth2/authorize',
      process.env.FITBIT_CLIENT_ID!,
      ['activity', 'heartrate', 'sleep', 'weight', 'profile'],
      state,
      codeChallenge,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/fitbit/callback`
    );
  },
  
  'samsung-health': (state: string) => {
    // Samsung Health doesn't use PKCE
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.SAMSUNG_HEALTH_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/samsung-health/callback`,
      scope: 'health:read',
      state
    });
    
    return `https://account.samsung.com/mobile/account/check.do?${params.toString()}`;
  },
  
  'garmin-connect': (state: string) => {
    // Garmin uses OAuth 1.0a - different flow
    const params = new URLSearchParams({
      oauth_callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/garmin-connect/callback`,
      state
    });
    
    return `https://connect.garmin.com/oauthConfirm?${params.toString()}`;
  }
};

/**
 * Get callback URL for service
 */
export function getCallbackUrl(serviceName: HealthServiceName): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/${serviceName}/callback`;
}

/**
 * Store integration tokens securely
 */
export async function storeIntegrationTokens(
  userId: string,
  serviceName: HealthServiceName,
  tokens: OAuthTokenResponse,
  scopes: string[]
): Promise<void> {
  const encryptedAccessToken = encryptToken(tokens.access_token);
  const encryptedRefreshToken = tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined;
  
  const expiresAt = tokens.expires_in 
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : undefined;
  
  await db.createHealthIntegration({
    user_id: userId,
    service_name: serviceName,
    status: 'connected',
    access_token: encryptedAccessToken,
    refresh_token: encryptedRefreshToken,
    token_expires_at: expiresAt,
    scopes,
    sync_status: 'idle',
    settings: {
      auto_sync: true,
      data_types: ['steps', 'heart_rate', 'sleep', 'calories'],
      sync_frequency: 'daily'
    }
  });
}

/**
 * Cleanup expired OAuth states (should be run periodically)
 */
export async function cleanupExpiredStates(): Promise<void> {
  await db.cleanupExpiredOAuthStates();
}
