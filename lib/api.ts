import { supabase } from '@/lib/supabase';

/**
 * Centralized API helper with authentication
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Make authenticated API request with automatic session handling
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Get the current session with retry logic
    let session = null;
    let sessionError = null;
    
    // First attempt to get session
    const sessionResult = await supabase.auth.getSession();
    session = sessionResult.data.session;
    sessionError = sessionResult.error;
    
    // If no session, try to refresh once
    if (!session && !sessionError) {
      console.log('API - No session found, attempting refresh...');
      const refreshResult = await supabase.auth.refreshSession();
      if (refreshResult.data.session) {
        session = refreshResult.data.session;
      }
      sessionError = refreshResult.error;
    }
    
    if (sessionError) {
      console.error('API - Session error:', sessionError.message);
      throw new APIError('Failed to get session', 401, 'SESSION_ERROR');
    }
    
    if (!session) {
      console.error('API - No session available');
      throw new APIError('Authentication required', 401, 'NO_SESSION');
    }

    // Add authorization header
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle authentication errors
    if (response.status === 401) {
      // Try to refresh session once
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        throw new APIError('Session expired', 401, 'SESSION_EXPIRED');
      }
      
      // Retry request with refreshed session
      const { data: { session: newSession } } = await supabase.auth.getSession();
      if (newSession) {
        const retryHeaders = {
          ...headers,
          'Authorization': `Bearer ${newSession.access_token}`,
        };
        
        return fetch(url, {
          ...options,
          headers: retryHeaders,
        });
      }
    }

    return response;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      error instanceof Error ? error.message : 'Network request failed',
      500,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Parse API response with error handling
 */
export async function parseAPIResponse<T = any>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let errorCode = 'HTTP_ERROR';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
      errorCode = errorData.code || errorCode;
    } catch {
      // If we can't parse JSON, use default message
    }
    
    throw new APIError(errorMessage, response.status, errorCode);
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw new APIError('Failed to parse response', 500, 'PARSE_ERROR');
  }
}

/**
 * Onboarding API helpers
 */
export const onboardingAPI = {
  /**
   * Save onboarding progress
   */
  async saveProgress(step: number, data: any) {
    const response = await fetchWithAuth('/api/onboarding/progress', {
      method: 'POST',
      body: JSON.stringify({ step, data }),
    });
    return parseAPIResponse(response);
  },

  /**
   * Get onboarding progress
   */
  async getProgress() {
    const response = await fetchWithAuth('/api/onboarding/progress');
    return parseAPIResponse(response);
  },

  /**
   * Complete onboarding
   */
  async complete(plan: 'explorer' | 'pathfinder') {
    const response = await fetchWithAuth('/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
    return parseAPIResponse(response);
  },
};

/**
 * Payment API helpers
 */
export const paymentAPI = {
  /**
   * Create checkout session
   */
  async createCheckoutSession(plan: 'monthly' | 'yearly') {
    const response = await fetchWithAuth('/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
    return parseAPIResponse<{ url: string; session_id: string }>(response);
  },
};

/**
 * Handle API errors with user-friendly messages and navigation
 */
export function handleAPIError(error: unknown, router?: any) {
  if (error instanceof APIError) {
    switch (error.code) {
      case 'NO_SESSION':
      case 'SESSION_EXPIRED':
      case 'AUTH_REQUIRED':
        // Only redirect if not already in auth flow
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        if (!currentPath.startsWith('/auth/') && !currentPath.startsWith('/onboarding')) {
          if (router) {
            router.push('/auth/login?reason=session_expired');
          } else if (typeof window !== 'undefined') {
            window.location.href = '/auth/login?reason=session_expired';
          }
        } else {
          console.log('API - Auth error during auth flow, not redirecting:', error.code);
        }
        return 'Please sign in to continue';
        
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again.';
        
      case 'PARSE_ERROR':
        return 'Server response error. Please try again.';
        
      default:
        return error.message || 'An unexpected error occurred';
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
}
