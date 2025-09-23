# 🐛 Onboarding Debug Guide

## 🎯 **Fixed Issues**

### **Issue 1: 400 Bad Request at Integration Step**
**Root Cause**: Strict validation for step 2 (integrations)
**Fix Applied**:
- ✅ Made step 2 validation more lenient
- ✅ Added better error logging to identify validation issues
- ✅ Allow empty or flexible data structures for integration step

### **Issue 2: 404 "User not found" at Step 5**
**Root Cause**: No profile created in `profiles` table when user signs up
**Fix Applied**:
- ✅ Auto-create profile when user not found in both APIs
- ✅ Use `ON CONFLICT` handling to prevent duplicate creation
- ✅ Extract user info from Supabase auth to populate profile

## 🧪 **Testing Your Fixes**

### **Step-by-Step Test:**

1. **Deploy to Vercel** (push your code changes)
2. **Open your app** and sign up with a new email
3. **Go through onboarding**:
   - Step 1: Set goals ✅
   - Step 2: Skip/continue integrations ✅ (should not get 400 error)
   - Step 3: Enter personal details ✅
   - Step 4: Continue to plan selection ✅
   - Step 5: Select Explorer/Pathfinder ✅ (should not get 404 error)
   - Step 6: Complete onboarding ✅

### **Check Your Neon Database**

After testing, check these tables:

**Profiles Table:**
```sql
SELECT user_id, email, name, onboarding_complete, plan 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;
```

**Onboarding Progress Table:**
```sql
SELECT user_id, step, data, created_at 
FROM onboarding_progress 
ORDER BY updated_at DESC 
LIMIT 5;
```

## 🔍 **Debug Information**

### **Expected Flow:**
1. User signs up → Supabase creates auth.users record
2. User starts onboarding → API creates profile in profiles table
3. Each step → Progress saved to onboarding_progress table  
4. Completion → Profile updated with onboarding_complete=true

### **Console Logs to Watch:**
- `"API - Profile not found, creating new profile for user:"`
- `"API - Created new profile:"`
- `"API - Token auth successful for user:"`
- `"Validation failed for step"` (should be rare now)

### **Expected Database Records:**
- **profiles**: 1 record per user with correct user_id, email, plan
- **onboarding_progress**: 1 record per user with final step number
- **subscriptions**: 1 record per user after completion

## 🚨 **If You Still Get Errors**

### **400 Bad Request:**
- Check Vercel function logs for validation details
- Look for `"Validation failed for step"` messages
- Verify request body structure

### **404 User Not Found:**
- Check if `DATABASE_URL` is properly set in Vercel
- Verify Neon DB connection is working
- Look for profile creation logs

### **500 Internal Server Error:**
- Check database connection issues
- Look for SQL constraint errors
- Verify table schema matches expectations

## ✅ **Expected Results After Fixes**

- ✅ **No 400 errors** at integration step (step 2)
- ✅ **No 404 errors** at plan selection (step 5) 
- ✅ **Profiles auto-created** when users start onboarding
- ✅ **Progress saves** between steps
- ✅ **Completion redirects** to dashboard
- ✅ **Database records** created correctly

## 🔧 **Verification Commands**

**Check if user profiles exist:**
```sql
SELECT COUNT(*) as profile_count FROM profiles;
```

**Check onboarding progress:**
```sql
SELECT step, COUNT(*) as user_count 
FROM onboarding_progress 
GROUP BY step 
ORDER BY step;
```

**Check completed onboarding:**
```sql
SELECT COUNT(*) as completed_users 
FROM profiles 
WHERE onboarding_complete = true;
```

Your onboarding flow should now work smoothly end-to-end! 🎉
