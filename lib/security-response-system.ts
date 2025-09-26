/**
 * Automated Security Response System
 * Implements automated responses to security threats including IP blocking,
 * account lockouts, and escalation procedures for critical security events
 */

import { securityMonitor, SecurityEventType, SecuritySeverity, SecurityEvent } from './security-monitor';
import { sendMultiChannelAlert, formatSecurityEventForNotification } from './notification-service';
import { createAdminSupabaseClient } from './admin-middleware';

export interface ResponseRule {
  id: string;
  name: string;
  eventType: SecurityEventType;
  conditions: ResponseCondition[];
  actions: ResponseAction[];
  enabled: boolean;
  priority: number;
  cooldownMinutes: number;
  maxExecutionsPerHour: number;
}

export interface ResponseCondition {
  type: 'threshold' | 'severity' | 'ip_reputation' | 'user_pattern' | 'geographic' | 'timing';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'matches_pattern';
  value: any;
  timeWindowMinutes?: number;
}

export interface ResponseAction {
  type: 'block_ip' | 'lock_account' | 'alert' | 'escalate' | 'isolate_session' | 'require_2fa' | 'log_incident';
  parameters: Record<string, any>;
  executeImmediately: boolean;
  requireApproval: boolean;
}

export interface EscalationLevel {
  level: number;
  name: string;
  triggerConditions: string[];
  notifications: {
    channels: ('email' | 'webhook' | 'sms')[];
    recipients: string[];
    template: string;
  };
  autoActions: ResponseAction[];
  requiresHumanIntervention: boolean;
  timeoutMinutes: number;
}

export class SecurityResponseSystem {
  private supabasePromise = createAdminSupabaseClient();
  private responseRules: ResponseRule[] = [];
  private escalationLevels: EscalationLevel[] = [];
  private actionExecutionCount: Map<string, number> = new Map();
  private lastExecutionTime: Map<string, number> = new Map();
  
  private async getSupabase() {
    return await this.supabasePromise;
  }

  constructor() {
    this.initializeDefaultRules();
    this.initializeEscalationLevels();
    this.startCleanupTimer();
  }

  /**
   * Process a security event and execute appropriate automated responses
   */
  async processSecurityEvent(event: {
    id: string;
    eventType: SecurityEventType;
    severity: SecuritySeverity;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    eventData: Record<string, any>;
    description: string;
  }): Promise<void> {
    try {
      console.log(`Processing security event: ${event.eventType} (${event.severity})`);

      // Find matching response rules
      const matchingRules = await this.findMatchingRules(event);
      
      // Execute actions for each matching rule
      for (const rule of matchingRules) {
        if (await this.shouldExecuteRule(rule, event)) {
          await this.executeRule(rule, event);
        }
      }

      // Check for escalation triggers
      await this.checkEscalationTriggers(event);

    } catch (error) {
      console.error('Error processing security event:', error);
      
      // Log the error as a security event
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await securityMonitor.logSecurityEvent({
        eventType: SecurityEventType.SYSTEM_MANIPULATION,
        severity: SecuritySeverity.HIGH,
        description: `Security response system error: ${errorMessage}`,
        eventData: { error: errorMessage, originalEvent: event }
      });
    }
  }

  /**
   * Manually trigger emergency response procedures
   */
  async triggerEmergencyResponse(
    eventType: SecurityEventType,
    severity: SecuritySeverity,
    description: string,
    userId?: string,
    ipAddress?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    const emergencyEventData: Omit<SecurityEvent, 'id' | 'createdAt'> = {
      eventType,
      severity,
      description: `EMERGENCY: ${description}`,
      userAgent: 'Security Response System',
      eventData: { ...additionalData, emergency: true, triggeredAt: new Date().toISOString() }
    };
    
    if (userId !== undefined) {
      emergencyEventData.userId = userId;
    }
    
    if (ipAddress !== undefined) {
      emergencyEventData.ipAddress = ipAddress;
    }
    
    const emergencyEvent = {
      id: `emergency-${Date.now()}`,
      ...emergencyEventData
    };

    // Log the emergency event
    await securityMonitor.logSecurityEvent(emergencyEventData);

    // Process with highest priority
    await this.processSecurityEvent(emergencyEvent);

    // Force escalation to highest level
    await this.escalateToLevel(this.escalationLevels.length - 1, emergencyEvent);
  }

  /**
   * Block IP address with automated response
   */
  async executeIPBlock(
    ipAddress: string,
    reason: string,
    duration: number,
    blockType: 'temporary' | 'permanent' = 'temporary'
  ): Promise<void> {
    try {
      // Block the IP
      await securityMonitor.blockIP(ipAddress, blockType, reason, duration);

      // Check for related IPs to block (same subnet, etc.)
      await this.checkRelatedIPs(ipAddress, reason);

      // Notify administrators
      await this.sendBlockNotification(ipAddress, reason, blockType, duration);

    } catch (error) {
      console.error('Error executing IP block:', error);
    }
  }

  /**
   * Lock user account with automated response
   */
  async executeAccountLock(
    userId: string,
    reason: string,
    duration?: number
  ): Promise<void> {
    try {
      // Suspend the user account
      const supabase = await this.getSupabase();
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'suspended',
          suspended_at: new Date().toISOString(),
          suspended_reason: reason,
          suspended_until: duration ? new Date(Date.now() + duration * 60 * 1000).toISOString() : null
        })
        .eq('id', userId);

      if (error) throw error;

      // Invalidate all user sessions
      await this.invalidateUserSessions(userId);

      // Log the account lock
      await securityMonitor.logSecurityEvent({
        eventType: SecurityEventType.ACCOUNT_LOCKED,
        severity: SecuritySeverity.HIGH,
        userId,
        description: `Account locked: ${reason}`,
        eventData: { reason, duration, lockedAt: new Date().toISOString() }
      });

      // Notify the user and administrators
      await this.sendAccountLockNotification(userId, reason);

    } catch (error) {
      console.error('Error executing account lock:', error);
    }
  }

  /**
   * Execute session isolation
   */
  async executeSessionIsolation(
    userId: string,
    sessionId: string,
    reason: string
  ): Promise<void> {
    try {
      // Invalidate the specific session
      await this.invalidateSession(sessionId);

      // Require re-authentication with additional verification
      await this.requireEnhancedAuth(userId);

      // Log the isolation
      await securityMonitor.logSecurityEvent({
        eventType: SecurityEventType.SESSION_HIJACK_ATTEMPT,
        severity: SecuritySeverity.HIGH,
        userId,
        description: `Session isolated: ${reason}`,
        eventData: { sessionId, reason, isolatedAt: new Date().toISOString() }
      });

    } catch (error) {
      console.error('Error executing session isolation:', error);
    }
  }

  /**
   * Create incident report for critical events
   */
  async createIncidentReport(event: any): Promise<string> {
    const incidentId = `incident-${Date.now()}`;
    
    const incident = {
      id: incidentId,
      event_id: event.id,
      severity: event.severity,
      status: 'open',
      created_at: new Date().toISOString(),
      description: event.description,
      event_data: event.eventData,
      response_actions: [],
      escalation_level: 0
    };

    // Store incident in database
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('security_incidents')
      .insert(incident);

    if (error) {
      console.error('Error creating incident report:', error);
      throw error;
    }

    return incidentId;
  }

  // Private helper methods

  private async findMatchingRules(event: any): Promise<ResponseRule[]> {
    return this.responseRules.filter(rule => {
      if (!rule.enabled) return false;
      if (rule.eventType !== event.eventType) return false;

      // Check all conditions
      return rule.conditions.every(condition => 
        this.evaluateCondition(condition, event)
      );
    }).sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)
  }

  private evaluateCondition(condition: ResponseCondition, event: any): boolean {
    switch (condition.type) {
      case 'severity':
        const severityLevels: Record<string, number> = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
        const eventLevel = severityLevels[event.severity] || 0;
        const conditionLevel = severityLevels[condition.value] || 0;
        
        switch (condition.operator) {
          case 'equals': return eventLevel === conditionLevel;
          case 'greater_than': return eventLevel > conditionLevel;
          case 'less_than': return eventLevel < conditionLevel;
        }
        break;

      case 'threshold':
        // This would check event counts in time windows
        // Implementation depends on the specific threshold logic
        return this.checkThreshold(condition, event);

      case 'ip_reputation':
        return this.checkIPReputation(condition, event.ipAddress);

      case 'user_pattern':
        return this.checkUserPattern(condition, event.userId, event);

      case 'geographic':
        return this.checkGeographic(condition, event.ipAddress);

      case 'timing':
        return this.checkTiming(condition, event);

      default:
        return false;
    }

    return false;
  }

  private async shouldExecuteRule(rule: ResponseRule, event: any): Promise<boolean> {
    const ruleKey = `${rule.id}-${event.eventType}`;
    
    // Check cooldown
    const lastExecution = this.lastExecutionTime.get(ruleKey) || 0;
    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    
    if (Date.now() - lastExecution < cooldownMs) {
      return false;
    }

    // Check execution limits
    const executionCount = this.actionExecutionCount.get(ruleKey) || 0;
    if (executionCount >= rule.maxExecutionsPerHour) {
      return false;
    }

    return true;
  }

  private async executeRule(rule: ResponseRule, event: any): Promise<void> {
    const ruleKey = `${rule.id}-${event.eventType}`;
    
    console.log(`Executing rule: ${rule.name} for event: ${event.eventType}`);

    // Update execution tracking
    this.lastExecutionTime.set(ruleKey, Date.now());
    this.actionExecutionCount.set(ruleKey, (this.actionExecutionCount.get(ruleKey) || 0) + 1);

    // Execute actions
    for (const action of rule.actions) {
      try {
        if (action.requireApproval && !event.eventData['emergency']) {
          // Queue for approval instead of executing immediately
          await this.queueForApproval(action, event, rule);
          continue;
        }

        await this.executeAction(action, event, rule);
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
      }
    }
  }

  private async executeAction(action: ResponseAction, event: any, rule: ResponseRule): Promise<void> {
    switch (action.type) {
      case 'block_ip':
        if (event.ipAddress) {
          await this.executeIPBlock(
            event.ipAddress,
            action.parameters['reason'] || `Automated block due to: ${event.description}`,
            action.parameters['duration'] || 60,
            action.parameters['blockType'] || 'temporary'
          );
        }
        break;

      case 'lock_account':
        if (event.userId) {
          await this.executeAccountLock(
            event.userId,
            action.parameters['reason'] || `Automated lock due to: ${event.description}`,
            action.parameters['duration']
          );
        }
        break;

      case 'isolate_session':
        if (event.userId && event.eventData['sessionId']) {
          await this.executeSessionIsolation(
            event.userId,
            event.eventData['sessionId'],
            action.parameters['reason'] || `Session isolation due to: ${event.description}`
          );
        }
        break;

      case 'alert':
        await this.sendSecurityAlert(event, action.parameters);
        break;

      case 'escalate':
        await this.escalateToLevel(action.parameters['level'] || 1, event);
        break;

      case 'log_incident':
        await this.createIncidentReport(event);
        break;

      case 'require_2fa':
        if (event.userId) {
          await this.requireTwoFactorAuth(event.userId);
        }
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  private async checkEscalationTriggers(event: any): Promise<void> {
    for (let i = 0; i < this.escalationLevels.length; i++) {
      const level = this.escalationLevels[i];
      
      if (!level) continue;
      
      const shouldEscalate = level.triggerConditions.some(condition => {
        // Evaluate escalation conditions
        return this.evaluateEscalationCondition(condition, event);
      });

      if (shouldEscalate) {
        await this.escalateToLevel(i, event);
        break; // Only escalate to the first matching level
      }
    }
  }

  private evaluateEscalationCondition(condition: string, event: any): boolean {
    switch (condition) {
      case 'critical_severity':
        return event.severity === 'critical';
      case 'privilege_escalation':
        return event.eventType === SecurityEventType.PRIVILEGE_ESCALATION;
      case 'data_breach_attempt':
        return event.eventType === SecurityEventType.DATA_BREACH_ATTEMPT;
      case 'multiple_admin_failures':
        return event.eventType === SecurityEventType.FAILED_LOGIN && event.eventData['attempt_count'] > 3;
      case 'sql_injection':
        return event.eventType === SecurityEventType.SQL_INJECTION_ATTEMPT;
      default:
        return false;
    }
  }

  private async escalateToLevel(levelIndex: number, event: any): Promise<void> {
    if (levelIndex >= this.escalationLevels.length) {
      levelIndex = this.escalationLevels.length - 1;
    }

    const level = this.escalationLevels[levelIndex];
    
    if (!level) {
      console.error('Escalation level not found:', levelIndex);
      return;
    }
    
    console.log(`Escalating to level ${level.level}: ${level.name}`);

    // Send escalation notifications
    const notification = formatSecurityEventForNotification({
      eventType: event.eventType,
      severity: event.severity,
      description: `ESCALATED (Level ${level.level}): ${event.description}`,
      ipAddress: event.ipAddress,
      userId: event.userId,
      eventData: event.eventData
    });

    const channels: any = {};

    if (level.notifications.channels.includes('email')) {
      channels.email = {
        to: level.notifications.recipients.join(','),
        subject: `ESCALATION Level ${level.level}: ${notification.subject}`,
        body: notification.body
      };
    }

    if (level.notifications.channels.includes('webhook')) {
      channels.webhook = {
        url: process.env['ESCALATION_WEBHOOK_URL'],
        payload: {
          ...notification.webhookPayload,
          escalation_level: level.level,
          escalation_name: level.name,
          requires_human_intervention: level.requiresHumanIntervention
        }
      };
    }

    if (level.notifications.channels.includes('sms')) {
      for (const recipient of level.notifications.recipients) {
        if (recipient.includes('+') || recipient.match(/^\d+$/)) {
          channels.sms = { to: recipient, message: notification.smsMessage };
          break;
        }
      }
    }

    await sendMultiChannelAlert(channels);

    // Execute auto actions
    for (const action of level.autoActions) {
      await this.executeAction(action, event, { name: `Escalation Level ${level.level}` } as ResponseRule);
    }

    // Update incident with escalation
    await this.updateIncidentEscalation(event.id, levelIndex);
  }

  private initializeDefaultRules(): void {
    this.responseRules = [
      {
        id: 'brute-force-ip-block',
        name: 'Brute Force IP Block',
        eventType: SecurityEventType.BRUTE_FORCE_ATTEMPT,
        conditions: [
          { type: 'threshold', operator: 'greater_than', value: 5, timeWindowMinutes: 15 }
        ],
        actions: [
          {
            type: 'block_ip',
            parameters: { duration: 60, blockType: 'temporary', reason: 'Brute force attempt detected' },
            executeImmediately: true,
            requireApproval: false
          }
        ],
        enabled: true,
        priority: 100,
        cooldownMinutes: 5,
        maxExecutionsPerHour: 10
      },
      {
        id: 'critical-event-escalation',
        name: 'Critical Event Escalation',
        eventType: SecurityEventType.PRIVILEGE_ESCALATION,
        conditions: [
          { type: 'severity', operator: 'equals', value: 'critical' }
        ],
        actions: [
          {
            type: 'escalate',
            parameters: { level: 2 },
            executeImmediately: true,
            requireApproval: false
          },
          {
            type: 'log_incident',
            parameters: {},
            executeImmediately: true,
            requireApproval: false
          }
        ],
        enabled: true,
        priority: 200,
        cooldownMinutes: 1,
        maxExecutionsPerHour: 5
      },
      {
        id: 'sql-injection-block',
        name: 'SQL Injection Auto Block',
        eventType: SecurityEventType.SQL_INJECTION_ATTEMPT,
        conditions: [
          { type: 'severity', operator: 'greater_than', value: 'medium' }
        ],
        actions: [
          {
            type: 'block_ip',
            parameters: { duration: 1440, blockType: 'temporary', reason: 'SQL injection attempt' },
            executeImmediately: true,
            requireApproval: false
          },
          {
            type: 'escalate',
            parameters: { level: 1 },
            executeImmediately: true,
            requireApproval: false
          }
        ],
        enabled: true,
        priority: 150,
        cooldownMinutes: 1,
        maxExecutionsPerHour: 3
      }
    ];
  }

  private initializeEscalationLevels(): void {
    this.escalationLevels = [
      {
        level: 1,
        name: 'Security Team Alert',
        triggerConditions: ['multiple_admin_failures', 'suspicious_activity'],
        notifications: {
          channels: ['email'],
          recipients: [process.env['SECURITY_TEAM_EMAIL'] || 'security@yourapp.com'],
          template: 'security_alert'
        },
        autoActions: [],
        requiresHumanIntervention: false,
        timeoutMinutes: 30
      },
      {
        level: 2,
        name: 'Critical Security Incident',
        triggerConditions: ['critical_severity', 'privilege_escalation', 'sql_injection'],
        notifications: {
          channels: ['email', 'webhook', 'sms'],
          recipients: [
            process.env['SECURITY_TEAM_EMAIL'] || 'security@yourapp.com',
            process.env['ADMIN_PHONE'] || '+1234567890'
          ],
          template: 'critical_incident'
        },
        autoActions: [
          {
            type: 'log_incident',
            parameters: {},
            executeImmediately: true,
            requireApproval: false
          }
        ],
        requiresHumanIntervention: true,
        timeoutMinutes: 15
      },
      {
        level: 3,
        name: 'Emergency Response',
        triggerConditions: ['data_breach_attempt'],
        notifications: {
          channels: ['email', 'webhook', 'sms'],
          recipients: [
            process.env['SECURITY_TEAM_EMAIL'] || 'security@yourapp.com',
            process.env['ADMIN_PHONE'] || '+1234567890',
            process.env['EMERGENCY_CONTACT'] || 'emergency@yourapp.com'
          ],
          template: 'emergency_response'
        },
        autoActions: [
          {
            type: 'log_incident',
            parameters: {},
            executeImmediately: true,
            requireApproval: false
          }
        ],
        requiresHumanIntervention: true,
        timeoutMinutes: 5
      }
    ];
  }

  // Additional helper methods would be implemented here...
  
  private checkThreshold(condition: ResponseCondition, event: any): boolean {
    // Implementation for threshold checking
    return true; // Placeholder
  }

  private checkIPReputation(condition: ResponseCondition, ipAddress?: string): boolean {
    // Implementation for IP reputation checking
    return false; // Placeholder
  }

  private checkUserPattern(condition: ResponseCondition, userId?: string, event?: any): boolean {
    // Implementation for user pattern analysis
    return false; // Placeholder
  }

  private checkGeographic(condition: ResponseCondition, ipAddress?: string): boolean {
    // Implementation for geographic checking
    return false; // Placeholder
  }

  private checkTiming(condition: ResponseCondition, event: any): boolean {
    // Implementation for timing analysis
    return false; // Placeholder
  }

  private async checkRelatedIPs(ipAddress: string, reason: string): Promise<void> {
    // Implementation for checking related IPs to block
  }

  private async sendBlockNotification(ipAddress: string, reason: string, blockType: string, duration: number): Promise<void> {
    // Implementation for sending block notifications
  }

  private async sendAccountLockNotification(userId: string, reason: string): Promise<void> {
    // Implementation for sending account lock notifications
  }

  private async invalidateUserSessions(userId: string): Promise<void> {
    // Implementation for invalidating all user sessions
  }

  private async invalidateSession(sessionId: string): Promise<void> {
    // Implementation for invalidating specific session
  }

  private async requireEnhancedAuth(userId: string): Promise<void> {
    // Implementation for requiring enhanced authentication
  }

  private async requireTwoFactorAuth(userId: string): Promise<void> {
    // Implementation for requiring 2FA
  }

  private async queueForApproval(action: ResponseAction, event: any, rule: ResponseRule): Promise<void> {
    // Implementation for queuing actions that require approval
  }

  private async sendSecurityAlert(event: any, parameters: any): Promise<void> {
    // Implementation for sending security alerts
  }

  private async updateIncidentEscalation(eventId: string, escalationLevel: number): Promise<void> {
    // Implementation for updating incident escalation
  }

  private startCleanupTimer(): void {
    // Clean up execution counters every hour
    setInterval(() => {
      this.actionExecutionCount.clear();
    }, 60 * 60 * 1000); // 1 hour
  }
}

// Export singleton instance
export const securityResponseSystem = new SecurityResponseSystem();
