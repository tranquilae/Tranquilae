# Stripe Radar Integration Guide for Tranquilae

This guide covers the complete setup and configuration of Stripe Radar for enhanced fraud prevention in the Tranquilae onboarding and payment system.

## Overview

Stripe Radar is a machine learning-powered fraud prevention tool that helps protect your business from fraudulent transactions. For Tranquilae, we've integrated Radar to:

- 🛡️ Prevent fraudulent sign-ups and trial abuse
- 🔍 Monitor suspicious payment patterns
- ⚡ Automatically handle high-risk transactions
- 📊 Provide detailed fraud analytics
- 🚨 Alert the team about potential threats

## Prerequisites

- Stripe account with Radar enabled (available for all accounts)
- Environment variables properly configured
- Supabase logging setup for audit trails
- Sentry for error tracking and alerts

## 1. Stripe Dashboard Configuration

### Enable Radar
1. Log into your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Radar** → **Overview**
3. Ensure Radar is enabled for your account

### Configure Radar Rules

Navigate to **Radar** → **Rules** and set up these recommended rules:

#### Basic Protection Rules
```
# Block very high-risk transactions
Block if :risk_score: > 75

# Block mismatched countries with elevated risk
Block if :card_country: != :ip_country: and :risk_score: > 50

# Manual review for multiple rapid attempts
Manual review if :velocity_attempts: > 3

# Block disposable email addresses
Block if :is_disposable_email:

# Review large amounts (adjust for your pricing)
Manual review if :amount: > 10000  # £100 in pence

# Block if CVC check fails
Block if :cvc_check: = "fail"

# Review if address verification fails
Manual review if :address_line1_check: = "fail" and :risk_score: > 30
```

#### Advanced Protection Rules
```
# Block suspicious velocity patterns
Block if :velocity_distinct_email_domains: > 5

# Review international cards from high-risk countries
Manual review if :card_country: in ["XX", "YY"] and :risk_score: > 25

# Block if using known proxy/VPN and high risk
Block if :is_proxy: and :risk_score: > 60

# Review rapid subscription attempts
Manual review if :velocity_subscription_creation: > 2
```

### Configure Webhooks
Ensure these webhook events are enabled in **Developers** → **Webhooks**:

```
radar.early_fraud_warning.created
review.opened  
review.closed
payment_intent.payment_failed
charge.dispute.created
```

## 2. Code Integration

The integration is already implemented in the following files:

### Core Files
- `lib/stripe-radar.ts` - Main Radar service with risk assessment
- `lib/supabase-logger.ts` - Logging for security events
- `app/api/webhooks/stripe/route.ts` - Enhanced webhook handling
- `app/api/checkout/session/route.ts` - Checkout with fraud prevention

### Email Templates
- `lib/email-templates/fraud-alert.ts` - User fraud notifications
- `lib/email-templates/account-restored.ts` - Account restoration emails

## 3. Environment Variables

Add these to your `.env.local`:

```env
# Stripe Radar Configuration
STRIPE_RADAR_ENABLED=true
STRIPE_RADAR_LOG_LEVEL=info

# Alert thresholds
FRAUD_ALERT_RISK_SCORE_THRESHOLD=75
FRAUD_ALERT_WEBHOOK_URL=https://your-slack-webhook-url

# Security settings
VELOCITY_LIMIT_CHECKOUT=3
VELOCITY_LIMIT_WINDOW_MINUTES=60
AUTO_SUSPEND_ON_FRAUD_WARNING=true
```

## 4. Risk Assessment Levels

Our system uses these risk levels:

| Risk Level | Score Range | Action | Description |
|------------|------------|---------|-------------|
| **Low** | 0-25 | Allow | Normal transaction, proceed |
| **Medium** | 26-50 | Monitor | Log and monitor, allow transaction |
| **High** | 51-75 | Review | Flag for manual review |
| **Very High** | 76-100 | Block | Automatically block transaction |

## 5. Automated Actions

### High-Risk Transaction Flow
1. **Detection**: Stripe Radar flags transaction
2. **Assessment**: Our system evaluates additional factors
3. **Action**: Based on risk level:
   - **High**: Manual review required
   - **Very High**: Transaction blocked, user notified
4. **Logging**: All events logged to Supabase
5. **Alerting**: Team notified via Sentry

### User Account Suspension Flow
1. **Trigger**: Early fraud warning or very high-risk score
2. **Action**: Account temporarily suspended
3. **Notification**: User receives fraud alert email
4. **Review**: Manual investigation by security team
5. **Resolution**: Account restored or permanently banned

## 6. Monitoring and Alerts

### Sentry Integration
Alerts are sent to Sentry for:
- High-risk transactions (score > 75)
- Early fraud warnings
- Payment reviews opened/closed
- Suspicious subscription patterns
- Velocity limit violations

### Log Analysis
Check Supabase audit logs for:
```sql
-- Recent fraud events
SELECT * FROM security_audit_log 
WHERE event_type = 'SUSPICIOUS_ACTIVITY' 
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Payment fraud patterns
SELECT user_id, COUNT(*) as attempts
FROM payment_audit_log 
WHERE event_type = 'PAYMENT_FAILURE'
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id 
HAVING COUNT(*) > 3;
```

## 7. Testing Fraud Prevention

### Test Cards for Radar
Use these Stripe test cards to simulate different fraud scenarios:

```javascript
// Always declined - fraud prevention
'4000000000000002'

// High risk score
'4100000000000019'

// CVC check fails
'4000000000000127'

// Address check fails
'4000000000000028'

// International card (non-US)
'4000000760000002' // Brazil
```

### Testing Webhooks
Use Stripe CLI to test webhook handling:

```bash
# Install Stripe CLI
# Forward webhooks to local development
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger radar.early_fraud_warning.created
stripe trigger review.opened
stripe trigger review.closed
```

### Testing API Endpoints
```bash
# Test checkout with fraud prevention
curl -X POST http://localhost:3000/api/checkout/session \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{"plan": "monthly"}'

# Check fraud risk for user
curl -X GET http://localhost:3000/api/user/fraud-risk \
  -H "x-user-id: test-user-123"
```

## 8. Best Practices

### Rule Configuration
- Start with conservative rules and adjust based on data
- Monitor false positive rates weekly
- Review blocked transactions monthly
- Update rules based on new fraud patterns

### User Experience
- Provide clear communication about security measures
- Quick resolution process for legitimate users
- Support team training for fraud cases
- Transparent appeals process

### Security Measures
- Regular security audits
- Automated alerting for unusual patterns
- Team training on fraud detection
- Documentation of incident responses

## 9. Common Issues and Solutions

### High False Positive Rate
**Problem**: Legitimate users being blocked
**Solution**: 
- Lower risk score thresholds
- Review country-based rules
- Analyze customer feedback

### Missed Fraudulent Transactions
**Problem**: Fraud getting through
**Solution**:
- Tighten risk score thresholds
- Add velocity checks
- Review manual review processes

### Webhook Delays
**Problem**: Delayed fraud notifications
**Solution**:
- Implement webhook retries
- Monitor webhook endpoint performance
- Use Stripe webhook signing verification

## 10. Compliance and Legal

### Data Protection
- Fraud data handling per GDPR
- User consent for fraud checks
- Data retention policies
- Right to explanation for automated decisions

### Documentation Requirements
- Maintain fraud detection logs
- Document decision rationale
- User communication records
- Regular compliance reviews

## 11. Performance Monitoring

### Key Metrics to Track
- Fraud detection rate
- False positive rate
- Manual review turnaround time
- User satisfaction with security measures

### Monthly Review Checklist
- [ ] Review fraud detection accuracy
- [ ] Analyze false positive cases
- [ ] Update Radar rules if needed
- [ ] Check webhook performance
- [ ] Review team response times
- [ ] Update documentation

## 12. Emergency Procedures

### High Fraud Alert
1. **Immediate**: Review suspicious transactions
2. **Within 1 hour**: Contact affected users
3. **Within 4 hours**: Implement additional protections
4. **Within 24 hours**: Full incident report

### System Compromise
1. **Immediately**: Disable payment processing
2. **Within 30 minutes**: Alert security team
3. **Within 2 hours**: Assess damage and scope
4. **Within 6 hours**: Implement containment measures
5. **Within 24 hours**: Full forensic analysis

---

## Support and Resources

- **Stripe Radar Documentation**: https://stripe.com/docs/radar
- **Webhook Testing**: https://stripe.com/docs/webhooks/test
- **Security Best Practices**: https://stripe.com/docs/security

For questions about this implementation, contact the development team or refer to the inline code documentation.

---

**Last Updated**: December 2024
**Version**: 1.0
**Maintainer**: Tranquilae Development Team
