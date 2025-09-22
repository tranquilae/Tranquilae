# Tranquilae Onboarding System

A comprehensive multi-step onboarding flow with Stripe integration, Lottie animations, and automatic plan management.

## 🎯 Features

- **7-Step Onboarding Flow**: Welcome → Goals → Connect → Personalise → Plan Selection → Payment → Finish
- **Progress Persistence**: LocalStorage + server-side backup
- **Stripe Integration**: £0 verification, 7-day trials, automatic downgrades
- **Optimized Animations**: Lazy-loaded Lottie files with SVG fallbacks
- **Email Notifications**: Comprehensive templates for all scenarios
- **Accessibility**: WCAG 2.1 AA compliant
- **Mobile Responsive**: Optimized for all devices

## 🏗️ Architecture

### Frontend Components
```
/app/onboarding/
├── page.tsx                 # Main onboarding page
├── Stepper.tsx              # Progress management & routing
└── steps/
    ├── WelcomeStep.tsx      # Welcome with animations
    ├── GoalsStep.tsx        # Goal selection
    ├── ConnectDevicesStep.tsx  # Device connections
    ├── PersonalisationStep.tsx # User profile data
    ├── PlanSelectionStep.tsx   # Explorer vs Pathfinder
    ├── StripePaymentStep.tsx   # Payment processing
    └── FinishStep.tsx          # Success/completion
```

### Backend APIs
```
/app/api/
├── onboarding/
│   ├── progress/route.ts    # Save/load progress
│   └── complete/route.ts    # Finalize onboarding
├── checkout/
│   ├── session/route.ts     # Create Stripe sessions
│   ├── success/route.ts     # Handle payment success
│   └── cancel/route.ts      # Handle cancellations
└── webhooks/
    └── stripe/route.ts      # Stripe event handling
```

### Database Schema
```sql
-- Users table extensions
ALTER TABLE users 
ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN plan VARCHAR(20) DEFAULT 'explorer';

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  plan VARCHAR(20) NOT NULL DEFAULT 'explorer',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding progress table
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  step INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## 🚀 Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host/database"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_PATHFINDER_MONTHLY="price_..."
STRIPE_PRICE_ID_PATHFINDER_YEARLY="price_..."

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
FROM_EMAIL="noreply@tranquilae.com"

# Email Configuration (Choose one)
# Option 1: SendGrid
SENDGRID_API_KEY="SG...."

# Option 2: SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Option 3: Development (Ethereal)
ETHEREAL_USER="test-user@ethereal.email"
ETHEREAL_PASS="test-password"
```

### 2. Database Setup

Run the migrations to set up the required tables:

```bash
npm run db:migrate
```

Or manually execute the SQL from the schema section above.

### 3. Stripe Setup

1. **Create Products & Prices** in your Stripe Dashboard:
   ```
   Product: Pathfinder Plan
   - Price 1: £10.00 GBP monthly (save price ID)
   - Price 2: £100.00 GBP yearly (save price ID)
   ```

2. **Configure Webhooks** in Stripe Dashboard:
   - Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_method.attached`
     - `setup_intent.succeeded`

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

### 6. Test the Flow

Visit `http://localhost:3000/onboarding` and test:
- Complete onboarding with Explorer plan
- Complete onboarding with Pathfinder plan
- Test payment failures using Stripe test cards

## 🧪 Testing

### Stripe Test Cards

Use these test cards for different scenarios:

```javascript
// Successful payments
"4242424242424242" // Visa
"5555555555554444" // Mastercard

// Failed payments
"4000000000000002" // Generic decline
"4000000000009995" // Insufficient funds
"4000000000009987" // Lost card
```

### Test Flow Commands

```bash
# Test email sending
npm run test:emails

# Test database operations
npm run test:db

# Test Stripe webhooks
npm run test:webhooks

# Run full test suite
npm run test
```

## 📧 Email Templates

The system includes 6 email templates:

1. **Welcome** - Explorer plan signup
2. **Pathfinder Welcome** - Trial start confirmation
3. **Payment Success** - Successful billing
4. **Payment Failure & Downgrade** - Automatic downgrade notice
5. **Upgrade Reminder** - Re-engagement after downgrade
6. **Trial Ending** - Pre-billing notification

Templates are located in `/lib/email-templates.ts` and follow Tranquilae branding.

## 🎨 Lottie Animations

### Animation Files
- `welcome.json` - Sunrise/meditation (15KB)
- `goals.json` - Branching paths (12KB)
- `connect.json` - Device sync (18KB)
- `personalise.json` - User profile (14KB)
- `plans.json` - Plan selection doors (16KB)
- `success.json` - Celebration confetti (22KB)

### CDN Configuration
All animations are served from a CDN with automatic fallbacks:
```typescript
// Usage example
import { getAnimation } from '@/lib/animations';

const animationConfig = getAnimation('welcome');
// Returns: { url, fallbackEmoji, fallbackColor, description }
```

## 🔒 Security Features

### Rate Limiting
- Onboarding progress: 10 requests/minute
- Checkout session: 5 requests/minute
- Onboarding completion: 3 requests/minute

### Input Validation
- All form inputs sanitized and validated
- Stripe webhook signature verification
- SQL injection prevention with parameterized queries

### Authentication
- User ID required for all onboarding endpoints
- Session/JWT token validation (integrate with your auth system)

## 🚀 Deployment

### Vercel Deployment

1. **Environment Variables**: Set all required env vars in Vercel dashboard
2. **Database**: Ensure Neon DB is accessible from Vercel
3. **Stripe Webhooks**: Update webhook URL to production domain
4. **Email Service**: Configure production email service

### Environment-Specific Configs

```javascript
// Production optimizations
if (process.env.NODE_ENV === 'production') {
  // Use Redis for rate limiting
  // Enable email queuing
  // Use CDN for Lottie files
  // Enable error monitoring
}
```

## 🐛 Troubleshooting

### Common Issues

**Onboarding progress not saving**
```bash
# Check database connection
npm run db:test

# Verify user authentication
# Check browser console for auth errors
```

**Stripe payments failing**
```bash
# Verify webhook signature
# Check Stripe dashboard for events
# Ensure correct price IDs in env vars
```

**Emails not sending**
```bash
# Test email configuration
npm run test:email-config

# Check SMTP credentials
# Verify SendGrid API key
```

**Lottie animations not loading**
```bash
# Check CDN URLs
# Verify fallback SVGs render
# Test with slow network connection
```

### Debug Mode

Enable debug logging:
```bash
DEBUG=tranquilae:* npm run dev
```

## 📊 Analytics & Monitoring

### Key Metrics to Track
- Onboarding completion rate by step
- Explorer to Pathfinder conversion
- Payment failure rates
- Trial-to-paid conversion
- Email engagement rates

### Integration Points
```typescript
// Track onboarding progress
analytics.track('Onboarding Step Completed', {
  step: 3,
  stepName: 'Personalisation',
  userId: user.id
});

// Track plan selections
analytics.track('Plan Selected', {
  plan: 'pathfinder',
  source: 'onboarding'
});
```

## 🔄 Maintenance

### Regular Tasks
- Monitor email delivery rates
- Review Stripe webhook logs
- Update Lottie animation CDN URLs
- Clean up old onboarding progress records

### Performance Optimization
- Preload critical animations
- Optimize database queries
- Monitor API response times
- Review email template performance

## 📚 API Reference

### Onboarding Endpoints

**POST /api/onboarding/progress**
```typescript
// Save step progress
{
  step: number,
  data: {
    goals?: string[],
    devicesConnected?: boolean,
    personalData?: PersonalData,
    selectedPlan?: 'explorer' | 'pathfinder',
    paymentStatus?: 'pending' | 'success' | 'failed'
  }
}
```

**POST /api/onboarding/complete**
```typescript
// Complete onboarding
{
  plan: 'explorer' | 'pathfinder'
}
```

### Checkout Endpoints

**POST /api/checkout/session**
```typescript
// Create Stripe session
{
  plan: 'monthly' | 'yearly'
}
```

**GET /api/checkout/success?session_id=cs_...**
Handles successful Stripe checkout completion.

**GET /api/checkout/cancel**
Handles checkout cancellation.

### Webhook Endpoint

**POST /api/webhooks/stripe**
Handles all Stripe events with signature verification.

## 👥 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Test email templates thoroughly
5. Verify accessibility compliance

---

## 🎉 Success!

Your Tranquilae onboarding system is now ready! Users will experience a smooth, branded journey from signup to dashboard with automatic payment handling and email notifications.

For support, check the troubleshooting section or contact the development team.
