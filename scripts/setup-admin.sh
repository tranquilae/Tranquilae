#!/bin/bash

# 🚀 Admin Panel Setup Script
# This script helps automate the admin panel deployment setup

set -e

echo "🔧 Admin Panel Setup Script"
echo "=================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}📋 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if .env.local exists
check_env_file() {
    if [ ! -f .env.local ]; then
        print_warning ".env.local file not found"
        echo "Creating .env.local template..."
        cat > .env.local << EOL
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Configuration
ADMIN_USER_IDS=uuid1,uuid2,uuid3
SUPER_ADMIN_USER_IDS=super-admin-uuid

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Error Tracking
SENTRY_DSN=your-sentry-dsn
EOL
        print_success "Created .env.local template"
        print_warning "Please update .env.local with your actual values before continuing"
        exit 1
    else
        print_success "Found .env.local file"
    fi
}

# Check if Node.js and npm are installed
check_dependencies() {
    print_step 1 "Checking dependencies"
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "Node.js and npm are installed"
}

# Install dependencies
install_dependencies() {
    print_step 2 "Installing dependencies"
    
    if [ -f package.json ]; then
        npm install
        print_success "Dependencies installed successfully"
    else
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
}

# Validate environment variables
validate_env_vars() {
    print_step 3 "Validating environment variables"
    
    source .env.local
    
    # Required variables
    required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "ADMIN_USER_IDS"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [[ "${!var}" == "your-"* ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing or incomplete environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        print_warning "Please update .env.local with actual values"
        exit 1
    fi
    
    print_success "Environment variables validated"
}

# Test database connection
test_database_connection() {
    print_step 4 "Testing database connection"
    
    # Create a simple test script
    cat > temp_db_test.js << 'EOL'
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
EOL
    
    # Run the test
    if node temp_db_test.js; then
        print_success "Database connection successful"
    else
        print_error "Database connection failed"
        rm -f temp_db_test.js
        exit 1
    fi
    
    rm -f temp_db_test.js
}

# Check if admin tables exist
check_admin_tables() {
    print_step 5 "Checking admin panel database structure"
    
    cat > temp_table_check.js << 'EOL'
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkTables() {
  try {
    // Check if admin_audit_logs table exists
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('⚠️  admin_audit_logs table not found. Please run the database migration.');
      process.exit(1);
    }
    
    console.log('✅ Admin tables found');
  } catch (error) {
    console.error('⚠️  Error checking tables:', error.message);
    process.exit(1);
  }
}

checkTables();
EOL
    
    if node temp_table_check.js; then
        print_success "Admin tables found"
    else
        print_warning "Admin tables not found"
        print_warning "Please run the database migration script in Supabase SQL Editor"
        print_warning "Migration file: scripts/admin-migration.sql"
    fi
    
    rm -f temp_table_check.js
}

# Build the application
build_application() {
    print_step 6 "Building application"
    
    if npm run build; then
        print_success "Application built successfully"
    else
        print_error "Build failed. Please check the error messages above."
        exit 1
    fi
}

# Run basic tests
run_basic_tests() {
    print_step 7 "Running basic tests"
    
    # Start the development server in the background
    npm run dev &
    DEV_SERVER_PID=$!
    
    # Wait for server to start
    echo "Waiting for development server to start..."
    sleep 10
    
    # Test basic endpoints
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        print_success "Basic API endpoints responding"
    else
        print_warning "Could not test API endpoints (this is normal if health endpoint doesn't exist)"
    fi
    
    # Stop the development server
    kill $DEV_SERVER_PID 2>/dev/null || true
    sleep 2
}

# Generate deployment summary
generate_deployment_summary() {
    print_step 8 "Generating deployment summary"
    
    cat > DEPLOYMENT_SUMMARY.md << EOL
# 🚀 Admin Panel Deployment Summary

**Generated:** $(date)
**Environment:** Development Setup Complete

## ✅ Setup Status
- [x] Dependencies installed
- [x] Environment variables configured
- [x] Database connection tested
- [x] Application builds successfully

## 🔧 Next Steps for Production Deployment

### 1. Database Migration
Run the following SQL in your Supabase production environment:
\`\`\`sql
-- Copy and execute contents of scripts/admin-migration.sql
\`\`\`

### 2. Environment Variables for Production
Set these in your deployment platform (Vercel/Netlify/etc.):
\`\`\`bash
ADMIN_USER_IDS="${ADMIN_USER_IDS}"
SUPER_ADMIN_USER_IDS="${SUPER_ADMIN_USER_IDS}"
SUPABASE_SERVICE_ROLE_KEY="your-production-service-role-key"
NEXT_PUBLIC_SUPABASE_URL="your-production-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-production-anon-key"
# ... other production environment variables
\`\`\`

### 3. Admin Account Setup
1. Create admin accounts through normal app registration
2. Get user UUIDs from Supabase Auth dashboard
3. Add UUIDs to ADMIN_USER_IDS environment variable
4. Deploy application with updated environment variables

### 4. Testing
Follow the comprehensive testing guide in:
- \`documentation/ADMIN_TESTING_GUIDE.md\`
- \`documentation/DEPLOYMENT_CHECKLIST.md\`

## 📚 Documentation
- Admin Testing Guide: \`documentation/ADMIN_TESTING_GUIDE.md\`
- Deployment Checklist: \`documentation/DEPLOYMENT_CHECKLIST.md\`
- Security Audit: \`documentation/ADMIN_SECURITY_AUDIT.md\`

## 🔗 Admin Panel Access
Once deployed, admin users can access the panel at:
\`https://yourdomain.com/admin\`

---
**Note:** This setup script prepared your development environment. 
Review the deployment checklist before going to production.
EOL
    
    print_success "Deployment summary generated: DEPLOYMENT_SUMMARY.md"
}

# Main execution
main() {
    echo "Starting admin panel setup..."
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from your project root directory."
        exit 1
    fi
    
    check_dependencies
    check_env_file
    install_dependencies
    validate_env_vars
    test_database_connection
    check_admin_tables
    build_application
    run_basic_tests
    generate_deployment_summary
    
    echo ""
    echo "🎉 Admin Panel Setup Complete!"
    echo ""
    print_success "Development environment is ready"
    print_warning "Review DEPLOYMENT_SUMMARY.md for next steps"
    print_warning "Follow documentation/DEPLOYMENT_CHECKLIST.md for production deployment"
    echo ""
}

# Run main function
main "$@"
