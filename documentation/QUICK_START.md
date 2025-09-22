# ⚡ Tranquilae - Quick Start Guide

Get your Tranquilae wellness app running in minutes! This guide focuses on the essentials.

## 🚀 5-Minute Setup

### Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/tranquilae.git
cd tranquilae

# Install dependencies  
npm install

# Copy environment template
cp .env.example .env.local
```

### Step 2: Essential Services (3 minutes)

You need these **4 services** to get started:

#### 🐘 Database (30 seconds)
1. Go to [neon.tech](https://neon.tech/) → Sign up → Create project
2. Copy connection string → Paste in `.env.local` as `DATABASE_URL`

#### 🔐 Auth (30 seconds)  
1. Go to [supabase.com](https://supabase.com/) → New project
2. Settings → API → Copy URL and keys → Paste in `.env.local`

#### 💳 Payments (1 minute)
1. Go to [stripe.com](https://stripe.com/) → Create account 
2. Dashboard → Developers → API keys → Copy test keys
3. Products → Create "Pathfinder Monthly" (£10) & "Pathfinder Yearly" (£100)
4. Copy price IDs → Paste in `.env.local`

#### 📧 Email (1 minute)
1. Go to [resend.com](https://resend.com/) → Sign up
2. API Keys → Create key → Paste in `.env.local`

### Step 3: Run & Test

```bash
# Set up database
npm run db:migrate

# Start development server
npm run dev

# Visit: http://localhost:3000 🎉
```

---

## 🛠 Essential Environment Variables

Copy these into your `.env.local` with your actual values:

```bash
# Database (Neon)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require"

# Auth (Supabase)  
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
SUPABASE_JWT_SECRET="your-jwt-secret"

# Payments (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_PRICE_ID_PATHFINDER_MONTHLY="price_..."
STRIPE_PRICE_ID_PATHFINDER_YEARLY="price_..."

# Email (Resend)
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@yourdomain.com"
FROM_NAME="Tranquilae"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🎯 Test Your Setup

### Basic Test (30 seconds)
```bash
npm run validate-env  # Check all environment variables
```

### Feature Tests
```bash
npm run test:stripe   # Test payment processing
npm run test:emails   # Test email sending  
npm run db:test      # Test database connection
```

### Manual Testing
1. Visit `http://localhost:3000`
2. Sign up for account
3. Complete onboarding flow
4. Try payment with test card: `4242424242424242`

---

## 🚀 Deploy to Vercel (2 minutes)

### One-Click Deploy
1. Push code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy! 🎉

### After Deployment
1. Update Stripe webhook URL: `https://your-app.vercel.app/api/webhooks/stripe`
2. Update Supabase redirect URLs: `https://your-app.vercel.app/auth/callback`

---

## 🤖 Add AI Coach (Optional)

For AI-powered wellness coaching:

```bash
# Add to .env.local
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4"
```

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Create account → API Keys → Create new key
3. Set spending limit ($5-10 for testing)

---

## ❓ Need More Help?

- **Detailed Setup**: Check `README.md`
- **Deployment Guide**: Check `DEPLOYMENT.md`  
- **Issues**: [GitHub Issues](https://github.com/yourusername/tranquilae/issues)

---

## 🎉 You're Ready!

Your wellness app is running! 🌿

**Key URLs:**
- 🏠 **Homepage**: http://localhost:3000
- 📝 **Onboarding**: http://localhost:3000/onboarding
- 📊 **Dashboard**: http://localhost:3000/dashboard (after signup)
- 🔐 **Admin**: http://localhost:3000/auth/login

**Next Steps:**
1. Customize branding in `tailwind.config.js`
2. Update email templates in `lib/email-templates.ts`
3. Add your content and launch! 🚀

---

*Built with ❤️ by the Tranquilae team*
