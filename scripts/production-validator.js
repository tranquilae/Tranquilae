#!/usr/bin/env node

/**
 * 🔍 Production Environment Validator
 * Comprehensive validation for production deployment readiness
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

class ProductionValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      criticalIssues: [],
      recommendations: []
    };
    this.envVars = {};
  }

  async validate() {
    log('🔍 Starting Production Environment Validation...', 'purple');
    log('================================================', 'purple');
    
    await this.validateEnvironmentVariables();
    await this.validateSecurityConfiguration();
    await this.validateDatabaseConnection();
    await this.validateExternalServices();
    await this.validateApplicationStructure();
    await this.validateBuildConfiguration();
    await this.validateAdminConfiguration();
    await this.validateMonitoring();
    await this.performSecurityChecks();
    await this.validatePerformanceSettings();
    
    this.generateValidationReport();
  }

  loadEnvironmentVariables() {
    if (fs.existsSync('.env.local')) {
      const envContent = fs.readFileSync('.env.local', 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=');
          if (key && value) {
            this.envVars[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
          }
        }
      });
    }
  }

  checkEnvVar(name, required = true, type = 'string', pattern = null) {
    const value = this.envVars[name];
    
    if (!value) {
      if (required) {
        this.recordIssue('CRITICAL', `Missing required environment variable: ${name}`);
        return false;
      } else {
        this.recordIssue('WARNING', `Optional environment variable missing: ${name}`);
        return false;
      }
    }

    // Type validation
    switch (type) {
      case 'url':
        try {
          new URL(value);
        } catch {
          this.recordIssue('CRITICAL', `Invalid URL format for ${name}: ${value}`);
          return false;
        }
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          this.recordIssue('CRITICAL', `Invalid email format for ${name}: ${value}`);
          return false;
        }
        break;
      case 'uuid':
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
          this.recordIssue('CRITICAL', `Invalid UUID format for ${name}`);
          return false;
        }
        break;
    }

    // Pattern validation
    if (pattern && !pattern.test(value)) {
      this.recordIssue('CRITICAL', `Invalid format for ${name}`);
      return false;
    }

    // Security checks
    if (value.includes('your-') || value.includes('example') || value.includes('placeholder')) {
      this.recordIssue('CRITICAL', `Template value detected in ${name}`);
      return false;
    }

    if (name.includes('LIVE') || name.includes('PRODUCTION')) {
      if (value.includes('test') || value.includes('dev')) {
        this.recordIssue('CRITICAL', `Test/dev value in production variable ${name}`);
        return false;
      }
    }

    return true;
  }

  recordIssue(severity, message, recommendation = null) {
    switch (severity) {
      case 'CRITICAL':
        this.results.failed++;
        this.results.criticalIssues.push(message);
        error(message);
        break;
      case 'WARNING':
        this.results.warnings++;
        warning(message);
        break;
      case 'PASS':
        this.results.passed++;
        success(message);
        break;
    }

    if (recommendation) {
      this.results.recommendations.push(recommendation);
    }
  }

  async validateEnvironmentVariables() {
    info('Step 1: Environment Variables Validation');
    
    this.loadEnvironmentVariables();
    
    if (Object.keys(this.envVars).length === 0) {
      this.recordIssue('CRITICAL', 'No environment variables found - .env.local missing or empty');
      return;
    }

    // Critical production variables
    const criticalVars = [
      { name: 'NODE_ENV', required: true },
      { name: 'NEXT_PUBLIC_APP_URL', required: true, type: 'url' },
      { name: 'DATABASE_URL', required: true, type: 'url' },
      { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true, type: 'url' },
      { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true },
      { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true },
      { name: 'SUPABASE_JWT_SECRET', required: true },
      { name: 'STRIPE_SECRET_KEY', required: true, pattern: /^sk_(live|test)_/ },
      { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: true, pattern: /^pk_(live|test)_/ },
      { name: 'STRIPE_WEBHOOK_SECRET', required: true },
      { name: 'RESEND_API_KEY', required: true },
      { name: 'FROM_EMAIL', required: true, type: 'email' },
      { name: 'OPENAI_API_KEY', required: true, pattern: /^sk-/ },
      { name: 'ADMIN_USER_IDS', required: true },
      { name: 'SUPER_ADMIN_USER_IDS', required: true }
    ];

    let validVars = 0;
    criticalVars.forEach(({ name, required, type, pattern }) => {
      if (this.checkEnvVar(name, required, type, pattern)) {
        validVars++;
      }
    });

    // Production-specific checks
    if (this.envVars.NODE_ENV !== 'production') {
      this.recordIssue('WARNING', 'NODE_ENV is not set to "production"');
    }

    // Stripe environment consistency
    const stripeSecret = this.envVars.STRIPE_SECRET_KEY;
    const stripePublic = this.envVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (stripeSecret && stripePublic) {
      const secretIsLive = stripeSecret.startsWith('sk_live_');
      const publicIsLive = stripePublic.startsWith('pk_live_');
      
      if (secretIsLive !== publicIsLive) {
        this.recordIssue('CRITICAL', 'Stripe key environment mismatch (live vs test)');
      } else if (secretIsLive && publicIsLive) {
        this.recordIssue('PASS', 'Stripe configured for production (live keys)');
      } else {
        this.recordIssue('WARNING', 'Stripe configured with test keys');
      }
    }

    // Admin user validation
    if (this.envVars.ADMIN_USER_IDS) {
      const adminIds = this.envVars.ADMIN_USER_IDS.split(',');
      let validAdminIds = 0;
      
      adminIds.forEach(id => {
        const trimmedId = id.trim();
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedId)) {
          validAdminIds++;
        }
      });
      
      if (validAdminIds > 0) {
        this.recordIssue('PASS', `${validAdminIds} valid admin user IDs configured`);
      } else {
        this.recordIssue('CRITICAL', 'No valid admin user IDs found');
      }
    }

    if (validVars >= criticalVars.length * 0.9) {
      this.recordIssue('PASS', 'Environment variables validation mostly complete');
    }
  }

  async validateSecurityConfiguration() {
    info('Step 2: Security Configuration Validation');
    
    // Check for security files
    const securityFiles = [
      'middleware.ts',
      'next.config.js'
    ];

    securityFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.recordIssue('PASS', `Security file present: ${file}`);
      } else {
        this.recordIssue('WARNING', `Security file missing: ${file}`);
      }
    });

    // Validate Next.js config
    if (fs.existsSync('next.config.js')) {
      const configContent = fs.readFileSync('next.config.js', 'utf8');
      
      const securityFeatures = [
        { feature: 'headers()', description: 'Security headers configuration' },
        { feature: 'X-Frame-Options', description: 'Clickjacking protection' },
        { feature: 'Content-Security-Policy', description: 'CSP headers' },
        { feature: 'poweredByHeader: false', description: 'Remove X-Powered-By header' },
        { feature: 'compress: true', description: 'Response compression' }
      ];

      securityFeatures.forEach(({ feature, description }) => {
        if (configContent.includes(feature)) {
          this.recordIssue('PASS', `Security feature enabled: ${description}`);
        } else {
          this.recordIssue('WARNING', `Security feature missing: ${description}`);
        }
      });
    }

    // Check for rate limiting
    if (fs.existsSync('lib/rate-limit.ts') || fs.existsSync('lib/rate-limiting.ts')) {
      this.recordIssue('PASS', 'Rate limiting implementation found');
    } else {
      this.recordIssue('WARNING', 'Rate limiting implementation not found');
    }

    // Check for security logging
    if (fs.existsSync('lib/security-logger.ts') || fs.existsSync('lib/audit-logger.ts')) {
      this.recordIssue('PASS', 'Security logging implementation found');
    } else {
      this.recordIssue('WARNING', 'Security logging implementation not found');
    }
  }

  async validateDatabaseConnection() {
    info('Step 3: Database Connection Validation');
    
    if (!this.envVars.DATABASE_URL && !this.envVars.NEXT_PUBLIC_SUPABASE_URL) {
      this.recordIssue('CRITICAL', 'No database configuration found');
      return;
    }

    // Validate Supabase configuration
    if (this.envVars.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabaseUrl = new URL(this.envVars.NEXT_PUBLIC_SUPABASE_URL);
        if (supabaseUrl.hostname.endsWith('.supabase.co')) {
          this.recordIssue('PASS', 'Valid Supabase URL format');
        } else {
          this.recordIssue('WARNING', 'Non-standard Supabase URL');
        }
      } catch {
        this.recordIssue('CRITICAL', 'Invalid Supabase URL format');
      }
    }

    // Check if database migration files exist
    const migrationPaths = [
      'scripts/admin-migration.sql',
      'supabase/migrations',
      'migrations'
    ];

    let migrationFound = false;
    migrationPaths.forEach(migrationPath => {
      if (fs.existsSync(migrationPath)) {
        this.recordIssue('PASS', `Database migrations found: ${migrationPath}`);
        migrationFound = true;
      }
    });

    if (!migrationFound) {
      this.recordIssue('WARNING', 'No database migration files found');
    }
  }

  async validateExternalServices() {
    info('Step 4: External Services Validation');
    
    // Validate service API key formats
    const services = [
      { 
        name: 'OpenAI', 
        key: 'OPENAI_API_KEY', 
        pattern: /^sk-[A-Za-z0-9-_]{32,}$/ 
      },
      { 
        name: 'Resend', 
        key: 'RESEND_API_KEY', 
        pattern: /^re_[A-Za-z0-9]{32,}$/ 
      },
      { 
        name: 'Stripe Secret', 
        key: 'STRIPE_SECRET_KEY', 
        pattern: /^sk_(live|test)_[A-Za-z0-9]{98,}$/ 
      }
    ];

    services.forEach(({ name, key, pattern }) => {
      const value = this.envVars[key];
      if (value) {
        if (pattern.test(value)) {
          this.recordIssue('PASS', `${name} API key format valid`);
        } else {
          this.recordIssue('CRITICAL', `${name} API key format invalid`);
        }
      }
    });

    // Check Stripe webhook configuration
    if (this.envVars.STRIPE_WEBHOOK_SECRET) {
      if (this.envVars.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
        this.recordIssue('PASS', 'Stripe webhook secret format valid');
      } else {
        this.recordIssue('CRITICAL', 'Stripe webhook secret format invalid');
      }
    }
  }

  async validateApplicationStructure() {
    info('Step 5: Application Structure Validation');
    
    const requiredDirectories = [
      'app',
      'components',
      'lib',
      'scripts'
    ];

    const requiredFiles = [
      'package.json',
      'next.config.js',
      'tailwind.config.js',
      'tsconfig.json'
    ];

    requiredDirectories.forEach(dir => {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        this.recordIssue('PASS', `Required directory exists: ${dir}`);
      } else {
        this.recordIssue('CRITICAL', `Required directory missing: ${dir}`);
      }
    });

    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.recordIssue('PASS', `Required file exists: ${file}`);
      } else {
        this.recordIssue('CRITICAL', `Required file missing: ${file}`);
      }
    });

    // Check admin panel structure
    const adminFiles = [
      'app/admin/layout.tsx',
      'app/admin/page.tsx',
      'app/admin/users/page.tsx',
      'app/admin/subscriptions/page.tsx',
      'components/admin'
    ];

    let adminFilesFound = 0;
    adminFiles.forEach(file => {
      if (fs.existsSync(file)) {
        adminFilesFound++;
      }
    });

    if (adminFilesFound >= adminFiles.length * 0.8) {
      this.recordIssue('PASS', 'Admin panel structure appears complete');
    } else {
      this.recordIssue('WARNING', 'Admin panel structure may be incomplete');
    }
  }

  async validateBuildConfiguration() {
    info('Step 6: Build Configuration Validation');
    
    // Validate package.json
    if (fs.existsSync('package.json')) {
      try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Check required scripts
        const requiredScripts = ['build', 'start', 'dev'];
        let scriptsFound = 0;
        
        requiredScripts.forEach(script => {
          if (packageJson.scripts && packageJson.scripts[script]) {
            scriptsFound++;
          }
        });
        
        if (scriptsFound === requiredScripts.length) {
          this.recordIssue('PASS', 'Required build scripts present');
        } else {
          this.recordIssue('WARNING', 'Some build scripts missing');
        }

        // Check critical dependencies
        const criticalDeps = [
          'next',
          'react',
          'react-dom',
          '@supabase/supabase-js',
          'stripe',
          '@stripe/stripe-js'
        ];

        let depsFound = 0;
        criticalDeps.forEach(dep => {
          if (packageJson.dependencies && packageJson.dependencies[dep]) {
            depsFound++;
          }
        });

        if (depsFound >= criticalDeps.length * 0.9) {
          this.recordIssue('PASS', 'Critical dependencies present');
        } else {
          this.recordIssue('WARNING', 'Some critical dependencies missing');
        }

      } catch (error) {
        this.recordIssue('CRITICAL', 'Invalid package.json format');
      }
    }

    // Check TypeScript configuration
    if (fs.existsSync('tsconfig.json')) {
      try {
        const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
        if (tsConfig.compilerOptions && tsConfig.compilerOptions.strict) {
          this.recordIssue('PASS', 'TypeScript strict mode enabled');
        } else {
          this.recordIssue('WARNING', 'TypeScript strict mode not enabled');
        }
      } catch (error) {
        this.recordIssue('WARNING', 'Invalid tsconfig.json format');
      }
    }
  }

  async validateAdminConfiguration() {
    info('Step 7: Admin Panel Configuration Validation');
    
    // Check admin API routes
    const adminApiRoutes = [
      'app/api/admin/users/route.ts',
      'app/api/admin/subscriptions/route.ts',
      'app/api/admin/audit-logs/route.ts'
    ];

    let adminApiFound = 0;
    adminApiRoutes.forEach(route => {
      if (fs.existsSync(route)) {
        adminApiFound++;
      }
    });

    if (adminApiFound >= adminApiRoutes.length * 0.8) {
      this.recordIssue('PASS', 'Admin API routes present');
    } else {
      this.recordIssue('WARNING', 'Some admin API routes missing');
    }

    // Validate admin user configuration
    if (this.envVars.ADMIN_USER_IDS && this.envVars.SUPER_ADMIN_USER_IDS) {
      const adminIds = this.envVars.ADMIN_USER_IDS.split(',').map(id => id.trim());
      const superAdminIds = this.envVars.SUPER_ADMIN_USER_IDS.split(',').map(id => id.trim());
      
      // Check if super admin IDs are subset of admin IDs
      const allSuperAdminsAreAdmins = superAdminIds.every(id => adminIds.includes(id));
      
      if (allSuperAdminsAreAdmins) {
        this.recordIssue('PASS', 'Admin role hierarchy configured correctly');
      } else {
        this.recordIssue('CRITICAL', 'Super admin IDs must be subset of admin IDs');
      }
    }

    // Check audit logging configuration
    const auditFiles = [
      'lib/audit-logger.ts',
      'scripts/admin-migration.sql'
    ];

    let auditFound = false;
    auditFiles.forEach(file => {
      if (fs.existsSync(file)) {
        auditFound = true;
      }
    });

    if (auditFound) {
      this.recordIssue('PASS', 'Audit logging infrastructure present');
    } else {
      this.recordIssue('WARNING', 'Audit logging infrastructure not found');
    }
  }

  async validateMonitoring() {
    info('Step 8: Monitoring and Error Tracking Validation');
    
    // Check for error tracking
    if (this.envVars.SENTRY_DSN) {
      if (this.envVars.SENTRY_DSN.startsWith('https://')) {
        this.recordIssue('PASS', 'Sentry error tracking configured');
      } else {
        this.recordIssue('WARNING', 'Invalid Sentry DSN format');
      }
    } else {
      this.recordIssue('WARNING', 'No error tracking configured');
      this.results.recommendations.push('Consider setting up Sentry for error tracking');
    }

    // Check for analytics
    if (this.envVars.NEXT_PUBLIC_VERCEL_ANALYTICS_ID || 
        this.envVars.NEXT_PUBLIC_POSTHOG_KEY ||
        this.envVars.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      this.recordIssue('PASS', 'Analytics tracking configured');
    } else {
      this.recordIssue('WARNING', 'No analytics tracking found');
      this.results.recommendations.push('Consider setting up analytics tracking');
    }

    // Check for logging configuration
    const loggingFiles = [
      'lib/logger.ts',
      'lib/security-logger.ts'
    ];

    let loggingFound = false;
    loggingFiles.forEach(file => {
      if (fs.existsSync(file)) {
        loggingFound = true;
      }
    });

    if (loggingFound) {
      this.recordIssue('PASS', 'Logging infrastructure present');
    } else {
      this.recordIssue('WARNING', 'No structured logging found');
    }
  }

  async performSecurityChecks() {
    info('Step 9: Security Validation');
    
    // Check for sensitive files in version control
    const sensitiveFiles = [
      '.env.local',
      '.env.production',
      'private.key',
      'certificate.pem'
    ];

    let gitignoreContent = '';
    if (fs.existsSync('.gitignore')) {
      gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    }

    let sensitiveFilesProtected = 0;
    sensitiveFiles.forEach(file => {
      if (gitignoreContent.includes(file) || gitignoreContent.includes('*.env*')) {
        sensitiveFilesProtected++;
      }
    });

    if (sensitiveFilesProtected >= sensitiveFiles.length * 0.8) {
      this.recordIssue('PASS', 'Sensitive files properly excluded from version control');
    } else {
      this.recordIssue('WARNING', 'Some sensitive files may not be excluded from version control');
    }

    // Check for security middleware
    if (fs.existsSync('middleware.ts')) {
      const middlewareContent = fs.readFileSync('middleware.ts', 'utf8');
      
      const securityFeatures = [
        'admin',
        'auth',
        'rate',
        'security'
      ];

      let securityFeaturesFound = 0;
      securityFeatures.forEach(feature => {
        if (middlewareContent.toLowerCase().includes(feature)) {
          securityFeaturesFound++;
        }
      });

      if (securityFeaturesFound >= 3) {
        this.recordIssue('PASS', 'Security middleware appears comprehensive');
      } else {
        this.recordIssue('WARNING', 'Security middleware may be incomplete');
      }
    }

    // Validate admin access restrictions
    const criticalFiles = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'OPENAI_API_KEY'
    ];

    let secureKeys = 0;
    criticalFiles.forEach(key => {
      const value = this.envVars[key];
      if (value && value.length > 32 && !value.includes('your-') && !value.includes('test')) {
        secureKeys++;
      }
    });

    if (secureKeys === criticalFiles.length) {
      this.recordIssue('PASS', 'Critical API keys appear secure');
    } else {
      this.recordIssue('CRITICAL', 'Some critical API keys may be insecure');
    }
  }

  async validatePerformanceSettings() {
    info('Step 10: Performance Configuration Validation');
    
    // Check Next.js config for performance settings
    if (fs.existsSync('next.config.js')) {
      const configContent = fs.readFileSync('next.config.js', 'utf8');
      
      const performanceFeatures = [
        { feature: 'compress: true', description: 'Response compression' },
        { feature: 'swcMinify: true', description: 'SWC minification' },
        { feature: 'reactStrictMode: true', description: 'React strict mode' },
        { feature: 'images:', description: 'Image optimization' }
      ];

      performanceFeatures.forEach(({ feature, description }) => {
        if (configContent.includes(feature)) {
          this.recordIssue('PASS', `Performance feature enabled: ${description}`);
        } else {
          this.recordIssue('WARNING', `Performance feature missing: ${description}`);
        }
      });
    }

    // Check for caching configuration
    if (this.envVars.REDIS_URL || this.envVars.UPSTASH_REDIS_REST_URL) {
      this.recordIssue('PASS', 'Caching configuration found');
    } else {
      this.recordIssue('WARNING', 'No caching configuration found');
      this.results.recommendations.push('Consider adding Redis for production caching');
    }
  }

  generateValidationReport() {
    log('\n📊 Production Validation Results', 'purple');
    log('=================================', 'purple');
    
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const score = Math.round((this.results.passed / total) * 100);
    
    success(`✅ Passed: ${this.results.passed}/${total} checks`);
    if (this.results.warnings > 0) {
      warning(`⚠️  Warnings: ${this.results.warnings} issues`);
    }
    if (this.results.failed > 0) {
      error(`❌ Failed: ${this.results.failed} critical issues`);
    }
    
    log(`\n📈 Production Readiness Score: ${score}%`, score >= 90 ? 'green' : score >= 75 ? 'yellow' : 'red');
    
    if (this.results.criticalIssues.length > 0) {
      log('\n🚨 Critical Issues (Must Fix):', 'red');
      this.results.criticalIssues.forEach(issue => {
        log(`  • ${issue}`, 'red');
      });
    }
    
    if (this.results.recommendations.length > 0) {
      log('\n💡 Recommendations:', 'cyan');
      this.results.recommendations.forEach(rec => {
        log(`  • ${rec}`, 'cyan');
      });
    }
    
    log('\n🎯 Deployment Readiness Assessment:', 'blue');
    
    if (this.results.failed === 0 && this.results.warnings <= 2) {
      success('🟢 READY FOR PRODUCTION DEPLOYMENT');
      log('All critical checks passed. System appears ready for production.', 'green');
    } else if (this.results.failed === 0 && this.results.warnings <= 5) {
      warning('🟡 READY WITH WARNINGS');
      log('No critical issues, but some warnings should be addressed.', 'yellow');
    } else if (this.results.failed <= 2) {
      error('🟠 NEEDS ATTENTION');
      log('Some critical issues need to be resolved before deployment.', 'red');
    } else {
      error('🔴 NOT READY FOR PRODUCTION');
      log('Multiple critical issues must be resolved before deployment.', 'red');
    }
    
    // Save detailed report
    this.saveReport();
    
    log(`\n📄 Detailed report saved to: production-validation-${new Date().toISOString().split('T')[0]}.json`, 'white');
    
    if (this.results.failed > 0) {
      process.exit(1);
    }
  }

  saveReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.passed + this.results.failed + this.results.warnings,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        score: Math.round((this.results.passed / (this.results.passed + this.results.failed + this.results.warnings)) * 100)
      },
      criticalIssues: this.results.criticalIssues,
      recommendations: this.results.recommendations,
      environment: {
        hasEnvFile: fs.existsSync('.env.local'),
        nodeEnv: this.envVars.NODE_ENV || 'not set',
        adminConfigured: !!this.envVars.ADMIN_USER_IDS,
        stripeConfigured: !!this.envVars.STRIPE_SECRET_KEY,
        databaseConfigured: !!(this.envVars.DATABASE_URL || this.envVars.NEXT_PUBLIC_SUPABASE_URL)
      }
    };
    
    const fileName = `production-validation-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(fileName, JSON.stringify(reportData, null, 2));
  }
}

// Main execution
async function main() {
  const validator = new ProductionValidator();
  await validator.validate();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ProductionValidator;
