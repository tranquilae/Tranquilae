# 🚀 Vercel Environment Variables Checklist

## Required Environment Variables for Vercel

Go to your Vercel Dashboard → Your Project → Settings → Environment Variables

### ✅ Supabase Configuration
| Variable Name | Value | Notes |
|---------------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fspoavmvfymlunmfubqp.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `sb_publishable_i490cr3a929wFuz286rVKA_3EbsFJ7N` | Your publishable key (safe to expose) |
| `SUPABASE_SECRET_KEY` | `sb_secret_YOUR_ACTUAL_SECRET_HERE` | **Your real secret key** (keep private!) |

### 🔐 Important Notes:
- **NEVER** commit the real `SUPABASE_SECRET_KEY` to your Git repository
- The secret key should ONLY be set in your production environment (Vercel)
- Local development uses dummy values for the secret key
- Admin features may not work locally without the real secret key

### 🎯 After Setting Environment Variables:
1. **Redeploy** your project in Vercel
2. The red diagnostic box should disappear
3. Your `/api/admin/stripe/sync` route should work properly

### 📋 How to Verify:
1. Visit your deployed site
2. Check that no red diagnostic box appears
3. Test admin functionalities if needed

---

## Current Status:
- ✅ Local environment is secure (no real secrets in files)
- ✅ Code supports new Supabase API key format
- ⏳ Need to verify Vercel environment variables are set
- ⏳ Need to redeploy after setting environment variables
