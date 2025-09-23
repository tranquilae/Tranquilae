# 📧 Supabase Email Rate Limit Resolution Guide

## 🔴 Current Issue: "Email Rate Limit Exceeded"

This error occurs when you exceed Supabase's email sending limits, which are quite restrictive on the free tier.

## 📊 Supabase Email Limits

### Free Tier Limits:
- **3 emails per hour** per project
- **30 emails per day** per project  
- Very restrictive for development/testing

### Paid Tier Limits:
- **Pro Plan**: 100 emails/hour, 1,000 emails/day
- **Team/Enterprise**: Much higher limits

## 🛠️ Immediate Solutions

### Solution 1: Wait and Retry (Quick Fix)
The rate limit resets after 1 hour, so you can:
1. Wait 1 hour from your last signup attempt
2. Try creating the account again
3. **Not ideal for development**

### Solution 2: Use Different Email Addresses
For testing purposes:
```bash
# Instead of using the same email, use variations:
test1@example.com
test2@example.com  
test3@example.com
```

### Solution 3: Disable Email Confirmation (Development)

**⚠️ TEMPORARY DEVELOPMENT SOLUTION ONLY**

Go to your Supabase Dashboard:
1. Visit: https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/auth/settings
2. Under **User Management**:
   - ✅ **Enable**: Allow new users to sign up
   - ❌ **Disable**: Enable email confirmations (for development only)
3. Save settings

This allows users to sign up without email verification during development.

### Solution 4: Custom Email Provider (Recommended)

Set up a custom email provider to bypass Supabase's email limits.

#### Option A: Use Resend (Recommended)
1. **Sign up for Resend**: https://resend.com (generous free tier)
2. **Get API Key**: Create API key in Resend dashboard
3. **Configure in Supabase**:
   - Go to: https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/auth/settings
   - Scroll to **SMTP Settings**
   - Enable custom SMTP
   - Configure:
     ```
     SMTP Host: smtp.resend.com
     SMTP Port: 587 (or 465 for SSL)
     SMTP User: resend
     SMTP Password: [Your Resend API Key]
     ```

#### Option B: Use Gmail SMTP
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-gmail@gmail.com  
SMTP Password: [App Password - not your regular password]
```

### Solution 5: Upgrade to Supabase Pro (Production)

For production applications:
1. **Go to**: https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/settings/billing
2. **Upgrade to Pro**: $25/month
3. **Benefits**:
   - 100 emails/hour (vs 3 on free)
   - 1,000 emails/day (vs 30 on free)
   - Better support and features

## 🔧 Quick Development Setup

Here's how to quickly set up for development:

### Step 1: Disable Email Confirmation (Temporarily)
```bash
# Go to Supabase Auth Settings and disable email confirmations
# This allows immediate signup without waiting for email verification
```

### Step 2: Create a Test Account
```bash
# Use your debug endpoint to test
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'
```

### Step 3: Re-enable Email Confirmation Later
Once you've set up custom SMTP or upgraded, re-enable email confirmations for security.

## 🚨 Important Security Notes

### For Development:
- ✅ OK to disable email confirmation temporarily
- ✅ Use test email addresses
- ✅ Don't use real user data

### For Production:
- ❌ NEVER disable email confirmation
- ✅ Always use custom SMTP provider
- ✅ Consider upgrading to Pro plan
- ✅ Monitor email sending quotas

## 🔍 How to Check Current Usage

Check your current email usage:
1. Go to: https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/logs
2. Filter by: **auth** logs
3. Look for email sending events
4. Monitor your daily/hourly usage

## 📈 Monitoring Email Limits

Add this to your signup API route to track email usage:

```typescript
// In your signup route
console.log('📧 Email sent for user:', user.email)
console.log('⏰ Timestamp:', new Date().toISOString())
console.log('🔢 Check your Supabase logs for email quota usage')
```

## ✅ Recommended Development Flow

1. **Immediate**: Disable email confirmation in Supabase Auth settings
2. **Short-term**: Set up Resend SMTP for reliable email delivery  
3. **Long-term**: Consider Supabase Pro if you're planning production deployment
4. **Always**: Re-enable email confirmation before going to production

## 🆘 Still Having Issues?

If you continue to have problems:

1. **Check Supabase Status**: https://status.supabase.com
2. **View Auth Logs**: Check your Supabase project logs for detailed error messages
3. **Test with Different Emails**: Use completely different email addresses
4. **Contact Supabase Support**: If you're on a paid plan

---

**Quick Action**: Disable email confirmations in your Supabase Auth settings for immediate testing, then set up custom SMTP for reliable long-term solution.
