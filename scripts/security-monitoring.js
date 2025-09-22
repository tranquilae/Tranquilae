#!/usr/bin/env node

/**
 * 🔐 Security Monitoring Setup
 * Automated security monitoring with alerts for admin access attempts and suspicious activity
 */

const fs = require('fs');
const path = require('path');

// Color codes for output
const colors = {
  red: '\033[0;31m',
  green: '\033[0;32m',
  yellow: '\033[1;33m',
  blue: '\033[0;34m',
  purple: '\033[0;35m',
  cyan: '\033[0;36m',
  white: '\033[1;37m',
  reset: '\033[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

class SecurityMonitoringSetup {
  constructor() {
    this.monitoringComponents = [
      'security-monitor.ts',
      'alert-system.ts',
      'threat-detection.ts',
      'security-dashboard.tsx',
      'monitoring-api.ts'
    ];
  }

  async setup() {
    log('🔐 Setting up Security Monitoring System...', 'purple');
    log('===============================================', 'purple');
    
    await this.createSecurityMonitor();
    await this.createAlertSystem();
    await this.createThreatDetection();
    await this.createSecurityDashboard();
    await this.createMonitoringAPI();
    await this.createSecurityReports();
    await this.generateConfiguration();
    
    success('🎉 Security monitoring system setup completed!');
  }

  async createSecurityMonitor() {
    info('Step 1: Creating Security Monitor');
    
    const securityMonitorContent = `/**
 * Security Monitor
 * Real-time security event monitoring and analysis
 */

import { createClient } from '@supabase/supabase-js';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: 'admin_login_attempt' | 'unauthorized_access' | 'suspicious_activity' | 'rate_limit_exceeded' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  path?: string;
  details: Record<string, any>;
  resolved: boolean;
}

export interface SecurityThreshold {
  event_type: string;
  count_threshold: number;
  time_window_minutes: number;
  severity_escalation: string;
}

class SecurityMonitor {
  private supabase;
  private alertCallbacks: Map<string, Function[]> = new Map();
  private thresholds: SecurityThreshold[] = [
    {
      event_type: 'admin_login_attempt',
      count_threshold: 5,
      time_window_minutes: 15,
      severity_escalation: 'high'
    },
    {
      event_type: 'unauthorized_access',
      count_threshold: 3,
      time_window_minutes: 10,
      severity_escalation: 'critical'
    },
    {
      event_type: 'suspicious_activity',
      count_threshold: 2,
      time_window_minutes: 5,
      severity_escalation: 'critical'
    },
    {
      event_type: 'rate_limit_exceeded',
      count_threshold: 10,
      time_window_minutes: 30,
      severity_escalation: 'medium'
    }
  ];

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    try {
      const securityEvent: Partial<SecurityEvent> = {
        ...event,
        timestamp: new Date().toISOString(),
        resolved: false
      };

      // Store in database
      const { error } = await this.supabase
        .from('security_events')
        .insert(securityEvent);

      if (error) {
        console.error('Failed to log security event:', error);
        return;
      }

      // Check thresholds and trigger alerts
      await this.checkThresholds(event.event_type, event.ip_address);

      // Trigger immediate alerts for critical events
      if (event.severity === 'critical') {
        await this.triggerAlert('critical_security_event', securityEvent);
      }

    } catch (error) {
      console.error('Security event logging failed:', error);
    }
  }

  private async checkThresholds(eventType: string, ipAddress?: string): Promise<void> {
    const threshold = this.thresholds.find(t => t.event_type === eventType);
    if (!threshold) return;

    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - threshold.time_window_minutes);

    let query = this.supabase
      .from('security_events')
      .select('count')
      .eq('event_type', eventType)
      .gte('timestamp', timeWindow.toISOString());

    if (ipAddress) {
      query = query.eq('ip_address', ipAddress);
    }

    const { data, error } = await query;

    if (error || !data) return;

    if (data.length >= threshold.count_threshold) {
      await this.triggerAlert('threshold_exceeded', {
        event_type: eventType,
        count: data.length,
        threshold: threshold.count_threshold,
        time_window: threshold.time_window_minutes,
        ip_address: ipAddress,
        escalated_severity: threshold.severity_escalation
      });
    }
  }

  private async triggerAlert(alertType: string, data: any): Promise<void> {
    const callbacks = this.alertCallbacks.get(alertType) || [];
    
    for (const callback of callbacks) {
      try {
        await callback(data);
      } catch (error) {
        console.error(\`Alert callback failed for \${alertType}:\`, error);
      }
    }
  }

  public onAlert(alertType: string, callback: Function): void {
    if (!this.alertCallbacks.has(alertType)) {
      this.alertCallbacks.set(alertType, []);
    }
    this.alertCallbacks.get(alertType)!.push(callback);
  }

  async getSecurityEvents(filters: {
    event_type?: string;
    severity?: string;
    resolved?: boolean;
    time_range?: { start: string; end: string };
    limit?: number;
  } = {}): Promise<SecurityEvent[]> {
    let query = this.supabase
      .from('security_events')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters.event_type) {
      query = query.eq('event_type', filters.event_type);
    }

    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters.resolved !== undefined) {
      query = query.eq('resolved', filters.resolved);
    }

    if (filters.time_range) {
      query = query
        .gte('timestamp', filters.time_range.start)
        .lte('timestamp', filters.time_range.end);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch security events:', error);
      return [];
    }

    return data || [];
  }

  async resolveSecurityEvent(eventId: string, resolvedBy: string): Promise<void> {
    const { error } = await this.supabase
      .from('security_events')
      .update({ 
        resolved: true, 
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (error) {
      console.error('Failed to resolve security event:', error);
    }
  }

  async getSecurityStats(): Promise<{
    total_events: number;
    unresolved_events: number;
    critical_events: number;
    events_by_type: Record<string, number>;
    events_by_severity: Record<string, number>;
  }> {
    const { data: totalEvents } = await this.supabase
      .from('security_events')
      .select('count');

    const { data: unresolvedEvents } = await this.supabase
      .from('security_events')
      .select('count')
      .eq('resolved', false);

    const { data: criticalEvents } = await this.supabase
      .from('security_events')
      .select('count')
      .eq('severity', 'critical')
      .eq('resolved', false);

    const { data: eventsByType } = await this.supabase
      .from('security_events')
      .select('event_type')
      .eq('resolved', false);

    const { data: eventsBySeverity } = await this.supabase
      .from('security_events')
      .select('severity')
      .eq('resolved', false);

    const typeStats: Record<string, number> = {};
    eventsByType?.forEach(event => {
      typeStats[event.event_type] = (typeStats[event.event_type] || 0) + 1;
    });

    const severityStats: Record<string, number> = {};
    eventsBySeverity?.forEach(event => {
      severityStats[event.severity] = (severityStats[event.severity] || 0) + 1;
    });

    return {
      total_events: totalEvents?.length || 0,
      unresolved_events: unresolvedEvents?.length || 0,
      critical_events: criticalEvents?.length || 0,
      events_by_type: typeStats,
      events_by_severity: severityStats
    };
  }
}

export const securityMonitor = new SecurityMonitor();

// Utility functions for common security events
export const logAdminLogin = (userId: string, success: boolean, ipAddress?: string, userAgent?: string) => {
  return securityMonitor.logSecurityEvent({
    event_type: 'admin_login_attempt',
    severity: success ? 'low' : 'medium',
    user_id: userId,
    ip_address: ipAddress,
    user_agent: userAgent,
    details: { success, timestamp: new Date().toISOString() }
  });
};

export const logUnauthorizedAccess = (path: string, userId?: string, ipAddress?: string) => {
  return securityMonitor.logSecurityEvent({
    event_type: 'unauthorized_access',
    severity: 'high',
    user_id: userId,
    ip_address: ipAddress,
    path: path,
    details: { attempted_path: path, timestamp: new Date().toISOString() }
  });
};

export const logSuspiciousActivity = (description: string, userId?: string, ipAddress?: string, details?: Record<string, any>) => {
  return securityMonitor.logSecurityEvent({
    event_type: 'suspicious_activity',
    severity: 'high',
    user_id: userId,
    ip_address: ipAddress,
    details: { description, ...details, timestamp: new Date().toISOString() }
  });
};

export const logRateLimitExceeded = (ipAddress: string, path?: string) => {
  return securityMonitor.logSecurityEvent({
    event_type: 'rate_limit_exceeded',
    severity: 'medium',
    ip_address: ipAddress,
    path: path,
    details: { path, timestamp: new Date().toISOString() }
  });
};`;

    fs.writeFileSync('lib/security-monitor.ts', securityMonitorContent);
    success('Security monitor created');
  }

  async createAlertSystem() {
    info('Step 2: Creating Alert System');
    
    const alertSystemContent = `/**
 * Alert System
 * Multi-channel security alert system (email, webhooks, dashboard)
 */

import { securityMonitor } from './security-monitor';

export interface AlertChannel {
  name: string;
  type: 'email' | 'webhook' | 'dashboard' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  event_types: string[];
  severity_threshold: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
  throttle_minutes?: number;
  enabled: boolean;
}

class AlertSystem {
  private channels: Map<string, AlertChannel> = new Map();
  private rules: AlertRule[] = [];
  private alertHistory: Map<string, number> = new Map();

  constructor() {
    this.setupDefaultChannels();
    this.setupDefaultRules();
    this.setupEventListeners();
  }

  private setupDefaultChannels(): void {
    // Email channel
    this.channels.set('email', {
      name: 'Email Alerts',
      type: 'email',
      config: {
        to: process.env.ADMIN_ALERT_EMAIL || 'admin@your-domain.com',
        from: process.env.FROM_EMAIL,
        smtp_config: 'resend' // or 'smtp'
      },
      enabled: true
    });

    // Slack webhook (if configured)
    if (process.env.SLACK_WEBHOOK_URL) {
      this.channels.set('slack', {
        name: 'Slack Notifications',
        type: 'webhook',
        config: {
          url: process.env.SLACK_WEBHOOK_URL,
          format: 'slack'
        },
        enabled: true
      });
    }

    // Discord webhook (if configured)
    if (process.env.DISCORD_WEBHOOK_URL) {
      this.channels.set('discord', {
        name: 'Discord Notifications',
        type: 'webhook',
        config: {
          url: process.env.DISCORD_WEBHOOK_URL,
          format: 'discord'
        },
        enabled: true
      });
    }

    // Dashboard alerts (always enabled)
    this.channels.set('dashboard', {
      name: 'Dashboard Alerts',
      type: 'dashboard',
      config: {},
      enabled: true
    });
  }

  private setupDefaultRules(): void {
    this.rules = [
      {
        id: 'critical_events',
        name: 'Critical Security Events',
        event_types: ['unauthorized_access', 'suspicious_activity', 'privilege_escalation'],
        severity_threshold: 'critical',
        channels: ['email', 'slack', 'discord', 'dashboard'],
        enabled: true
      },
      {
        id: 'failed_admin_logins',
        name: 'Failed Admin Login Attempts',
        event_types: ['admin_login_attempt'],
        severity_threshold: 'medium',
        channels: ['email', 'dashboard'],
        throttle_minutes: 15,
        enabled: true
      },
      {
        id: 'rate_limit_alerts',
        name: 'Rate Limit Violations',
        event_types: ['rate_limit_exceeded'],
        severity_threshold: 'medium',
        channels: ['dashboard'],
        throttle_minutes: 30,
        enabled: true
      },
      {
        id: 'threshold_exceeded',
        name: 'Security Threshold Exceeded',
        event_types: ['threshold_exceeded'],
        severity_threshold: 'high',
        channels: ['email', 'slack', 'dashboard'],
        throttle_minutes: 10,
        enabled: true
      }
    ];
  }

  private setupEventListeners(): void {
    // Listen for security events
    securityMonitor.onAlert('critical_security_event', (event) => {
      this.processAlert('critical_events', event);
    });

    securityMonitor.onAlert('threshold_exceeded', (event) => {
      this.processAlert('threshold_exceeded', event);
    });
  }

  private async processAlert(ruleId: string, eventData: any): Promise<void> {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule || !rule.enabled) return;

    // Check throttling
    if (rule.throttle_minutes) {
      const lastAlert = this.alertHistory.get(ruleId) || 0;
      const now = Date.now();
      const throttleMs = rule.throttle_minutes * 60 * 1000;
      
      if (now - lastAlert < throttleMs) {
        return; // Throttled
      }
      
      this.alertHistory.set(ruleId, now);
    }

    // Send alerts to configured channels
    for (const channelName of rule.channels) {
      const channel = this.channels.get(channelName);
      if (channel && channel.enabled) {
        await this.sendAlert(channel, rule, eventData);
      }
    }
  }

  private async sendAlert(channel: AlertChannel, rule: AlertRule, eventData: any): Promise<void> {
    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailAlert(channel, rule, eventData);
          break;
        case 'webhook':
          await this.sendWebhookAlert(channel, rule, eventData);
          break;
        case 'dashboard':
          await this.sendDashboardAlert(channel, rule, eventData);
          break;
      }
    } catch (error) {
      console.error(\`Failed to send alert via \${channel.name}:\`, error);
    }
  }

  private async sendEmailAlert(channel: AlertChannel, rule: AlertRule, eventData: any): Promise<void> {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const subject = \`🚨 Security Alert: \${rule.name}\`;
    const html = this.generateEmailTemplate(rule, eventData);

    await resend.emails.send({
      from: channel.config.from,
      to: [channel.config.to],
      subject,
      html
    });
  }

  private async sendWebhookAlert(channel: AlertChannel, rule: AlertRule, eventData: any): Promise<void> {
    const payload = this.generateWebhookPayload(channel.config.format, rule, eventData);
    
    const response = await fetch(channel.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(\`Webhook failed with status \${response.status}\`);
    }
  }

  private async sendDashboardAlert(channel: AlertChannel, rule: AlertRule, eventData: any): Promise<void> {
    // Store alert in database for dashboard display
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('dashboard_alerts').insert({
      rule_id: rule.id,
      rule_name: rule.name,
      event_data: eventData,
      severity: this.getSeverityFromEventData(eventData),
      created_at: new Date().toISOString(),
      acknowledged: false
    });
  }

  private generateEmailTemplate(rule: AlertRule, eventData: any): string {
    const severity = this.getSeverityFromEventData(eventData);
    const severityColor = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545'
    }[severity] || '#6c757d';

    return \`
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .alert-box { border-left: 4px solid \${severityColor}; padding: 20px; background: #f8f9fa; }
            .severity { color: \${severityColor}; font-weight: bold; text-transform: uppercase; }
            .details { background: white; padding: 15px; border-radius: 4px; margin-top: 15px; }
            .timestamp { color: #6c757d; font-size: 0.9em; }
        </style>
    </head>
    <body>
        <div class="alert-box">
            <h2>🚨 Security Alert</h2>
            <p><strong>Rule:</strong> \${rule.name}</p>
            <p><strong>Severity:</strong> <span class="severity">\${severity}</span></p>
            <p><strong>Time:</strong> \${new Date().toISOString()}</p>
            
            <div class="details">
                <h3>Event Details</h3>
                <pre>\${JSON.stringify(eventData, null, 2)}</pre>
            </div>
            
            <div class="details">
                <h3>Recommended Actions</h3>
                <ul>
                    <li>Review the admin panel security logs</li>
                    <li>Check for unauthorized access attempts</li>
                    <li>Verify admin user activities</li>
                    <li>Update security policies if needed</li>
                </ul>
            </div>
            
            <p class="timestamp">
                This alert was generated automatically by the Tranquilae Security Monitoring System.
            </p>
        </div>
    </body>
    </html>
    \`;
  }

  private generateWebhookPayload(format: string, rule: AlertRule, eventData: any): any {
    const severity = this.getSeverityFromEventData(eventData);
    
    if (format === 'slack') {
      return {
        text: \`🚨 Security Alert: \${rule.name}\`,
        attachments: [
          {
            color: this.getSeverityColor(severity),
            fields: [
              { title: 'Severity', value: severity.toUpperCase(), short: true },
              { title: 'Time', value: new Date().toISOString(), short: true },
              { title: 'Details', value: \`\\\`\\\`\\\`\\n\${JSON.stringify(eventData, null, 2)}\\n\\\`\\\`\\\`\`, short: false }
            ]
          }
        ]
      };
    }

    if (format === 'discord') {
      return {
        embeds: [
          {
            title: '🚨 Security Alert',
            description: rule.name,
            color: parseInt(this.getSeverityColor(severity).replace('#', ''), 16),
            fields: [
              { name: 'Severity', value: severity.toUpperCase(), inline: true },
              { name: 'Time', value: new Date().toISOString(), inline: true },
              { name: 'Details', value: \`\\\`\\\`\\\`json\\n\${JSON.stringify(eventData, null, 2)}\\n\\\`\\\`\\\`\` }
            ],
            timestamp: new Date().toISOString()
          }
        ]
      };
    }

    // Default format
    return {
      rule: rule.name,
      severity,
      timestamp: new Date().toISOString(),
      data: eventData
    };
  }

  private getSeverityFromEventData(eventData: any): string {
    return eventData.severity || eventData.escalated_severity || 'medium';
  }

  private getSeverityColor(severity: string): string {
    const colors = {
      low: '#28a745',
      medium: '#ffc107', 
      high: '#fd7e14',
      critical: '#dc3545'
    };
    return colors[severity as keyof typeof colors] || '#6c757d';
  }

  // Public API
  public addChannel(name: string, channel: AlertChannel): void {
    this.channels.set(name, channel);
  }

  public addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  public enableChannel(name: string): void {
    const channel = this.channels.get(name);
    if (channel) {
      channel.enabled = true;
    }
  }

  public disableChannel(name: string): void {
    const channel = this.channels.get(name);
    if (channel) {
      channel.enabled = false;
    }
  }

  public getChannels(): AlertChannel[] {
    return Array.from(this.channels.values());
  }

  public getRules(): AlertRule[] {
    return this.rules;
  }
}

export const alertSystem = new AlertSystem();`;

    fs.writeFileSync('lib/alert-system.ts', alertSystemContent);
    success('Alert system created');
  }

  async createThreatDetection() {
    info('Step 3: Creating Threat Detection');
    
    const threatDetectionContent = `/**
 * Threat Detection System
 * Advanced pattern detection for security threats
 */

import { securityMonitor, logSuspiciousActivity } from './security-monitor';
import { alertSystem } from './alert-system';

export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  pattern: {
    event_types: string[];
    conditions: Record<string, any>;
    time_window_minutes: number;
    threshold_count: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface ThreatScore {
  ip_address: string;
  user_id?: string;
  score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  last_updated: string;
}

class ThreatDetectionEngine {
  private patterns: ThreatPattern[] = [];
  private threatScores: Map<string, ThreatScore> = new Map();

  constructor() {
    this.setupDefaultPatterns();
    this.startPeriodicAnalysis();
  }

  private setupDefaultPatterns(): void {
    this.patterns = [
      {
        id: 'brute_force_admin',
        name: 'Admin Brute Force Attack',
        description: 'Multiple failed admin login attempts from same IP',
        pattern: {
          event_types: ['admin_login_attempt'],
          conditions: { success: false },
          time_window_minutes: 15,
          threshold_count: 5
        },
        severity: 'high',
        enabled: true
      },
      {
        id: 'privilege_escalation',
        name: 'Privilege Escalation Attempt',
        description: 'User attempting to access higher privilege resources',
        pattern: {
          event_types: ['unauthorized_access'],
          conditions: { path: '/admin' },
          time_window_minutes: 10,
          threshold_count: 3
        },
        severity: 'critical',
        enabled: true
      },
      {
        id: 'suspicious_api_access',
        name: 'Suspicious API Access Pattern',
        description: 'Unusual API access patterns indicating potential attack',
        pattern: {
          event_types: ['rate_limit_exceeded'],
          conditions: { path_pattern: '/api/admin/' },
          time_window_minutes: 5,
          threshold_count: 10
        },
        severity: 'medium',
        enabled: true
      },
      {
        id: 'account_enumeration',
        name: 'Account Enumeration Attack',
        description: 'Systematic probing of user accounts',
        pattern: {
          event_types: ['admin_login_attempt'],
          conditions: { varied_users: true },
          time_window_minutes: 30,
          threshold_count: 15
        },
        severity: 'high',
        enabled: true
      },
      {
        id: 'geo_anomaly',
        name: 'Geographic Anomaly',
        description: 'Admin access from unusual geographic location',
        pattern: {
          event_types: ['admin_login_attempt'],
          conditions: { geo_anomaly: true },
          time_window_minutes: 60,
          threshold_count: 1
        },
        severity: 'medium',
        enabled: true
      }
    ];
  }

  private startPeriodicAnalysis(): void {
    // Run threat analysis every 5 minutes
    setInterval(async () => {
      await this.analyzeThreats();
    }, 5 * 60 * 1000);

    // Run comprehensive analysis every hour
    setInterval(async () => {
      await this.comprehensiveThreatAnalysis();
    }, 60 * 60 * 1000);
  }

  private async analyzeThreats(): Promise<void> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get recent security events
    const events = await securityMonitor.getSecurityEvents({
      time_range: {
        start: oneHourAgo.toISOString(),
        end: now.toISOString()
      },
      resolved: false
    });

    // Analyze each pattern
    for (const pattern of this.patterns) {
      if (!pattern.enabled) continue;

      const matchingEvents = this.filterEventsByPattern(events, pattern);
      const threats = this.detectPatternThreats(matchingEvents, pattern);

      for (const threat of threats) {
        await this.handleThreatDetection(threat, pattern);
      }
    }
  }

  private filterEventsByPattern(events: any[], pattern: ThreatPattern): any[] {
    return events.filter(event => {
      // Check event type
      if (!pattern.pattern.event_types.includes(event.event_type)) {
        return false;
      }

      // Check time window
      const eventTime = new Date(event.timestamp);
      const cutoff = new Date();
      cutoff.setMinutes(cutoff.getMinutes() - pattern.pattern.time_window_minutes);
      
      if (eventTime < cutoff) {
        return false;
      }

      // Check conditions
      return this.matchesConditions(event, pattern.pattern.conditions);
    });
  }

  private matchesConditions(event: any, conditions: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (key === 'success' && event.details?.success !== value) {
        return false;
      }
      
      if (key === 'path' && event.path !== value) {
        return false;
      }
      
      if (key === 'path_pattern' && !event.path?.includes(value)) {
        return false;
      }
      
      // Add more condition checks as needed
    }
    
    return true;
  }

  private detectPatternThreats(events: any[], pattern: ThreatPattern): any[] {
    const threatsBySource: Map<string, any[]> = new Map();

    // Group events by source (IP address or user)
    for (const event of events) {
      const source = event.ip_address || event.user_id || 'unknown';
      
      if (!threatsBySource.has(source)) {
        threatsBySource.set(source, []);
      }
      
      threatsBySource.get(source)!.push(event);
    }

    // Check which sources exceed threshold
    const threats: any[] = [];
    
    for (const [source, sourceEvents] of threatsBySource) {
      if (sourceEvents.length >= pattern.pattern.threshold_count) {
        threats.push({
          source,
          events: sourceEvents,
          count: sourceEvents.length,
          pattern_id: pattern.id
        });
      }
    }

    return threats;
  }

  private async handleThreatDetection(threat: any, pattern: ThreatPattern): Promise<void> {
    // Update threat score
    this.updateThreatScore(threat.source, pattern.severity, pattern.name);

    // Log suspicious activity
    await logSuspiciousActivity(
      \`Threat pattern detected: \${pattern.name}\`,
      threat.events[0]?.user_id,
      threat.events[0]?.ip_address,
      {
        pattern_id: pattern.id,
        pattern_name: pattern.name,
        event_count: threat.count,
        threshold: pattern.pattern.threshold_count,
        time_window: pattern.pattern.time_window_minutes
      }
    );

    // Send alert if high severity
    if (pattern.severity === 'high' || pattern.severity === 'critical') {
      alertSystem.processAlert('threat_detected', {
        pattern: pattern.name,
        severity: pattern.severity,
        source: threat.source,
        count: threat.count,
        events: threat.events.slice(0, 5) // Limit event details
      });
    }
  }

  private updateThreatScore(source: string, severity: string, factor: string): void {
    const scoreIncrements = {
      low: 1,
      medium: 5,
      high: 15,
      critical: 30
    };

    const increment = scoreIncrements[severity as keyof typeof scoreIncrements] || 1;
    
    const existing = this.threatScores.get(source);
    
    if (existing) {
      existing.score += increment;
      existing.factors.push(factor);
      existing.last_updated = new Date().toISOString();
      existing.risk_level = this.calculateRiskLevel(existing.score);
    } else {
      this.threatScores.set(source, {
        ip_address: source,
        score: increment,
        risk_level: this.calculateRiskLevel(increment),
        factors: [factor],
        last_updated: new Date().toISOString()
      });
    }
  }

  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 50) return 'critical';
    if (score >= 20) return 'high';
    if (score >= 10) return 'medium';
    return 'low';
  }

  private async comprehensiveThreatAnalysis(): Promise<void> {
    // Analyze trends and patterns over longer time periods
    const stats = await securityMonitor.getSecurityStats();
    
    // Check for unusual activity spikes
    if (stats.critical_events > 5) {
      await logSuspiciousActivity(
        'High number of critical security events',
        undefined,
        undefined,
        { critical_events_count: stats.critical_events, analysis_type: 'comprehensive' }
      );
    }

    // Decay threat scores over time
    this.decayThreatScores();
  }

  private decayThreatScores(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const [source, score] of this.threatScores) {
      const lastUpdated = new Date(score.last_updated);
      
      if (lastUpdated < oneHourAgo) {
        // Decay score by 10% per hour
        score.score = Math.max(0, score.score * 0.9);
        score.risk_level = this.calculateRiskLevel(score.score);
        
        if (score.score < 1) {
          this.threatScores.delete(source);
        }
      }
    }
  }

  // Public API
  public addPattern(pattern: ThreatPattern): void {
    this.patterns.push(pattern);
  }

  public getPatterns(): ThreatPattern[] {
    return this.patterns;
  }

  public getThreatScores(): ThreatScore[] {
    return Array.from(this.threatScores.values());
  }

  public getThreatScore(source: string): ThreatScore | null {
    return this.threatScores.get(source) || null;
  }

  public enablePattern(patternId: string): void {
    const pattern = this.patterns.find(p => p.id === patternId);
    if (pattern) {
      pattern.enabled = true;
    }
  }

  public disablePattern(patternId: string): void {
    const pattern = this.patterns.find(p => p.id === patternId);
    if (pattern) {
      pattern.enabled = false;
    }
  }
}

export const threatDetection = new ThreatDetectionEngine();`;

    fs.writeFileSync('lib/threat-detection.ts', threatDetectionContent);
    success('Threat detection system created');
  }

  async createSecurityDashboard() {
    info('Step 4: Creating Security Dashboard');
    
    const securityDashboardContent = `/**
 * Security Dashboard Component
 * Real-time security monitoring dashboard for admin panel
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Eye, 
  Clock,
  MapPin,
  User,
  Server
} from 'lucide-react';

interface SecurityStats {
  total_events: number;
  unresolved_events: number;
  critical_events: number;
  events_by_type: Record<string, number>;
  events_by_severity: Record<string, number>;
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  ip_address?: string;
  path?: string;
  details: Record<string, any>;
  resolved: boolean;
}

interface ThreatScore {
  ip_address: string;
  user_id?: string;
  score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  last_updated: string;
}

export default function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [threatScores, setThreatScores] = useState<ThreatScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
    const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      const [statsRes, eventsRes, threatsRes] = await Promise.all([
        fetch('/api/admin/security/stats'),
        fetch('/api/admin/security/events?limit=20'),
        fetch('/api/admin/security/threats')
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      if (eventsRes.ok) {
        setRecentEvents(await eventsRes.json());
      }

      if (threatsRes.ok) {
        setThreatScores(await threatsRes.json());
      }
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRiskColor = (riskLevel: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[riskLevel as keyof typeof colors] || 'text-gray-600';
  };

  const formatEventType = (eventType: string) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const resolveEvent = async (eventId: string) => {
    try {
      const response = await fetch(\`/api/admin/security/events/\${eventId}/resolve\`, {
        method: 'POST'
      });

      if (response.ok) {
        setRecentEvents(events => 
          events.map(event => 
            event.id === eventId ? { ...event, resolved: true } : event
          )
        );
      }
    } catch (error) {
      console.error('Failed to resolve event:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-gray-600">Real-time security monitoring and threat detection</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-600">System Protected</span>
        </div>
      </div>

      {/* Critical Alerts */}
      {stats && stats.critical_events > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{stats.critical_events} critical security events</strong> require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_events || 0}</div>
            <p className="text-xs text-muted-foreground">Security events logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.unresolved_events || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.critical_events || 0}</div>
            <p className="text-xs text-muted-foreground">High priority incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threat Sources</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threatScores.length}</div>
            <p className="text-xs text-muted-foreground">Active threat sources</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="threats">Threat Analysis</TabsTrigger>
          <TabsTrigger value="patterns">Detection Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Latest security events requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent security events</p>
                ) : (
                  recentEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{formatEventType(event.event_type)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {event.ip_address && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{event.ip_address}</span>
                          </div>
                        )}
                        {event.user_id && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{event.user_id.substring(0, 8)}...</span>
                          </div>
                        )}
                        {event.path && (
                          <div className="flex items-center space-x-1">
                            <span>{event.path}</span>
                          </div>
                        )}
                      </div>

                      {!event.resolved && (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveEvent(event.id)}
                          >
                            Mark Resolved
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Analysis</CardTitle>
              <CardDescription>Active threat sources and risk scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threatScores.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active threats detected</p>
                ) : (
                  threatScores.map((threat, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{threat.ip_address}</span>
                          <Badge className={getRiskColor(threat.risk_level)}>
                            {threat.risk_level.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Score: <span className="font-medium">{threat.score}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <strong>Threat Factors:</strong> {threat.factors.join(', ')}
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        Last Updated: {new Date(threat.last_updated).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detection Patterns</CardTitle>
              <CardDescription>Active threat detection patterns and rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  Detection patterns configuration will be loaded here
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}`;

    if (!fs.existsSync('components/admin')) {
      fs.mkdirSync('components/admin', { recursive: true });
    }
    fs.writeFileSync('components/admin/SecurityDashboard.tsx', securityDashboardContent);
    success('Security dashboard component created');
  }

  async createMonitoringAPI() {
    info('Step 5: Creating Monitoring API');
    
    // Create API routes directory if it doesn't exist
    const apiDir = 'app/api/admin/security';
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }

    // Stats API
    const statsApiContent = `import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor } from '@/lib/security-monitor';

export async function GET(request: NextRequest) {
  try {
    const stats = await securityMonitor.getSecurityStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch security stats' },
      { status: 500 }
    );
  }
}`;

    // Events API
    const eventsApiContent = `import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor } from '@/lib/security-monitor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const eventType = searchParams.get('event_type') || undefined;
    const severity = searchParams.get('severity') || undefined;

    const events = await securityMonitor.getSecurityEvents({
      limit,
      event_type: eventType,
      severity: severity,
      resolved: false
    });

    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch security events' },
      { status: 500 }
    );
  }
}`;

    // Threats API
    const threatsApiContent = `import { NextRequest, NextResponse } from 'next/server';
import { threatDetection } from '@/lib/threat-detection';

export async function GET(request: NextRequest) {
  try {
    const threatScores = threatDetection.getThreatScores();
    
    // Sort by risk level and score
    const sorted = threatScores.sort((a, b) => {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aRisk = riskOrder[a.risk_level as keyof typeof riskOrder] || 0;
      const bRisk = riskOrder[b.risk_level as keyof typeof riskOrder] || 0;
      
      if (aRisk !== bRisk) return bRisk - aRisk;
      return b.score - a.score;
    });

    return NextResponse.json(sorted);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch threat scores' },
      { status: 500 }
    );
  }
}`;

    fs.writeFileSync(`${apiDir}/stats/route.ts`, statsApiContent);
    fs.writeFileSync(`${apiDir}/events/route.ts`, eventsApiContent);
    fs.writeFileSync(`${apiDir}/threats/route.ts`, threatsApiContent);

    success('Monitoring API endpoints created');
  }

  async createSecurityReports() {
    info('Step 6: Creating Security Reports');
    
    const securityReportsContent = `/**
 * Security Reports Generator
 * Automated security report generation and scheduling
 */

import { securityMonitor } from './security-monitor';
import { threatDetection } from './threat-detection';

export interface SecurityReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'incident';
  period: {
    start: string;
    end: string;
  };
  summary: {
    total_events: number;
    critical_events: number;
    resolved_events: number;
    new_threats: number;
    top_threat_sources: string[];
  };
  sections: ReportSection[];
  generated_at: string;
}

export interface ReportSection {
  title: string;
  type: 'summary' | 'chart' | 'table' | 'timeline';
  data: any;
}

class SecurityReportsGenerator {
  
  async generateDailyReport(): Promise<SecurityReport> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const events = await securityMonitor.getSecurityEvents({
      time_range: {
        start: yesterday.toISOString(),
        end: now.toISOString()
      }
    });

    const stats = await securityMonitor.getSecurityStats();
    const threats = threatDetection.getThreatScores();

    return {
      id: \`daily-\${now.toISOString().split('T')[0]}\`,
      type: 'daily',
      period: {
        start: yesterday.toISOString(),
        end: now.toISOString()
      },
      summary: {
        total_events: events.length,
        critical_events: events.filter(e => e.severity === 'critical').length,
        resolved_events: events.filter(e => e.resolved).length,
        new_threats: threats.length,
        top_threat_sources: threats
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map(t => t.ip_address)
      },
      sections: [
        {
          title: 'Security Events Overview',
          type: 'summary',
          data: this.generateEventsSummary(events)
        },
        {
          title: 'Critical Events Timeline',
          type: 'timeline',
          data: events
            .filter(e => e.severity === 'critical')
            .map(e => ({
              timestamp: e.timestamp,
              event_type: e.event_type,
              ip_address: e.ip_address,
              details: e.details
            }))
        },
        {
          title: 'Threat Analysis',
          type: 'table',
          data: {
            headers: ['IP Address', 'Risk Level', 'Score', 'Factors'],
            rows: threats.map(t => [
              t.ip_address,
              t.risk_level,
              t.score,
              t.factors.join(', ')
            ])
          }
        }
      ],
      generated_at: now.toISOString()
    };
  }

  async generateWeeklyReport(): Promise<SecurityReport> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Similar structure to daily report but with weekly data
    const events = await securityMonitor.getSecurityEvents({
      time_range: {
        start: oneWeekAgo.toISOString(),
        end: now.toISOString()
      }
    });

    return {
      id: \`weekly-\${now.toISOString().split('T')[0]}\`,
      type: 'weekly',
      period: {
        start: oneWeekAgo.toISOString(),
        end: now.toISOString()
      },
      summary: {
        total_events: events.length,
        critical_events: events.filter(e => e.severity === 'critical').length,
        resolved_events: events.filter(e => e.resolved).length,
        new_threats: 0, // Calculate new threats for the week
        top_threat_sources: []
      },
      sections: [
        {
          title: 'Weekly Security Trends',
          type: 'chart',
          data: this.generateWeeklyTrends(events)
        },
        {
          title: 'Security Events by Day',
          type: 'chart',
          data: this.generateDailyBreakdown(events)
        }
      ],
      generated_at: now.toISOString()
    };
  }

  async generateIncidentReport(incidentId: string): Promise<SecurityReport> {
    // Generate detailed incident report
    const events = await securityMonitor.getSecurityEvents({
      // Filter by incident-related events
    });

    return {
      id: \`incident-\${incidentId}\`,
      type: 'incident',
      period: {
        start: events[0]?.timestamp || '',
        end: events[events.length - 1]?.timestamp || ''
      },
      summary: {
        total_events: events.length,
        critical_events: events.filter(e => e.severity === 'critical').length,
        resolved_events: events.filter(e => e.resolved).length,
        new_threats: 0,
        top_threat_sources: []
      },
      sections: [
        {
          title: 'Incident Timeline',
          type: 'timeline',
          data: events.map(e => ({
            timestamp: e.timestamp,
            event_type: e.event_type,
            severity: e.severity,
            description: \`\${e.event_type} from \${e.ip_address}\`
          }))
        },
        {
          title: 'Impact Analysis',
          type: 'summary',
          data: {
            affected_users: new Set(events.map(e => e.user_id).filter(Boolean)).size,
            affected_ips: new Set(events.map(e => e.ip_address).filter(Boolean)).size,
            duration: 'TBD', // Calculate incident duration
            resolution_status: 'In Progress'
          }
        }
      ],
      generated_at: new Date().toISOString()
    };
  }

  private generateEventsSummary(events: any[]): any {
    const eventTypes = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    const severityBreakdown = events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      total: events.length,
      by_type: eventTypes,
      by_severity: severityBreakdown,
      resolution_rate: events.filter(e => e.resolved).length / events.length
    };
  }

  private generateWeeklyTrends(events: any[]): any {
    // Generate trend data for charts
    const dailyCounts = {};
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyCounts[dateStr] = 0;
    }

    events.forEach(event => {
      const dateStr = event.timestamp.split('T')[0];
      if (dailyCounts.hasOwnProperty(dateStr)) {
        dailyCounts[dateStr]++;
      }
    });

    return {
      labels: Object.keys(dailyCounts),
      data: Object.values(dailyCounts)
    };
  }

  private generateDailyBreakdown(events: any[]): any {
    const hourlyBreakdown = Array(24).fill(0);
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourlyBreakdown[hour]++;
    });

    return {
      labels: Array.from({length: 24}, (_, i) => \`\${i}:00\`),
      data: hourlyBreakdown
    };
  }

  async scheduleReports(): Promise<void> {
    // In a real implementation, you'd integrate with a job scheduler
    // For now, we'll provide the structure for scheduling

    console.log('Setting up scheduled security reports...');
    
    // Daily reports at 6 AM
    // Weekly reports on Mondays at 7 AM  
    // Monthly reports on 1st of month at 8 AM
  }

  async emailReport(report: SecurityReport, recipients: string[]): Promise<void> {
    // Email the report to specified recipients
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = this.generateReportHTML(report);

    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: recipients,
      subject: \`Security Report - \${report.type.charAt(0).toUpperCase() + report.type.slice(1)}\`,
      html
    });
  }

  private generateReportHTML(report: SecurityReport): string {
    return \`
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
            .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
            .stat-card { background: white; padding: 15px; border: 1px solid #dee2e6; border-radius: 4px; }
            .section { margin-bottom: 30px; }
            .critical { color: #dc3545; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Security Report - \${report.type.charAt(0).toUpperCase() + report.type.slice(1)}</h1>
            <p>Period: \${new Date(report.period.start).toLocaleDateString()} - \${new Date(report.period.end).toLocaleDateString()}</p>
            <p>Generated: \${new Date(report.generated_at).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="stat-card">
                <h3>Total Events</h3>
                <div style="font-size: 2em; font-weight: bold;">\${report.summary.total_events}</div>
            </div>
            <div class="stat-card">
                <h3>Critical Events</h3>
                <div style="font-size: 2em; font-weight: bold;" class="critical">\${report.summary.critical_events}</div>
            </div>
            <div class="stat-card">
                <h3>Resolved Events</h3>
                <div style="font-size: 2em; font-weight: bold;">\${report.summary.resolved_events}</div>
            </div>
            <div class="stat-card">
                <h3>Active Threats</h3>
                <div style="font-size: 2em; font-weight: bold;">\${report.summary.new_threats}</div>
            </div>
        </div>

        \${report.sections.map(section => \`
        <div class="section">
            <h2>\${section.title}</h2>
            <pre>\${JSON.stringify(section.data, null, 2)}</pre>
        </div>
        \`).join('')}
    </body>
    </html>
    \`;
  }
}

export const securityReports = new SecurityReportsGenerator();`;

    fs.writeFileSync('lib/security-reports.ts', securityReportsContent);
    success('Security reports generator created');
  }

  async generateConfiguration() {
    info('Step 7: Generating Configuration Files');
    
    // Database migration for security tables
    const securityMigrationContent = `-- Security Monitoring Tables
-- Run this SQL in your Supabase SQL Editor

-- Security events table
CREATE TABLE IF NOT EXISTS security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  user_agent TEXT,
  path TEXT,
  details JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard alerts table
CREATE TABLE IF NOT EXISTS dashboard_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security reports table
CREATE TABLE IF NOT EXISTS security_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id TEXT UNIQUE NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'incident')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  report_data JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  emailed_at TIMESTAMPTZ,
  email_recipients TEXT[]
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);

CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_created ON dashboard_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_severity ON dashboard_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_acknowledged ON dashboard_alerts(acknowledged);

-- Row Level Security
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_reports ENABLE ROW LEVEL SECURITY;

-- Policies for admin access only
CREATE POLICY "Admins can manage security events" ON security_events
FOR ALL TO authenticated
USING (auth.uid() IN (
  SELECT unnest(string_to_array(current_setting('app.admin_users', true), ','))::uuid
));

CREATE POLICY "Admins can manage dashboard alerts" ON dashboard_alerts
FOR ALL TO authenticated  
USING (auth.uid() IN (
  SELECT unnest(string_to_array(current_setting('app.admin_users', true), ','))::uuid
));

CREATE POLICY "Admins can view security reports" ON security_reports
FOR SELECT TO authenticated
USING (auth.uid() IN (
  SELECT unnest(string_to_array(current_setting('app.admin_users', true), ','))::uuid
));

-- Functions for cleanup
CREATE OR REPLACE FUNCTION cleanup_old_security_events() 
RETURNS void AS $$
BEGIN
  -- Delete security events older than 6 months
  DELETE FROM security_events 
  WHERE timestamp < NOW() - INTERVAL '6 months';
  
  -- Delete resolved events older than 3 months
  DELETE FROM security_events 
  WHERE resolved = true AND resolved_at < NOW() - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-security-events', '0 2 * * 0', 'SELECT cleanup_old_security_events();');`;

    // Configuration file
    const configContent = `# Security Monitoring Configuration

## Environment Variables
Add these to your .env.local or deployment environment:

\`\`\`bash
# Security Monitoring
ADMIN_ALERT_EMAIL="admin@your-domain.com"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" # Optional
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR/WEBHOOK" # Optional

# Email configuration (already configured)
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@your-domain.com"

# Admin users (already configured)  
ADMIN_USER_IDS="uuid1,uuid2,uuid3"
SUPER_ADMIN_USER_IDS="uuid1"
\`\`\`

## Integration Steps

1. **Database Setup**
   \`\`\`sql
   -- Run the SQL migration in Supabase SQL Editor
   -- File: scripts/security-migration.sql
   \`\`\`

2. **Add Security Dashboard to Admin Panel**
   \`\`\`tsx
   // In your admin layout or routing
   import SecurityDashboard from '@/components/admin/SecurityDashboard';
   
   // Add route for /admin/security
   <Route path="/security" component={SecurityDashboard} />
   \`\`\`

3. **Integrate Security Monitoring**
   \`\`\`typescript
   // In your middleware.ts
   import { logAdminLogin, logUnauthorizedAccess } from '@/lib/security-monitor';
   
   // Log security events
   await logAdminLogin(user.id, true, request.ip);
   await logUnauthorizedAccess('/admin/users', user?.id, request.ip);
   \`\`\`

4. **Start Alert System**
   \`\`\`typescript
   // In your app startup
   import { alertSystem } from '@/lib/alert-system';
   import { threatDetection } from '@/lib/threat-detection';
   
   // Systems start automatically when imported
   \`\`\`

## Alert Channels

### Email Alerts
- Automatic email alerts for critical events
- Daily/weekly security reports
- Incident notifications

### Slack Integration (Optional)
- Real-time security alerts in Slack
- Threat detection notifications
- Custom webhook format

### Discord Integration (Optional)  
- Security alerts with Discord embeds
- Rich formatting for threat data
- Channel-specific notifications

### Dashboard Alerts
- Real-time dashboard notifications
- Interactive alert management
- Acknowledgment and resolution tracking

## Threat Detection Patterns

The system includes pre-configured patterns for:

- **Brute Force Attacks**: Multiple failed login attempts
- **Privilege Escalation**: Unauthorized access attempts
- **Account Enumeration**: Systematic user probing
- **Geographic Anomalies**: Unusual access locations
- **API Abuse**: Suspicious API access patterns

## Monitoring Best Practices

1. **Regular Review**: Check security dashboard daily
2. **Alert Response**: Respond to critical alerts within 1 hour
3. **Pattern Updates**: Review and update threat patterns monthly
4. **Report Analysis**: Analyze weekly security reports
5. **Incident Documentation**: Document and learn from incidents

## Maintenance

- **Log Cleanup**: Automated cleanup after 6 months
- **Report Archival**: Archive old reports quarterly  
- **Pattern Tuning**: Adjust detection thresholds based on false positives
- **Alert Fatigue**: Monitor alert frequency and adjust rules

## Testing

Test the system with controlled security events:

\`\`\`bash
# Run security tests
node scripts/security-tests.js

# Generate test events
curl -X POST /api/admin/security/test-event \\
  -H "Content-Type: application/json" \\
  -d '{"type": "admin_login_attempt", "severity": "high"}'
\`\`\``;

    fs.writeFileSync('scripts/security-migration.sql', securityMigrationContent);
    fs.writeFileSync('SECURITY_MONITORING_CONFIG.md', configContent);
    
    success('Configuration files generated');
  }
}

// Main execution
async function main() {
  const setup = new SecurityMonitoringSetup();
  await setup.setup();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SecurityMonitoringSetup;
