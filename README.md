<div align="center">
  <img src="public/logo.svg" alt="Tranquilae Logo" width="400" height="75">
  
  # 🌿 Tranquilae
  
  **Your Personal Wellness Journey Companion**
  
  *Transform your health and mindfulness with AI-powered coaching, nutrition tracking, and personalized wellness plans.*

  [![Next.js](https://img.shields.io/badge/Next.js-14.2.32-black?logo=next.js&logoColor=white)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Auth-green?logo=supabase&logoColor=white)](https://supabase.com/)
  [![Stripe](https://img.shields.io/badge/Stripe-Payments-purple?logo=stripe&logoColor=white)](https://stripe.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## ✨ Features

### 🎯 **Smart Onboarding Experience**
- 7-step personalized onboarding flow with beautiful Lottie animations
- Goal setting and device integration setup
- Progress persistence with server-side backup
- Seamless payment integration for premium features

### 📊 **Comprehensive Wellness Dashboard**
- **Nutrition Tracking**: Calorie monitoring and meal planning
- **AI Coach**: Personalized wellness guidance powered by OpenAI
- **Mindfulness**: Meditation tracking and mindful eating tools
- **Workouts**: Exercise logging and progress tracking
- **Notes**: Personal wellness journal

### 💳 **Flexible Subscription Plans**
- **Explorer Plan** (Free): Basic tracking and features
- **Pathfinder Plan**: Full AI coaching, premium features, device integrations
  - Monthly: £10 GBP / $13 USD
  - Yearly: £100 GBP / $130 USD (2 months free!)
- 7-day free trials with automatic plan management

### 🔒 **Enterprise-Grade Security**
- Advanced fraud detection with Stripe Radar
- Rate limiting and input validation
- Secure authentication with Supabase
- GDPR-compliant data handling

### 🌐 **Device Integrations**
- Apple HealthKit (iOS)
- Google Fit (Android)
- Fitbit, Garmin, Oura Ring
- MyFitnessPal and other fitness apps

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database (we recommend [Neon](https://neon.tech/))
- Stripe account for payments
- Supabase project for authentication
- Email service (Resend or SMTP)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/tranquilae.git
cd tranquilae
npm install
```

### 2. Environment Setup

Copy the environment template:
```bash
cp .env.example .env.local
```

Fill in your environment variables (see [Environment Variables](#-environment-variables) section below).

### 3. Database Setup

```bash
# Run database migrations
npm run db:migrate

# Test database connection
npm run db:test
```

### 4. Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app in action! 🎉

---

## 🔧 Environment Variables

### Required for Basic Functionality

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGci...` |

### Required for Payments (Pathfinder Plan)

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_51...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_51...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `STRIPE_PRICE_ID_PATHFINDER_MONTHLY` | Monthly price ID | `price_...` |
| `STRIPE_PRICE_ID_PATHFINDER_YEARLY` | Yearly price ID | `price_...` |

### Required for AI Features

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI coach | `sk-...` |
| `OPENAI_MODEL` | GPT model to use | `gpt-4` |

### Required for Emails

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend email API key | `re_...` |
| `FROM_EMAIL` | Sender email address | `noreply@tranquilae.com` |

### Optional but Recommended

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Your app's URL | `http://localhost:3000` |
| `REDIS_URL` | Redis for caching/rate limiting | Memory storage |
| `SENTRY_DSN` | Error monitoring | Disabled |

For the complete list, see `.env.example`.

---

## 🛠 Required External Services

### 1. **Database - Neon PostgreSQL** 🐘

**Why**: Serverless PostgreSQL perfect for Next.js apps
**Setup**:
1. Create account at [neon.tech](https://neon.tech/)
2. Create new project
3. Copy connection string to `DATABASE_URL`

**Cost**: Generous free tier, paid plans from $19/month

### 2. **Authentication - Supabase** 🔐

**Why**: Complete auth solution with social logins
**Setup**:
1. Create project at [supabase.com](https://supabase.com/)
2. Go to Settings > API
3. Copy URL and keys to environment variables

**Cost**: Free for up to 50k monthly users

### 3. **Payments - Stripe** 💳

**Why**: Industry-standard payment processing
**Setup**:
1. Create account at [stripe.com](https://stripe.com/)
2. Create products: "Pathfinder Monthly" (£10) & "Pathfinder Yearly" (£100)
3. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Copy keys and price IDs

**Cost**: 2.9% + 30¢ per transaction

### 4. **Email - Resend** 📧

**Why**: Developer-friendly email API
**Setup**:
1. Create account at [resend.com](https://resend.com/)
2. Verify your domain
3. Copy API key

**Cost**: 3,000 emails/month free, then $20/month

### 5. **AI Coach - OpenAI** 🤖

**Why**: Powers personalized wellness coaching
**Setup**:
1. Create account at [platform.openai.com](https://platform.openai.com/)
2. Generate API key
3. Set up billing

**Cost**: ~$0.002 per 1k tokens (very affordable for coaching)

### 6. **Optional: Error Monitoring - Sentry** 🐛

**Why**: Track and fix issues in production
**Setup**:
1. Create project at [sentry.io](https://sentry.io/)
2. Copy DSN

**Cost**: Free for 5k errors/month

---

## 🚀 Vercel Deployment

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/tranquilae)

### Manual Deployment

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com/)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Environment Variables**
   - In Vercel dashboard, go to Settings > Environment Variables
   - Add all required variables from your `.env.local`
   - Make sure to set production values (live Stripe keys, production database, etc.)

4. **Domain Setup**
   - Add custom domain in Vercel dashboard
   - Update `NEXT_PUBLIC_APP_URL` to your production domain
   - Update Stripe webhook URL to production endpoint

5. **Post-Deploy Checklist**
   - [ ] Test user registration/login
   - [ ] Test onboarding flow
   - [ ] Test Stripe payments with test cards
   - [ ] Verify email sending
   - [ ] Check error monitoring setup

---

## 🧪 Testing

### Stripe Test Cards

```javascript
// Successful payments
"4242424242424242" // Visa
"5555555555554444" // Mastercard

// Payment failures
"4000000000000002" // Generic decline
"4000000000009995" // Insufficient funds
```

### Test Commands

```bash
# Test full environment
npm run validate-env

# Test individual services
npm run test:stripe
npm run test:emails
npm run db:test

# Run test suite
npm run test
```

---

## 📚 Project Structure

```
tranquilae/
├── app/
│   ├── (dashboard)/          # Main app dashboard
│   │   ├── ai-coach/        # AI coaching interface
│   │   ├── calories/        # Nutrition tracking
│   │   ├── mindfulness/     # Meditation & mindfulness
│   │   ├── workouts/        # Exercise tracking
│   │   └── settings/        # User preferences
│   ├── auth/                # Authentication pages
│   ├── onboarding/          # User onboarding flow
│   ├── api/                 # Backend API routes
│   └── homepage/            # Landing page
├── components/              # Reusable UI components
├── lib/                     # Utility functions
│   ├── database.ts         # Database operations
│   ├── stripe-radar.ts     # Fraud prevention
│   ├── email-templates.ts  # Email templates
│   └── validations.ts      # Input validation
├── public/                  # Static assets
└── scripts/                # Database migrations & setup
```

---

## 🔒 Security Features

- **Stripe Radar**: Advanced fraud detection
- **Rate Limiting**: API abuse prevention
- **Input Validation**: XSS and injection prevention
- **HTTPS Enforcement**: Secure connections only
- **Secret Management**: Environment variable isolation
- **Webhook Verification**: Cryptographic signature validation

---

## 🎨 Customization

### Branding
- Update `public/logo.svg` with your logo
- Modify colors in `tailwind.config.js`
- Update email templates in `lib/email-templates.ts`

### Features
- Add new dashboard widgets in `components/`
- Extend onboarding in `app/onboarding/steps/`
- Add device integrations in `lib/integrations/`

---

## 📈 Analytics & Monitoring

Track key metrics:
- Onboarding completion rate
- Free-to-paid conversion
- Feature usage
- Payment success rate

Integrate with:
- Vercel Analytics (built-in)
- PostHog for user behavior
- Sentry for error monitoring

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Stripe](https://stripe.com/) - Online payment processing
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

## 📞 Support

- 📧 Email: support@tranquilae.com
- 💬 Discord: [Join our community](https://discord.gg/tranquilae)
- 📖 Docs: [docs.tranquilae.com](https://docs.tranquilae.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/tranquilae/issues)

---

<div align="center">
  
  **Built with ❤️ for your wellness journey**
  
  *Start your transformation today with Tranquilae*

  [Live Demo](https://tranquilae.vercel.app) · [Documentation](https://docs.tranquilae.com) · [Join Community](https://discord.gg/tranquilae)

</div>
