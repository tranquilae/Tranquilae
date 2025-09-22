# 🔐 Admin Panel - Complete User & Subscription Management System

A comprehensive admin panel built with Next.js 13+, Supabase, and Stripe integration for managing users, subscriptions, and system operations with enterprise-level security and audit logging.

## ✨ Features

### 🛡️ Security & Authentication
- **Role-based Access Control** - Admin and Super Admin role separation
- **Row-Level Security (RLS)** - Database-level access control
- **Audit Logging** - Complete action tracking and compliance
- **Session Management** - Secure admin session handling
- **Environment-based Admin Assignment** - Admin roles defined via environment variables

### 👥 User Management
- **Complete CRUD Operations** - Create, read, update, delete users
- **Advanced Search & Filtering** - Search by name, email, plan, role, status
- **User Actions**:
  - Edit user profile (name, plan, role, status)
  - Password reset via Supabase Auth
  - Email change with proper validation
  - Account suspension/activation
  - User deletion (Super Admin only)
- **Bulk Operations** - Select multiple users for batch actions
- **Real-time Updates** - Live data synchronization

### 💳 Subscription Management
- **Stripe Integration** - Full synchronization with Stripe subscriptions
- **Plan Management** - Upgrade/downgrade user plans
- **Subscription Lifecycle**:
  - View subscription status and details
  - Handle trial periods, cancellations, past due
  - Manual subscription overrides
  - Billing history and payments
- **Sync Operations** - Real-time sync with Stripe data
- **Revenue Analytics** - Subscription metrics and reporting

### 📊 Audit & Compliance
- **Complete Action Logging** - Every admin action tracked
- **Sensitive Data Protection** - Automatic PII redaction
- **Searchable Audit Logs** - Filter by user, action, date range
- **Compliance Ready** - GDPR, SOX, HIPAA audit trails
- **Event Details** - Expandable event metadata and context

### 🎨 User Experience
- **Modern UI/UX** - Clean, intuitive design with Tailwind CSS
- **Dark/Light Mode** - Theme switching with persistence
- **Mobile Responsive** - Full functionality on all devices  
- **Loading States** - Smooth UX with skeleton loaders
- **Error Handling** - Graceful error messages and recovery
- **Toast Notifications** - Success/error feedback

## 🏗️ Architecture

### Frontend (Next.js 13+)
```
app/
├── admin/
│   ├── layout.tsx              # Admin layout with sidebar
│   ├── page.tsx                # Dashboard with metrics
│   ├── users/
│   │   └── page.tsx            # User management interface
│   ├── subscriptions/
│   │   └── page.tsx            # Subscription management
│   ├── audit-logs/
│   │   └── page.tsx            # Audit log viewer
│   └── settings/
│       └── page.tsx            # System settings (Super Admin)
│
├── api/admin/                  # Admin API routes
│   ├── users/
│   │   ├── route.ts            # GET /api/admin/users
│   │   └── [id]/
│   │       ├── route.ts        # GET, PUT, DELETE /api/admin/users/[id]
│   │       ├── suspend/route.ts
│   │       ├── password-reset/route.ts
│   │       └── change-email/route.ts
│   ├── subscriptions/
│   │   ├── route.ts            # Subscription management
│   │   ├── sync/route.ts       # Stripe sync
│   │   └── [id]/
│   │       └── route.ts        # Individual subscription actions
│   └── audit-logs/
│       └── route.ts            # Audit log queries
│
└── components/admin/           # Admin-specific components
    ├── AdminLayout.tsx         # Main admin layout
    ├── Sidebar.tsx             # Navigation sidebar
    ├── Dashboard.tsx           # Dashboard components
    ├── UserManagement.tsx      # User CRUD interface
    ├── SubscriptionManagement.tsx
    ├── AuditLogs.tsx          # Audit log viewer
    └── [modals]/              # Action modals
```

### Backend (Supabase)
```sql
-- Core Tables
users                    # User profiles and metadata
subscriptions           # User subscription data
admin_audit_logs        # Complete audit trail

-- Row Level Security
-- Policies for admin access control
-- Service role bypasses for admin operations
```

### Security Layer
```
Environment Variables → Admin Role Assignment
       ↓
Middleware → Route Protection
       ↓
API Handlers → User Verification
       ↓  
Database → RLS Policies
       ↓
Audit Logs → Action Tracking
```

## 🚀 Quick Start

### 1. Prerequisites
```bash
node >= 18.0.0
npm >= 8.0.0
# Supabase project with Auth enabled
# Stripe account (for subscription features)
```

### 2. Installation & Setup
```bash
# Clone repository
git clone <your-repo>
cd <your-project>

# Run automated setup
chmod +x scripts/setup-admin.sh
./scripts/setup-admin.sh

# Or manual setup:
npm install
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Database Migration
```sql
-- Run in Supabase SQL Editor
-- Copy contents from scripts/admin-migration.sql
```

### 4. Environment Configuration
```bash
# .env.local
ADMIN_USER_IDS="uuid1,uuid2,uuid3"
SUPER_ADMIN_USER_IDS="super-admin-uuid"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
# ... other required variables
```

### 5. Start Development
```bash
npm run dev
# Access admin panel at http://localhost:3000/admin
```

## 📁 Project Structure

### Key Files & Directories

```
├── app/admin/                  # Admin panel pages
├── components/admin/           # Admin-specific components  
├── lib/
│   ├── admin/                  # Admin utility functions
│   ├── supabase-admin.ts      # Admin Supabase client
│   └── audit-logger.ts        # Audit logging utilities
├── middleware.ts              # Route protection
├── scripts/
│   ├── admin-migration.sql    # Database setup
│   └── setup-admin.sh         # Automated setup
└── documentation/             # Comprehensive guides
    ├── ADMIN_TESTING_GUIDE.md
    ├── DEPLOYMENT_CHECKLIST.md
    ├── ADMIN_SECURITY_AUDIT.md
    └── API_DOCUMENTATION.md
```

### Core Components

**AdminLayout** (`components/admin/AdminLayout.tsx`)
- Main layout wrapper with navigation
- Theme switching and user session management
- Responsive sidebar with role-based menu items

**UserManagement** (`components/admin/UserManagement.tsx`)
- Complete user CRUD interface
- Advanced filtering and search
- Bulk operations and action modals

**SubscriptionManagement** (`components/admin/SubscriptionManagement.tsx`)  
- Stripe subscription integration
- Plan upgrade/downgrade workflows
- Billing history and payment management

**AuditLogs** (`components/admin/AuditLogs.tsx`)
- Searchable audit log viewer
- Event detail expansion
- Export and compliance features

## 🔧 Configuration

### Admin Role Assignment
```bash
# Environment Variables
ADMIN_USER_IDS="uuid1,uuid2,uuid3"           # Regular admins
SUPER_ADMIN_USER_IDS="super-admin-uuid"       # Super admins

# Super Admin Exclusive Features:
# - User deletion
# - System settings access  
# - Admin user management
# - Sensitive configuration changes
```

### Database Configuration
```sql
-- Row Level Security Examples
CREATE POLICY "Admins can manage users" 
ON users FOR ALL 
TO authenticated 
USING (auth.uid() IN (SELECT unnest(string_to_array(current_setting('app.admin_users'), ','))));

-- Audit Logs Security
CREATE POLICY "Admins can view audit logs"
ON admin_audit_logs FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT unnest(string_to_array(current_setting('app.admin_users'), ','))));
```

### Stripe Integration
```javascript
// Subscription sync with Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Plan upgrade example
await stripe.subscriptions.update(subscriptionId, {
  items: [{
    id: subscription.items.data[0].id,
    price: newPriceId,
  }],
  proration_behavior: 'always_invoice'
});
```

## 🔒 Security Features

### Access Control
- **Multi-level Authorization**: Environment-based admin assignment
- **Route Protection**: Middleware-level access control  
- **API Security**: Every endpoint validates admin privileges
- **Session Management**: Secure admin session handling

### Data Protection
- **PII Redaction**: Automatic sensitive data masking in logs
- **Encryption**: All data encrypted at rest and in transit
- **Audit Trail**: Complete action history for compliance
- **Input Validation**: Comprehensive input sanitization

### Compliance Ready
- **GDPR**: Data protection and user rights management
- **SOX**: Financial audit trail and controls
- **HIPAA**: Healthcare data protection (if applicable)
- **Custom Compliance**: Configurable audit retention and export

## 🧪 Testing

### Automated Setup Test
```bash
./scripts/setup-admin.sh
# Validates environment, dependencies, database connection
```

### Comprehensive Testing Guide
Follow the complete testing procedures in:
- `documentation/ADMIN_TESTING_GUIDE.md` - 25 test scenarios
- `documentation/DEPLOYMENT_CHECKLIST.md` - Production readiness

### Testing Categories
- **Authentication & Authorization** (3 tests)
- **User Management CRUD** (6 tests)  
- **Subscription Operations** (3 tests)
- **Audit Logging** (3 tests)
- **Security & Error Handling** (7 tests)
- **Integration & Performance** (3 tests)

## 📈 Monitoring & Analytics

### Built-in Metrics
- **User Activity**: Registration, login, subscription changes
- **Admin Actions**: All administrative operations tracked
- **System Health**: Database performance, API response times
- **Revenue Analytics**: Subscription revenue, churn, growth

### Audit & Compliance Dashboard
- **Action Frequency**: Admin operation statistics  
- **User Changes**: Profile updates, role changes, suspensions
- **Security Events**: Failed logins, unauthorized access attempts
- **Data Export**: Compliance reporting and audit export

## 🚀 Deployment

### Production Deployment
1. **Follow Deployment Checklist**: `documentation/DEPLOYMENT_CHECKLIST.md`
2. **Run Security Audit**: `documentation/ADMIN_SECURITY_AUDIT.md`
3. **Complete Testing**: All 25 test scenarios in testing guide
4. **Monitor Post-deployment**: Health checks and error tracking

### Supported Platforms
- **Vercel** (recommended)
- **Netlify**  
- **Railway**
- **Self-hosted** (Docker support available)

### Environment Setup
```bash
# Production Environment Variables
ADMIN_USER_IDS="production-admin-uuids"
SUPABASE_SERVICE_ROLE_KEY="production-service-key"
STRIPE_SECRET_KEY="sk_live_..."
# ... additional production config
```

## 📚 Documentation

### Complete Documentation Set
- **[ADMIN_TESTING_GUIDE.md](documentation/ADMIN_TESTING_GUIDE.md)** - 25 comprehensive test scenarios
- **[DEPLOYMENT_CHECKLIST.md](documentation/DEPLOYMENT_CHECKLIST.md)** - Production deployment guide
- **[ADMIN_SECURITY_AUDIT.md](documentation/ADMIN_SECURITY_AUDIT.md)** - Security audit checklist  
- **[API_DOCUMENTATION.md](documentation/API_DOCUMENTATION.md)** - Complete API reference

### Quick Reference
- **Admin Access**: `https://yourapp.com/admin`
- **API Base**: `https://yourapp.com/api/admin/`
- **Database Tables**: `users`, `subscriptions`, `admin_audit_logs`

## 🤝 Contributing

### Development Guidelines
1. Follow existing code patterns and conventions
2. Add tests for new features
3. Update documentation for API changes  
4. Ensure security review for admin features
5. Test all role-based access scenarios

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Run security audit checklist
4. Update relevant documentation
5. Submit PR with detailed description

## 📞 Support

### Getting Help
- **Documentation**: Check the comprehensive guides in `/documentation`
- **Testing Issues**: Follow the testing guide step-by-step
- **Security Concerns**: Review the security audit checklist
- **Deployment Problems**: Use the deployment checklist

### Common Issues & Solutions

**Access Denied (403)**
```bash
# Check admin user configuration
echo $ADMIN_USER_IDS
# Verify user UUID is in the environment variable
```

**Database Connection Issues**  
```bash
# Test database connection
./scripts/setup-admin.sh
# Validates environment and connectivity
```

**Stripe Sync Failures**
```bash
# Check Stripe configuration
echo $STRIPE_SECRET_KEY
# Verify webhook endpoints are configured
```

## 📄 License

This admin panel is part of the Tranquilae project. See the main project README for license information.

---

## 🎯 Quick Start Checklist

Ready to deploy? Follow this checklist:

- [ ] **Environment Setup**: Run `./scripts/setup-admin.sh`
- [ ] **Database Migration**: Execute `scripts/admin-migration.sql`
- [ ] **Admin Accounts**: Create and configure admin users  
- [ ] **Testing**: Complete testing guide scenarios
- [ ] **Security Audit**: Review security checklist
- [ ] **Production Deploy**: Follow deployment guide
- [ ] **Post-Deploy Testing**: Verify all functionality
- [ ] **Monitoring Setup**: Configure alerts and logging

**🎉 You now have a production-ready admin panel with enterprise-level security, comprehensive user and subscription management, and complete audit logging!**
