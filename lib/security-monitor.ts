/**
 * Security Monitoring System
 * Comprehensive security event detection and monitoring for admin panel
 */

import { createServiceClient } from './admin-middleware';
import { sendEmail, sendWebhookAlert, sendSMSAlert } from './notification-service';

// Security Event Types
export enum SecurityEventType {
  FAILED_LOGIN = 'failed_login',
  SUCCESSFUL_LOGIN = 'successful_login',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  IP_BLOCKED = 'ip_blocked',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCOUNT_LOCKED = 'account_locked',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  ADMIN_ACTION = 'admin_action',
  SYSTEM_MANIPULATION = 'system_manipulation',
  UNUSUAL_LOCATION = 'unusual_location',
  SESSION_HIJACK_ATTEMPT = 'session_hijack_attempt',
  API_ABUSE = 'api_abuse',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt'
}

// Security Event Severity Levels
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Alert Channel Types
export enum AlertChannel {
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  SMS = 'sms'
}

export interface SecurityEvent {
  id?: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  eventData: Record<string, any>;
  description: string;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt?: string;
}

export interface AlertConfiguration {
  id?: string;
  name: string;
  eventType: SecurityEventType;
  thresholdCount: number;
  thresholdWindowMinutes: number;
  severity: SecuritySeverity;
  enabled: boolean;
  alertChannels: AlertChannel[];
  recipients: string[];
  autoBlock: boolean;
  autoBlockDurationMinutes: number;
}

export interface SecurityMetrics {
  periodDays: number;
  failedLogins: number;
  successfulLogins: number;
  securityEvents: number;
  criticalEvents: number;
  activeBlocks: number;
  eventsByType: Record<string, number>;
}

export class SecurityMonitor {
  private supabase = createServiceClient();

  /**
   * Log a security event and trigger alerts if necessary
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'createdAt'>): Promise<string> {
    try {
      // Call the database function to log the event
      const { data, error } = await this.supabase
        .rpc('log_security_event', {
          p_event_type: event.eventType,
          p_severity: event.severity,
          p_user_id: event.userId || null,
          p_ip_address: event.ipAddress || null,
          p_user_agent: event.userAgent || null,
          p_event_data: event.eventData || {},
          p_description: event.description
        });

      if (error) {
        console.error('Error logging security event:', error);
        throw error;
      }

      const eventId = data as string;

      // Check for alert triggers
      await this.checkAlertTriggers(event, eventId);

      return eventId;
    } catch (error) {
      console.error('Failed to log security event:', error);
      throw error;
    }
  }

  /**
   * Handle failed login attempt with auto-blocking
   */
  async handleFailedLogin(
    ipAddress: string,
    userId?: string,
    userAgent?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      // Call the database function to handle failed login
      const { error } = await this.supabase
        .rpc('handle_failed_login', {
          p_ip_address: ipAddress,
          p_user_id: userId || null,
          p_user_agent: userAgent || null
        });

      if (error) {
        console.error('Error handling failed login:', error);
        throw error;
      }

      // Additional client-side detection for sophisticated attacks
      await this.detectSophisticatedAttacks(ipAddress, userId, userAgent, additionalData);
    } catch (error) {
      console.error('Failed to handle failed login:', error);
      throw error;
    }
  }

  /**
   * Handle successful login and detect anomalies
   */
  async handleSuccessfulLogin(
    userId: string,
    ipAddress: string,
    userAgent?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      // Log successful login
      await this.logSecurityEvent({
        eventType: SecurityEventType.SUCCESSFUL_LOGIN,
        severity: SecuritySeverity.LOW,
        userId,
        ipAddress,
        userAgent,
        eventData: additionalData || {},
        description: `Successful admin login from IP ${ipAddress}`
      });

      // Check for location-based anomalies
      await this.checkLocationAnomaly(userId, ipAddress);

      // Check for session hijacking indicators
      await this.checkSessionHijackingIndicators(userId, ipAddress, userAgent);

      // Update metrics
      await this.updateLoginMetrics('successful');
    } catch (error) {
      console.error('Failed to handle successful login:', error);
      throw error;
    }
  }

  /**
   * Detect privilege escalation attempts
   */
  async detectPrivilegeEscalation(
    userId: string,
    attemptedRole: string,
    currentRole: string,
    ipAddress?: string
  ): Promise<void> {
    if (attemptedRole !== currentRole && this.isHigherPrivilege(attemptedRole, currentRole)) {
      await this.logSecurityEvent({
        eventType: SecurityEventType.PRIVILEGE_ESCALATION,
        severity: SecuritySeverity.CRITICAL,
        userId,
        ipAddress,
        eventData: {
          attempted_role: attemptedRole,
          current_role: currentRole
        },
        description: `Privilege escalation attempt: ${currentRole} → ${attemptedRole}`
      });
    }
  }

  /**
   * Detect API abuse patterns
   */
  async detectAPIAbuse(
    userId: string,
    endpoint: string,
    ipAddress: string,
    requestCount: number,
    timeWindow: number
  ): Promise<void> {
    const threshold = this.getAPIRateThreshold(endpoint);
    
    if (requestCount > threshold) {
      await this.logSecurityEvent({
        eventType: SecurityEventType.API_ABUSE,
        severity: SecuritySeverity.HIGH,
        userId,
        ipAddress,
        eventData: {
          endpoint,
          request_count: requestCount,
          time_window: timeWindow,
          threshold
        },
        description: `API abuse detected: ${requestCount} requests to ${endpoint} in ${timeWindow}s`
      });
    }
  }

  /**
   * Detect SQL injection attempts
   */
  async detectSQLInjection(
    userId: string,
    ipAddress: string,
    userAgent: string,
    inputData: string,
    endpoint: string
  ): Promise<void> {
    const sqlPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /exec\s*\(/i,
      /script\s*>/i,
      /\/\*.*\*\//i,
      /;.*--/i,
      /'.*or.*'.*=/i
    ];

    const isSQLInjection = sqlPatterns.some(pattern => pattern.test(inputData));

    if (isSQLInjection) {
      await this.logSecurityEvent({
        eventType: SecurityEventType.SQL_INJECTION_ATTEMPT,
        severity: SecuritySeverity.CRITICAL,
        userId,
        ipAddress,
        userAgent,
        eventData: {
          endpoint,
          suspicious_input: inputData.substring(0, 500), // Limit length
          detected_patterns: sqlPatterns.filter(p => p.test(inputData)).map(p => p.toString())
        },
        description: `SQL injection attempt detected on ${endpoint}`
      });

      // Auto-block IP for SQL injection attempts
      await this.blockIP(ipAddress, 'temporary', 'SQL injection attempt detected', 1440); // 24 hours
    }
  }

  /**
   * Check if IP address is blocked
   */
  async isIPBlocked(ipAddress: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('is_ip_blocked', { p_ip_address: ipAddress });

      if (error) {
        console.error('Error checking IP block status:', error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error('Failed to check IP block status:', error);
      return false;
    }
  }

  /**
   * Block IP address
   */
  async blockIP(
    ipAddress: string,
    blockType: 'temporary' | 'permanent' = 'temporary',
    reason: string = 'Suspicious activity detected',
    durationMinutes: number = 60,
    createdBy?: string
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .rpc('block_ip_address', {
          p_ip_address: ipAddress,
          p_block_type: blockType,
          p_reason: reason,
          p_duration_minutes: durationMinutes,
          p_created_by: createdBy || null
        });

      if (error) {
        console.error('Error blocking IP address:', error);
        throw error;
      }

      return data as string;
    } catch (error) {
      console.error('Failed to block IP address:', error);
      throw error;
    }
  }

  /**
   * Get security dashboard statistics
   */
  async getSecurityDashboardStats(days: number = 7): Promise<SecurityMetrics> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_security_dashboard_stats', { p_days: days });

      if (error) {
        console.error('Error fetching security stats:', error);
        throw error;
      }

      return data as SecurityMetrics;
    } catch (error) {
      console.error('Failed to fetch security dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get recent security events
   */
  async getSecurityEvents(
    limit: number = 50,
    eventType?: SecurityEventType,
    severity?: SecuritySeverity,
    resolved?: boolean
  ): Promise<SecurityEvent[]> {
    try {
      let query = this.supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (eventType) {
        query = query.eq('event_type', eventType);
      }
      if (severity) {
        query = query.eq('severity', severity);
      }
      if (resolved !== undefined) {
        query = query.eq('resolved', resolved);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching security events:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch security events:', error);
      throw error;
    }
  }

  /**
   * Resolve security event
   */
  async resolveSecurityEvent(eventId: string, resolvedBy: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('security_events')
        .update({
          resolved: true,
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) {
        console.error('Error resolving security event:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to resolve security event:', error);
      throw error;
    }
  }

  /**
   * Get alert configurations
   */
  async getAlertConfigurations(): Promise<AlertConfiguration[]> {
    try {
      const { data, error } = await this.supabase
        .from('alert_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching alert configurations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch alert configurations:', error);
      throw error;
    }
  }

  /**
   * Update alert configuration
   */
  async updateAlertConfiguration(config: AlertConfiguration): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('alert_configurations')
        .upsert({
          ...config,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating alert configuration:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update alert configuration:', error);
      throw error;
    }
  }

  // Private helper methods

  private async checkAlertTriggers(event: Omit<SecurityEvent, 'id' | 'createdAt'>, eventId: string): Promise<void> {
    try {
      // Get relevant alert configurations
      const configs = await this.getActiveAlertConfigurations(event.eventType);

      for (const config of configs) {
        const shouldAlert = await this.shouldTriggerAlert(config, event);
        
        if (shouldAlert) {
          await this.sendAlerts(config, [eventId], event);

          if (config.autoBlock && event.ipAddress) {
            await this.blockIP(
              event.ipAddress,
              'temporary',
              `Auto-blocked due to ${config.name}`,
              config.autoBlockDurationMinutes
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking alert triggers:', error);
    }
  }

  private async getActiveAlertConfigurations(eventType: SecurityEventType): Promise<AlertConfiguration[]> {
    const { data, error } = await this.supabase
      .from('alert_configurations')
      .select('*')
      .eq('event_type', eventType)
      .eq('enabled', true);

    if (error) {
      console.error('Error fetching alert configurations:', error);
      return [];
    }

    return data || [];
  }

  private async shouldTriggerAlert(config: AlertConfiguration, event: Omit<SecurityEvent, 'id' | 'createdAt'>): Promise<boolean> {
    // Count recent events of this type
    const { data, error } = await this.supabase
      .from('security_events')
      .select('id')
      .eq('event_type', event.eventType)
      .gte('created_at', new Date(Date.now() - config.thresholdWindowMinutes * 60 * 1000).toISOString());

    if (error) {
      console.error('Error checking alert threshold:', error);
      return false;
    }

    return (data?.length || 0) >= config.thresholdCount;
  }

  private async sendAlerts(config: AlertConfiguration, eventIds: string[], event: Omit<SecurityEvent, 'id' | 'createdAt'>): Promise<void> {
    const alertPromises = [];

    for (const channel of config.alertChannels) {
      for (const recipient of config.recipients) {
        switch (channel) {
          case AlertChannel.EMAIL:
            alertPromises.push(this.sendEmailAlert(recipient, config, event));
            break;
          case AlertChannel.WEBHOOK:
            alertPromises.push(this.sendWebhookAlert(recipient, config, event));
            break;
          case AlertChannel.SMS:
            alertPromises.push(this.sendSMSAlert(recipient, config, event));
            break;
        }
      }
    }

    await Promise.allSettled(alertPromises);
  }

  private async sendEmailAlert(email: string, config: AlertConfiguration, event: Omit<SecurityEvent, 'id' | 'createdAt'>): Promise<void> {
    const subject = `Security Alert: ${config.name}`;
    const body = `
      Security event detected:
      
      Type: ${event.eventType}
      Severity: ${event.severity}
      Description: ${event.description}
      Time: ${new Date().toISOString()}
      IP Address: ${event.ipAddress || 'N/A'}
      User ID: ${event.userId || 'N/A'}
      
      Please review and take appropriate action.
    `;

    await sendEmail(email, subject, body);
  }

  private async sendWebhookAlert(url: string, config: AlertConfiguration, event: Omit<SecurityEvent, 'id' | 'createdAt'>): Promise<void> {
    const payload = {
      alert: config.name,
      event: {
        type: event.eventType,
        severity: event.severity,
        description: event.description,
        timestamp: new Date().toISOString(),
        data: event.eventData
      }
    };

    await sendWebhookAlert(url, payload);
  }

  private async sendSMSAlert(phone: string, config: AlertConfiguration, event: Omit<SecurityEvent, 'id' | 'createdAt'>): Promise<void> {
    const message = `SECURITY ALERT: ${event.eventType} - ${event.description}. Check admin panel immediately.`;
    await sendSMSAlert(phone, message);
  }

  private async detectSophisticatedAttacks(
    ipAddress: string,
    userId?: string,
    userAgent?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    // Detect user agent anomalies
    if (userAgent && this.isSuspiciousUserAgent(userAgent)) {
      await this.logSecurityEvent({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.MEDIUM,
        userId,
        ipAddress,
        userAgent,
        eventData: { suspicious_user_agent: userAgent },
        description: 'Suspicious user agent detected'
      });
    }

    // Detect timing-based attacks
    if (additionalData?.timing && this.isSuspiciousTiming(additionalData.timing)) {
      await this.logSecurityEvent({
        eventType: SecurityEventType.BRUTE_FORCE_ATTEMPT,
        severity: SecuritySeverity.HIGH,
        userId,
        ipAddress,
        userAgent,
        eventData: { timing_data: additionalData.timing },
        description: 'Timing-based brute force attack detected'
      });
    }
  }

  private async checkLocationAnomaly(userId: string, ipAddress: string): Promise<void> {
    // This would integrate with a geo-IP service
    // For now, we'll implement a basic check
    const { data: recentLogins } = await this.supabase
      .from('security_events')
      .select('ip_address, created_at')
      .eq('user_id', userId)
      .eq('event_type', SecurityEventType.SUCCESSFUL_LOGIN)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentLogins && recentLogins.length > 0) {
      const previousIPs = recentLogins.map(login => login.ip_address);
      if (!previousIPs.includes(ipAddress)) {
        await this.logSecurityEvent({
          eventType: SecurityEventType.UNUSUAL_LOCATION,
          severity: SecuritySeverity.MEDIUM,
          userId,
          ipAddress,
          eventData: { previous_ips: previousIPs },
          description: 'Login from new location detected'
        });
      }
    }
  }

  private async checkSessionHijackingIndicators(userId: string, ipAddress: string, userAgent?: string): Promise<void> {
    // Check for rapid IP changes
    const { data: recentSessions } = await this.supabase
      .from('security_events')
      .select('ip_address, user_agent, created_at')
      .eq('user_id', userId)
      .eq('event_type', SecurityEventType.SUCCESSFUL_LOGIN)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentSessions && recentSessions.length > 2) {
      const uniqueIPs = new Set(recentSessions.map(s => s.ip_address));
      if (uniqueIPs.size > 2) {
        await this.logSecurityEvent({
          eventType: SecurityEventType.SESSION_HIJACK_ATTEMPT,
          severity: SecuritySeverity.HIGH,
          userId,
          ipAddress,
          userAgent,
          eventData: { recent_ips: Array.from(uniqueIPs) },
          description: 'Potential session hijacking detected - multiple IP addresses in short time'
        });
      }
    }
  }

  private isHigherPrivilege(attemptedRole: string, currentRole: string): boolean {
    const roleHierarchy = { 'user': 0, 'admin': 1, 'super_admin': 2 };
    return (roleHierarchy[attemptedRole] || 0) > (roleHierarchy[currentRole] || 0);
  }

  private getAPIRateThreshold(endpoint: string): number {
    const thresholds: Record<string, number> = {
      '/api/admin/users': 100,
      '/api/admin/subscriptions': 50,
      '/api/admin/logs': 200,
      '/api/admin/system': 20
    };
    return thresholds[endpoint] || 60; // Default threshold
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /python/i,
      /bot/i,
      /crawler/i,
      /scanner/i,
      /sqlmap/i,
      /nikto/i
    ];
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private isSuspiciousTiming(timing: any): boolean {
    // Check for too-fast requests (< 100ms between attempts)
    return timing.interval && timing.interval < 100;
  }

  private async updateLoginMetrics(type: 'successful' | 'failed'): Promise<void> {
    const column = type === 'successful' ? 'successful_logins' : 'failed_logins';
    
    const { error } = await this.supabase
      .from('security_metrics')
      .upsert({
        metric_date: new Date().toISOString().split('T')[0],
        [column]: 1
      }, {
        onConflict: 'metric_date'
      });

    if (error) {
      console.error(`Error updating ${type} login metrics:`, error);
    }
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();
