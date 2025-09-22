# 🚀 Tranquilae - Vercel Deployment Guide

This guide walks you through deploying Tranquilae to Vercel with all required services configured.

## 📋 Pre-Deployment Checklist

### ✅ Required Accounts Setup
- [ ] **Neon Database**: [neon.tech](https://neon.tech/) - PostgreSQL database
- [ ] **Supabase**: [supabase.com](https://supabase.com/) - Authentication
- [ ] **Stripe**: [stripe.com](https://stripe.com/) - Payment processing
- [ ] **Resend**: [resend.com](https://resend.com/) - Email service
- [ ] **OpenAI**: [platform.openai.com](https://platform.openai.com/) - AI features
- [ ] **Vercel**: [vercel.com](https://vercel.com/) - Hosting platform

### 🗄️ Environment Variables Ready
Ensure you have all values from your `.env.local` file ready for Vercel.

---

## 🏗️ Step 1: Database Setup (Neon)

1. **Create Neon Project**
   ```bash
   # Go to: https://neon.tech/
   # Click "Sign up" → "Create your first project"
   # Choose region closest to your users
   ```

2. **Get Connection String**
   ```bash
   # In Neon Dashboard → Connection Details
   # Copy "Connection string"
   # Example: postgresql://user:pass@ep-name.region.neon.tech/dbname?sslmode=require
   ```

3. **Run Migrations** (local first)
   ```bash
   # Set DATABASE_URL in your .env.local
   npm run db:migrate
   npm run db:test  # Verify connection
   ```

---

## 🔐 Step 2: Authentication Setup (Supabase)

1. **Create Supabase Project**
   ```bash
   # Go to: https://supabase.com/
   # "New project" → Choose organization
   # Set project name, password, region
   ```

2. **Get API Keys**
   ```bash
   # In Supabase Dashboard:
   # Settings → API
   # Copy: Project URL, anon public key, service_role key
   ```

3. **Configure Authentication**
   ```bash
   # Authentication → Settings
   # Site URL: https://your-domain.vercel.app
   # Redirect URLs: https://your-domain.vercel.app/auth/callback
   ```

---

## 💳 Step 3: Payment Setup (Stripe)

1. **Create Stripe Account**
   ```bash
   # Go to: https://stripe.com/
   # Complete business verification
   # Dashboard → Developers → API keys
   ```

2. **Create Products**
   ```bash
   # Dashboard → Products → Add product
   # Product 1: "Pathfinder Monthly" - £10.00 GBP
   # Product 2: "Pathfinder Yearly" - £100.00 GBP  
   # Save the price IDs (price_xxx)
   ```

3. **Setup Webhooks** (do this AFTER deploying)
   ```bash
   # Dashboard → Webhooks → Add endpoint
   # URL: https://your-domain.vercel.app/api/webhooks/stripe
   # Events: checkout.session.completed, invoice.payment_succeeded, customer.subscription.updated
   ```

---

## 📧 Step 4: Email Setup (Resend)

1. **Create Resend Account**
   ```bash
   # Go to: https://resend.com/
   # Sign up → Verify email
   ```

2. **Add Domain** (for production)
   ```bash
   # Domains → Add domain
   # Follow DNS verification steps
   # For testing: use @resend.dev domain
   ```

3. **Generate API Key**
   ```bash
   # API Keys → Create API Key
   # Copy the key (starts with re_)
   ```

---

## 🤖 Step 5: AI Setup (OpenAI)

1. **Create OpenAI Account**
   ```bash
   # Go to: https://platform.openai.com/
   # Sign up → Add billing method
   ```

2. **Generate API Key**
   ```bash
   # API Keys → Create new secret key
   # Copy key (starts with sk-)
   # Set spending limits in Billing
   ```

---

## 🌐 Step 6: Deploy to Vercel

### Option A: One-Click Deploy (Recommended)

1. **Deploy from GitHub**
   ```bash
   # Fork the repository to your GitHub
   # Go to: https://vercel.com/new
   # Import your forked repository
   ```

### Option B: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   # Follow the prompts
   ```

---

## ⚙️ Step 7: Environment Variables in Vercel

1. **Access Vercel Dashboard**
   ```bash
   # Go to: https://vercel.com/dashboard
   # Select your project → Settings → Environment Variables
   ```

2. **Add Required Variables**
   
   **Database**
   ```
   DATABASE_URL: postgresql://user:pass@ep-name.region.neon.tech/dbname?sslmode=require
   ```

   **Authentication**
   ```
   NEXT_PUBLIC_SUPABASE_URL: https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_JWT_SECRET: your-jwt-secret
   ```

   **Payments**
   ```
   STRIPE_SECRET_KEY: sk_live_... (use live keys for production)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pk_live_...
   STRIPE_WEBHOOK_SECRET: whsec_... (set after webhook creation)
   STRIPE_PRICE_ID_PATHFINDER_MONTHLY: price_...
   STRIPE_PRICE_ID_PATHFINDER_YEARLY: price_...
   ```

   **Email**
   ```
   RESEND_API_KEY: re_...
   FROM_EMAIL: noreply@your-domain.com
   FROM_NAME: Tranquilae
   ```

   **AI**
   ```
   OPENAI_API_KEY: sk-...
   OPENAI_MODEL: gpt-4
   ```

   **App Configuration**
   ```
   NEXT_PUBLIC_APP_URL: https://your-domain.vercel.app
   NODE_ENV: production
   ```

3. **Redeploy**
   ```bash
   # After adding env vars, trigger redeploy:
   # Dashboard → Deployments → Click "..." → Redeploy
   ```

---

## 🔗 Step 8: Custom Domain (Optional)

1. **Add Domain in Vercel**
   ```bash
   # Dashboard → Settings → Domains
   # Add your domain: www.tranquilae.com
   ```

2. **Update DNS Records**
   ```bash
   # Add CNAME record:
   # Name: www (or @)
   # Value: cname.vercel-dns.com
   ```

3. **Update Environment Variables**
   ```bash
   NEXT_PUBLIC_APP_URL: https://www.tranquilae.com
   # Also update in Supabase redirect URLs
   # And Stripe webhook URL
   ```

---

## ✅ Step 9: Post-Deployment Testing

### 🧪 Test Checklist

1. **Basic Functionality**
   ```bash
   ✅ Visit your site - loads without errors
   ✅ Sign up flow works
   ✅ Email verification works
   ✅ Login/logout works
   ✅ Onboarding flow completes
   ```

2. **Payment Testing**
   ```bash
   ✅ Select Pathfinder plan
   ✅ Test card: 4242424242424242 processes successfully
   ✅ Declined card: 4000000000000002 shows error
   ✅ Check Stripe dashboard for test payments
   ```

3. **AI Features**
   ```bash
   ✅ AI coach responds to messages
   ✅ Personalized recommendations work
   ✅ No OpenAI API errors in logs
   ```

4. **Email Testing**
   ```bash
   ✅ Welcome emails send
   ✅ Password reset emails work
   ✅ Payment confirmation emails arrive
   ```

---

## 🐛 Troubleshooting

### Common Issues

**❌ Build Fails**
```bash
# Check Vercel build logs
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Package dependencies
```

**❌ Database Connection Fails**
```bash
# Verify DATABASE_URL format
# Check Neon database is running
# Ensure connection string includes ?sslmode=require
```

**❌ Authentication Issues**
```bash
# Verify Supabase URL and keys
# Check redirect URLs in Supabase config
# Ensure JWT secret is set
```

**❌ Stripe Webhooks Fail**
```bash
# Check webhook URL is correct
# Verify webhook secret
# Check Stripe dashboard for delivery attempts
```

**❌ Emails Not Sending**
```bash
# Verify Resend API key
# Check FROM_EMAIL domain is verified
# Review Resend dashboard logs
```

### Debug Commands

```bash
# Test environment locally first
npm run validate-env
npm run test:stripe
npm run test:emails
npm run db:test

# Check Vercel function logs
vercel logs
```

---

## 🎯 Production Optimizations

### Performance
- Enable Vercel Analytics
- Set up Redis for caching (Upstash)
- Configure image optimization

### Security
- Switch to live Stripe keys
- Enable webhook signature verification
- Set up Sentry error monitoring
- Review CORS settings

### Monitoring
- Set up Sentry for error tracking
- Configure Stripe Radar for fraud detection
- Monitor database performance in Neon
- Set up alerts for failed payments

---

## 📞 Need Help?

- **Vercel Issues**: [vercel.com/support](https://vercel.com/support)
- **Database Issues**: [neon.tech/docs](https://neon.tech/docs)
- **Payment Issues**: [stripe.com/docs](https://stripe.com/docs)
- **Email Issues**: [resend.com/docs](https://resend.com/docs)

**Project Issues**: [GitHub Issues](https://github.com/yourusername/tranquilae/issues)

---

## 🎉 Deployment Complete!

Your Tranquilae app is now live! 🌿

**Next Steps:**
1. Update your README with the live URL
2. Set up monitoring and alerts
3. Plan your launch strategy
4. Start onboarding your first users!

**Live URLs to Test:**
- 🏠 Homepage: `https://your-domain.vercel.app`
- 📝 Onboarding: `https://your-domain.vercel.app/onboarding`
- 🔐 Login: `https://your-domain.vercel.app/auth/login`
- 📊 Dashboard: `https://your-domain.vercel.app/dashboard`
