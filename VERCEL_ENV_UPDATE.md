# 🔧 Vercel Environment Variable Update Required

## 🚨 **Action Required**

You need to update your Vercel environment variables to use the **new Supabase API key naming**.

## 📝 **Current vs New Variable Names**

### **❌ Old (Remove These):**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY  
```

### **✅ New (Add These):**
```
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
SUPABASE_SECRET_KEY
```

## 🔧 **Steps to Update Vercel:**

### **1. Go to Vercel Dashboard**
1. Open [vercel.com](https://vercel.com)
2. Go to your Tranquilae project
3. Click **Settings** → **Environment Variables**

### **2. Add New Variables**
Add these new environment variables:

```bash
# Publishable key (safe for frontend) - Next.js framework standard
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_i490cr3a929wFuz286rVKA_3EbsFJ7N

# Secret key (server-side only - use your full secret key)
SUPABASE_SECRET_KEY=[your-full-secret-key-starting-with-sb_secret_]

# Keep this one the same
NEXT_PUBLIC_SUPABASE_URL=https://fspoavmvfymlunmfubqp.supabase.co
```

### **3. Remove Old Variables (Optional)**
You can remove these old variables:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (if you added it)
- `SUPABASE_SERVICE_ROLE_KEY` (if you have it)

### **4. Redeploy**
After updating variables:
1. Go to **Deployments** tab
2. Click **...** on latest deployment  
3. Click **Redeploy**

## ✅ **Expected Result**

After updating and redeploying:
- ✅ No more "supabaseKey is required" error
- ✅ Red diagnostic box disappears  
- ✅ Signup/login forms work properly
- ✅ Authentication flows work correctly

## 🔍 **Verification**

Visit `https://tranquilae.com/auth/signup` and:
1. **Red box should not appear** (or show all ✅)
2. **Signup form should load properly**
3. **No JavaScript errors in browser console**

---

**Once you update the Vercel environment variables, your authentication will work with the new Supabase API format!** 🌿
