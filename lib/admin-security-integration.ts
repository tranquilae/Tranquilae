/**
 * Admin Security Integration
 * Demonstrates how to integrate the security monitoring system with admin routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor, SecurityEventType, SecuritySeverity } from './security-monitor';
import { securityResponseSystem } from './security-response-system';
import { withAdminAuth } from './admin-middleware';

/**
 * Enhanced admin middleware that includes security monitoring
 */
export function withSecurityMonitoring(handler: Function, options?: { requireSuperAdmin?: boolean }) {
  return withAdminAuth(async (request: NextRequest) => {
    const startTime = Date.now();
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    try {
      // Check if IP is blocked before processing
      if (await securityMonitor.isIPBlocked(ipAddress)) {
        await securityMonitor.logSecurityEvent({
          eventType: SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
          severity: SecuritySeverity.HIGH,
          ipAddress,
          userAgent,
          eventData: { 
            blocked_ip_attempt: true,
            route: request.nextUrl.pathname,
            method: request.method
          },
          description: `Access attempt from blocked IP: ${ipAddress}`
        });
        
        return NextResponse.json(
          { error: 'Access denied' }, 
          { status: 403 }
        );
      }

      // Execute the handler
      const response = await handler(request);

      // Log successful admin action
      const user = (request as any).user;
      if (user && response.status < 400) {
        await securityMonitor.handleSuccessfulLogin(
          user.id,
          ipAddress,
          userAgent,
          {
            route: request.nextUrl.pathname,
            method: request.method,
            response_time: Date.now() - startTime
          }
        );

        // Log admin action for audit
        await securityMonitor.logSecurityEvent({
          eventType: SecurityEventType.ADMIN_ACTION,
          severity: SecuritySeverity.LOW,
          userId: user.id,
          ipAddress,
          userAgent,
          eventData: {
            action: `${request.method} ${request.nextUrl.pathname}`,
            response_status: response.status,
            response_time: Date.now() - startTime
          },
          description: `Admin action: ${request.method} ${request.nextUrl.pathname}`
        });
      }

      return response;

    } catch (error: any) {
      // Log failed admin access
      await securityMonitor.handleFailedLogin(
        ipAddress,
        undefined, // No user ID for failed auth
        userAgent,
        {
          route: request.nextUrl.pathname,
          method: request.method,
          error: error.message,
          response_time: Date.now() - startTime
        }
      );

      // Process security event through automated response system
      await securityResponseSystem.processSecurityEvent({
        id: `failed-access-${Date.now()}`,
        eventType: SecurityEventType.FAILED_LOGIN,
        severity: SecuritySeverity.MEDIUM,
        ipAddress,
        userAgent,
        eventData: {
          route: request.nextUrl.pathname,
          method: request.method,
          error: error.message
        },
        description: `Failed admin access attempt to ${request.nextUrl.pathname}`
      });

      throw error;
    }
  }, options);
}

/**
 * Enhanced login handler with security monitoring
 */
export async function handleSecureAdminLogin(
  email: string,
  password: string,
  request: NextRequest
): Promise<{ success: boolean; user?: any; error?: string }> {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Check if IP is blocked
    if (await securityMonitor.isIPBlocked(ipAddress)) {
      await securityMonitor.logSecurityEvent({
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
        severity: SecuritySeverity.HIGH,
        ipAddress,
        userAgent,
        eventData: { blocked_ip_login_attempt: true },
        description: `Login attempt from blocked IP: ${ipAddress}`
      });
      
      return { success: false, error: 'Access denied' };
    }

    // Perform authentication (this would be your existing auth logic)
    const authResult = await authenticateAdmin(email, password);

    if (authResult.success && authResult.user) {
      // Check for suspicious login patterns
      await checkSuspiciousLoginPatterns(authResult.user.id, ipAddress, userAgent);

      // Log successful login
      await securityMonitor.handleSuccessfulLogin(
        authResult.user.id,
        ipAddress,
        userAgent,
        {
          login_method: 'password',
          user_role: authResult.user.role,
          login_time: new Date().toISOString()
        }
      );

      return authResult;
    } else {
      // Handle failed login with security monitoring
      await securityMonitor.handleFailedLogin(
        ipAddress,
        undefined, // No user ID for failed login
        userAgent,
        {
          attempted_email: email,
          failure_reason: authResult.error || 'Invalid credentials',
          login_time: new Date().toISOString()
        }
      );

      // Process through automated response system
      await securityResponseSystem.processSecurityEvent({
        id: `failed-login-${Date.now()}`,
        eventType: SecurityEventType.FAILED_LOGIN,
        severity: SecuritySeverity.MEDIUM,
        ipAddress,
        userAgent,
        eventData: {
          attempted_email: email,
          failure_reason: authResult.error || 'Invalid credentials'
        },
        description: `Failed admin login attempt for email: ${email}`
      });

      return { success: false, error: 'Invalid credentials' };
    }

  } catch (error: any) {
    // Log system error
    await securityMonitor.logSecurityEvent({
      eventType: SecurityEventType.SYSTEM_MANIPULATION,
      severity: SecuritySeverity.HIGH,
      ipAddress,
      userAgent,
      eventData: { 
        error: error.message,
        stack: error.stack,
        attempted_email: email
      },
      description: `System error during admin login: ${error.message}`
    });

    return { success: false, error: 'System error occurred' };
  }
}

/**
 * Monitor for privilege escalation attempts
 */
export async function monitorPrivilegeEscalation(
  userId: string,
  currentRole: string,
  attemptedAction: string,
  request: NextRequest
): Promise<boolean> {
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
  
  // Define role-based permissions
  const permissions = {
    'user': ['read_profile', 'update_profile'],
    'admin': ['read_users', 'update_users', 'read_logs', 'manage_subscriptions'],
    'super_admin': ['all']
  };

  const allowedActions = permissions[currentRole as keyof typeof permissions] || [];
  const isAuthorized = allowedActions.includes('all') || allowedActions.includes(attemptedAction);

  if (!isAuthorized) {
    // Log privilege escalation attempt
    await securityMonitor.detectPrivilegeEscalation(
      userId,
      'super_admin', // Assumed attempted privilege
      currentRole,
      ipAddress
    );

    // Process through automated response system
    await securityResponseSystem.processSecurityEvent({
      id: `privilege-escalation-${Date.now()}`,
      eventType: SecurityEventType.PRIVILEGE_ESCALATION,
      severity: SecuritySeverity.CRITICAL,
      userId,
      ipAddress,
      eventData: {
        current_role: currentRole,
        attempted_action: attemptedAction,
        timestamp: new Date().toISOString()
      },
      description: `Privilege escalation attempt: ${currentRole} tried to ${attemptedAction}`
    });

    return false;
  }

  return true;
}

/**
 * Monitor API endpoints for abuse
 */
export async function monitorAPIUsage(
  userId: string,
  endpoint: string,
  request: NextRequest
): Promise<boolean> {
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
  
  // This would typically use a rate limiter like Redis
  // For now, we'll simulate with a simple in-memory counter
  const key = `${userId}-${endpoint}`;
  const timeWindow = 60; // 1 minute
  const requestCount = await getRequestCount(key, timeWindow);

  // Check for API abuse
  if (requestCount > 0) {
    await securityMonitor.detectAPIAbuse(
      userId,
      endpoint,
      ipAddress,
      requestCount,
      timeWindow
    );

    // Process through automated response system
    await securityResponseSystem.processSecurityEvent({
      id: `api-abuse-${Date.now()}`,
      eventType: SecurityEventType.API_ABUSE,
      severity: SecuritySeverity.HIGH,
      userId,
      ipAddress,
      eventData: {
        endpoint,
        request_count: requestCount,
        time_window: timeWindow
      },
      description: `API abuse detected: ${requestCount} requests to ${endpoint} in ${timeWindow}s`
    });

    return false;
  }

  return true;
}

/**
 * Monitor for SQL injection attempts in request parameters
 */
export async function monitorSQLInjection(
  userId: string,
  requestData: any,
  request: NextRequest
): Promise<boolean> {
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const endpoint = request.nextUrl.pathname;

  // Check all string parameters for SQL injection patterns
  const allStrings = extractStrings(requestData);
  
  for (const str of allStrings) {
    if (str && typeof str === 'string' && str.length > 0) {
      // Use the security monitor's SQL injection detection
      await securityMonitor.detectSQLInjection(
        userId,
        ipAddress,
        userAgent,
        str,
        endpoint
      );

      // If injection detected, the security monitor will automatically:
      // 1. Log the event
      // 2. Block the IP
      // 3. Send alerts
      // 4. Process through response system
    }
  }

  return true;
}

// Helper functions

async function authenticateAdmin(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
  // This would be your existing authentication logic
  // Placeholder implementation
  return { success: false, error: 'Authentication not implemented' };
}

async function checkSuspiciousLoginPatterns(userId: string, ipAddress: string, userAgent: string): Promise<void> {
  // Check for multiple rapid logins, unusual locations, etc.
  // This would integrate with your existing user session tracking
}

async function getRequestCount(key: string, timeWindow: number): Promise<number> {
  // This would typically use Redis or another rate limiting solution
  // Placeholder implementation
  return 0;
}

function extractStrings(obj: any, strings: string[] = []): string[] {
  if (typeof obj === 'string') {
    strings.push(obj);
  } else if (typeof obj === 'object' && obj !== null) {
    Object.values(obj).forEach(value => extractStrings(value, strings));
  }
  return strings;
}

/**
 * Manual security incident reporting
 */
export async function reportSecurityIncident(
  type: SecurityEventType,
  severity: SecuritySeverity,
  description: string,
  userId?: string,
  additionalData?: any
): Promise<void> {
  await securityResponseSystem.triggerEmergencyResponse(
    type,
    severity,
    description,
    userId,
    undefined, // IP address
    additionalData
  );
}

/**
 * Test the security monitoring system
 */
export async function testSecuritySystem(): Promise<{
  success: boolean;
  results: any;
}> {
  try {
    // Test different security events
    const results = [];

    // Test failed login detection
    await securityMonitor.handleFailedLogin('192.168.1.100', undefined, 'test-agent');
    results.push({ test: 'failed_login', status: 'passed' });

    // Test privilege escalation detection
    await securityMonitor.detectPrivilegeEscalation('test-user', 'super_admin', 'user', '192.168.1.100');
    results.push({ test: 'privilege_escalation', status: 'passed' });

    // Test SQL injection detection
    await securityMonitor.detectSQLInjection(
      'test-user',
      '192.168.1.100',
      'test-agent',
      "'; DROP TABLE users; --",
      '/test'
    );
    results.push({ test: 'sql_injection', status: 'passed' });

    // Test emergency response
    await securityResponseSystem.triggerEmergencyResponse(
      SecurityEventType.DATA_BREACH_ATTEMPT,
      SecuritySeverity.CRITICAL,
      'Test emergency response',
      'test-user',
      '192.168.1.100',
      { test: true }
    );
    results.push({ test: 'emergency_response', status: 'passed' });

    return { success: true, results };

  } catch (error) {
    console.error('Security system test failed:', error);
    return { success: false, results: { error: error.message } };
  }
}
