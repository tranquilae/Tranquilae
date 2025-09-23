# 🚀 Deployment Configuration Guide

Your build is failing because the production environment (Vercel) is missing the correct Supabase environment variables. Here's how to fix it:

## 🔴 Current Issue

```
Error: Supabase client creation failed: NEXT_PUBLIC_SUPABASE_ANON_KEY is required
```

**Root Cause**: Your code now looks for `NEXT_PUBLIC_SUPABASE_ANON_KEY`, but Supabase provided you with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.

## ✅ Solution: Add Environment Variables to Vercel

### Step 1: Go to Vercel Dashboard

1. Visit https://vercel.com/dashboard
2. Select your **Tranquilae** project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Required Variables

Add these environment variables to your Vercel deployment:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fspoavmvfymlunmfubqp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_i490cr3a929wFuz286rVKA_3EbsFJ7N_YOUR_COMPLETE_KEY_HERE
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_i490cr3a929wFuz286rVKA_3EbsFJ7N_YOUR_COMPLETE_KEY_HERE

# ⚠️ IMPORTANT: Get the COMPLETE keys from your Supabase dashboard!
# The keys above are truncated - you need the full versions

# Secret Keys (for production - get from Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_YOUR_COMPLETE_SECRET_KEY_HERE
SUPABASE_JWT_SECRET=ae530813-ddb2-4f7a-916c-041973670d38

# Database
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-wild-pine-advqkvr0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Other required variables
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_KEY
RESEND_API_KEY=re_YOUR_RESEND_KEY
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY
```

### Step 3: Get the Complete Keys

**The keys you provided are truncated!** You need to:

1. Go to https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/settings/api
2. Click the **👁️ eye icon** next to each key to reveal the COMPLETE value
3. Copy the full keys (they should be 100+ characters long)

### Step 4: Environment Variable Settings in Vercel

For each environment variable:
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `sb_publishable_1490c3a929wFuz286rVKA_3BbsFJ7N_COMPLETE_KEY_HERE`
- **Environments**: Select all (Production, Preview, Development)

Repeat for all variables above.

### Step 5: Redeploy

After adding all environment variables:
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic redeployment

## 🔧 Quick Fix Commands

If you want to quickly update your local environment and push the fix:

```bash
# 1. Update your local .env.local with COMPLETE keys
# 2. Test locally
npm run dev

# 3. Validate configuration
node scripts/validate-supabase-config.js

# 4. If validation passes, commit and push
git add .
git commit -m "Fix: Update Supabase configuration for new key format"
git push origin main
```

## 🚨 Critical Notes

1. **Never commit secret keys** to your repository
2. **Use .env.local for development** (already in .gitignore)
3. **Set production keys in Vercel dashboard** (not in code)
4. **Complete keys are much longer** than what you currently have
5. **Both old and new naming conventions** are now supported

## ✅ Success Indicators

Build will succeed when:
- ✅ All environment variables are set in Vercel
- ✅ Keys are complete (not truncated)
- ✅ No "NEXT_PUBLIC_SUPABASE_ANON_KEY is required" errors
- ✅ Application builds successfully
- ✅ Authentication works in production

## 🆘 Still Having Issues?

1. **Check Vercel build logs** for specific missing variables
2. **Verify key completeness** - they should be very long strings
3. **Test locally first** with `npm run build`
4. **Use the validation script** to check configuration

---

**Priority**: Fix the environment variables in Vercel **immediately** to resolve the deployment failure.
