# 🚨 Client-Side Error Troubleshooting Guide

## Problem
Your site at `www.tranquilae.com` is showing "Application error: a client-side exception has occurred" - this is a Next.js error that typically indicates JavaScript execution issues on the client side.

## ✅ **Fixes Applied**

### 1. **Fixed Middleware Import Issue** ⚠️ **CRITICAL**
**Problem**: Middleware was importing `checkAdminAccess` from `./lib/supabase` which contains server-side only code that can't run in Edge Runtime.
**Fix**: Created inline `checkAdminAccessInline` function directly in middleware to avoid import issues.

### 2. **Added Global Error Boundaries** 🛡️
- Created `app/global-error.tsx` for global error handling
- Created `components/error-boundary.tsx` for component-level error boundaries  
- Updated `app/layout.tsx` to wrap all content with error boundary

### 3. **Enhanced Logo Component Error Handling** 🖼️
- Added error handling for logo loading failures
- Created fallback text display if image fails to load
- Prevents crashes when logo.svg is unavailable

### 4. **Added Development Diagnostics** 🔍
- Created `components/diagnostics.tsx` to show debugging info in development
- Temporarily added to homepage to help identify issues

## 🚀 **Immediate Actions Required**

### **Step 1: Deploy These Changes**
All the fixes are now in your codebase. Deploy to production:

```bash
git add .
git commit -m "Fix client-side error: update middleware and add error boundaries"
git push origin main
```

### **Step 2: Check Environment Variables**
Ensure these are set in your production environment:

```bash
NEXT_PUBLIC_SITE_URL="https://tranquilae.com"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### **Step 3: Verify Static Assets**
Ensure `/public/logo.svg` exists and is accessible at `https://tranquilae.com/logo.svg`

## 🔍 **Root Cause Analysis**

### **Most Likely Causes:**
1. **Middleware Import Issue** (Fixed ✅) - Server-side imports in Edge Runtime
2. **Missing Environment Variables** - Check your deployment platform
3. **Static Asset Loading** - Logo or image files not found
4. **CSS Variables Not Loading** - Tailwind/CSS build issues

### **How to Identify the Exact Issue:**
After deployment, check browser console at `https://www.tranquilae.com`:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for JavaScript errors
4. Check Network tab for failed requests

## 🔧 **Additional Debugging Steps**

### **If Error Persists After Deploy:**

1. **Check Build Logs:**
   ```bash
   npm run build
   ```
   Look for TypeScript or build errors.

2. **Test Locally:**
   ```bash
   npm run dev
   ```
   See if error occurs locally vs. production only.

3. **Check Browser Console:**
   Look for specific error messages like:
   - `TypeError: Cannot read property...`
   - `ReferenceError: ... is not defined`
   - `Failed to load resource...`

4. **Verify Deployment:**
   - Check if all files deployed correctly
   - Verify environment variables are set
   - Ensure build process completed successfully

## 🛠️ **Temporary Workaround (If Needed)**

If the site is still down, you can create a simple holding page by replacing `app/page.tsx` temporarily:

```tsx
export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Tranquilae</h1>
        <p className="text-gray-600">We'll be back soon! Performing maintenance.</p>
      </div>
    </div>
  )
}
```

## 📊 **Next.js Error Types Reference**

- **Client-side exception**: JavaScript error during hydration or client execution
- **Server-side error**: Issue during server-side rendering (SSR)
- **Build error**: Problem during compilation/build process
- **Runtime error**: Issue during code execution

## 🚨 **Emergency Recovery Steps**

If nothing else works:

1. **Revert to Last Working Version:**
   ```bash
   git log --oneline
   git reset --hard <last-working-commit>
   git push --force-with-lease origin main
   ```

2. **Deploy Minimal Version:**
   - Strip back to basic homepage
   - Remove complex components
   - Add features back incrementally

## 📝 **Post-Fix Checklist**

After the site is back online:

- [ ] Remove diagnostic component from production
- [ ] Test all auth flows
- [ ] Verify admin panel access
- [ ] Check email template functionality  
- [ ] Monitor error logs for 24 hours
- [ ] Set up proper error monitoring (Sentry)

---

**The fixes I've implemented should resolve the client-side error. Deploy the changes and monitor the console for any remaining issues.**
