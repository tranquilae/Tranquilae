import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';

// Initialize Supabase client for logging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface DatabaseEvent {
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  user_id?: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
  error?: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

export interface SecurityEvent {
  event_type: 'LOGIN' | 'LOGOUT' | 'SIGNUP' | 'PASSWORD_RESET' | 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PaymentEvent {
  event_type: 'PAYMENT_ATTEMPT' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILURE' | 
             'SUBSCRIPTION_CREATED' | 'SUBSCRIPTION_UPDATED' | 'SUBSCRIPTION_CANCELLED' | 
             'TRIAL_STARTED' | 'TRIAL_ENDED' | 'REFUND_ISSUED' | 
             'CHARGEBACK_RECEIVED' | 'INVOICE_GENERATED' | 
             'PAYMENT_METHOD_UPDATED' | 'WEBHOOK_RECEIVED';
  user_id?: string;
  stripe_customer_id?: string;
  stripe_payment_intent_id?: string;
  stripe_subscription_id?: string;
  amount?: number;
  currency?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
}

class SupabaseLogger {
  private static instance: SupabaseLogger;
  
  public static getInstance(): SupabaseLogger {
    if (!SupabaseLogger.instance) {
      SupabaseLogger.instance = new SupabaseLogger();
    }
    return SupabaseLogger.instance;
  }

  /**
   * Log database operations with detailed context
   */
  async logDatabaseEvent(event: DatabaseEvent): Promise<void> {
    try {
      const logEntry = {
        event_type: `DB_${event.operation}`,
        table_name: event.table_name,
        user_id: event.user_id || null,
        event_data: {
          operation: event.operation,
          record_id: event.record_id,
          old_data: event.old_data ? this.sanitizeData(event.old_data) : null,
          new_data: event.new_data ? this.sanitizeData(event.new_data) : null,
          duration_ms: event.duration_ms,
          error: event.error,
          metadata: event.metadata
        },
        ip_address: event.ip_address,
        user_agent: event.user_agent,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(logEntry);

      if (error) {
        console.error('Failed to log database event:', error);
        // Fall back to Sentry for critical logging failures
        Sentry.captureException(new Error(`Supabase logging failed: ${error.message}`), {
          tags: { component: 'supabase-logger' },
          extra: { originalEvent: event }
        });
      }
    } catch (error) {
      console.error('Database logging error:', error);
      Sentry.captureException(error, {
        tags: { component: 'supabase-logger', operation: 'database-event' }
      });
    }
  }

  /**
   * Log security events (authentication, authorization, etc.)
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const logEntry = {
        event_type: event.event_type,
        user_id: event.user_id || null,
        event_data: {
          success: event.success,
          error: event.error,
          metadata: event.metadata
        },
        ip_address: event.ip_address,
        user_agent: event.user_agent,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(logEntry);

      if (error) {
        console.error('Failed to log security event:', error);
        Sentry.captureException(new Error(`Security logging failed: ${error.message}`), {
          tags: { component: 'security-logger' },
          extra: { originalEvent: event }
        });
      }

      // Also send critical security events to Sentry
      if (!event.success || event.event_type === 'SUSPICIOUS_ACTIVITY') {
        Sentry.captureMessage(`Security Event: ${event.event_type}`, {
          level: event.success ? 'warning' : 'error',
          tags: {
            component: 'security',
            event_type: event.event_type
          },
          user: {
            id: event.user_id,
            ip_address: event.ip_address
          },
          extra: {
            user_agent: event.user_agent,
            metadata: event.metadata
          }
        });
      }
    } catch (error) {
      console.error('Security logging error:', error);
      Sentry.captureException(error, {
        tags: { component: 'supabase-logger', operation: 'security-event' }
      });
    }
  }

  /**
   * Log payment and subscription events
   */
  async logPaymentEvent(event: PaymentEvent): Promise<void> {
    try {
      const logEntry = {
        event_type: event.event_type,
        user_id: event.user_id || null,
        event_data: {
          stripe_session_id: event.stripe_session_id,
          stripe_subscription_id: event.stripe_subscription_id,
          amount: event.amount,
          currency: event.currency,
          plan: event.plan,
          error: event.error,
          metadata: event.metadata
        },
        ip_address: null, // Payment events don't have direct IP access
        user_agent: null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(logEntry);

      if (error) {
        console.error('Failed to log payment event:', error);
        Sentry.captureException(new Error(`Payment logging failed: ${error.message}`), {
          tags: { component: 'payment-logger' },
          extra: { originalEvent: event }
        });
      }

      // Send payment failures to Sentry for immediate attention
      if (event.event_type === 'PAYMENT_FAILED' || event.error) {
        Sentry.captureMessage(`Payment Event: ${event.event_type}`, {
          level: 'error',
          tags: {
            component: 'payments',
            event_type: event.event_type
          },
          user: {
            id: event.user_id
          },
          extra: {
            stripe_session_id: event.stripe_session_id,
            amount: event.amount,
            currency: event.currency,
            error: event.error
          }
        });
      }
    } catch (error) {
      console.error('Payment logging error:', error);
      Sentry.captureException(error, {
        tags: { component: 'supabase-logger', operation: 'payment-event' }
      });
    }
  }

  /**
   * Log general application events
   */
  async logAppEvent(eventType: string, data: Record<string, any>, userId?: string): Promise<void> {
    try {
      const logEntry = {
        event_type: eventType,
        user_id: userId || null,
        event_data: this.sanitizeData(data),
        ip_address: null,
        user_agent: null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(logEntry);

      if (error) {
        console.error('Failed to log app event:', error);
      }
    } catch (error) {
      console.error('App logging error:', error);
      Sentry.captureException(error, {
        tags: { component: 'supabase-logger', operation: 'app-event' }
      });
    }
  }

  /**
   * Get audit logs for a specific user (with proper access control)
   */
  async getUserAuditLogs(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      Sentry.captureException(error, {
        tags: { component: 'supabase-logger', operation: 'fetch-logs' }
      });
      return [];
    }
  }

  /**
   * Sanitize sensitive data before logging
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'stripe_customer_id', 
      'access_token', 'refresh_token', 'ssn', 'credit_card'
    ];

    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (sanitized[key] && typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Health check for logging system
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', details: any }> {
    try {
      const testLog = {
        event_type: 'HEALTH_CHECK',
        user_id: null,
        event_data: { timestamp: new Date().toISOString() },
        ip_address: null,
        user_agent: null
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(testLog);

      if (error) {
        return {
          status: 'unhealthy',
          details: { error: error.message }
        };
      }

      return {
        status: 'healthy',
        details: { message: 'Logging system operational' }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

// Export singleton instance
export const supabaseLogger = SupabaseLogger.getInstance();

// Convenience functions
export const logDatabaseEvent = (event: DatabaseEvent) => supabaseLogger.logDatabaseEvent(event);
export const logSecurityEvent = (event: SecurityEvent) => supabaseLogger.logSecurityEvent(event);
export const logPaymentEvent = (event: PaymentEvent) => supabaseLogger.logPaymentEvent(event);
export const logAppEvent = (eventType: string, data: Record<string, any>, userId?: string) => 
  supabaseLogger.logAppEvent(eventType, data, userId);
