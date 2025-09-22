#!/usr/bin/env node

/**
 * 🔒 Security Hardening Script
 * Automated security hardening for production deployment
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

class SecurityHardening {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      fixes: []
    };
  }

  async run() {
    log('🔒 Starting Security Hardening Process...', 'purple');
    log('==========================================', 'purple');
    
    await this.checkEnvironmentSecurity();
    await this.hardenNextJSConfig();
    await this.createSecurityHeaders();
    await this.setupRateLimiting();
    await this.createSecurityMiddleware();
    await this.validateAdminSecurity();
    await this.setupSecurityLogging();
    await this.createSecurityTests();
    
    this.generateReport();
  }

  async checkEnvironmentSecurity() {
    info('Step 1: Environment Security Validation');
    
    // Check if .env.local exists and is secure
    if (fs.existsSync('.env.local')) {
      const envContent = fs.readFileSync('.env.local', 'utf8');
      
      // Check for insecure values
      const insecurePatterns = [
        { pattern: /your-.*/, message: 'Template values found' },
        { pattern: /test.*secret/, message: 'Test secrets in production' },
        { pattern: /localhost/, message: 'Localhost URLs in production' },
        { pattern: /sk_test_/, message: 'Stripe test keys detected' },
        { pattern: /pk_test_/, message: 'Stripe test publishable keys detected' }
      ];
      
      let securityIssues = [];
      insecurePatterns.forEach(({ pattern, message }) => {
        if (pattern.test(envContent)) {
          securityIssues.push(message);
        }
      });
      
      if (securityIssues.length > 0) {
        warning('Environment security issues found:');
        securityIssues.forEach(issue => log(`  - ${issue}`, 'red'));
        this.results.warnings += securityIssues.length;
      } else {
        success('Environment variables appear secure');
        this.results.passed++;
      }
    } else {
      warning('.env.local not found - creating template');
      this.createSecureEnvTemplate();
      this.results.warnings++;
    }
  }

  async hardenNextJSConfig() {
    info('Step 2: Next.js Configuration Hardening');
    
    const nextConfigPath = 'next.config.js';
    const secureNextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@sentry/nextjs']
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.openai.com;"
          }
        ]
      },
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      }
    ];
  },

  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true
      }
    ];
  },

  // Image optimization security
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    formats: ['image/webp', 'image/avif']
  },

  // Webpack configuration for security
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Production optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true
};

module.exports = nextConfig;`;

    try {
      fs.writeFileSync(nextConfigPath, secureNextConfig);
      success('Next.js configuration hardened');
      this.results.passed++;
      this.results.fixes.push('Created secure Next.js configuration');
    } catch (error) {
      error(`Failed to create Next.js config: ${error.message}`);
      this.results.failed++;
    }
  }

  async createSecurityHeaders() {
    info('Step 3: Security Headers Implementation');
    
    const securityHeadersPath = 'lib/security-headers.ts';
    const securityHeadersContent = `/**
 * Security Headers Configuration
 * Implements comprehensive security headers for production
 */

export const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Strict transport security
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // Content security policy
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.openai.com;"
};

export const adminSecurityHeaders = {
  ...securityHeaders,
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-cache, no-store, must-revalidate'
};

export function applySecurityHeaders(response: Response): Response {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function applyAdminSecurityHeaders(response: Response): Response {
  Object.entries(adminSecurityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}`;

    try {
      if (!fs.existsSync('lib')) {
        fs.mkdirSync('lib', { recursive: true });
      }
      fs.writeFileSync(securityHeadersPath, securityHeadersContent);
      success('Security headers configuration created');
      this.results.passed++;
      this.results.fixes.push('Implemented comprehensive security headers');
    } catch (error) {
      error(`Failed to create security headers: ${error.message}`);
      this.results.failed++;
    }
  }

  async setupRateLimiting() {
    info('Step 4: Rate Limiting Implementation');
    
    const rateLimitPath = 'lib/rate-limit.ts';
    const rateLimitContent = `/**
 * Rate Limiting Implementation
 * Protects against brute force attacks and API abuse
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;
  
  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  private getKey(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0] || req.ip || 'unknown';
    return ip;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  public checkRateLimit(req: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanup();
    
    const key = this.getKey(req);
    const now = Date.now();
    
    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: this.store[key].resetTime
      };
    }
    
    this.store[key].count++;
    
    return {
      allowed: this.store[key].count <= this.maxRequests,
      remaining: Math.max(0, this.maxRequests - this.store[key].count),
      resetTime: this.store[key].resetTime
    };
  }
}

// Different rate limiters for different endpoints
export const generalRateLimiter = new RateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authRateLimiter = new RateLimiter(15 * 60 * 1000, 10); // 10 auth attempts per 15 minutes
export const adminRateLimiter = new RateLimiter(5 * 60 * 1000, 50); // 50 admin requests per 5 minutes

export function withRateLimit(rateLimiter: RateLimiter) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest): Promise<NextResponse> => {
      const { allowed, remaining, resetTime } = rateLimiter.checkRateLimit(req);
      
      if (!allowed) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Too many requests',
            retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': new Date(resetTime).toISOString(),
              'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
            }
          }
        );
      }
      
      const response = await handler(req);
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
      
      return response;
    };
  };
}`;

    try {
      fs.writeFileSync(rateLimitPath, rateLimitContent);
      success('Rate limiting implementation created');
      this.results.passed++;
      this.results.fixes.push('Implemented rate limiting for API protection');
    } catch (error) {
      error(`Failed to create rate limiting: ${error.message}`);
      this.results.failed++;
    }
  }

  async createSecurityMiddleware() {
    info('Step 5: Enhanced Security Middleware');
    
    const middlewarePath = 'middleware.ts';
    const middlewareContent = `import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { applySecurityHeaders, applyAdminSecurityHeaders } from './lib/security-headers';
import { generalRateLimiter, adminRateLimiter } from './lib/rate-limit';

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];
const SUPER_ADMIN_USER_IDS = process.env.SUPER_ADMIN_USER_IDS?.split(',') || [];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();
  
  // Apply general security headers
  response = applySecurityHeaders(response);
  
  // Rate limiting
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') || 
                      request.nextUrl.pathname.startsWith('/api/admin');
  
  const rateLimiter = isAdminRoute ? adminRateLimiter : generalRateLimiter;
  const { allowed, remaining, resetTime } = rateLimiter.checkRateLimit(request);
  
  if (!allowed) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
        }
      }
    );
  }

  // Admin route protection
  if (isAdminRoute) {
    response = applyAdminSecurityHeaders(response);
    
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Check authentication
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Log security events
    const logSecurityEvent = async (event: string, userId?: string, details?: any) => {
      try {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          event,
          userId: userId || 'anonymous',
          ip: request.ip || request.headers.get('x-forwarded-for'),
          userAgent: request.headers.get('user-agent'),
          path: request.nextUrl.pathname,
          details
        }));
      } catch (error) {
        console.error('Failed to log security event:', error);
      }
    };

    if (error || !user) {
      await logSecurityEvent('admin_access_denied_unauthenticated');
      return NextResponse.redirect(new URL(\`/auth/login?redirectTo=\${request.nextUrl.pathname}\`, request.url));
    }

    // Check admin permissions
    const isAdmin = ADMIN_USER_IDS.includes(user.id);
    const isSuperAdmin = SUPER_ADMIN_USER_IDS.includes(user.id);
    
    if (!isAdmin) {
      await logSecurityEvent('admin_access_denied_unauthorized', user.id, {
        attemptedPath: request.nextUrl.pathname
      });
      return NextResponse.redirect(new URL('/403', request.url));
    }

    // Super admin route protection
    if (request.nextUrl.pathname.startsWith('/admin/settings') && !isSuperAdmin) {
      await logSecurityEvent('super_admin_access_denied', user.id, {
        attemptedPath: request.nextUrl.pathname
      });
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Log successful admin access
    await logSecurityEvent('admin_access_granted', user.id, {
      role: isSuperAdmin ? 'super_admin' : 'admin',
      path: request.nextUrl.pathname
    });

    // Add user context to response headers (for debugging)
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('X-User-Role', isSuperAdmin ? 'super_admin' : 'admin');
      response.headers.set('X-User-ID', user.id);
    }
  }

  // Add rate limit headers
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};`;

    try {
      fs.writeFileSync(middlewarePath, middlewareContent);
      success('Enhanced security middleware created');
      this.results.passed++;
      this.results.fixes.push('Enhanced middleware with security logging and rate limiting');
    } catch (error) {
      error(`Failed to create security middleware: ${error.message}`);
      this.results.failed++;
    }
  }

  async validateAdminSecurity() {
    info('Step 6: Admin Security Validation');
    
    // Check if admin user IDs are configured
    const envFile = '.env.local';
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      
      const hasAdminIds = /ADMIN_USER_IDS=/.test(envContent);
      const hasSuperAdminIds = /SUPER_ADMIN_USER_IDS=/.test(envContent);
      const hasServiceKey = /SUPABASE_SERVICE_ROLE_KEY=/.test(envContent);
      
      if (hasAdminIds && hasSuperAdminIds && hasServiceKey) {
        success('Admin security configuration found');
        this.results.passed++;
      } else {
        warning('Admin security configuration incomplete');
        this.results.warnings++;
      }
    } else {
      warning('Environment file not found for admin validation');
      this.results.warnings++;
    }
  }

  async setupSecurityLogging() {
    info('Step 7: Security Logging Setup');
    
    const securityLoggerPath = 'lib/security-logger.ts';
    const securityLoggerContent = `/**
 * Security Event Logging
 * Centralized logging for security events and audit trail
 */

export interface SecurityEvent {
  timestamp: string;
  event: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityLogger {
  private static instance: SecurityLogger;

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  async logEvent(event: Partial<SecurityEvent>): Promise<void> {
    const fullEvent: SecurityEvent = {
      timestamp: new Date().toISOString(),
      event: 'unknown',
      severity: 'medium',
      ...event
    };

    try {
      // Console logging (always enabled)
      console.log(\`[SECURITY] \${fullEvent.severity.toUpperCase()}: \${fullEvent.event}\`, {
        ...fullEvent,
        timestamp: undefined // Remove to avoid duplication
      });

      // In production, you might want to send to external logging service
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to Sentry, LogRocket, or custom logging endpoint
        // await this.sendToExternalLogger(fullEvent);
      }

      // Store in database for audit trail
      await this.storeInDatabase(fullEvent);
      
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private async storeInDatabase(event: SecurityEvent): Promise<void> {
    try {
      // This would integrate with your audit logging system
      // For now, we'll just ensure it's logged to console
      if (event.severity === 'high' || event.severity === 'critical') {
        console.warn(\`[CRITICAL SECURITY EVENT] \${event.event}\`, event);
      }
    } catch (error) {
      console.error('Failed to store security event in database:', error);
    }
  }

  // Predefined security event methods
  async adminLoginAttempt(userId: string, success: boolean, ip?: string): Promise<void> {
    await this.logEvent({
      event: success ? 'admin_login_success' : 'admin_login_failure',
      userId,
      ip,
      severity: success ? 'low' : 'medium'
    });
  }

  async unauthorizedAccess(path: string, userId?: string, ip?: string): Promise<void> {
    await this.logEvent({
      event: 'unauthorized_access_attempt',
      userId,
      ip,
      path,
      severity: 'high'
    });
  }

  async rateLimitExceeded(ip?: string, path?: string): Promise<void> {
    await this.logEvent({
      event: 'rate_limit_exceeded',
      ip,
      path,
      severity: 'medium'
    });
  }

  async suspiciousActivity(description: string, userId?: string, ip?: string, details?: Record<string, any>): Promise<void> {
    await this.logEvent({
      event: 'suspicious_activity',
      userId,
      ip,
      details: { description, ...details },
      severity: 'high'
    });
  }
}

export const securityLogger = SecurityLogger.getInstance();

// Utility function for easier usage
export const logSecurityEvent = (event: Partial<SecurityEvent>) => {
  return securityLogger.logEvent(event);
};`;

    try {
      fs.writeFileSync(securityLoggerPath, securityLoggerContent);
      success('Security logging system created');
      this.results.passed++;
      this.results.fixes.push('Implemented comprehensive security logging');
    } catch (error) {
      error(`Failed to create security logging: ${error.message}`);
      this.results.failed++;
    }
  }

  async createSecurityTests() {
    info('Step 8: Security Testing Suite');
    
    const securityTestPath = 'scripts/security-tests.js';
    const securityTestContent = `#!/usr/bin/env node

/**
 * Security Testing Suite
 * Automated security tests for production readiness
 */

const https = require('https');
const http = require('http');

class SecurityTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async runAllTests() {
    console.log('🔒 Running Security Test Suite...');
    console.log('=====================================');
    
    await this.testSecurityHeaders();
    await this.testAdminAccess();
    await this.testRateLimiting();
    await this.testCSP();
    await this.testRedirects();
    
    this.generateReport();
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = \`\${this.baseUrl}\${path}\`;
      const request = (url.startsWith('https:') ? https : http).get(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
      });
      
      request.on('error', reject);
      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async testSecurityHeaders() {
    console.log('🛡️  Testing Security Headers...');
    
    try {
      const response = await this.makeRequest('/');
      const headers = response.headers;
      
      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'strict-transport-security',
        'x-xss-protection'
      ];
      
      let passed = 0;
      requiredHeaders.forEach(header => {
        if (headers[header]) {
          console.log(\`  ✅ \${header}: \${headers[header]}\`);
          passed++;
        } else {
          console.log(\`  ❌ Missing header: \${header}\`);
        }
      });
      
      this.results.push({
        test: 'Security Headers',
        passed: passed,
        total: requiredHeaders.length,
        status: passed === requiredHeaders.length ? 'PASS' : 'FAIL'
      });
      
    } catch (error) {
      console.log(\`  ❌ Failed to test headers: \${error.message}\`);
      this.results.push({ test: 'Security Headers', status: 'ERROR', error: error.message });
    }
  }

  async testAdminAccess() {
    console.log('👨‍💼 Testing Admin Access Controls...');
    
    try {
      const response = await this.makeRequest('/admin');
      
      if (response.status === 302 || response.status === 401 || response.status === 403) {
        console.log('  ✅ Admin access properly protected');
        this.results.push({ test: 'Admin Access', status: 'PASS' });
      } else {
        console.log(\`  ❌ Admin access not protected (status: \${response.status})\`);
        this.results.push({ test: 'Admin Access', status: 'FAIL' });
      }
    } catch (error) {
      console.log(\`  ❌ Failed to test admin access: \${error.message}\`);
      this.results.push({ test: 'Admin Access', status: 'ERROR', error: error.message });
    }
  }

  async testRateLimiting() {
    console.log('🚦 Testing Rate Limiting...');
    
    try {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(this.makeRequest('/api/health'));
      }
      
      const responses = await Promise.allSettled(requests);
      const rateLimited = responses.some(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );
      
      if (rateLimited) {
        console.log('  ✅ Rate limiting is active');
        this.results.push({ test: 'Rate Limiting', status: 'PASS' });
      } else {
        console.log('  ⚠️  Rate limiting not detected (may need more requests)');
        this.results.push({ test: 'Rate Limiting', status: 'WARNING' });
      }
    } catch (error) {
      console.log(\`  ❌ Failed to test rate limiting: \${error.message}\`);
      this.results.push({ test: 'Rate Limiting', status: 'ERROR', error: error.message });
    }
  }

  async testCSP() {
    console.log('🔐 Testing Content Security Policy...');
    
    try {
      const response = await this.makeRequest('/');
      const csp = response.headers['content-security-policy'];
      
      if (csp) {
        console.log(\`  ✅ CSP header present: \${csp.substring(0, 100)}...\`);
        this.results.push({ test: 'Content Security Policy', status: 'PASS' });
      } else {
        console.log('  ❌ CSP header missing');
        this.results.push({ test: 'Content Security Policy', status: 'FAIL' });
      }
    } catch (error) {
      console.log(\`  ❌ Failed to test CSP: \${error.message}\`);
      this.results.push({ test: 'Content Security Policy', status: 'ERROR', error: error.message });
    }
  }

  async testRedirects() {
    console.log('↩️  Testing Security Redirects...');
    
    try {
      const response = await this.makeRequest('/admin', { 
        headers: { 'User-Agent': 'SecurityTestSuite/1.0' }
      });
      
      if (response.status >= 300 && response.status < 400) {
        console.log(\`  ✅ Admin redirect working (status: \${response.status})\`);
        this.results.push({ test: 'Security Redirects', status: 'PASS' });
      } else {
        console.log(\`  ⚠️  Unexpected response for admin access: \${response.status}\`);
        this.results.push({ test: 'Security Redirects', status: 'WARNING' });
      }
    } catch (error) {
      console.log(\`  ❌ Failed to test redirects: \${error.message}\`);
      this.results.push({ test: 'Security Redirects', status: 'ERROR', error: error.message });
    }
  }

  generateReport() {
    console.log('\\n📊 Security Test Results');
    console.log('=========================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    
    this.results.forEach(result => {
      const icon = {
        'PASS': '✅',
        'FAIL': '❌',
        'WARNING': '⚠️',
        'ERROR': '🚨'
      }[result.status];
      
      console.log(\`\${icon} \${result.test}: \${result.status}\`);
      if (result.error) {
        console.log(\`   Error: \${result.error}\`);
      }
    });
    
    console.log(\`\\nSummary: \${passed} passed, \${failed} failed, \${warnings} warnings, \${errors} errors\`);
    
    if (failed > 0 || errors > 0) {
      console.log('\\n⚠️  Security issues detected. Please review and fix before production deployment.');
      process.exit(1);
    } else {
      console.log('\\n✅ All security tests passed!');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const tester = new SecurityTester(baseUrl);
  tester.runAllTests().catch(console.error);
}

module.exports = SecurityTester;`;

    try {
      fs.writeFileSync(securityTestPath, securityTestContent);
      success('Security testing suite created');
      this.results.passed++;
      this.results.fixes.push('Created comprehensive security test suite');
    } catch (error) {
      error(`Failed to create security tests: ${error.message}`);
      this.results.failed++;
    }
  }

  createSecureEnvTemplate() {
    const envTemplate = `# 🔒 PRODUCTION ENVIRONMENT VARIABLES
# SECURITY WARNING: Never commit this file to version control

# ==============================================
# 🚀 DEPLOYMENT & HOSTING
# ==============================================
NEXT_PUBLIC_APP_URL="https://your-production-domain.com"
NODE_ENV="production"

# ==============================================
# 🐘 DATABASE - Required
# ==============================================
DATABASE_URL="postgresql://username:password@production-host/dbname?sslmode=require"

# ==============================================
# 🔐 AUTHENTICATION - Required
# ==============================================
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-production-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-production-service-role-key"
SUPABASE_JWT_SECRET="your-jwt-secret"

# ==============================================
# 💳 PAYMENTS - Required
# ==============================================
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_PATHFINDER_MONTHLY="price_..."
STRIPE_PRICE_ID_PATHFINDER_YEARLY="price_..."

# ==============================================
# 📧 EMAIL SERVICE - Required
# ==============================================
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@your-domain.com"
FROM_NAME="Tranquilae"

# ==============================================
# 🤖 AI COACH - Required
# ==============================================
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4"

# ==============================================
# 👨‍💼 ADMIN PANEL - Required
# ==============================================
ADMIN_USER_IDS="uuid1,uuid2,uuid3"
SUPER_ADMIN_USER_IDS="uuid1"

# ==============================================
# 📈 MONITORING - Recommended
# ==============================================
SENTRY_DSN="https://your-dsn@sentry.io/project"

# ==============================================
# 🔒 SECURITY NOTES
# ==============================================
# ✅ Use strong, unique passwords
# ✅ Enable 2FA on all service accounts
# ✅ Regularly rotate API keys
# ✅ Monitor access logs
# ✅ Use HTTPS everywhere
# ✅ Validate webhook signatures
`;

    fs.writeFileSync('.env.production.template', envTemplate);
  }

  generateReport() {
    log('\n📊 Security Hardening Results', 'purple');
    log('================================', 'purple');
    
    success(`✅ Passed: ${this.results.passed} checks`);
    if (this.results.warnings > 0) {
      warning(`⚠️  Warnings: ${this.results.warnings} items need attention`);
    }
    if (this.results.failed > 0) {
      error(`❌ Failed: ${this.results.failed} critical issues`);
    }
    
    if (this.results.fixes.length > 0) {
      log('\n🔧 Security Improvements Applied:', 'cyan');
      this.results.fixes.forEach(fix => log(`  ✅ ${fix}`, 'green'));
    }
    
    log('\n🎯 Next Steps:', 'blue');
    log('1. Review environment variables in .env.local', 'white');
    log('2. Run security tests: node scripts/security-tests.js', 'white');
    log('3. Test rate limiting and security headers', 'white');
    log('4. Deploy to staging for full testing', 'white');
    log('5. Review security logs and monitoring', 'white');
    
    if (this.results.failed === 0) {
      log('\n🎉 Security hardening completed successfully!', 'green');
    } else {
      log('\n⚠️  Please address failed checks before production deployment.', 'red');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const hardening = new SecurityHardening();
  hardening.run().catch(console.error);
}

module.exports = SecurityHardening;
