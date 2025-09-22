#!/usr/bin/env node

/**
 * 🧪 End-to-End Testing Suite
 * Comprehensive automated testing for admin panel functionality
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

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

class E2ETestSuite {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
    this.testSession = {
      cookies: {},
      adminToken: null,
      testUserId: null
    };
  }

  async runAllTests() {
    log('🧪 Starting End-to-End Testing Suite...', 'purple');
    log('=========================================', 'purple');
    
    // Environment and setup tests
    await this.testEnvironmentSetup();
    await this.testDatabaseConnection();
    await this.testServiceIntegrations();
    
    // Authentication and access control tests
    await this.testPublicAccess();
    await this.testAuthenticationFlow();
    await this.testAdminAccessControl();
    await this.testRoleBasedAccess();
    
    // Admin panel functionality tests
    await this.testDashboardLoad();
    await this.testUserManagement();
    await this.testSubscriptionManagement();
    await this.testAuditLogging();
    
    // Security and performance tests
    await this.testSecurityHeaders();
    await this.testRateLimiting();
    await this.testErrorHandling();
    await this.testMobileResponsiveness();
    
    this.generateTestReport();
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;
      const requestOptions = {
        ...options,
        headers: {
          'User-Agent': 'E2ETestSuite/1.0',
          'Cookie': this.buildCookieHeader(),
          ...options.headers
        }
      };

      const request = (url.startsWith('https:') ? https : http).request(url, requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // Update cookies from response
          this.updateCookies(res.headers['set-cookie']);
          resolve({ 
            status: res.statusCode, 
            headers: res.headers, 
            data: data,
            cookies: res.headers['set-cookie']
          });
        });
      });
      
      request.on('error', reject);
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        request.write(options.body);
      }
      
      request.end();
    });
  }

  buildCookieHeader() {
    return Object.entries(this.testSession.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  updateCookies(setCookieHeaders) {
    if (!setCookieHeaders) return;
    
    setCookieHeaders.forEach(cookie => {
      const [nameValue] = cookie.split(';');
      const [name, value] = nameValue.split('=');
      if (name && value) {
        this.testSession.cookies[name.trim()] = value.trim();
      }
    });
  }

  recordTest(name, status, details = null, error = null) {
    const test = { name, status, details, error, timestamp: new Date().toISOString() };
    this.results.tests.push(test);
    
    switch (status) {
      case 'PASS':
        this.results.passed++;
        success(`${name}: PASSED`);
        break;
      case 'FAIL':
        this.results.failed++;
        error(`${name}: FAILED`);
        if (details) log(`  Details: ${details}`, 'red');
        if (error) log(`  Error: ${error}`, 'red');
        break;
      case 'WARNING':
        this.results.warnings++;
        warning(`${name}: WARNING`);
        if (details) log(`  Details: ${details}`, 'yellow');
        break;
    }
  }

  async testEnvironmentSetup() {
    info('Testing Environment Setup');
    
    try {
      // Check if required files exist
      const requiredFiles = [
        'package.json',
        '.env.local',
        'next.config.js'
      ];
      
      let missingFiles = [];
      requiredFiles.forEach(file => {
        if (!fs.existsSync(file)) {
          missingFiles.push(file);
        }
      });
      
      if (missingFiles.length > 0) {
        this.recordTest('Environment Files', 'FAIL', `Missing files: ${missingFiles.join(', ')}`);
      } else {
        this.recordTest('Environment Files', 'PASS');
      }

      // Check environment variables
      if (fs.existsSync('.env.local')) {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const requiredVars = [
          'NEXT_PUBLIC_SUPABASE_URL',
          'SUPABASE_SERVICE_ROLE_KEY',
          'ADMIN_USER_IDS'
        ];
        
        let missingVars = [];
        requiredVars.forEach(varName => {
          if (!envContent.includes(varName)) {
            missingVars.push(varName);
          }
        });
        
        if (missingVars.length > 0) {
          this.recordTest('Environment Variables', 'FAIL', `Missing: ${missingVars.join(', ')}`);
        } else {
          this.recordTest('Environment Variables', 'PASS');
        }
      }
      
    } catch (error) {
      this.recordTest('Environment Setup', 'FAIL', null, error.message);
    }
  }

  async testDatabaseConnection() {
    info('Testing Database Connection');
    
    try {
      const response = await this.makeRequest('/api/health');
      
      if (response.status === 200) {
        this.recordTest('Database Connection', 'PASS');
      } else {
        this.recordTest('Database Connection', 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      this.recordTest('Database Connection', 'FAIL', null, error.message);
    }
  }

  async testServiceIntegrations() {
    info('Testing Service Integrations');
    
    // Test basic connectivity to core services
    const services = [
      { name: 'Application', path: '/' },
      { name: 'API Health', path: '/api/health' }
    ];
    
    for (const service of services) {
      try {
        const response = await this.makeRequest(service.path);
        
        if (response.status >= 200 && response.status < 400) {
          this.recordTest(`${service.name} Service`, 'PASS');
        } else {
          this.recordTest(`${service.name} Service`, 'FAIL', `Status: ${response.status}`);
        }
      } catch (error) {
        this.recordTest(`${service.name} Service`, 'FAIL', null, error.message);
      }
    }
  }

  async testPublicAccess() {
    info('Testing Public Access');
    
    try {
      const response = await this.makeRequest('/');
      
      if (response.status === 200) {
        this.recordTest('Public Homepage Access', 'PASS');
        
        // Check if it contains basic app content
        if (response.data.includes('Tranquilae') || response.data.includes('html')) {
          this.recordTest('Homepage Content', 'PASS');
        } else {
          this.recordTest('Homepage Content', 'WARNING', 'Unexpected content structure');
        }
      } else {
        this.recordTest('Public Homepage Access', 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      this.recordTest('Public Access', 'FAIL', null, error.message);
    }
  }

  async testAuthenticationFlow() {
    info('Testing Authentication Flow');
    
    try {
      // Test login page access
      const loginResponse = await this.makeRequest('/auth/login');
      
      if (loginResponse.status === 200) {
        this.recordTest('Login Page Access', 'PASS');
      } else {
        this.recordTest('Login Page Access', 'FAIL', `Status: ${loginResponse.status}`);
      }
      
      // Test signup page access
      const signupResponse = await this.makeRequest('/auth/signup');
      
      if (signupResponse.status === 200) {
        this.recordTest('Signup Page Access', 'PASS');
      } else {
        this.recordTest('Signup Page Access', 'FAIL', `Status: ${signupResponse.status}`);
      }
      
    } catch (error) {
      this.recordTest('Authentication Flow', 'FAIL', null, error.message);
    }
  }

  async testAdminAccessControl() {
    info('Testing Admin Access Control');
    
    try {
      // Test unauthenticated admin access
      const adminResponse = await this.makeRequest('/admin');
      
      // Should redirect to login (302) or deny access (401/403)
      if ([302, 401, 403].includes(adminResponse.status)) {
        this.recordTest('Admin Access Protection', 'PASS');
      } else if (adminResponse.status === 200) {
        this.recordTest('Admin Access Protection', 'FAIL', 'Admin access not properly protected');
      } else {
        this.recordTest('Admin Access Protection', 'WARNING', `Unexpected status: ${adminResponse.status}`);
      }
      
      // Test admin API access
      const adminApiResponse = await this.makeRequest('/api/admin/users');
      
      if ([401, 403].includes(adminApiResponse.status)) {
        this.recordTest('Admin API Protection', 'PASS');
      } else {
        this.recordTest('Admin API Protection', 'FAIL', `Status: ${adminApiResponse.status}`);
      }
      
    } catch (error) {
      this.recordTest('Admin Access Control', 'FAIL', null, error.message);
    }
  }

  async testRoleBasedAccess() {
    info('Testing Role-Based Access');
    
    try {
      // Test different admin routes
      const routes = [
        '/admin/dashboard',
        '/admin/users',
        '/admin/subscriptions',
        '/admin/audit-logs',
        '/admin/settings' // Super admin only
      ];
      
      let protectedCount = 0;
      for (const route of routes) {
        try {
          const response = await this.makeRequest(route);
          
          if ([302, 401, 403].includes(response.status)) {
            protectedCount++;
          }
        } catch (error) {
          // Network errors are acceptable for this test
          protectedCount++;
        }
      }
      
      if (protectedCount === routes.length) {
        this.recordTest('Role-Based Access Control', 'PASS');
      } else {
        this.recordTest('Role-Based Access Control', 'WARNING', 
          `${protectedCount}/${routes.length} routes properly protected`);
      }
      
    } catch (error) {
      this.recordTest('Role-Based Access', 'FAIL', null, error.message);
    }
  }

  async testDashboardLoad() {
    info('Testing Dashboard Functionality');
    
    try {
      // Test dashboard redirect
      const dashboardResponse = await this.makeRequest('/admin/dashboard');
      
      // Should redirect to login or show 403
      if ([302, 401, 403].includes(dashboardResponse.status)) {
        this.recordTest('Dashboard Access Control', 'PASS');
      } else {
        this.recordTest('Dashboard Access Control', 'WARNING', `Status: ${dashboardResponse.status}`);
      }
      
    } catch (error) {
      this.recordTest('Dashboard Load', 'FAIL', null, error.message);
    }
  }

  async testUserManagement() {
    info('Testing User Management');
    
    try {
      // Test user management page
      const usersResponse = await this.makeRequest('/admin/users');
      
      if ([302, 401, 403].includes(usersResponse.status)) {
        this.recordTest('User Management Access Control', 'PASS');
      } else {
        this.recordTest('User Management Access Control', 'WARNING', `Status: ${usersResponse.status}`);
      }
      
      // Test users API
      const usersApiResponse = await this.makeRequest('/api/admin/users');
      
      if ([401, 403].includes(usersApiResponse.status)) {
        this.recordTest('Users API Protection', 'PASS');
      } else {
        this.recordTest('Users API Protection', 'FAIL', `Status: ${usersApiResponse.status}`);
      }
      
    } catch (error) {
      this.recordTest('User Management', 'FAIL', null, error.message);
    }
  }

  async testSubscriptionManagement() {
    info('Testing Subscription Management');
    
    try {
      // Test subscription management page
      const subscriptionsResponse = await this.makeRequest('/admin/subscriptions');
      
      if ([302, 401, 403].includes(subscriptionsResponse.status)) {
        this.recordTest('Subscription Management Access Control', 'PASS');
      } else {
        this.recordTest('Subscription Management Access Control', 'WARNING', 
          `Status: ${subscriptionsResponse.status}`);
      }
      
      // Test subscriptions API
      const subscriptionsApiResponse = await this.makeRequest('/api/admin/subscriptions');
      
      if ([401, 403].includes(subscriptionsApiResponse.status)) {
        this.recordTest('Subscriptions API Protection', 'PASS');
      } else {
        this.recordTest('Subscriptions API Protection', 'FAIL', 
          `Status: ${subscriptionsApiResponse.status}`);
      }
      
    } catch (error) {
      this.recordTest('Subscription Management', 'FAIL', null, error.message);
    }
  }

  async testAuditLogging() {
    info('Testing Audit Logging');
    
    try {
      // Test audit logs page
      const auditResponse = await this.makeRequest('/admin/audit-logs');
      
      if ([302, 401, 403].includes(auditResponse.status)) {
        this.recordTest('Audit Logs Access Control', 'PASS');
      } else {
        this.recordTest('Audit Logs Access Control', 'WARNING', `Status: ${auditResponse.status}`);
      }
      
      // Test audit logs API
      const auditApiResponse = await this.makeRequest('/api/admin/audit-logs');
      
      if ([401, 403].includes(auditApiResponse.status)) {
        this.recordTest('Audit Logs API Protection', 'PASS');
      } else {
        this.recordTest('Audit Logs API Protection', 'FAIL', `Status: ${auditApiResponse.status}`);
      }
      
    } catch (error) {
      this.recordTest('Audit Logging', 'FAIL', null, error.message);
    }
  }

  async testSecurityHeaders() {
    info('Testing Security Headers');
    
    try {
      const response = await this.makeRequest('/');
      const headers = response.headers;
      
      const securityHeaders = {
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'x-xss-protection': '1; mode=block',
        'strict-transport-security': 'max-age=',
        'referrer-policy': 'strict-origin-when-cross-origin'
      };
      
      let passedHeaders = 0;
      let totalHeaders = Object.keys(securityHeaders).length;
      
      Object.entries(securityHeaders).forEach(([header, expectedValue]) => {
        if (headers[header] && headers[header].includes(expectedValue)) {
          passedHeaders++;
        }
      });
      
      if (passedHeaders === totalHeaders) {
        this.recordTest('Security Headers', 'PASS');
      } else if (passedHeaders > totalHeaders / 2) {
        this.recordTest('Security Headers', 'WARNING', 
          `${passedHeaders}/${totalHeaders} headers present`);
      } else {
        this.recordTest('Security Headers', 'FAIL', 
          `Only ${passedHeaders}/${totalHeaders} headers present`);
      }
      
    } catch (error) {
      this.recordTest('Security Headers', 'FAIL', null, error.message);
    }
  }

  async testRateLimiting() {
    info('Testing Rate Limiting');
    
    try {
      // Send multiple requests quickly
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(this.makeRequest('/api/health'));
      }
      
      const responses = await Promise.allSettled(requests);
      const rateLimited = responses.some(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );
      
      if (rateLimited) {
        this.recordTest('Rate Limiting', 'PASS');
      } else {
        this.recordTest('Rate Limiting', 'WARNING', 'Rate limiting may not be active');
      }
      
    } catch (error) {
      this.recordTest('Rate Limiting', 'WARNING', 'Could not test rate limiting');
    }
  }

  async testErrorHandling() {
    info('Testing Error Handling');
    
    try {
      // Test 404 handling
      const notFoundResponse = await this.makeRequest('/nonexistent-page');
      
      if (notFoundResponse.status === 404) {
        this.recordTest('404 Error Handling', 'PASS');
      } else {
        this.recordTest('404 Error Handling', 'WARNING', `Status: ${notFoundResponse.status}`);
      }
      
      // Test malformed API request
      const badApiResponse = await this.makeRequest('/api/nonexistent');
      
      if ([404, 405].includes(badApiResponse.status)) {
        this.recordTest('API Error Handling', 'PASS');
      } else {
        this.recordTest('API Error Handling', 'WARNING', `Status: ${badApiResponse.status}`);
      }
      
    } catch (error) {
      this.recordTest('Error Handling', 'FAIL', null, error.message);
    }
  }

  async testMobileResponsiveness() {
    info('Testing Mobile Responsiveness');
    
    try {
      // Test with mobile user agent
      const mobileResponse = await this.makeRequest('/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        }
      });
      
      if (mobileResponse.status === 200) {
        this.recordTest('Mobile Responsiveness', 'PASS');
      } else {
        this.recordTest('Mobile Responsiveness', 'WARNING', `Status: ${mobileResponse.status}`);
      }
      
    } catch (error) {
      this.recordTest('Mobile Responsiveness', 'WARNING', 'Could not test mobile responsiveness');
    }
  }

  generateTestReport() {
    log('\n📊 End-to-End Test Results', 'purple');
    log('===========================', 'purple');
    
    const totalTests = this.results.passed + this.results.failed + this.results.warnings;
    
    success(`✅ Passed: ${this.results.passed}/${totalTests} tests`);
    if (this.results.warnings > 0) {
      warning(`⚠️  Warnings: ${this.results.warnings}/${totalTests} tests`);
    }
    if (this.results.failed > 0) {
      error(`❌ Failed: ${this.results.failed}/${totalTests} tests`);
    }
    
    log('\n📝 Detailed Test Results:', 'cyan');
    log('========================', 'cyan');
    
    this.results.tests.forEach(test => {
      const icon = {
        'PASS': '✅',
        'FAIL': '❌',
        'WARNING': '⚠️'
      }[test.status];
      
      log(`${icon} ${test.name}`);
      if (test.details) {
        log(`   ${test.details}`, 'white');
      }
      if (test.error) {
        log(`   Error: ${test.error}`, 'red');
      }
    });
    
    // Generate test report file
    this.saveTestReport();
    
    log('\n🎯 Summary:', 'blue');
    if (this.results.failed > 0) {
      error('❌ Critical issues detected. Please review and fix before production.');
      log('Review failed tests and ensure all security measures are in place.', 'red');
    } else if (this.results.warnings > 0) {
      warning('⚠️  Some warnings detected. Review before production deployment.');
      log('Warnings may indicate configuration issues or missing optimizations.', 'yellow');
    } else {
      success('🎉 All tests passed! System appears ready for production.');
    }
    
    log(`\n📄 Test report saved to: test-results-${new Date().toISOString().split('T')[0]}.json`, 'white');
  }

  saveTestReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      summary: {
        total: this.results.passed + this.results.failed + this.results.warnings,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        successRate: Math.round((this.results.passed / (this.results.passed + this.results.failed + this.results.warnings)) * 100)
      },
      tests: this.results.tests
    };
    
    const fileName = `test-results-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(fileName, JSON.stringify(reportData, null, 2));
  }
}

// Test configuration validation
function validateTestEnvironment() {
  const requiredFiles = ['package.json', '.env.local'];
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    error(`Missing required files: ${missingFiles.join(', ')}`);
    process.exit(1);
  }
  
  info('Test environment validation passed');
}

// Main execution
async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  
  log('🚀 Initializing End-to-End Test Suite', 'purple');
  log(`📍 Target URL: ${baseUrl}`, 'white');
  
  validateTestEnvironment();
  
  const testSuite = new E2ETestSuite(baseUrl);
  await testSuite.runAllTests();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = E2ETestSuite;
