# 🌿 Tranquilae Environment Variables Setup

## Step 1: Get Your New Supabase API Keys

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/settings/api
2. Copy these two NEW API keys (not the legacy JWT ones):
   - **Publishable key** - Format: `sb_publishable_...` (safe to expose publicly)
   - **Secret key** - Format: `sb_secret_...` (click the eye icon to reveal, keep private)

## Step 2: Update Local Environment (.env.local)

Replace the content of your `.env.local` file with:

```bash
# 🌿 Tranquilae - Local Environment Variables
# Updated with real Supabase keys

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://tranquilae.com"

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL="https://fspoavmvfymlunmfubqp.supabase.co"

# 🔑 NEW SUPABASE API KEYS (Replace with your actual keys)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="sb_publishable_YOUR_KEY_HERE"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_YOUR_KEY_HERE"
SUPABASE_SECRET_KEY="sb_secret_YOUR_KEY_HERE"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_YOUR_KEY_HERE"

# Development Settings
NODE_ENV="development"
```

## Step 3: Set Environment Variables in Vercel

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Find your Tranquilae project
3. Go to **Settings** > **Environment Variables**
4. Add these environment variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fspoavmvfymlunmfubqp.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Your publishable key (sb_publishable_...) |
| `SUPABASE_SECRET_KEY` | Your secret key (sb_secret_...) |

## Step 4: Deploy

After setting the environment variables:
1. Go to the **Deployments** tab in Vercel
2. Click **Redeploy** on your latest deployment
3. Or push a new commit to trigger automatic deployment

## Verification

Once deployed, the red diagnostic box should disappear and your app should work correctly!

## What the NEW API keys look like:

- **Publishable key**: Starts with `sb_publishable_` (safe to expose publicly)
- **Secret key**: Starts with `sb_secret_` (keep this private!)

Make sure you're copying the full keys including the `sb_` prefix!
