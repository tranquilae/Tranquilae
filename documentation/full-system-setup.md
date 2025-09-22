# 🔐 Admin Panel Security System - Complete Setup Guide

> **Version:** 1.0  
> **Last Updated:** September 2025  
> **Environment:** Next.js 14+ with Supabase

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Installation & Dependencies](#installation--dependencies)
6. [Security System Components](#security-system-components)
7. [Configuration Guide](#configuration-guide)
8. [API Routes Setup](#api-routes-setup)
9. [Frontend Integration](#frontend-integration)
10. [Testing & Validation](#testing--validation)
11. [Deployment Guide](#deployment-guide)
12. [Troubleshooting](#troubleshooting)
13. [Security Best Practices](#security-best-practices)
14. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🎯 Overview

This admin panel security system provides enterprise-grade security monitoring with:

- **Real-time Threat Detection** - Failed logins, brute force, SQL injection, privilege escalation
- **Automated Response System** - IP blocking, account lockouts, session isolation
- **Multi-Channel Alerting** - Email, SMS, Webhook notifications
- **Security Dashboard** - Real-time monitoring and management interface
- **Audit Logging** - Comprehensive security event tracking

### System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Database      │
│                 │    │                  │    │                 │
│ • Dashboard     │◄──►│ • Auth Routes    │◄──►│ • User Tables   │
│ • Security UI   │    │ • Admin Routes   │    │ • Security      │
│ • Monitoring    │    │ • Middleware     │    │ • Audit Logs    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Security Monitor│    │ Response System  │    │ Notifications   │
│                 │    │                  │    │                 │
│ • Event Detect  │◄──►│ • Auto Block     │◄──►│ • Email Alerts  │
│ • Pattern Anal  │    │ • Escalation     │    │ • SMS Alerts    │
│ • IP Tracking   │    │ • Incident Mgmt  │    │ • Webhooks      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🔧 Prerequisites

### System Requirements

- **Node.js:** 18.x or higher
- **Next.js:** 14.x or higher
- **Database:** PostgreSQL (Supabase recommended)
- **Operating System:** Windows 10/11, macOS, or Linux

### Required Accounts & Services

- **Supabase Account** - Database and authentication
- **Resend Account** - Email notifications
- **Twilio Account** - SMS notifications (optional)
- **Webhook Service** - External integrations (optional)

### Development Tools

- **Code Editor:** VS Code, WebStorm, or similar
- **Package Manager:** npm, yarn, or pnpm
- **Database Client:** Supabase Dashboard or pgAdmin

---

## 🗄️ Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name:** `tranquilae-admin`
   - **Database Password:** Generate a secure password
   - **Region:** Choose nearest to your users
   - **Plan:** Start with Free tier
5. Wait for project initialization (2-3 minutes)

### Step 2: Configure Database Settings

1. Navigate to **Settings > Database**
2. Note down your connection details:
   - **Host:** `db.[project-ref].supabase.co`
   - **Database name:** `postgres`
   - **Port:** `5432`
   - **User:** `postgres`
   - **Password:** Your chosen password

### Step 3: Run Database Migrations

Execute the following SQL files in order:

#### 3.1 Basic Admin Schema (`admin-migration.sql`)

```sql
-- Navigate to Supabase Dashboard > SQL Editor
-- Copy and paste the content from admin-migration.sql
-- Click "RUN" button
```

**Expected Output:**
- ✅ `users` table updated with role and status columns
- ✅ `audit_logs` table created
- ✅ RLS policies enabled
- ✅ Admin functions created

#### 3.2 Security Monitoring Schema (`security-monitoring-migration.sql`)

```sql
-- In SQL Editor, create a new query
-- Copy and paste the content from security-monitoring-migration.sql
-- Click "RUN" button
```

**Expected Output:**
- ✅ `security_events` table created
- ✅ `blocked_ips` table created
- ✅ `alert_configurations` table created
- ✅ `security_metrics` table created
- ✅ `alert_history` table created
- ✅ Security functions created
- ✅ Default alert configurations inserted

### Step 4: Verify Database Setup

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'audit_logs', 'security_events', 
    'blocked_ips', 'alert_configurations', 
    'security_metrics', 'alert_history'
);
```

**Expected Result:** All 7 tables should be listed.

### Step 5: Set Up Row Level Security (RLS)

Verify RLS is enabled:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'audit_logs', 'security_events', 'blocked_ips',
    'alert_configurations', 'security_metrics'
);
```

**Expected Result:** `rowsecurity` should be `true` for all tables.

---

## 🔐 Environment Configuration

### Step 1: Create Environment Files

Create the following files in your project root:

#### `.env.local` (Development)

```bash
# ============================================
# CORE CONFIGURATION
# ============================================

# Next.js Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="Tranquilae Admin"

# ============================================
# SUPABASE CONFIGURATION
# ============================================

# Get these from: Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=eyJ[your-service-role-key]

# Database Connection (for direct queries if needed)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# ============================================
# SECURITY CONFIGURATION
# ============================================

# JWT Secret for additional security
JWT_SECRET=your-super-secure-jwt-secret-minimum-256-bits

# Webhook Security (generate with: openssl rand -hex 32)
WEBHOOK_SECRET=your-webhook-verification-secret

# Session Configuration
SESSION_TIMEOUT_HOURS=8
MAX_FAILED_ATTEMPTS=5
ACCOUNT_LOCKOUT_MINUTES=60

# ============================================
# EMAIL NOTIFICATIONS (RESEND)
# ============================================

# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_[your-resend-api-key]
FROM_EMAIL=security@yourdomain.com
SECURITY_TEAM_EMAIL=security@yourdomain.com

# Email Templates
EMAIL_TEMPLATE_SECURITY_ALERT=security_alert
EMAIL_TEMPLATE_CRITICAL_INCIDENT=critical_incident
EMAIL_TEMPLATE_EMERGENCY_RESPONSE=emergency_response

# ============================================
# SMS NOTIFICATIONS (TWILIO) - OPTIONAL
# ============================================

# Get from: https://console.twilio.com/
TWILIO_ACCOUNT_SID=AC[your-account-sid]
TWILIO_AUTH_TOKEN=[your-auth-token]
TWILIO_PHONE_NUMBER=+1234567890

# SMS Recipients
ADMIN_PHONE=+1234567890
EMERGENCY_CONTACT=+1987654321

# ============================================
# WEBHOOK NOTIFICATIONS - OPTIONAL
# ============================================

# External webhook endpoints
ESCALATION_WEBHOOK_URL=https://your-webhook-service.com/security
INCIDENT_WEBHOOK_URL=https://your-incident-management.com/webhook

# Webhook Headers
WEBHOOK_USER_AGENT=TranquilaeAdmin/1.0
WEBHOOK_TIMEOUT_MS=10000

# ============================================
# SECURITY THRESHOLDS
# ============================================

# IP Blocking Configuration
AUTO_BLOCK_THRESHOLD=5
AUTO_BLOCK_WINDOW_MINUTES=15
DEFAULT_BLOCK_DURATION_MINUTES=60

# API Rate Limiting
API_RATE_LIMIT_REQUESTS=100
API_RATE_LIMIT_WINDOW_MINUTES=15

# Geographic Security
ENABLE_GEO_BLOCKING=false
BLOCKED_COUNTRIES=CN,RU,KP  # ISO country codes

# ============================================
# TESTING CONFIGURATION
# ============================================

# Test Recipients (for system testing)
TEST_EMAIL=test@yourdomain.com
TEST_PHONE_NUMBER=+1234567890
TEST_WEBHOOK_URL=https://httpbin.org/post

# Enable Debug Logging
DEBUG_SECURITY_EVENTS=true
LOG_LEVEL=info

# ============================================
# PRODUCTION OVERRIDES
# ============================================

# Set to 'production' for live environment
NODE_ENV=development

# Production Security Headers
SECURE_HEADERS=true
CSRF_PROTECTION=true
```

#### `.env.production` (Production)

```bash
# ============================================
# PRODUCTION CONFIGURATION
# ============================================

NODE_ENV=production

# Production URLs
NEXT_PUBLIC_SITE_URL=https://admin.yourdomain.com
NEXT_PUBLIC_SITE_NAME="Your App Admin Panel"

# Enhanced Security
SECURE_HEADERS=true
CSRF_PROTECTION=true
DEBUG_SECURITY_EVENTS=false
LOG_LEVEL=error

# Stricter Security Settings
MAX_FAILED_ATTEMPTS=3
ACCOUNT_LOCKOUT_MINUTES=120
SESSION_TIMEOUT_HOURS=4

# Production Rate Limits
API_RATE_LIMIT_REQUESTS=50
API_RATE_LIMIT_WINDOW_MINUTES=15

# All other variables same as .env.local but with production values
```

### Step 2: Secure Environment Variables

#### 2.1 Add to `.gitignore`

```gitignore
# Environment variables
.env
.env.local
.env.development
.env.production
.env.staging

# Logs
logs
*.log

# Security
security-logs/
temp-keys/
```

#### 2.2 Environment Variable Validation

Create `lib/env-validation.ts`:

```typescript
// Validate all required environment variables at startup
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
];

export function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

---

## 📦 Installation & Dependencies

### Step 1: Install Core Dependencies

```bash
# Navigate to your project directory
cd C:\Users\disha\Documents\GitHub\Tranquilae

# Install core packages
npm install @supabase/supabase-js
npm install @supabase/ssr
npm install @supabase/auth-helpers-nextjs

# Install UI components (if using shadcn/ui)
npm install @radix-ui/react-accordion
npm install @radix-ui/react-alert-dialog  
npm install @radix-ui/react-avatar
npm install @radix-ui/react-checkbox
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-label
npm install @radix-ui/react-select
npm install @radix-ui/react-switch
npm install @radix-ui/react-tabs
npm install @radix-ui/react-toast

# Install utility libraries
npm install class-variance-authority
npm install clsx
npm install tailwind-merge
npm install lucide-react
npm install date-fns
npm install recharts
```

### Step 2: Install Security Dependencies

```bash
# Email service
npm install resend

# SMS service (optional)
npm install twilio

# Security utilities
npm install bcryptjs
npm install jsonwebtoken
npm install crypto-js

# Rate limiting
npm install @upstash/redis
npm install @upstash/ratelimit

# Validation
npm install zod
npm install validator
```

### Step 3: Install Development Dependencies

```bash
# TypeScript
npm install --save-dev typescript
npm install --save-dev @types/node
npm install --save-dev @types/react
npm install --save-dev @types/react-dom
npm install --save-dev @types/bcryptjs
npm install --save-dev @types/jsonwebtoken

# Testing
npm install --save-dev jest
npm install --save-dev @testing-library/react
npm install --save-dev @testing-library/jest-dom

# Linting and Formatting
npm install --save-dev eslint
npm install --save-dev prettier
npm install --save-dev eslint-config-prettier
```

### Step 4: Verify Installation

```bash
# Check installed packages
npm list --depth=0

# Verify critical packages
npm list @supabase/supabase-js resend twilio recharts
```

**Expected Output:** All packages should show their version numbers without errors.

---

## 🏗️ Security System Components

### Component Overview

| Component | File Location | Purpose |
|-----------|---------------|---------|
| **Admin Middleware** | `lib/admin-middleware.ts` | Authentication & authorization |
| **Security Monitor** | `lib/security-monitor.ts` | Event detection & logging |
| **Response System** | `lib/security-response-system.ts` | Automated threat responses |
| **Notification Service** | `lib/notification-service.ts` | Multi-channel alerts |
| **Security Dashboard** | `components/admin/SecurityDashboard.tsx` | Admin interface |
| **Integration Layer** | `lib/admin-security-integration.ts` | Route protection |

### File Structure

```
C:\Users\disha\Documents\GitHub\Tranquilae\
├── components/
│   └── admin/
│       └── SecurityDashboard.tsx           # Security monitoring UI
├── lib/
│   ├── admin-middleware.ts                 # Core authentication
│   ├── security-monitor.ts                 # Event detection
│   ├── security-response-system.ts         # Automated responses
│   ├── notification-service.ts             # Alerts & notifications
│   └── admin-security-integration.ts       # Integration helpers
├── app/
│   └── api/
│       └── admin/
│           ├── security/
│           │   ├── events/
│           │   │   └── route.ts           # Security events API
│           │   ├── metrics/
│           │   │   └── route.ts           # Security metrics API
│           │   ├── alerts/
│           │   │   └── route.ts           # Alert config API
│           │   └── blocked-ips/
│           │       └── route.ts           # IP management API
│           ├── auth/
│           │   └── route.ts               # Admin authentication
│           ├── users/
│           │   └── route.ts               # User management
│           └── logs/
│               └── route.ts               # Audit logs
├── documentation/
│   └── full-system-setup.md               # This guide
├── admin-migration.sql                     # Database schema
├── security-monitoring-migration.sql       # Security tables
└── .env.local                             # Environment config
```

---

## ⚙️ Configuration Guide

### Security Monitor Configuration

Edit `lib/security-monitor.ts` to customize detection settings:

```typescript
// Customize threat detection thresholds
const SECURITY_THRESHOLDS = {
  FAILED_LOGIN_THRESHOLD: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5'),
  FAILED_LOGIN_WINDOW: parseInt(process.env.AUTO_BLOCK_WINDOW_MINUTES || '15'),
  AUTO_BLOCK_DURATION: parseInt(process.env.DEFAULT_BLOCK_DURATION_MINUTES || '60'),
  
  // API Rate Limiting
  API_RATE_LIMIT: parseInt(process.env.API_RATE_LIMIT_REQUESTS || '100'),
  API_RATE_WINDOW: parseInt(process.env.API_RATE_LIMIT_WINDOW_MINUTES || '15'),
  
  // Session Security
  SESSION_TIMEOUT: parseInt(process.env.SESSION_TIMEOUT_HOURS || '8') * 60 * 60 * 1000,
  MAX_CONCURRENT_SESSIONS: 3,
  
  // Geographic Security
  ENABLE_GEO_BLOCKING: process.env.ENABLE_GEO_BLOCKING === 'true',
  BLOCKED_COUNTRIES: (process.env.BLOCKED_COUNTRIES || '').split(',').filter(Boolean)
};
```

### Alert Configuration

Configure alert rules in the database:

```sql
-- Update alert thresholds
UPDATE alert_configurations 
SET threshold_count = 3, threshold_window_minutes = 5 
WHERE name = 'Failed Login Alerts';

-- Enable/disable specific alerts
UPDATE alert_configurations 
SET enabled = false 
WHERE name = 'Suspicious Activity';

-- Update notification channels
UPDATE alert_configurations 
SET alert_channels = '["email", "webhook"]'::jsonb,
    recipients = '["admin@yourdomain.com", "https://your-webhook.com"]'::jsonb
WHERE name = 'Brute Force Detection';
```

### Response System Configuration

Customize automated responses in `lib/security-response-system.ts`:

```typescript
// Configure escalation levels
private initializeEscalationLevels(): void {
  this.escalationLevels = [
    {
      level: 1,
      name: 'Security Team Alert',
      triggerConditions: ['multiple_admin_failures', 'suspicious_activity'],
      notifications: {
        channels: ['email'],
        recipients: [process.env.SECURITY_TEAM_EMAIL!],
        template: 'security_alert'
      },
      autoActions: [],
      requiresHumanIntervention: false,
      timeoutMinutes: 30
    },
    {
      level: 2,
      name: 'Critical Security Incident',
      triggerConditions: ['critical_severity', 'privilege_escalation'],
      notifications: {
        channels: ['email', 'webhook', 'sms'],
        recipients: [
          process.env.SECURITY_TEAM_EMAIL!,
          process.env.ADMIN_PHONE!
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
    }
  ];
}
```

### Notification Templates

Customize email templates in `lib/notification-service.ts`:

```typescript
// Customize email styling and content
const emailHtml = html || `
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🚨 ${process.env.NEXT_PUBLIC_SITE_NAME} Security Alert</h1>
        </div>
        <!-- Add your custom content here -->
      </div>
    </body>
  </html>
`;
```

---

## 🔗 API Routes Setup

### Step 1: Create API Directory Structure

```bash
# Create API directories
mkdir -p app/api/admin/security/events
mkdir -p app/api/admin/security/metrics  
mkdir -p app/api/admin/security/alerts
mkdir -p app/api/admin/security/blocked-ips
mkdir -p app/api/admin/auth
mkdir -p app/api/admin/users
mkdir -p app/api/admin/logs
```

### Step 2: Security Events API

Create `app/api/admin/security/events/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withSecurityMonitoring } from '@/lib/admin-security-integration';
import { securityMonitor } from '@/lib/security-monitor';

export const GET = withSecurityMonitoring(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const eventType = searchParams.get('eventType') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const resolved = searchParams.get('resolved') === 'true' ? true : 
                    searchParams.get('resolved') === 'false' ? false : undefined;

    const events = await securityMonitor.getSecurityEvents(
      limit, 
      eventType as any, 
      severity as any, 
      resolved
    );

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching security events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security events' }, 
      { status: 500 }
    );
  }
});

export const POST = withSecurityMonitoring(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const eventId = await securityMonitor.logSecurityEvent(body);
    return NextResponse.json({ success: true, eventId });
  } catch (error) {
    console.error('Error creating security event:', error);
    return NextResponse.json(
      { error: 'Failed to create security event' }, 
      { status: 500 }
    );
  }
});
```

### Step 3: Security Metrics API

Create `app/api/admin/security/metrics/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withSecurityMonitoring } from '@/lib/admin-security-integration';
import { securityMonitor } from '@/lib/security-monitor';

export const GET = withSecurityMonitoring(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const metrics = await securityMonitor.getSecurityDashboardStats(days);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security metrics' }, 
      { status: 500 }
    );
  }
});
```

### Step 4: Alert Configuration API

Create `app/api/admin/security/alerts/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withSecurityMonitoring } from '@/lib/admin-security-integration';
import { securityMonitor } from '@/lib/security-monitor';

export const GET = withSecurityMonitoring(async (request: NextRequest) => {
  try {
    const configs = await securityMonitor.getAlertConfigurations();
    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching alert configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert configurations' }, 
      { status: 500 }
    );
  }
}, { requireSuperAdmin: true });

export const PUT = withSecurityMonitoring(async (request: NextRequest) => {
  try {
    const config = await request.json();
    await securityMonitor.updateAlertConfiguration(config);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating alert configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update alert configuration' }, 
      { status: 500 }
    );
  }
}, { requireSuperAdmin: true });
```

### Step 5: Blocked IPs API

Create `app/api/admin/security/blocked-ips/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withSecurityMonitoring } from '@/lib/admin-security-integration';
import { createServiceClient } from '@/lib/admin-middleware';

export const GET = withSecurityMonitoring(async (request: NextRequest) => {
  try {
    const supabase = createServiceClient();
    
    const { data: blockedIPs, error } = await supabase
      .from('blocked_ips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(blockedIPs || []);
  } catch (error) {
    console.error('Error fetching blocked IPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked IPs' }, 
      { status: 500 }
    );
  }
});

export const POST = withSecurityMonitoring(async (request: NextRequest) => {
  try {
    const { ipAddress, reason, duration, blockType } = await request.json();
    const user = (request as any).user;
    
    const supabase = createServiceClient();
    
    const blockId = await supabase.rpc('block_ip_address', {
      p_ip_address: ipAddress,
      p_block_type: blockType || 'temporary',
      p_reason: reason,
      p_duration_minutes: duration || 60,
      p_created_by: user.id
    });

    return NextResponse.json({ success: true, blockId });
  } catch (error) {
    console.error('Error blocking IP:', error);
    return NextResponse.json(
      { error: 'Failed to block IP' }, 
      { status: 500 }
    );
  }
}, { requireSuperAdmin: true });
```

### Step 6: Event Resolution API

Create `app/api/admin/security/events/[eventId]/resolve/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withSecurityMonitoring } from '@/lib/admin-security-integration';
import { securityMonitor } from '@/lib/security-monitor';

export const POST = withSecurityMonitoring(async (
  request: NextRequest,
  { params }: { params: { eventId: string } }
) => {
  try {
    const user = (request as any).user;
    await securityMonitor.resolveSecurityEvent(params.eventId, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resolving security event:', error);
    return NextResponse.json(
      { error: 'Failed to resolve security event' }, 
      { status: 500 }
    );
  }
});
```

---

## 🎨 Frontend Integration

### Step 1: Add Security Dashboard to Admin Layout

Create or update `app/admin/layout.tsx`:

```typescript
import { Suspense } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
```

### Step 2: Create Security Dashboard Page

Create `app/admin/security/page.tsx`:

```typescript
import { Suspense } from 'react';
import SecurityDashboard from '@/components/admin/SecurityDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Center</h1>
          <p className="text-muted-foreground">
            Monitor security events, manage threats, and configure alerts
          </p>
        </div>
      </div>

      <Suspense fallback={
        <Card>
          <CardHeader>
            <CardTitle>Loading Security Dashboard...</CardTitle>
            <CardDescription>Please wait while we fetch the latest security data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <SecurityDashboard />
      </Suspense>
    </div>
  );
}
```

### Step 3: Update Admin Sidebar Navigation

Update your admin sidebar to include security navigation:

```typescript
// components/admin/AdminSidebar.tsx
import { Shield, Users, Settings, BarChart3, Activity } from 'lucide-react';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Security',
    href: '/admin/security',
    icon: Shield,
    badge: 'New',
  },
  {
    title: 'Activity Logs',
    href: '/admin/logs',
    icon: Activity,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];
```

### Step 4: Add Real-time Updates

Create `hooks/useSecurityData.ts`:

```typescript
import { useState, useEffect } from 'react';

export function useSecurityData(refreshInterval = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const [metricsRes, eventsRes, alertsRes, blockedRes] = await Promise.all([
        fetch('/api/admin/security/metrics'),
        fetch('/api/admin/security/events?limit=50'),
        fetch('/api/admin/security/alerts'),
        fetch('/api/admin/security/blocked-ips')
      ]);

      const [metrics, events, alerts, blocked] = await Promise.all([
        metricsRes.json(),
        eventsRes.json(),
        alertsRes.json(),
        blockedRes.json()
      ]);

      setData({ metrics, events, alerts, blocked });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}
```

---

## 🧪 Testing & Validation

### Step 1: Environment Validation Test

Create `scripts/test-environment.js`:

```javascript
#!/usr/bin/env node

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
];

const optionalEnvVars = [
  'RESEND_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN'
];

console.log('🔍 Environment Validation Test\n');

let hasErrors = false;

// Check required variables
console.log('Required Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    hasErrors = true;
  }
});

console.log('\nOptional Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`⚠️  ${varName}: Not configured`);
  }
});

if (hasErrors) {
  console.log('\n❌ Environment validation failed. Please check your .env.local file.');
  process.exit(1);
} else {
  console.log('\n✅ Environment validation passed!');
}
```

### Step 2: Database Connection Test

Create `scripts/test-database.js`:

```javascript
#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function testDatabaseConnection() {
  console.log('🔍 Database Connection Test\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Test basic connection
    console.log('Testing basic connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Basic connection successful');

    // Test security tables
    console.log('\nTesting security tables...');
    const tables = [
      'security_events',
      'blocked_ips', 
      'alert_configurations',
      'security_metrics',
      'alert_history'
    ];

    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (tableError) {
        console.log(`❌ Table '${table}': ${tableError.message}`);
      } else {
        console.log(`✅ Table '${table}': Accessible`);
      }
    }

    // Test security functions
    console.log('\nTesting security functions...');
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_security_dashboard_stats', { p_days: 7 });
    
    if (statsError) {
      console.log(`❌ Function 'get_security_dashboard_stats': ${statsError.message}`);
    } else {
      console.log('✅ Function \'get_security_dashboard_stats\': Working');
      console.log(`   Sample data:`, statsData);
    }

    console.log('\n✅ Database tests completed successfully!');
    
  } catch (error) {
    console.log(`\n❌ Database test failed: ${error.message}`);
    process.exit(1);
  }
}

testDatabaseConnection();
```

### Step 3: Security System Test

Create `scripts/test-security.js`:

```javascript
#!/usr/bin/env node

const { testSecuritySystem } = require('../lib/admin-security-integration.ts');

async function runSecurityTests() {
  console.log('🔍 Security System Test\n');
  
  try {
    const result = await testSecuritySystem();
    
    if (result.success) {
      console.log('✅ Security system tests passed!');
      console.log('\nTest Results:');
      result.results.forEach(test => {
        console.log(`  ✅ ${test.test}: ${test.status}`);
      });
    } else {
      console.log('❌ Security system tests failed!');
      console.log('Error:', result.results.error);
    }
    
  } catch (error) {
    console.log(`❌ Security test error: ${error.message}`);
  }
}

runSecurityTests();
```

### Step 4: Notification Test

Create `scripts/test-notifications.js`:

```javascript
#!/usr/bin/env node

const { testNotificationChannels } = require('../lib/notification-service.ts');

async function testNotifications() {
  console.log('🔍 Notification System Test\n');
  
  try {
    const results = await testNotificationChannels();
    
    console.log('Email Test:');
    if (results.email.success) {
      console.log(`✅ Email sent successfully (ID: ${results.email.messageId})`);
    } else {
      console.log(`❌ Email failed: ${results.email.error}`);
    }

    console.log('\nWebhook Test:');
    if (results.webhook.success) {
      console.log(`✅ Webhook sent successfully (ID: ${results.webhook.messageId})`);
    } else {
      console.log(`❌ Webhook failed: ${results.webhook.error}`);
    }

    console.log('\nSMS Test:');
    if (results.sms.success) {
      console.log(`✅ SMS sent successfully (ID: ${results.sms.messageId})`);
    } else {
      console.log(`❌ SMS failed: ${results.sms.error}`);
    }
    
  } catch (error) {
    console.log(`❌ Notification test error: ${error.message}`);
  }
}

testNotifications();
```

### Step 5: Run All Tests

Add to your `package.json`:

```json
{
  "scripts": {
    "test:env": "node scripts/test-environment.js",
    "test:db": "node scripts/test-database.js", 
    "test:security": "node scripts/test-security.js",
    "test:notifications": "node scripts/test-notifications.js",
    "test:all": "npm run test:env && npm run test:db && npm run test:security && npm run test:notifications"
  }
}
```

Run the tests:

```bash
# Test everything
npm run test:all

# Or run individual tests
npm run test:env
npm run test:db
npm run test:security
npm run test:notifications
```

---

## 🚀 Deployment Guide

### Vercel Deployment

#### Step 1: Prepare for Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Initialize project
vercel
```

#### Step 2: Configure Environment Variables

In Vercel Dashboard:

1. Go to **Settings > Environment Variables**
2. Add all variables from your `.env.local`:

```bash
# Required for all environments
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret

# Production-specific
RESEND_API_KEY=your-production-resend-key
TWILIO_ACCOUNT_SID=your-production-twilio-sid
SECURITY_TEAM_EMAIL=security@yourdomain.com
NEXT_PUBLIC_SITE_URL=https://admin.yourdomain.com
```

#### Step 3: Deploy

```bash
# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

### Railway Deployment

#### Step 1: Connect Repository

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Connect your GitHub repository

#### Step 2: Configure Environment

In Railway Dashboard:
1. Go to **Variables** tab
2. Add all environment variables
3. Set `NODE_ENV=production`

#### Step 3: Configure Build

Create `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### Netlify Deployment

#### Step 1: Build Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[headers]]
  for = "/api/*"
  [headers.values]
    X-Robots-Tag = "noindex"
    X-Frame-Options = "DENY" 
    X-Content-Type-Options = "nosniff"
```

#### Step 2: Environment Setup

In Netlify Dashboard:
1. Go to **Site Settings > Environment Variables**
2. Add all production variables

### Docker Deployment

#### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed  
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### Step 2: Build and Deploy

```bash
# Build image
docker build -t tranquilae-admin .

# Run container
docker run -p 3000:3000 --env-file .env.production tranquilae-admin
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Database Connection Issues

**Problem:** `Error: Could not connect to database`

**Solutions:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection manually
npm run test:db

# Verify Supabase project status
# Go to Supabase Dashboard > Settings > Database
# Check if project is paused or has issues
```

**Checklist:**
- ✅ Supabase project is active (not paused)
- ✅ Environment variables are correctly set
- ✅ Service role key has proper permissions
- ✅ Database migrations have been run

#### 2. Authentication Failures

**Problem:** `Error: Invalid JWT token`

**Solutions:**
```bash
# Check JWT secret
echo $JWT_SECRET

# Verify JWT secret length (minimum 256 bits)
node -e "console.log(process.env.JWT_SECRET.length >= 32)"

# Clear browser cookies and localStorage
# In browser console:
localStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

**Checklist:**
- ✅ JWT_SECRET is at least 32 characters
- ✅ Supabase anon key is correct
- ✅ User has proper role (admin/super_admin)
- ✅ User status is 'active'

#### 3. Email Notifications Not Working

**Problem:** `Error: Failed to send email alert`

**Solutions:**
```bash
# Test Resend API key
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "test@yourapp.com",
    "to": ["test@example.com"],
    "subject": "Test Email",
    "html": "<p>Test message</p>"
  }'

# Test notification system
npm run test:notifications
```

**Checklist:**
- ✅ RESEND_API_KEY is valid and active
- ✅ FROM_EMAIL is verified in Resend dashboard
- ✅ Recipient emails are valid
- ✅ No rate limiting issues

#### 4. SMS Notifications Not Working

**Problem:** `Error: Failed to send SMS alert`

**Solutions:**
```bash
# Verify Twilio credentials
curl -X GET 'https://api.twilio.com/2010-04-01/Accounts/YOUR_SID.json' \
  -u YOUR_SID:YOUR_AUTH_TOKEN

# Check phone number format
node -e "
const phone = '+1234567890';
console.log('Valid format:', /^\+[1-9]\d{1,14}$/.test(phone));
"
```

**Checklist:**
- ✅ TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct
- ✅ TWILIO_PHONE_NUMBER is verified in Twilio console
- ✅ Recipient phone numbers are in E.164 format (+1234567890)
- ✅ Account has sufficient credits

#### 5. Security Events Not Logging

**Problem:** Security events not appearing in dashboard

**Solutions:**
```sql
-- Check if security_events table exists and has data
SELECT COUNT(*) FROM security_events;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'security_events';

-- Test logging function
SELECT log_security_event(
  'test_event',
  'low', 
  null,
  '127.0.0.1'::inet,
  'test-agent',
  '{}'::jsonb,
  'Test event'
);
```

**Checklist:**
- ✅ Database migration completed successfully
- ✅ RLS policies are properly configured
- ✅ Service role key has database permissions
- ✅ Security monitor is initialized

#### 6. IP Blocking Not Working

**Problem:** IPs not being blocked after failed attempts

**Solutions:**
```sql
-- Check blocked_ips table
SELECT * FROM blocked_ips ORDER BY created_at DESC LIMIT 5;

-- Test IP blocking function
SELECT block_ip_address(
  '192.168.1.100'::inet,
  'temporary',
  'Test block',
  60
);

-- Check if IP is blocked
SELECT is_ip_blocked('192.168.1.100'::inet);
```

**Checklist:**
- ✅ `handle_failed_login` function is working
- ✅ Threshold settings are correct
- ✅ IP blocking logic is enabled
- ✅ No whitelist preventing blocks

#### 7. Dashboard Not Loading

**Problem:** Security dashboard shows loading indefinitely

**Solutions:**
```bash
# Check API routes
curl http://localhost:3000/api/admin/security/metrics
curl http://localhost:3000/api/admin/security/events

# Check browser console for errors
# Press F12 > Console tab

# Check Next.js logs
npm run dev
# Look for API errors in terminal
```

**Checklist:**
- ✅ All API routes are properly configured
- ✅ Authentication middleware is working
- ✅ User has admin permissions
- ✅ No JavaScript errors in browser console

#### 8. High Memory Usage

**Problem:** Application using excessive memory

**Solutions:**
```bash
# Monitor memory usage
node --inspect your-app.js
# Open chrome://inspect in Chrome

# Reduce security event retention
DELETE FROM security_events 
WHERE created_at < NOW() - INTERVAL '30 days';

# Optimize queries
EXPLAIN ANALYZE SELECT * FROM security_events 
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Optimizations:**
- ✅ Implement event archiving (move old events to separate table)
- ✅ Add database indexes for common queries
- ✅ Limit real-time updates frequency
- ✅ Use pagination for large datasets

### Debug Mode

Enable debug logging by adding to `.env.local`:

```bash
# Enable detailed logging
DEBUG_SECURITY_EVENTS=true
LOG_LEVEL=debug

# Enable SQL query logging
SUPABASE_DEBUG=true
```

View logs:

```bash
# Development
npm run dev

# Production (if using PM2)
pm2 logs your-app-name

# Docker
docker logs your-container-name
```

### Performance Monitoring

Monitor system performance:

```sql
-- Check database performance
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Check slow queries
SELECT 
  query,
  mean_time,
  calls,
  total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 🛡️ Security Best Practices

### 1. Environment Security

```bash
# Use strong secrets (minimum 32 characters)
JWT_SECRET=$(openssl rand -hex 32)
WEBHOOK_SECRET=$(openssl rand -hex 32)

# Restrict environment access
chmod 600 .env.local
echo ".env*" >> .gitignore

# Use different secrets for different environments
```

### 2. Database Security

```sql
-- Regular security audits
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Monitor failed connections
SELECT * FROM pg_stat_database WHERE numbackends > 0;

-- Regular backup verification
pg_dump --host=your-host --port=5432 --username=postgres --dbname=postgres --no-password --clean --create --verbose --file=backup.sql
```

### 3. API Security

```typescript
// Rate limiting per endpoint
const rateLimits = {
  '/api/admin/auth': { requests: 5, window: '15m' },
  '/api/admin/users': { requests: 100, window: '15m' },
  '/api/admin/security': { requests: 50, window: '15m' }
};

// Input validation
import { z } from 'zod';

const securityEventSchema = z.object({
  eventType: z.enum(['failed_login', 'suspicious_activity', ...]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(1).max(1000),
  ipAddress: z.string().ip().optional()
});
```

### 4. Frontend Security

```typescript
// Sanitize user inputs
import DOMPurify from 'dompurify';

const sanitizedInput = DOMPurify.sanitize(userInput);

// Content Security Policy
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;
```

### 5. Monitoring Security

```typescript
// Regular security health checks
export async function securityHealthCheck() {
  const checks = [
    { name: 'Database Connection', test: () => testDatabaseConnection() },
    { name: 'Alert System', test: () => testAlertSystem() },
    { name: 'IP Blocking', test: () => testIPBlocking() },
    { name: 'Event Logging', test: () => testEventLogging() }
  ];

  const results = await Promise.allSettled(
    checks.map(async check => ({
      name: check.name,
      status: await check.test() ? 'healthy' : 'unhealthy'
    }))
  );

  return results;
}
```

### 6. Incident Response Plan

```markdown
## Security Incident Response

### Level 1 - Low Priority
- Monitor for patterns
- Log for investigation
- No immediate action required

### Level 2 - Medium Priority  
- Alert security team within 30 minutes
- Begin investigation
- Document findings

### Level 3 - High Priority
- Alert security team within 15 minutes
- Potential system lockdown
- External communication may be needed

### Level 4 - Critical Priority
- Immediate response required (5 minutes)
- Full system lockdown
- Executive notification
- External authorities if data breach
```

---

## 📊 Monitoring & Maintenance

### Daily Tasks

```bash
# Check system health
npm run test:env
npm run test:db

# Review security events
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/security/events?limit=50"

# Monitor blocked IPs  
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/security/blocked-ips"
```

### Weekly Tasks

```sql
-- Clean old security events (keep last 90 days)
DELETE FROM security_events 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Archive old audit logs
INSERT INTO audit_logs_archive 
SELECT * FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '1 year';

-- Update security statistics
REFRESH MATERIALIZED VIEW security_summary_stats;

-- Check database performance
SELECT 
  schemaname,
  tablename, 
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables 
WHERE schemaname = 'public';
```

### Monthly Tasks

- Review and update alert configurations
- Analyze security trends and patterns  
- Update threat detection rules
- Review user permissions and roles
- Test disaster recovery procedures
- Update security documentation
- Review and rotate API keys

### Automated Monitoring

Create monitoring scripts:

```bash
# Create monitoring directory
mkdir -p scripts/monitoring

# System health monitor
cat > scripts/monitoring/health-check.sh << 'EOF'
#!/bin/bash

echo "Security System Health Check - $(date)"
echo "==========================================="

# Check critical services
npm run test:env || echo "❌ Environment check failed"
npm run test:db || echo "❌ Database check failed"  
npm run test:notifications || echo "❌ Notifications check failed"

# Check disk space
df -h | grep -E "/$|/var|/tmp"

# Check memory usage
free -h

# Check recent security events
echo "Recent Critical Events:"
psql $DATABASE_URL -c "
  SELECT created_at, event_type, description 
  FROM security_events 
  WHERE severity = 'critical' 
  AND created_at > NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC 
  LIMIT 5;
"

echo "Health check completed at $(date)"
EOF

chmod +x scripts/monitoring/health-check.sh
```

### Performance Optimization

```sql
-- Create performance monitoring view
CREATE OR REPLACE VIEW security_performance_stats AS
SELECT 
  DATE(created_at) as date,
  event_type,
  COUNT(*) as event_count,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_resolution_time
FROM security_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), event_type
ORDER BY date DESC, event_count DESC;

-- Index optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_created_type 
ON security_events (created_at DESC, event_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_severity_unresolved
ON security_events (severity, resolved) 
WHERE resolved = false;
```

### Alerting Setup

Configure system-level alerts:

```yaml
# alerts.yml - for use with monitoring systems like Prometheus
groups:
  - name: security_system
    rules:
      - alert: HighFailedLoginRate
        expr: rate(failed_logins_total[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: High failed login rate detected

      - alert: CriticalSecurityEvent
        expr: critical_security_events_total > 0
        for: 0s
        labels:
          severity: critical
        annotations:
          summary: Critical security event occurred

      - alert: DatabaseConnectionFailure
        expr: database_connection_status == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: Database connection failed
```

---

## 📞 Support & Resources

### Documentation Links

- **Supabase Documentation:** [supabase.com/docs](https://supabase.com/docs)
- **Next.js Documentation:** [nextjs.org/docs](https://nextjs.org/docs)
- **Resend API Documentation:** [resend.com/docs](https://resend.com/docs)
- **Twilio API Documentation:** [twilio.com/docs](https://twilio.com/docs)

### Community Resources

- **Next.js Discord:** [discord.gg/nextjs](https://discord.gg/nextjs)
- **Supabase Discord:** [discord.supabase.com](https://discord.supabase.com)
- **GitHub Discussions:** Create issues in your repository

### Emergency Contacts

Update these with your team's contact information:

```bash
# Emergency Response Team
SECURITY_TEAM_EMAIL=security@yourdomain.com
ADMIN_PHONE=+1234567890
EMERGENCY_CONTACT=emergency@yourdomain.com

# Escalation Contacts
CTO_EMAIL=cto@yourdomain.com
CEO_PHONE=+1987654321

# External Resources
HOSTING_SUPPORT=support@vercel.com
DATABASE_SUPPORT=support@supabase.com
```

### Backup & Recovery

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
gzip $BACKUP_FILE

# Upload to cloud storage
aws s3 cp ${BACKUP_FILE}.gz s3://your-backup-bucket/database/

echo "Backup completed: ${BACKUP_FILE}.gz"
```

---

## ✅ Final Checklist

Before going live, verify all items:

### Pre-Production Checklist

- [ ] **Database Setup**
  - [ ] All migrations executed successfully
  - [ ] RLS policies enabled and tested
  - [ ] Default data inserted
  - [ ] Performance indexes created

- [ ] **Environment Configuration**
  - [ ] All required environment variables set
  - [ ] Production secrets generated and secured
  - [ ] API keys active and properly scoped
  - [ ] CORS settings configured

- [ ] **Security System**
  - [ ] Event detection working
  - [ ] IP blocking functional
  - [ ] Alert system configured
  - [ ] Dashboard accessible

- [ ] **Testing**
  - [ ] All tests passing
  - [ ] Security system tested
  - [ ] Notification channels verified
  - [ ] Performance validated

- [ ] **Deployment**
  - [ ] Production environment configured
  - [ ] Domain and SSL configured
  - [ ] Monitoring enabled
  - [ ] Backup system active

- [ ] **Documentation**
  - [ ] Team trained on system usage
  - [ ] Incident response plan defined
  - [ ] Emergency contacts updated
  - [ ] Runbook procedures documented

### Go-Live Checklist

- [ ] Final security scan completed
- [ ] Load testing performed
- [ ] Disaster recovery tested
- [ ] Monitoring alerts configured
- [ ] Support team briefed
- [ ] Rollback plan prepared

---

**🎉 Congratulations! Your security system is ready for production.**

For ongoing support and updates, maintain regular monitoring and keep this documentation current as your system evolves.

---

*Last updated: September 2025*  
*Version: 1.0*  
*Next review date: December 2025*
