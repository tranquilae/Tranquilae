# 🔐 Supabase JWT Migration Guide - 2024 Update

**CRITICAL**: Supabase has deprecated legacy API keys and moved to a new JWT-based authentication system. This guide will help you migrate your Tranquilae project to use the new secure authentication system.

## 🚨 Why This Migration is Important

- **Security**: New JWT system is more secure with proper token verification
- **Future-proofing**: Legacy keys will be deprecated and eventually removed
- **Features**: Access to latest Supabase auth features and improvements
- **Performance**: Better token handling and session management

---

## 📋 Migration Checklist

### **Phase 1: Update Your Supabase Dashboard (5 minutes)**

#### 1. Get New API Keys
```bash
# 1. Go to your Supabase project dashboard
# 2. Navigate to: Settings → API → API Keys section
# 3. You should see these keys:

✅ Project URL (unchanged)
✅ anon public key (NEW format)
✅ service_role secret key (NEW format)
```

#### 2. Get JWT Settings
```bash
# 1. In the same API settings page
# 2. Scroll down to "JWT Settings"
# 3. Copy the JWT Secret (this is new!)
```

### **Phase 2: Update Environment Variables (2 minutes)**

#### Current (Legacy) Format:
```bash
# OLD - Remove these
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..." # Old format
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..." # Old format
SUPABASE_JWT_SECRET="simple-string" # Old format
```

#### New (2024) Format:
```bash
# NEW - Use these instead
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"

# NEW: anon key with proper JWT structure
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2plY3QtaWQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzOTU0NDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ..."

# NEW: service_role key with proper JWT structure  
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2plY3QtaWQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM5NTQ0MDAwLCJleHAiOjIwMDAwMDAwMDB9..."

# NEW: JWT Secret for token verification (32+ characters)
SUPABASE_JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
```

### **Phase 3: Code Changes (Already Done! ✅)**

The Supabase client configuration has been updated in:
- ✅ `lib/supabase.ts` - Enhanced with JWT verification
- ✅ `.env.example` - Updated with new format
- ✅ Documentation - All guides updated

### **Phase 4: Update Vercel Environment Variables (3 minutes)**

#### In Vercel Dashboard:
```bash
# 1. Go to your Vercel project dashboard
# 2. Settings → Environment Variables
# 3. Update these variables:

NEXT_PUBLIC_SUPABASE_ANON_KEY → [new anon key]
SUPABASE_SERVICE_ROLE_KEY → [new service_role key]
SUPABASE_JWT_SECRET → [new JWT secret]

# 4. Redeploy your project
```

---

## 🔍 How to Identify JWT Format

### **Legacy Format (OLD)**:
```
eyJhbGci... (shorter, simpler)
```

### **New JWT Format (CORRECT)**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2plY3QtaWQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzOTU0NDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ...
```

**Key differences:**
- JWT tokens have **three parts** separated by dots (.)
- They contain `"iss":"supabase"` in the payload
- They have proper `"role"` field ("anon" or "service_role")
- They include proper timestamps

---

## 🧪 Testing Your Migration

### **1. Quick Environment Test**
```bash
# Run this to validate your new configuration:
npm run validate-env
```

### **2. Authentication Test**
```bash
# Test the new JWT system:
npm run test

# Or manually test authentication:
curl -H "Authorization: Bearer YOUR_NEW_ANON_KEY" \
     https://your-project.supabase.co/rest/v1/
```

### **3. Admin Panel Test**
```bash
# 1. Start your development server:
npm run dev

# 2. Try to access admin panel:
# http://localhost:3000/admin

# 3. Check browser console for errors
# 4. Verify security monitoring works
```

---

## 🚨 Troubleshooting Common Issues

### **Issue 1: "Invalid JWT" Errors**
```bash
# Solution: Check your JWT secret format
# Ensure it's 32+ characters and matches Supabase dashboard

# Test JWT secret:
echo "SUPABASE_JWT_SECRET length: ${#SUPABASE_JWT_SECRET}"
# Should output: "SUPABASE_JWT_SECRET length: 64" (or similar)
```

### **Issue 2: Authentication Fails**
```bash
# Solution: Verify your anon key format
# It should decode to show proper Supabase structure

# Check anon key payload (for debugging):
node -e "console.log(JSON.parse(Buffer.from(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.')[1], 'base64').toString()))"
# Should show: {"iss":"supabase","ref":"project-id","role":"anon",...}
```

### **Issue 3: Admin Panel Access Denied**
```bash
# Solution: Check ADMIN_USER_IDS environment variable
echo "Admin IDs: $ADMIN_USER_IDS"

# Get your user ID from Supabase dashboard:
# Authentication → Users → Copy user UUID
```

### **Issue 4: Database Connection Issues**
```bash
# Solution: This might not be related to JWT migration
# Check DATABASE_URL is correct:
npm run db:test
```

---

## 📈 New Features Available After Migration

### **Enhanced Security**
- ✅ Proper JWT token verification
- ✅ Enhanced admin access controls
- ✅ Better session management
- ✅ Token expiration handling

### **Better Error Handling**
- ✅ Clear error messages for auth failures
- ✅ Improved debugging information
- ✅ Better logging for security events

### **Modern Auth Flow**
- ✅ PKCE flow for better security
- ✅ Automatic token refresh
- ✅ Better URL detection for email confirmations

---

## ⏰ Migration Timeline

### **Immediate (Today)**
- [ ] Update environment variables
- [ ] Test locally
- [ ] Deploy to staging/preview

### **This Week**
- [ ] Update production environment
- [ ] Monitor for any authentication issues
- [ ] Update team documentation

### **Optional Improvements**
- [ ] Set up JWT expiration monitoring
- [ ] Add custom JWT claims if needed
- [ ] Implement advanced security features

---

## 🆘 Need Help?

### **Quick Support Checklist**
1. ✅ Check Supabase dashboard for new key format
2. ✅ Verify environment variables are updated
3. ✅ Test locally before deploying
4. ✅ Check browser console for errors
5. ✅ Verify admin user IDs are correct

### **Common Support Issues**
- **"Jose package not found"**: Run `npm install jose`
- **"JWT verification failed"**: Check JWT secret is 32+ chars
- **"Invalid anon key"**: Get new key from Supabase dashboard
- **"Admin access denied"**: Check ADMIN_USER_IDS environment variable

---

**✅ Migration Complete!** 

Your Tranquilae project is now using the secure 2024 Supabase JWT authentication system with enhanced security features and better performance.

**Next Steps:**
1. Monitor authentication logs for first few days
2. Consider setting up JWT expiration monitoring
3. Review security dashboard for any issues
4. Update your team on the new authentication system
