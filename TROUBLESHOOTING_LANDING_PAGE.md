# 🔧 Troubleshooting: Landing Page Not Loading

## Problem
The landing page shows only a loading spinner and never loads.

## Root Cause
The `AuthProvider` component tries to connect to Supabase on app startup. If Supabase is slow or misconfigured, it hangs indefinitely.

---

## ✅ Solution Applied

We've added **timeout protection** and **better error handling** to the `AuthProvider`. Now:
- ⏱️ Auth check times out after 5 seconds
- 🏠 Public pages (like homepage) load even if auth fails
- 📊 Console logs show what's happening
- 🔒 Protected pages still require authentication

---

## 🧪 Testing Steps

### Step 1: Test Supabase Connection

Run the diagnostic script:
```bash
node scripts/test-supabase-connection.js
```

**Expected Output:**
```
✅ url: https://your-project.supabase.co...
✅ anonKey: eyJhbGci...
✅ Connection successful!
```

**If you see errors:**
- Check `.env.local` file exists in project root
- Verify environment variables are correct
- Get values from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

---

### Step 2: Check Browser Console

1. Open your app: `npm run dev`
2. Open browser DevTools (F12)
3. Go to Console tab

**Look for these logs:**
```
🔐 AuthProvider: Starting auth check...
✅ AuthProvider: User authenticated [user-id]
   OR
ℹ️  AuthProvider: No active session
Auth initialization: 234ms
```

**Warning signs:**
```
❌ AuthProvider: Error getting initial session: [error]
⚠️  AuthProvider: Init failed, but allowing public route access
```

---

### Step 3: Verify Homepage Loads

Navigate to `http://localhost:3000`

**✅ Success:**
- Homepage displays with header, hero section, features
- No infinite loading spinner
- Console shows auth completed quickly (<5 seconds)

**❌ Still stuck?** See "Advanced Troubleshooting" below

---

## 🔍 Advanced Troubleshooting

### Issue: Still seeing loading spinner

**Check 1: Environment Variables**
```bash
# Windows PowerShell
Get-Content .env.local | Select-String "SUPABASE"

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Check 2: Restart Dev Server**
```bash
# Stop server (Ctrl+C)
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Restart
npm run dev
```

**Check 3: Check Supabase Project Status**
- Go to https://supabase.com/dashboard
- Ensure project is **Active** (not Paused)
- Check "Project Settings" > "API" for correct keys

---

### Issue: Homepage loads but dashboard doesn't work

This is expected! The auth system is working. Dashboard requires login.

**To test:**
1. Click "Get Started" or "Log In"
2. Create an account or sign in
3. Complete onboarding
4. Dashboard should now load

---

### Issue: Console shows "Auth check timeout"

**Cause:** Supabase is slow or unreachable

**Solutions:**
1. **Check internet connection**
2. **Verify Supabase status:** https://status.supabase.com
3. **Test from another network** (mobile hotspot)
4. **Contact Supabase support** if their service is down

---

### Issue: "Invalid credentials" errors

**Cause:** API keys are wrong or expired

**Solutions:**
1. Go to Supabase Dashboard > Project Settings > API
2. Copy the **anon/public** key (NOT the service_role key)
3. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-correct-key-here
   ```
4. Restart dev server

---

## 📝 Common .env.local Configuration

Create or update `.env.local` in project root:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (for admin operations - OPTIONAL for homepage)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database (OPTIONAL for homepage)
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# Stripe (OPTIONAL for homepage)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Quick Fixes Summary

| Problem | Quick Fix |
|---------|-----------|
| Missing env vars | Run `node scripts/test-supabase-connection.js` |
| Stuck on loading | Restart dev server, clear `.next` folder |
| Wrong API keys | Copy from Supabase Dashboard > API settings |
| Timeout errors | Check Supabase status, try different network |
| Can't access dashboard | Normal! Login required for protected pages |

---

## 📞 Still Need Help?

1. **Check the logs:**
   - Terminal output
   - Browser console (F12)
   - Run diagnostic script

2. **Provide this info when asking for help:**
   - Output of `node scripts/test-supabase-connection.js`
   - Browser console errors (screenshot)
   - Terminal errors
   - Whether homepage loads without `AuthProvider`

3. **GitHub Issues:**
   - https://github.com/yourusername/tranquilae/issues

---

## ✨ What Changed?

We improved the `AuthProvider` component (`components/AuthProvider.tsx`):

**Before:**
- ❌ Hung forever if Supabase was slow
- ❌ Blocked all pages during auth check
- ❌ No error messages

**After:**
- ✅ Times out after 5 seconds
- ✅ Public pages load even if auth fails
- ✅ Detailed console logging
- ✅ Error states handled gracefully

---

**Last Updated:** 2025-10-05
