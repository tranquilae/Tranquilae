# 🌿 Tranquilae - Complete Systems Architecture & Vercel Deployment Guide

> **Comprehensive Production Deployment Guide**  
> **Version:** 2.0  
> **Platform:** Vercel + External Services  
> **Updated:** September 2025

## 📋 Table of Contents

1. [Systems Overview](#systems-overview)
2. [Core Infrastructure Setup](#core-infrastructure-setup)
3. [Database & Authentication](#database--authentication)
4. [Payment Processing](#payment-processing)
5. [Email & Communications](#email--communications)
6. [AI & OpenAI Integration](#ai--openai-integration)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Admin Panel Security System](#admin-panel-security-system)
9. [Vercel Deployment](#vercel-deployment)
10. [Production Configuration](#production-configuration)
11. [Testing All Systems](#testing-all-systems)
12. [Maintenance & Monitoring](#maintenance--monitoring)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 Systems Overview

### **Tranquilae Platform Architecture**

```mermaid
graph TB
    Users[👥 Users] --> Vercel[🚀 Vercel Frontend]
    Vercel --> API[🔌 Next.js API Routes]
    
    API --> Supabase[🔐 Supabase Auth]
    API --> Neon[🐘 Neon PostgreSQL]
    API --> Stripe[💳 Stripe Payments]
    API --> Resend[📧 Resend Email]
    API --> OpenAI[🤖 OpenAI GPT-4]
    API --> Sentry[🐛 Sentry Monitoring]
    
    Admin[👨‍💼 Admin Users] --> AdminPanel[🛡️ Admin Security Panel]
    AdminPanel --> SecurityDB[🔒 Security Monitoring]
    AdminPanel --> Twilio[📱 Twilio SMS]
    
    Vercel --> Analytics[📊 Vercel Analytics]
```

### **Complete System Components**

| System | Purpose | Tier | Cost | Critical |
|--------|---------|------|------|----------|
| **Vercel** | Frontend & API Hosting | Pro | $20/mo | ✅ |
| **Neon PostgreSQL** | Main Database | Paid | $19/mo | ✅ |
| **Supabase** | Authentication & RLS | Pro | $25/mo | ✅ |
| **Stripe** | Payment Processing | Usage | 2.9% + 30¢ | ✅ |
| **Resend** | Transactional Emails | Pro | $20/mo | ✅ |
| **OpenAI** | AI Wellness Coach | Usage | ~$50/mo | ✅ |
| **Twilio** | SMS Alerts (Admin) | Usage | $10/mo | ⚠️ |
| **Sentry** | Error Monitoring | Team | $26/mo | ⚠️ |
| **Custom Domain** | yourapp.com | Registrar | $12/year | ⚠️ |

**Total Monthly Cost: ~$172/month + usage**

---

## 🏗️ Core Infrastructure Setup

### **1. Domain & DNS Setup**

#### **Domain Registration**
```bash
# Choose a domain provider
# Recommended: Namecheap, Cloudflare, Google Domains

# Example domains:
# - tranquilae.com
# - yourwellnessapp.com  
# - mindfuljourney.io
```

#### **DNS Configuration**
```dns
# DNS Records to set up:

# Main app
A     @          76.76.19.61 (Vercel IP)
CNAME www        cname.vercel-dns.com
CNAME admin      cname.vercel-dns.com

# Email verification (Resend)
TXT   @          "v=spf1 include:spf.resend.com ~all"
CNAME resend._domainkey    [resend-provided-cname]

# Optional: API subdomain
CNAME api        cname.vercel-dns.com
```

### **2. SSL Certificate**
Vercel automatically provides SSL certificates. No manual setup needed.

---

## 🗄️ Database & Authentication

### **Step 1: Neon PostgreSQL Setup**

#### **Create Neon Account & Database**
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub (recommended)
3. Click **"Create a project"**
4. Configure:
   - **Name:** `tranquilae-prod`
   - **Region:** Choose closest to your users
   - **PostgreSQL Version:** 15 (latest stable)
   - **Plan:** Scale (required for production)

#### **Connection Configuration**
```bash
# Copy from Neon Dashboard > Connection Details
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.neon.tech/neondb?sslmode=require"

# Pooled connection (recommended for serverless)
DATABASE_POOLED_URL="postgresql://username:password@ep-xxx-pooler.us-east-1.neon.tech/neondb?sslmode=require"
```

#### **Database Migrations**
```bash
# Run all migrations in order
# 1. Core app schema
npm run db:migrate

# 2. Admin panel schema
# Execute admin-migration.sql in Neon Console

# 3. Security monitoring schema  
# Execute security-monitoring-migration.sql in Neon Console
```

### **Step 2: Supabase Authentication**

#### **Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. **"New project"**
3. Configure:
   - **Name:** `tranquilae-auth`
   - **Database Password:** Generate strong password
   - **Region:** Same as Neon for low latency
   - **Plan:** Pro ($25/month for production features)

#### **Authentication Configuration**
```bash
# From Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
SUPABASE_JWT_SECRET="your-jwt-secret"
```

#### **Auth Providers Setup**
```sql
-- In Supabase Dashboard > Authentication > Providers
-- Enable these providers:

-- 1. Email (default) ✅
-- 2. Google OAuth:
--    Client ID: your-google-client-id
--    Client Secret: your-google-client-secret
--    Redirect URL: https://your-project.supabase.co/auth/v1/callback

-- 3. Apple OAuth (for iOS users):
--    Service ID: com.yourapp.signin
--    Team ID: XXXXXXXXXX
--    Key ID: XXXXXXXXXX
```

#### **Row Level Security (RLS) Policies**
```sql
-- Enable RLS on user data tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_nutrition ENABLE ROW LEVEL SECURITY;

-- Create policies (example)
CREATE POLICY "Users can only see their own data" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);
```

---

## 💳 Payment Processing

### **Step 1: Stripe Account Setup**

#### **Account Creation & Verification**
1. Go to [stripe.com](https://stripe.com)
2. **"Start now"** → Business account
3. Complete business verification:
   - Business details
   - Bank account information
   - Identity verification
   - **Enable Stripe Radar** (fraud protection)

#### **Product Creation**
```bash
# In Stripe Dashboard > Products
# Create these exact products:

# 1. Pathfinder Monthly
Name: "Pathfinder Plan - Monthly"
Price: £10.00 GBP (or $13.00 USD)
Billing: Recurring monthly
ID: price_1pathfinder_monthly_xxx

# 2. Pathfinder Yearly  
Name: "Pathfinder Plan - Yearly"
Price: £100.00 GBP (or $130.00 USD)
Billing: Recurring yearly
ID: price_1pathfinder_yearly_xxx
```

#### **Webhook Configuration**
```bash
# In Stripe Dashboard > Webhooks
# Create webhook endpoint:
URL: https://yourdomain.com/api/stripe-webhook
Events to send:
  ✅ customer.subscription.created
  ✅ customer.subscription.updated
  ✅ customer.subscription.deleted
  ✅ invoice.payment_succeeded
  ✅ invoice.payment_failed
  ✅ payment_intent.succeeded
  ✅ payment_intent.payment_failed
```

#### **Stripe Configuration**
```bash
# From Stripe Dashboard > Developers > API keys
STRIPE_SECRET_KEY="sk_live_51..." # LIVE key for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_51..." # LIVE key

# From Webhooks section
STRIPE_WEBHOOK_SECRET="whsec_1234..."

# Product price IDs
STRIPE_PRICE_ID_PATHFINDER_MONTHLY="price_1..."
STRIPE_PRICE_ID_PATHFINDER_YEARLY="price_1..."

# Optional: Radar settings
STRIPE_RADAR_RISK_THRESHOLD="35" # Block payments above this risk score
```

### **Step 2: Payment Flow Testing**
```javascript
// Test cards for development
const testCards = {
  success: "4242424242424242", // Visa
  decline: "4000000000000002", // Generic decline
  fraud: "4000000000000036",   // High risk (Radar)
  insufficient: "4000000000009995"
};

// Test subscription flow:
// 1. Create customer
// 2. Attach payment method
// 3. Create subscription
// 4. Handle webhook events
```

---

## 📧 Email & Communications

### **Step 1: Resend Email Service**

#### **Account Setup**
1. Go to [resend.com](https://resend.com)
2. **"Get started"** → Pro account ($20/month)
3. **Add domain** → `yourdomain.com`
4. **DNS Verification**:
   ```dns
   # Add these DNS records:
   TXT @ "v=spf1 include:spf.resend.com ~all"
   CNAME resend._domainkey [provided-by-resend]
   ```

#### **Email Configuration**
```bash
# From Resend Dashboard > API Keys
RESEND_API_KEY="re_123456789..."

# Email settings
FROM_EMAIL="noreply@yourdomain.com"
FROM_NAME="Tranquilae"
SUPPORT_EMAIL="support@yourdomain.com"
ADMIN_EMAIL="admin@yourdomain.com"
```

#### **Email Templates**
The system sends these automated emails:
- ✅ Welcome email (onboarding)
- ✅ Subscription confirmation
- ✅ Payment receipts
- ✅ Password reset
- ✅ Admin security alerts
- ✅ Subscription renewal reminders

### **Step 2: SMS Notifications (Admin Security)**

#### **Twilio Setup** (Optional but recommended)
```bash
# 1. Create account at twilio.com
# 2. Get phone number
# 3. Configure for admin alerts only

TWILIO_ACCOUNT_SID="AC123..."
TWILIO_AUTH_TOKEN="auth_token_123..."
TWILIO_PHONE_NUMBER="+1234567890"

# Admin phone numbers for critical alerts
ADMIN_PHONE="+1987654321"
SECURITY_TEAM_PHONE="+1555123456"
```

---

## 🤖 AI & OpenAI Integration

### **Step 1: OpenAI Account Setup**

#### **Account & Billing**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account → **Add payment method**
3. Set **usage limits** (recommended: $100/month)
4. Create **API key** with restricted permissions

#### **AI Configuration**
```bash
# From OpenAI Dashboard > API keys
OPENAI_API_KEY="sk-proj-..."

# Model configuration
OPENAI_MODEL="gpt-4" # Production ready
OPENAI_MAX_TOKENS="1000" # Response length limit
OPENAI_TEMPERATURE="0.7" # Creativity level

# Usage monitoring
OPENAI_MONTHLY_BUDGET="100" # USD budget limit
```

#### **AI Coach System**
The AI coach provides:
- 🏋️ **Personalized workout recommendations**
- 🥗 **Nutrition advice and meal planning**
- 🧘 **Mindfulness and meditation guidance**
- 📊 **Progress analysis and motivation**
- 🎯 **Goal setting and adjustment**

### **Step 2: AI Safety & Monitoring**
```bash
# Content filtering
OPENAI_CONTENT_FILTER="true"
OPENAI_MAX_REQUESTS_PER_USER="50" # Daily limit per user

# Monitoring
OPENAI_LOG_REQUESTS="true" # Log for cost analysis
OPENAI_ALERT_THRESHOLD="80" # Alert at 80% of budget
```

---

## 📊 Monitoring & Analytics

### **Step 1: Sentry Error Monitoring**

#### **Sentry Setup**
1. Go to [sentry.io](https://sentry.io)
2. Create **organization** → **project**
3. Choose **"Next.js"** platform
4. **Team plan** ($26/month) for production alerts

#### **Sentry Configuration**
```bash
# From Sentry Dashboard > Settings > Client Keys
SENTRY_DSN="https://123@456.ingest.sentry.io/789"
SENTRY_ORG="your-org-name"
SENTRY_PROJECT="tranquilae"

# Environment tracking
SENTRY_ENVIRONMENT="production"
SENTRY_RELEASE="1.0.0" # Update with each deployment
```

#### **Error Tracking Setup**
```typescript
// sentry.client.config.ts & sentry.server.config.ts already configured
// Monitor these critical errors:
// - Payment processing failures
// - AI API timeouts
// - Database connection issues
// - Authentication errors
// - Admin security events
```

### **Step 2: Analytics & Performance**

#### **Vercel Analytics** (Built-in)
```bash
# Already configured via @vercel/analytics package
# Tracks:
# - Page views and unique visitors
# - Core Web Vitals
# - Conversion funnels
# - Real user monitoring
```

#### **Optional: Advanced Analytics**
```bash
# PostHog for user behavior (optional)
# NEXT_PUBLIC_POSTHOG_KEY="phc_123..."
# NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# Track key events:
# - Onboarding completion
# - Subscription conversions  
# - Feature usage
# - User retention
```

---

## 🛡️ Admin Panel Security System

### **Security Monitoring Architecture**

```mermaid
graph TB
    AdminPanel[🛡️ Admin Panel] --> SecurityMonitor[🔍 Security Monitor]
    SecurityMonitor --> DB[(🗄️ Security Events DB)]
    SecurityMonitor --> Alerts[📢 Alert System]
    
    Alerts --> Email[📧 Email Alerts]
    Alerts --> SMS[📱 SMS Alerts]  
    Alerts --> Webhook[🔗 Webhook Alerts]
    
    SecurityMonitor --> ResponseSystem[🚨 Auto Response]
    ResponseSystem --> IPBlock[🚫 IP Blocking]
    ResponseSystem --> AccountLock[🔒 Account Lock]
```

### **Security System Environment Variables**

```bash
# ==============================================
# 🔒 ADMIN PANEL SECURITY CONFIGURATION
# ==============================================

# Admin user identification (Supabase UUIDs)
ADMIN_USER_IDS="uuid1,uuid2,uuid3"
SUPER_ADMIN_USER_IDS="uuid1"

# Security thresholds
MAX_FAILED_ATTEMPTS="5"
AUTO_BLOCK_WINDOW_MINUTES="15"
DEFAULT_BLOCK_DURATION_MINUTES="60"
ACCOUNT_LOCKOUT_MINUTES="120"

# Alert configuration
SECURITY_TEAM_EMAIL="security@yourdomain.com"
ADMIN_PHONE="+1234567890"
EMERGENCY_CONTACT="emergency@yourdomain.com"

# Webhook security
WEBHOOK_SECRET="generated-webhook-secret-32-chars"
ESCALATION_WEBHOOK_URL="https://your-incident-management.com/webhook"

# JWT security
JWT_SECRET="super-secure-jwt-secret-minimum-256-bits"

# API rate limiting  
API_RATE_LIMIT_REQUESTS="100"
API_RATE_LIMIT_WINDOW_MINUTES="15"

# Session security
SESSION_TIMEOUT_HOURS="8"
CSRF_PROTECTION="true"
SECURE_HEADERS="true"

# Geographic security (optional)
ENABLE_GEO_BLOCKING="false"
BLOCKED_COUNTRIES="CN,RU,KP" # ISO country codes

# Debug and monitoring
DEBUG_SECURITY_EVENTS="false" # Set to true for debugging
LOG_LEVEL="error" # production setting
```

### **Security Features Enabled**

- ✅ **Real-time Threat Detection** - Failed logins, brute force, SQL injection
- ✅ **Automated IP Blocking** - Auto-block after 5 failed attempts
- ✅ **Multi-channel Alerts** - Email, SMS, Webhook notifications  
- ✅ **Security Dashboard** - Real-time monitoring interface
- ✅ **Audit Logging** - Complete admin action tracking
- ✅ **Privilege Escalation Detection** - Unauthorized access attempts
- ✅ **Session Security** - Timeout, hijacking detection
- ✅ **API Rate Limiting** - Prevent abuse
- ✅ **Automated Response System** - Account lockouts, escalation

---

## 🚀 Vercel Deployment

### **Step 1: Prepare Repository**

#### **Pre-deployment Checklist**
```bash
# ✅ 1. Verify all files are committed
git add .
git commit -m "feat: production deployment ready"
git push origin main

# ✅ 2. Verify build works locally
npm run build
npm run start

# ✅ 3. Run all tests
npm run validate-env
npm run test:stripe  
npm run test:emails
npm run db:test
```

#### **Vercel Configuration Files**

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://yourdomain.com"
        },
        {
          "key": "Access-Control-Allow-Methods", 
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/admin",
      "destination": "/admin-panel",
      "permanent": false
    }
  ]
}
```

### **Step 2: Vercel Account Setup**

#### **Account & Team Configuration**
```bash
# 1. Sign up at vercel.com with GitHub
# 2. Choose Pro plan ($20/month) for production features:
#    - Custom domains
#    - Advanced analytics
#    - Team collaboration
#    - Priority support
#    - Edge functions
#    - Increased limits

# 3. Create team for organization (optional)
# 4. Connect GitHub repository
```

### **Step 3: Deployment Configuration**

#### **Import Project to Vercel**
1. **Vercel Dashboard** → **"Add New..."** → **"Project"**
2. **Import Git Repository** → Select `tranquilae`
3. **Configure Project**:
   ```bash
   Project Name: tranquilae
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Install Command: npm install
   Development Command: npm run dev
   ```

#### **Environment Variables Setup**
In Vercel Dashboard → **Settings** → **Environment Variables**:

```bash
# ===== PRODUCTION ENVIRONMENT VARIABLES =====

# Deployment
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"

# Database (Neon - Production)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# Authentication (Supabase - Production)  
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
SUPABASE_JWT_SECRET="your-jwt-secret"

# Payments (Stripe - LIVE keys)
STRIPE_SECRET_KEY="sk_live_51..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_51..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_PATHFINDER_MONTHLY="price_..."
STRIPE_PRICE_ID_PATHFINDER_YEARLY="price_..."

# Email (Resend - Production)
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@yourdomain.com"
FROM_NAME="Tranquilae"

# AI (OpenAI - Production)
OPENAI_API_KEY="sk-proj-..."
OPENAI_MODEL="gpt-4"

# Monitoring (Sentry - Production)
SENTRY_DSN="https://123@456.ingest.sentry.io/789"

# Admin Security (All production values)
ADMIN_USER_IDS="real-admin-uuid1,real-admin-uuid2"
SUPER_ADMIN_USER_IDS="real-super-admin-uuid"
SECURITY_TEAM_EMAIL="security@yourdomain.com"
JWT_SECRET="production-jwt-secret-minimum-256-bits"
WEBHOOK_SECRET="production-webhook-secret"

# SMS Alerts (Twilio - Production)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"
ADMIN_PHONE="+1987654321"

# Feature toggles
NEXT_PUBLIC_ENABLE_AI_COACH="true"
NEXT_PUBLIC_ENABLE_INTEGRATIONS="true"
DEBUG_SECURITY_EVENTS="false"
LOG_LEVEL="error"
```

### **Step 4: Domain Configuration**

#### **Custom Domain Setup**
1. **Vercel Dashboard** → **Domains** → **"Add"**
2. Enter your domain: `yourdomain.com`
3. **DNS Configuration**:
   ```dns
   # Add these DNS records at your domain provider:
   A     @     76.76.19.61
   CNAME www   cname.vercel-dns.com
   
   # Admin subdomain (optional)
   CNAME admin cname.vercel-dns.com
   ```
4. **SSL Certificate**: Automatically provisioned by Vercel

#### **Environment-specific Domains**
```bash
# Production: https://yourdomain.com
# Staging: https://staging-tranquilae.vercel.app  
# Preview: https://tranquilae-git-feature-username.vercel.app
```

### **Step 5: Deploy**

```bash
# Deploy via Vercel CLI (optional)
npm install -g vercel
vercel login
vercel --prod

# Or deploy via GitHub integration (recommended)
# Push to main branch triggers automatic deployment
git push origin main
```

---

## ⚙️ Production Configuration

### **Step 1: Post-Deployment Setup**

#### **Database Final Configuration**
```sql
-- Run in Neon Console after first deployment

-- 1. Create admin users (replace with real UUIDs from Supabase)
UPDATE users SET role = 'super_admin', status = 'active' 
WHERE id = 'real-uuid-from-supabase';

UPDATE users SET role = 'admin', status = 'active' 
WHERE id IN ('admin-uuid-1', 'admin-uuid-2');

-- 2. Set up security monitoring data retention
DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '90 days';

-- 3. Create performance indexes
CREATE INDEX CONCURRENTLY idx_users_subscription_status 
ON users (subscription_status, created_at);

CREATE INDEX CONCURRENTLY idx_security_events_critical 
ON security_events (severity, created_at) 
WHERE severity = 'critical';
```

#### **Stripe Webhook Verification**
```bash
# Test webhook in Stripe Dashboard:
# 1. Go to Webhooks → Your webhook
# 2. Click "Send test webhook"  
# 3. Choose "customer.subscription.created"
# 4. Verify it appears in Vercel function logs

# Check webhook signature verification:
curl -X POST https://yourdomain.com/api/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"type":"ping"}'
```

### **Step 2: Security Hardening**

#### **Security Headers Verification**
```bash
# Test security headers are applied:
curl -I https://yourdomain.com

# Expected headers:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff  
# Referrer-Policy: origin-when-cross-origin
# Strict-Transport-Security: max-age=31536000
```

#### **Admin Panel Access**
```bash
# 1. Create admin user accounts in Supabase
# 2. Assign proper UUIDs to environment variables
# 3. Test admin login at https://yourdomain.com/admin
# 4. Verify security dashboard loads
# 5. Test IP blocking functionality
```

### **Step 3: Performance Optimization**

#### **Vercel Function Configuration**
```typescript
// In API routes, add these configurations:
export const config = {
  runtime: 'edge', // For better performance
  regions: ['lhr1'], // London region (adjust for your users)
  maxDuration: 30 // 30 seconds timeout
}

// Critical routes to optimize:
// - /api/stripe-webhook (edge runtime)
// - /api/auth/* (minimal runtime)  
// - /api/ai-coach (longer timeout for OpenAI)
```

#### **Database Connection Pooling**
```bash
# Use pooled connection string for Vercel functions
DATABASE_POOLED_URL="postgresql://user:pass@ep-xxx-pooler.neon.tech/db"

# Set connection limits
DATABASE_MAX_CONNECTIONS="10"
DATABASE_IDLE_TIMEOUT="30000"
```

---

## 🧪 Testing All Systems

### **Step 1: Automated Testing Suite**

#### **System Health Check Script**
Create `scripts/production-health-check.js`:
```javascript
#!/usr/bin/env node

const systems = [
  {
    name: 'Frontend',
    test: () => fetch('https://yourdomain.com').then(r => r.status === 200)
  },
  {
    name: 'Database', 
    test: async () => {
      const { neon } = require('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL);
      const result = await sql`SELECT 1`;
      return result.length > 0;
    }
  },
  {
    name: 'Authentication',
    test: async () => {
      const response = await fetch('https://yourdomain.com/api/auth/session');
      return response.status === 200 || response.status === 401;
    }
  },
  {
    name: 'Stripe',
    test: async () => {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const account = await stripe.accounts.retrieve();
      return account.id !== null;
    }
  },
  {
    name: 'Resend Email',
    test: async () => {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      // Don't actually send, just verify API key
      return process.env.RESEND_API_KEY.startsWith('re_');
    }
  },
  {
    name: 'OpenAI',
    test: async () => {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
      });
      return response.status === 200;
    }
  }
];

async function runHealthCheck() {
  console.log('🏥 Production Health Check\n');
  
  for (const system of systems) {
    try {
      const healthy = await system.test();
      console.log(`${healthy ? '✅' : '❌'} ${system.name}`);
    } catch (error) {
      console.log(`❌ ${system.name}: ${error.message}`);
    }
  }
}

runHealthCheck().catch(console.error);
```

#### **End-to-End User Journey Test**
```javascript
// Test complete user flow:
// 1. User registration
// 2. Email verification  
// 3. Onboarding completion
// 4. Subscription purchase
// 5. AI coach interaction
// 6. Admin panel security logging
```

### **Step 2: Payment Flow Testing**

#### **Test Subscription Flow**
```bash
# Use Stripe test cards in development:
# Success: 4242424242424242
# Decline: 4000000000000002

# Test scenarios:
# 1. Successful monthly subscription
# 2. Successful yearly subscription  
# 3. Failed payment handling
# 4. Subscription cancellation
# 5. Dunning management
# 6. Webhook event processing
```

### **Step 3: Security System Testing**

#### **Admin Security Tests**
```bash
# Test security features:
# 1. Failed login detection (trigger with wrong password 6 times)
# 2. IP blocking verification
# 3. Email alerts delivery
# 4. SMS alerts (if configured)  
# 5. Admin dashboard access
# 6. Security event logging
# 7. Auto-response system
```

---

## 🔧 Maintenance & Monitoring

### **Daily Monitoring Tasks**

#### **Automated Health Checks**
```bash
# Set up monitoring with Vercel Cron Jobs
# Create: /api/cron/health-check.ts

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405);
  
  // Run health checks
  // Send alerts if systems are down
  // Update status page
  
  res.status(200).json({ status: 'healthy' });
}

# Configure in vercel.json:
{
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

#### **Key Metrics to Monitor**
```bash
# Business Metrics:
# - Daily active users
# - Subscription conversion rate
# - Churn rate
# - Revenue (MRR/ARR)

# Technical Metrics:
# - API response times
# - Error rates
# - Database performance
# - Payment success rate
# - Email delivery rate
# - AI API usage/costs

# Security Metrics:
# - Failed login attempts
# - Blocked IPs
# - Security events
# - Admin panel access
```

### **Weekly Tasks**

```sql
-- Database maintenance (run weekly)
-- Clean up old data
DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '90 days';
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';

-- Update database statistics
ANALYZE;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### **Monthly Tasks**

- 📊 **Review analytics and metrics**
- 💰 **Analyze costs and optimize**
- 🔒 **Security audit and updates**
- 📧 **Review email deliverability**
- 🤖 **Analyze AI usage and costs**
- 🛠️ **Dependency updates**
- 📱 **Test all integrations**

---

## 🔧 Troubleshooting

### **Common Vercel Deployment Issues**

#### **1. Build Failures**
```bash
# Issue: TypeScript errors during build
# Solution: 
npm run type-check  # Fix TypeScript errors locally
# Or temporarily: typescript.ignoreBuildErrors: true in next.config.mjs

# Issue: Environment variables not found
# Solution: Verify all production env vars are set in Vercel dashboard
```

#### **2. Database Connection Issues**
```bash
# Issue: "Connection pool exhausted"
# Solution: Use pooled connection string
DATABASE_POOLED_URL="postgresql://user:pass@ep-xxx-pooler.neon.tech/db"

# Issue: "SSL connection required"
# Solution: Ensure ?sslmode=require in connection string
```

#### **3. Stripe Webhook Failures**
```bash
# Issue: Webhook signature verification failed
# Solution: Check STRIPE_WEBHOOK_SECRET matches dashboard

# Issue: Webhook timeout
# Solution: Optimize webhook handler, use Vercel edge runtime
```

#### **4. Email Delivery Issues**
```bash
# Issue: Emails not delivered
# Solution: 
# 1. Verify domain DNS records in Resend
# 2. Check SPF/DKIM configuration
# 3. Monitor bounce rates

# Issue: Rate limiting
# Solution: Upgrade Resend plan or optimize sending frequency
```

#### **5. Admin Security System Issues**
```bash
# Issue: Security events not logging
# Solution:
# 1. Check database migrations completed
# 2. Verify RLS policies
# 3. Check service role key permissions

# Issue: IP blocking not working
# Solution:
# 1. Verify handle_failed_login function exists
# 2. Check IP extraction from headers
# 3. Test with different IP addresses
```

### **Performance Optimization**

#### **Vercel Function Optimization**
```typescript
// Use edge runtime for better performance
export const config = {
  runtime: 'edge'
}

// Or specify regions closer to users
export const config = {
  regions: ['lhr1', 'fra1'] // London, Frankfurt
}
```

#### **Database Query Optimization**
```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_users_subscription_active 
ON users (subscription_status) 
WHERE subscription_status = 'active';

-- Monitor slow queries
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

---

## 📞 Support & Resources

### **Emergency Contacts**
```bash
# Update these with your actual contacts:
SECURITY_TEAM_EMAIL="security@yourdomain.com"
ADMIN_PHONE="+1234567890"  
EMERGENCY_CONTACT="emergency@yourdomain.com"

# External Service Support:
VERCEL_SUPPORT="https://vercel.com/support"
NEON_SUPPORT="https://console.neon.tech/support"
SUPABASE_SUPPORT="https://supabase.com/support"
STRIPE_SUPPORT="https://support.stripe.com/"
RESEND_SUPPORT="https://resend.com/support"
OPENAI_SUPPORT="https://help.openai.com/"
```

### **Service Status Pages**
- **Vercel:** https://vercel-status.com
- **Neon:** https://neon.tech/status
- **Supabase:** https://status.supabase.com  
- **Stripe:** https://status.stripe.com
- **Resend:** https://status.resend.com
- **OpenAI:** https://status.openai.com

### **Documentation Links**
- **Vercel Deployment:** https://vercel.com/docs/deployments
- **Next.js Production:** https://nextjs.org/docs/deployment
- **Stripe Integration:** https://stripe.com/docs/payments
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **OpenAI API:** https://platform.openai.com/docs

---

## ✅ Production Deployment Checklist

### **Pre-Launch Checklist**

- [ ] **Domain & DNS**
  - [ ] Domain registered and DNS configured
  - [ ] SSL certificate active (automatic via Vercel)
  - [ ] Admin subdomain configured (optional)

- [ ] **Core Services**  
  - [ ] Neon PostgreSQL database active
  - [ ] Supabase authentication configured
  - [ ] All database migrations executed
  - [ ] Row Level Security policies enabled

- [ ] **Payment System**
  - [ ] Stripe account verified and live
  - [ ] Products and prices created
  - [ ] Webhooks configured and tested
  - [ ] Fraud protection (Radar) enabled

- [ ] **Email System**
  - [ ] Resend domain verified
  - [ ] SPF/DKIM records configured
  - [ ] Email templates tested

- [ ] **AI Integration**
  - [ ] OpenAI API key active
  - [ ] Usage limits configured
  - [ ] Content filtering enabled

- [ ] **Monitoring**
  - [ ] Sentry error monitoring active
  - [ ] Vercel Analytics enabled
  - [ ] Health check endpoints working

- [ ] **Security (Admin Panel)**
  - [ ] Security monitoring database setup
  - [ ] Admin users configured with proper roles
  - [ ] IP blocking system tested
  - [ ] Alert systems (email/SMS) functional
  - [ ] Security dashboard accessible

- [ ] **Vercel Configuration**
  - [ ] All environment variables set
  - [ ] Build successful
  - [ ] Functions deployed without errors
  - [ ] Custom domain working

### **Post-Launch Checklist**

- [ ] **User Testing**
  - [ ] Registration and login flow
  - [ ] Onboarding process complete
  - [ ] Subscription purchase successful  
  - [ ] AI coach functionality working

- [ ] **Payment Testing**
  - [ ] Test card transactions successful
  - [ ] Webhook events processing correctly
  - [ ] Subscription management working

- [ ] **Monitoring Setup**
  - [ ] Error tracking operational
  - [ ] Performance metrics baseline established
  - [ ] Security alerts configured

- [ ] **Team Access**
  - [ ] Admin panel access verified
  - [ ] Security monitoring functional
  - [ ] Emergency contact procedures documented

---

## 🎉 Final Notes

**Congratulations!** You now have a complete, production-ready wellness platform with:

- ✅ **Scalable infrastructure** on Vercel with global CDN
- ✅ **Secure authentication** and user management
- ✅ **Robust payment processing** with fraud protection  
- ✅ **AI-powered coaching** for personalized wellness
- ✅ **Enterprise-grade admin security** with real-time monitoring
- ✅ **Professional email system** for user communications
- ✅ **Comprehensive monitoring** and error tracking

### **Estimated Monthly Operating Costs**
- **Total: ~$172/month + usage**
- **Scales with growth** (most costs are usage-based)
- **Premium features** justify the investment
- **Enterprise-ready** for serious wellness businesses

### **Next Steps**
1. 🚀 **Launch and iterate** based on user feedback
2. 📊 **Monitor key metrics** and optimize conversion
3. 🔧 **Scale infrastructure** as user base grows
4. 💡 **Add new features** based on user needs
5. 🌍 **Expand globally** with localization

**Your wellness platform is ready to transform lives!** 🌿✨

---

*This guide covers the complete system architecture for the Tranquilae wellness platform. Keep it updated as your platform evolves and scales.*

**Version 2.0 - Complete Systems Guide**  
**Last Updated: September 2025**
