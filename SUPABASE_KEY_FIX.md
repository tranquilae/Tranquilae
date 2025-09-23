# 🔑 Supabase Key Configuration Fix

## 🚨 **Problem Identified**
Your Supabase keys are incorrect format:
- `sb_publishable_xyz` ❌ (Not a valid JWT)
- `sb_secret_xyz` ❌ (Not a valid JWT)

Supabase keys should be JWT tokens starting with `eyJ...`

## ✅ **How to Get Correct Keys**

### **Step 1: Access Your Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: `https://fspoavmvfymlunmfubqp.supabase.co`

### **Step 2: Get API Keys**
Navigate to: **Settings** → **API**

You'll see two keys:

#### **Public anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY)**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzcG9hdm12ZnltbHVubWZ1YnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2...
```
- Starts with `eyJ`
- Safe to use in frontend
- Role: `anon`

#### **Service role key (SUPABASE_SERVICE_ROLE_KEY)**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzcG9hdm12ZnltbHVubWZ1YnFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6...
```
- Starts with `eyJ`
- **NEVER expose in frontend**
- Role: `service_role`

### **Step 3: Update Environment Variables**

Update your production environment with correct keys:

```bash
NEXT_PUBLIC_SITE_URL="https://tranquilae.com"
NEXT_PUBLIC_SUPABASE_URL="https://fspoavmvfymlunmfubqp.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzcG9hdm12ZnltbHVubWZ1YnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzcG9hdm12ZnltbHVubWZ1YnFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6..."
```

## 🗄️ **Database Configuration**

### **Transaction Pooler Setup**
Your pooler setup looks correct, but verify the connection string format:

**For Shared Pooler (Session Mode):**
```bash
DATABASE_URL="postgresql://postgres.fspoavmvfymlunmfubqp:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```

**For Transaction Pooler (Transaction Mode):**
```bash
DATABASE_URL="postgresql://postgres.fspoavmvfymlunmfubqp:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
```

### **Get Database Password**
1. In Supabase Dashboard: **Settings** → **Database**
2. Copy the password from **Connection parameters**
3. Replace `[YOUR-PASSWORD]` in the connection string

## 🔧 **Deployment Platform Setup**

### **For Vercel:**
```bash
vercel env add NEXT_PUBLIC_SITE_URL
# Enter: https://tranquilae.com

vercel env add NEXT_PUBLIC_SUPABASE_URL  
# Enter: https://fspoavmvfymlunmfubqp.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your anon key (starts with eyJ...)

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste your service role key (starts with eyJ...)

vercel env add DATABASE_URL
# Paste your pooler connection string
```

### **For Other Platforms:**
Set the same environment variables in your deployment platform's settings.

## ✅ **Verification Steps**

### **1. Test Keys Locally**
Create `.env.local` with correct keys and test:
```bash
npm run dev
```

### **2. Verify JWT Format**
Your keys should decode at [jwt.io](https://jwt.io) and show:
- `iss`: `"supabase"`
- `ref`: `"fspoavmvfymlunmfubqp"`
- `role`: `"anon"` or `"service_role"`

### **3. Test Database Connection**
```bash
npm run db:test
```

## 🚨 **Security Notes**

- **NEVER commit real keys to Git**
- Use `.env.local` for local development  
- Keep service role key secret
- Regularly rotate keys if compromised

## 🔄 **If Keys Don't Exist**

If you can't find proper JWT keys in your Supabase dashboard:

1. **Reset API Keys:**
   - Go to **Settings** → **API**
   - Click **Reset** next to each key
   - Copy the new JWT tokens

2. **Verify Project Setup:**
   - Ensure project is properly initialized
   - Check if authentication is enabled
   - Verify project URL is correct

---

## 📋 **Quick Checklist**

- [ ] Get real JWT keys from Supabase dashboard (start with `eyJ...`)
- [ ] Update all environment variables in production
- [ ] Set correct database connection string with password
- [ ] Test authentication flow
- [ ] Verify site loads without errors
- [ ] Check browser console for any remaining issues

**Once you update with the correct JWT keys, your authentication will work properly!**
