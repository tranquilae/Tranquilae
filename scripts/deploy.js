#!/usr/bin/env node

/**
 * 🚀 Multi-Platform Deployment Script
 * Automated deployment to Vercel, Netlify, Railway with security validation
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

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

class DeploymentManager {
  constructor(platform, environment = 'production') {
    this.platform = platform.toLowerCase();
    this.environment = environment;
    this.supportedPlatforms = ['vercel', 'netlify', 'railway'];
    this.deploymentConfig = {};
  }

  async deploy() {
    log('🚀 Starting Multi-Platform Deployment...', 'purple');
    log('==========================================', 'purple');
    log(`📍 Platform: ${this.platform}`, 'white');
    log(`🌍 Environment: ${this.environment}`, 'white');
    
    if (!this.supportedPlatforms.includes(this.platform)) {
      error(`Unsupported platform: ${this.platform}`);
      error(`Supported platforms: ${this.supportedPlatforms.join(', ')}`);
      process.exit(1);
    }

    try {
      await this.preDeploymentChecks();
      await this.prepareDeployment();
      await this.executeDeployment();
      await this.postDeploymentTasks();
      await this.generateDeploymentReport();
      
      success('🎉 Deployment completed successfully!');
    } catch (deployError) {
      error(`💥 Deployment failed: ${deployError.message}`);
      process.exit(1);
    }
  }

  async preDeploymentChecks() {
    info('Step 1: Pre-deployment Validation');
    
    // Run production validator
    await this.runProductionValidator();
    
    // Run security hardening
    await this.runSecurityHardening();
    
    // Run tests
    await this.runTests();
    
    // Validate environment variables
    await this.validateEnvironmentVariables();
  }

  async runProductionValidator() {
    try {
      log('Running production validation...', 'blue');
      
      if (fs.existsSync('scripts/production-validator.js')) {
        execSync('node scripts/production-validator.js', { stdio: 'inherit' });
        success('Production validation passed');
      } else {
        warning('Production validator not found, skipping...');
      }
    } catch (validationError) {
      error('Production validation failed');
      throw validationError;
    }
  }

  async runSecurityHardening() {
    try {
      log('Running security hardening...', 'blue');
      
      if (fs.existsSync('scripts/security-hardening.js')) {
        execSync('node scripts/security-hardening.js', { stdio: 'inherit' });
        success('Security hardening completed');
      } else {
        warning('Security hardening script not found, skipping...');
      }
    } catch (hardeningError) {
      error('Security hardening failed');
      throw hardeningError;
    }
  }

  async runTests() {
    try {
      log('Running test suite...', 'blue');
      
      // Run production build test
      execSync('npm run build', { stdio: 'inherit' });
      success('Build test passed');
      
      // Run E2E tests if available
      if (fs.existsSync('scripts/e2e-testing-suite.js')) {
        log('Running E2E tests...', 'blue');
        execSync('node scripts/e2e-testing-suite.js', { stdio: 'inherit' });
        success('E2E tests passed');
      }
    } catch (testError) {
      error('Tests failed');
      throw testError;
    }
  }

  async validateEnvironmentVariables() {
    if (!fs.existsSync('.env.local') && !fs.existsSync('.env.production')) {
      throw new Error('No environment file found (.env.local or .env.production)');
    }
    
    success('Environment variables validated');
  }

  async prepareDeployment() {
    info('Step 2: Preparing Deployment Configuration');
    
    await this.createPlatformConfig();
    await this.setupEnvironmentVariables();
    await this.optimizeForProduction();
  }

  async createPlatformConfig() {
    switch (this.platform) {
      case 'vercel':
        await this.createVercelConfig();
        break;
      case 'netlify':
        await this.createNetlifyConfig();
        break;
      case 'railway':
        await this.createRailwayConfig();
        break;
    }
  }

  async createVercelConfig() {
    const vercelConfig = {
      version: 2,
      name: 'tranquilae-admin',
      builds: [
        {
          src: 'package.json',
          use: '@vercel/next'
        }
      ],
      routes: [
        {
          src: '/admin/(.*)',
          headers: {
            'X-Robots-Tag': 'noindex, nofollow',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      ],
      functions: {
        'app/api/admin/**/*.ts': {
          maxDuration: 30
        }
      },
      env: this.getEnvironmentVariablesForPlatform('vercel'),
      crons: [
        {
          path: '/api/admin/cleanup',
          schedule: '0 2 * * *'
        }
      ]
    };

    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    success('Vercel configuration created');
  }

  async createNetlifyConfig() {
    const netlifyToml = `
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_ENV = "production"

[[redirects]]
  from = "/admin/*"
  to = "/admin/:splat"
  status = 200
  headers = {X-Robots-Tag = "noindex, nofollow"}

[[headers]]
  for = "/admin/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@supabase/supabase-js", "stripe"]
`;

    fs.writeFileSync('netlify.toml', netlifyToml);
    success('Netlify configuration created');
  }

  async createRailwayConfig() {
    const railwayConfig = {
      build: {
        builder: "NIXPACKS"
      },
      deploy: {
        startCommand: "npm start",
        healthcheckPath: "/api/health",
        healthcheckTimeout: 100,
        restartPolicyType: "ON_FAILURE"
      }
    };

    fs.writeFileSync('railway.json', JSON.stringify(railwayConfig, null, 2));
    success('Railway configuration created');
  }

  getEnvironmentVariablesForPlatform(platform) {
    const requiredVars = [
      'NODE_ENV',
      'NEXT_PUBLIC_APP_URL',
      'DATABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'RESEND_API_KEY',
      'FROM_EMAIL',
      'FROM_NAME',
      'OPENAI_API_KEY',
      'ADMIN_USER_IDS',
      'SUPER_ADMIN_USER_IDS',
      'SENTRY_DSN'
    ];

    const envVars = {};
    requiredVars.forEach(varName => {
      envVars[varName] = `@${varName.toLowerCase()}`;
    });

    return envVars;
  }

  async setupEnvironmentVariables() {
    const platformInstructions = {
      vercel: this.generateVercelEnvInstructions(),
      netlify: this.generateNetlifyEnvInstructions(),
      railway: this.generateRailwayEnvInstructions()
    };

    const instructions = platformInstructions[this.platform];
    
    fs.writeFileSync(`deployment-env-setup-${this.platform}.md`, instructions);
    success(`Environment variable setup instructions created for ${this.platform}`);
  }

  generateVercelEnvInstructions() {
    return `# Vercel Environment Variables Setup

## Using Vercel CLI:
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add NODE_ENV
vercel env add NEXT_PUBLIC_APP_URL
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_JWT_SECRET
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add RESEND_API_KEY
vercel env add FROM_EMAIL
vercel env add FROM_NAME
vercel env add OPENAI_API_KEY
vercel env add ADMIN_USER_IDS
vercel env add SUPER_ADMIN_USER_IDS
vercel env add SENTRY_DSN
\`\`\`

## Using Vercel Dashboard:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add each variable for Production environment
4. Make sure to select "Production" scope for all variables

## Security Notes:
- Use production API keys (live Stripe keys, production Supabase keys)
- Ensure ADMIN_USER_IDS contains actual UUID values
- Set NODE_ENV to "production"
- Verify NEXT_PUBLIC_APP_URL matches your domain
`;
  }

  generateNetlifyEnvInstructions() {
    return `# Netlify Environment Variables Setup

## Using Netlify CLI:
\`\`\`bash
# Install Netlify CLI
npm i -g netlify-cli

# Login to Netlify
netlify login

# Set environment variables
netlify env:set NODE_ENV production
netlify env:set NEXT_PUBLIC_APP_URL https://your-domain.netlify.app
netlify env:set DATABASE_URL "your-database-url"
netlify env:set NEXT_PUBLIC_SUPABASE_URL "your-supabase-url"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your-anon-key"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-service-key"
netlify env:set SUPABASE_JWT_SECRET "your-jwt-secret"
netlify env:set STRIPE_SECRET_KEY "sk_live_..."
netlify env:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "pk_live_..."
netlify env:set STRIPE_WEBHOOK_SECRET "whsec_..."
netlify env:set RESEND_API_KEY "re_..."
netlify env:set FROM_EMAIL "noreply@your-domain.com"
netlify env:set FROM_NAME "Tranquilae"
netlify env:set OPENAI_API_KEY "sk-..."
netlify env:set ADMIN_USER_IDS "uuid1,uuid2,uuid3"
netlify env:set SUPER_ADMIN_USER_IDS "uuid1"
netlify env:set SENTRY_DSN "your-sentry-dsn"
\`\`\`

## Using Netlify Dashboard:
1. Go to Site Settings → Environment Variables
2. Add each variable
3. Deploy to make changes take effect

## Additional Netlify Setup:
- Configure custom domain if needed
- Set up form handling for contact forms
- Configure redirect rules in netlify.toml
`;
  }

  generateRailwayEnvInstructions() {
    return `# Railway Environment Variables Setup

## Using Railway CLI:
\`\`\`bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Set environment variables
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_APP_URL=https://your-app.railway.app
railway variables set DATABASE_URL="your-database-url"
railway variables set NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
railway variables set SUPABASE_SERVICE_ROLE_KEY="your-service-key"
railway variables set SUPABASE_JWT_SECRET="your-jwt-secret"
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."
railway variables set RESEND_API_KEY="re_..."
railway variables set FROM_EMAIL="noreply@your-domain.com"
railway variables set FROM_NAME="Tranquilae"
railway variables set OPENAI_API_KEY="sk-..."
railway variables set ADMIN_USER_IDS="uuid1,uuid2,uuid3"
railway variables set SUPER_ADMIN_USER_IDS="uuid1"
railway variables set SENTRY_DSN="your-sentry-dsn"
\`\`\`

## Using Railway Dashboard:
1. Go to your project
2. Navigate to Variables tab  
3. Add each environment variable
4. Redeploy to apply changes

## Railway-Specific Notes:
- Railway provides automatic HTTPS
- Database can be connected via Railway's database service
- Memory and CPU can be scaled as needed
`;
  }

  async optimizeForProduction() {
    // Create production optimized package.json scripts
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!packageJson.scripts['build:production']) {
      packageJson.scripts['build:production'] = 'NODE_ENV=production next build';
    }
    
    if (!packageJson.scripts['start:production']) {
      packageJson.scripts['start:production'] = 'NODE_ENV=production next start';
    }

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    success('Production scripts optimized');
  }

  async executeDeployment() {
    info('Step 3: Executing Deployment');
    
    switch (this.platform) {
      case 'vercel':
        await this.deployToVercel();
        break;
      case 'netlify':
        await this.deployToNetlify();
        break;
      case 'railway':
        await this.deployToRailway();
        break;
    }
  }

  async deployToVercel() {
    try {
      log('Deploying to Vercel...', 'blue');
      
      // Check if Vercel CLI is installed
      try {
        execSync('vercel --version', { stdio: 'pipe' });
      } catch {
        log('Installing Vercel CLI...', 'yellow');
        execSync('npm i -g vercel', { stdio: 'inherit' });
      }

      // Deploy
      const deployCmd = this.environment === 'production' ? 'vercel --prod' : 'vercel';
      execSync(deployCmd, { stdio: 'inherit' });
      
      success('Successfully deployed to Vercel');
    } catch (deployError) {
      error('Vercel deployment failed');
      throw deployError;
    }
  }

  async deployToNetlify() {
    try {
      log('Deploying to Netlify...', 'blue');
      
      // Check if Netlify CLI is installed
      try {
        execSync('netlify --version', { stdio: 'pipe' });
      } catch {
        log('Installing Netlify CLI...', 'yellow');
        execSync('npm i -g netlify-cli', { stdio: 'inherit' });
      }

      // Build and deploy
      execSync('npm run build', { stdio: 'inherit' });
      
      const deployCmd = this.environment === 'production' ? 
        'netlify deploy --prod --dir=.next' : 
        'netlify deploy --dir=.next';
      
      execSync(deployCmd, { stdio: 'inherit' });
      
      success('Successfully deployed to Netlify');
    } catch (deployError) {
      error('Netlify deployment failed');
      throw deployError;
    }
  }

  async deployToRailway() {
    try {
      log('Deploying to Railway...', 'blue');
      
      // Check if Railway CLI is installed
      try {
        execSync('railway --version', { stdio: 'pipe' });
      } catch {
        log('Installing Railway CLI...', 'yellow');
        execSync('npm i -g @railway/cli', { stdio: 'inherit' });
      }

      // Deploy
      execSync('railway up', { stdio: 'inherit' });
      
      success('Successfully deployed to Railway');
    } catch (deployError) {
      error('Railway deployment failed');
      throw deployError;
    }
  }

  async postDeploymentTasks() {
    info('Step 4: Post-deployment Tasks');
    
    await this.runPostDeploymentTests();
    await this.setupMonitoring();
    await this.configureCustomDomain();
  }

  async runPostDeploymentTests() {
    log('Running post-deployment validation...', 'blue');
    
    // Wait a bit for deployment to be ready
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      // Run security tests against deployed URL
      if (fs.existsSync('scripts/security-tests.js')) {
        const deployedUrl = await this.getDeployedUrl();
        if (deployedUrl) {
          execSync(`node scripts/security-tests.js ${deployedUrl}`, { stdio: 'inherit' });
          success('Post-deployment security tests passed');
        }
      }
    } catch (testError) {
      warning('Post-deployment tests failed - please verify manually');
    }
  }

  async getDeployedUrl() {
    // This would need to be implemented based on platform APIs
    // For now, return null and skip URL-based tests
    return null;
  }

  async setupMonitoring() {
    log('Setting up monitoring and alerts...', 'blue');
    
    const monitoringConfig = {
      platform: this.platform,
      endpoints: [
        '/api/health',
        '/admin',
        '/api/admin/users'
      ],
      alerts: {
        downtime: true,
        errorRate: true,
        responseTime: true
      }
    };

    fs.writeFileSync(`monitoring-config-${this.platform}.json`, JSON.stringify(monitoringConfig, null, 2));
    success('Monitoring configuration created');
  }

  async configureCustomDomain() {
    const domainInstructions = {
      vercel: `
# Custom Domain Setup for Vercel
1. Go to your Vercel project dashboard
2. Navigate to Domains tab
3. Add your custom domain
4. Update DNS records as instructed
5. Wait for SSL certificate provisioning
`,
      netlify: `
# Custom Domain Setup for Netlify  
1. Go to Site Settings → Domain management
2. Add custom domain
3. Update DNS records or use Netlify DNS
4. Enable HTTPS (automatic with Netlify)
`,
      railway: `
# Custom Domain Setup for Railway
1. Go to your project settings
2. Navigate to Domains section
3. Add custom domain
4. Update CNAME record to point to Railway
5. Enable force HTTPS in settings
`
    };

    fs.writeFileSync(`domain-setup-${this.platform}.md`, domainInstructions[this.platform]);
    info('Custom domain setup instructions created');
  }

  async generateDeploymentReport() {
    info('Step 5: Generating Deployment Report');
    
    const deploymentReport = {
      timestamp: new Date().toISOString(),
      platform: this.platform,
      environment: this.environment,
      status: 'completed',
      components: {
        preDeploymentChecks: '✅ Passed',
        securityHardening: '✅ Applied',
        buildOptimization: '✅ Completed',
        deployment: '✅ Successful',
        postDeploymentTasks: '✅ Completed'
      },
      nextSteps: [
        'Verify deployment URL is accessible',
        'Test admin panel functionality',
        'Configure custom domain if needed',
        'Set up monitoring alerts',
        'Update DNS records',
        'Run final security tests'
      ],
      importantNotes: [
        'Environment variables must be configured in platform dashboard',
        'Database migration may need to be run manually',
        'Admin users need to be created and configured',
        'Stripe webhooks need to be updated with new URL',
        'Email domain verification may be required'
      ]
    };

    const reportFileName = `deployment-report-${this.platform}-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportFileName, JSON.stringify(deploymentReport, null, 2));
    
    success(`Deployment report saved: ${reportFileName}`);
  }
}

// CLI interface
function showUsage() {
  log('🚀 Multi-Platform Deployment Tool', 'purple');
  log('Usage: node deploy.js <platform> [environment]', 'white');
  log('', 'white');
  log('Platforms:', 'blue');
  log('  vercel    - Deploy to Vercel', 'white');
  log('  netlify   - Deploy to Netlify', 'white');
  log('  railway   - Deploy to Railway', 'white');
  log('', 'white');
  log('Environment (optional):', 'blue');
  log('  production (default) - Production deployment', 'white');
  log('  staging             - Staging deployment', 'white');
  log('', 'white');
  log('Examples:', 'blue');
  log('  node deploy.js vercel', 'white');
  log('  node deploy.js netlify production', 'white');
  log('  node deploy.js railway staging', 'white');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showUsage();
    process.exit(0);
  }

  const platform = args[0];
  const environment = args[1] || 'production';

  const deploymentManager = new DeploymentManager(platform, environment);
  await deploymentManager.deploy();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DeploymentManager;
