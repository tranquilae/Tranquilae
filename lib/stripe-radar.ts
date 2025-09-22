import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { logPaymentEvent, logSecurityEvent } from './supabase-logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export interface RadarRiskAssessment {
  risk_level: 'low' | 'medium' | 'high' | 'very_high';
  risk_score: number;
  radar_outcome: 'allowed' | 'manual_review' | 'blocked';
  reasons: string[];
  recommendations: string[];
}

export interface FraudCheckResult {
  passed: boolean;
  risk_assessment: RadarRiskAssessment;
  stripe_radar_data?: any;
  additional_checks?: {
    velocity_check: boolean;
    geolocation_check: boolean;
    device_fingerprint: boolean;
  };
}

class StripeRadarService {
  private static instance: StripeRadarService;
  
  public static getInstance(): StripeRadarService {
    if (!StripeRadarService.instance) {
      StripeRadarService.instance = new StripeRadarService();
    }
    return StripeRadarService.instance;
  }

  /**
   * Assess fraud risk for a payment attempt using Stripe Radar
   */
  async assessPaymentRisk(
    paymentIntentId: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<FraudCheckResult> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['charges.data.outcome']
      });

      const charge = paymentIntent.charges.data[0];
      const outcome = charge?.outcome;

      // Extract Stripe Radar risk assessment
      const riskAssessment: RadarRiskAssessment = {
        risk_level: this.mapRadarRiskLevel(outcome?.risk_level),
        risk_score: outcome?.risk_score || 0,
        radar_outcome: this.mapRadarOutcome(outcome?.seller_message),
        reasons: this.extractRiskReasons(outcome),
        recommendations: this.generateRecommendations(outcome)
      };

      // Perform additional fraud checks
      const additionalChecks = await this.performAdditionalFraudChecks(paymentIntent, metadata);

      const result: FraudCheckResult = {
        passed: this.evaluateOverallRisk(riskAssessment, additionalChecks),
        risk_assessment: riskAssessment,
        stripe_radar_data: {
          network_status: outcome?.network_status,
          reason: outcome?.reason,
          seller_message: outcome?.seller_message,
          type: outcome?.type
        },
        additional_checks: additionalChecks
      };

      // Log fraud check results
      await logSecurityEvent({
        event_type: 'SUSPICIOUS_ACTIVITY',
        user_id: userId,
        success: result.passed,
        error: result.passed ? undefined : 'Fraud check failed',
        metadata: {
          payment_intent_id: paymentIntentId,
          risk_level: riskAssessment.risk_level,
          risk_score: riskAssessment.risk_score,
          reasons: riskAssessment.reasons
        }
      });

      // Alert on high-risk transactions
      if (riskAssessment.risk_level === 'high' || riskAssessment.risk_level === 'very_high') {
        Sentry.captureMessage('High-risk payment detected', {
          level: 'warning',
          tags: {
            component: 'fraud-prevention',
            risk_level: riskAssessment.risk_level
          },
          user: { id: userId },
          extra: {
            payment_intent_id: paymentIntentId,
            risk_assessment: riskAssessment,
            additional_checks: additionalChecks
          }
        });
      }

      return result;
    } catch (error) {
      console.error('Error assessing payment risk:', error);
      Sentry.captureException(error, {
        tags: { component: 'stripe-radar', operation: 'assess-risk' },
        user: { id: userId },
        extra: { payment_intent_id: paymentIntentId }
      });

      // Return conservative assessment on error
      return {
        passed: false,
        risk_assessment: {
          risk_level: 'high',
          risk_score: 100,
          radar_outcome: 'manual_review',
          reasons: ['Unable to assess risk due to technical error'],
          recommendations: ['Manual review required']
        }
      };
    }
  }

  /**
   * Configure Stripe Radar rules for Tranquilae-specific fraud prevention
   */
  async configureRadarRules(): Promise<void> {
    try {
      // These are example rules - you would configure these in the Stripe Dashboard
      const recommendedRules = [
        {
          rule: 'Block if :risk_score: > 75',
          description: 'Block transactions with very high risk scores'
        },
        {
          rule: 'Block if :card_country: != :ip_country: and :risk_score: > 50',
          description: 'Block mismatched country transactions with elevated risk'
        },
        {
          rule: 'Manual review if :velocity_attempts: > 3',
          description: 'Manual review for multiple rapid attempts'
        },
        {
          rule: 'Block if :is_disposable_email:',
          description: 'Block disposable email addresses'
        },
        {
          rule: 'Manual review if :amount: > 10000',
          description: 'Review large transactions (>£100)'
        }
      ];

      console.log('Recommended Stripe Radar Rules for Tranquilae:');
      recommendedRules.forEach((rule, index) => {
        console.log(`${index + 1}. ${rule.rule}`);
        console.log(`   ${rule.description}\n`);
      });

      // Log radar configuration
      await logSecurityEvent({
        event_type: 'SUSPICIOUS_ACTIVITY',
        success: true,
        metadata: {
          action: 'radar_rules_configured',
          rules_count: recommendedRules.length
        }
      });

    } catch (error) {
      console.error('Error configuring Radar rules:', error);
      Sentry.captureException(error, {
        tags: { component: 'stripe-radar', operation: 'configure-rules' }
      });
    }
  }

  /**
   * Check for suspicious patterns in user behavior
   */
  async checkVelocityLimits(
    userId: string, 
    ipAddress?: string, 
    timeWindowMinutes: number = 60
  ): Promise<{ exceeded: boolean; count: number; recommendations: string[] }> {
    try {
      const timeWindow = new Date(Date.now() - (timeWindowMinutes * 60 * 1000));

      // This would query your audit logs for payment attempts
      // Implementation depends on your audit log structure
      
      const recentAttempts = 0; // Placeholder - implement based on your audit logs
      
      const velocityExceeded = recentAttempts > 3; // Allow max 3 attempts per hour
      
      if (velocityExceeded) {
        await logSecurityEvent({
          event_type: 'RATE_LIMIT_EXCEEDED',
          user_id: userId,
          ip_address: ipAddress,
          success: false,
          metadata: {
            attempts_count: recentAttempts,
            time_window_minutes: timeWindowMinutes
          }
        });
      }

      return {
        exceeded: velocityExceeded,
        count: recentAttempts,
        recommendations: velocityExceeded 
          ? ['Temporarily block user', 'Require additional verification', 'Manual review']
          : ['Monitor continued activity']
      };
    } catch (error) {
      console.error('Error checking velocity limits:', error);
      return {
        exceeded: true, // Fail safe
        count: 0,
        recommendations: ['Manual review required due to technical error']
      };
    }
  }

  /**
   * Analyze subscription patterns for potential abuse
   */
  async analyzeSubscriptionPatterns(userId: string): Promise<{
    suspicious: boolean;
    patterns: string[];
    risk_factors: string[];
  }> {
    try {
      // Retrieve user's subscription history
      const customer = await this.getStripeCustomerByUserId(userId);
      if (!customer) {
        return {
          suspicious: false,
          patterns: [],
          risk_factors: ['No customer record found']
        };
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 100
      });

      const patterns: string[] = [];
      const riskFactors: string[] = [];

      // Check for rapid subscription creation/cancellation
      const activeSubscriptions = subscriptions.data.filter(sub => 
        ['active', 'trialing'].includes(sub.status)
      );
      
      const canceledSubscriptions = subscriptions.data.filter(sub => 
        sub.status === 'canceled'
      );

      if (canceledSubscriptions.length > 2) {
        patterns.push('Multiple canceled subscriptions');
        riskFactors.push('Pattern of subscription abuse');
      }

      if (activeSubscriptions.length > 1) {
        patterns.push('Multiple active subscriptions');
        riskFactors.push('Unusual subscription behavior');
      }

      // Check for rapid trial abuse
      const trialSubscriptions = subscriptions.data.filter(sub => 
        sub.status === 'trialing'
      );

      if (trialSubscriptions.length > 1) {
        patterns.push('Multiple trial subscriptions');
        riskFactors.push('Potential trial abuse');
      }

      const suspicious = riskFactors.length > 0;

      if (suspicious) {
        await logSecurityEvent({
          event_type: 'SUSPICIOUS_ACTIVITY',
          user_id: userId,
          success: false,
          metadata: {
            patterns,
            risk_factors: riskFactors,
            subscriptions_count: subscriptions.data.length
          }
        });
      }

      return {
        suspicious,
        patterns,
        risk_factors: riskFactors
      };
    } catch (error) {
      console.error('Error analyzing subscription patterns:', error);
      Sentry.captureException(error, {
        tags: { component: 'stripe-radar', operation: 'analyze-patterns' }
      });

      return {
        suspicious: true, // Fail safe
        patterns: ['Unable to analyze due to error'],
        risk_factors: ['Technical error during analysis']
      };
    }
  }

  /**
   * Private helper methods
   */
  private mapRadarRiskLevel(radarLevel?: string): RadarRiskAssessment['risk_level'] {
    switch (radarLevel) {
      case 'low': return 'low';
      case 'elevated': return 'medium';
      case 'highest': return 'very_high';
      default: return 'medium';
    }
  }

  private mapRadarOutcome(sellerMessage?: string): RadarRiskAssessment['radar_outcome'] {
    if (!sellerMessage) return 'allowed';
    
    if (sellerMessage.includes('blocked')) return 'blocked';
    if (sellerMessage.includes('review')) return 'manual_review';
    return 'allowed';
  }

  private extractRiskReasons(outcome?: any): string[] {
    const reasons: string[] = [];
    
    if (outcome?.reason) {
      reasons.push(outcome.reason);
    }
    
    if (outcome?.seller_message) {
      reasons.push(outcome.seller_message);
    }

    return reasons;
  }

  private generateRecommendations(outcome?: any): string[] {
    const recommendations: string[] = [];
    
    if (outcome?.risk_level === 'highest') {
      recommendations.push('Consider requiring additional verification');
      recommendations.push('Monitor user activity closely');
    }
    
    if (outcome?.reason === 'generic_decline') {
      recommendations.push('Suggest user contacts their bank');
    }
    
    return recommendations;
  }

  private async performAdditionalFraudChecks(
    paymentIntent: Stripe.PaymentIntent,
    metadata?: Record<string, any>
  ): Promise<FraudCheckResult['additional_checks']> {
    // Implement additional checks based on your requirements
    return {
      velocity_check: true, // Placeholder
      geolocation_check: true, // Placeholder
      device_fingerprint: true // Placeholder
    };
  }

  private evaluateOverallRisk(
    riskAssessment: RadarRiskAssessment,
    additionalChecks?: FraudCheckResult['additional_checks']
  ): boolean {
    // Block if Radar says to block
    if (riskAssessment.radar_outcome === 'blocked') {
      return false;
    }
    
    // Block very high risk
    if (riskAssessment.risk_level === 'very_high' || riskAssessment.risk_score > 80) {
      return false;
    }
    
    // Check additional fraud checks
    if (additionalChecks) {
      if (!additionalChecks.velocity_check || !additionalChecks.geolocation_check) {
        return false;
      }
    }
    
    return true;
  }

  private async getStripeCustomerByUserId(userId: string): Promise<Stripe.Customer | null> {
    try {
      // This would query your database to get the Stripe customer ID for the user
      // Implementation depends on your database structure
      return null; // Placeholder
    } catch (error) {
      console.error('Error getting Stripe customer:', error);
      return null;
    }
  }
}

// Export singleton instance
export const stripeRadar = StripeRadarService.getInstance();

// Convenience functions
export const assessPaymentRisk = (paymentIntentId: string, userId?: string, metadata?: Record<string, any>) =>
  stripeRadar.assessPaymentRisk(paymentIntentId, userId, metadata);

export const configureRadarRules = () => stripeRadar.configureRadarRules();

export const checkVelocityLimits = (userId: string, ipAddress?: string, timeWindowMinutes?: number) =>
  stripeRadar.checkVelocityLimits(userId, ipAddress, timeWindowMinutes);

export const analyzeSubscriptionPatterns = (userId: string) =>
  stripeRadar.analyzeSubscriptionPatterns(userId);
