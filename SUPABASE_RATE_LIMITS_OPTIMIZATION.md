# 🚀 Supabase Rate Limits Optimization Guide

## 🎯 Current Issue
You're hitting the **email sending rate limit** (currently at 100 emails/hour), but you can adjust these limits in your Supabase dashboard!

## 📊 Current Rate Limits Analysis

Looking at your current settings:

| Setting | Current Limit | Impact | Recommendation |
|---------|---------------|--------|----------------|
| **Email sending** | 100/hour | ⚠️ Can still hit during testing | Increase for development |
| **SMS messages** | 30/hour | ✅ Adequate for most use cases | Keep as is |
| **Token refreshes** | 150/hour (1800 per 5min) | ✅ Very generous | Keep as is |
| **Token verifications** | 30/hour (360 per 5min) | ⚠️ May limit OTP testing | Consider increasing |
| **Anonymous users** | 30/hour | ✅ Good for testing | Keep as is |
| **Sign ups/ins** | 30 per 5min (360/hour) | ⚠️ May limit rapid testing | Consider increasing |
| **Web3 sign-ins** | 30 per 5min | ✅ Adequate | Keep as is |

## 🛠️ Recommended Development Settings

### For Active Development & Testing

```
📧 Email sending rate limit: 500 per hour
   Reason: Allows extensive testing without hitting limits

🔐 Token verifications: 100 per 5min (1200/hour)  
   Reason: For testing OTP/magic links repeatedly

👤 Sign ups/ins: 100 per 5min (1200/hour)
   Reason: For rapid testing of auth flows

📱 SMS messages: 50 per hour
   Reason: If you plan to test SMS features

🔄 Keep other limits as they are (already generous)
```

### For Production

```
📧 Email sending: 200-300 per hour
   Reason: Handle legitimate user registrations

🔐 Token verifications: 50 per 5min (600/hour)
   Reason: Security vs usability balance  

👤 Sign ups/ins: 50 per 5min (600/hour)
   Reason: Prevent abuse while allowing legitimate users

📱 SMS messages: 100 per hour
   Reason: Production SMS usage
```

## 🎯 Immediate Action Steps

### Step 1: Increase Email Rate Limit
1. Go to your current rate limits page in Supabase
2. Change **"Rate limit for sending emails"** from `100` to `500`
3. This gives you 5x more emails per hour for testing

### Step 2: Increase Auth Rate Limits  
1. Change **"Rate limit for token verifications"** from `30` to `100`
2. Change **"Rate limit for sign ups and sign ins"** from `30` to `100`
3. This allows more rapid testing of auth flows

### Step 3: Save and Test
1. Click **"Save changes"** at the bottom
2. Wait 1-2 minutes for changes to propagate
3. Try creating accounts again

## 🧪 Test Your New Limits

After updating the limits, test with the auth script:

```bash
# Run the auth tester
node scripts/test-auth-flow.js

# Or test manually with curl
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","password":"testpassword123"}'
```

## 📈 Monitoring Rate Limit Usage

### Check Current Usage
1. **Supabase Dashboard**: Go to https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/logs
2. **Filter by**: Auth logs
3. **Look for**: Rate limit warnings or errors

### Add Monitoring to Your App
Add this to your signup API route:

```typescript
// In /app/api/auth/signup/route.ts
console.log(`📧 Email sent at ${new Date().toISOString()}`);
console.log(`📊 Check Supabase logs for current rate limit usage`);

// Log rate limit headers if available
if (error?.message?.includes('rate limit')) {
  console.warn('⚠️ Rate limit hit:', error.message);
  return NextResponse.json(
    { 
      error: 'Rate limit exceeded. Please try again in a few minutes.',
      retryAfter: 3600 // 1 hour
    }, 
    { status: 429 }
  );
}
```

## 🔄 Rate Limit Reset Timing

Understanding when limits reset:

| Limit Type | Reset Period | Example |
|------------|--------------|---------|
| Email sending | Every hour | If you hit limit at 2:30 PM, resets at 3:00 PM |
| Sign ups/ins | Every 5 minutes | Quick reset for rapid testing |
| Token verifications | Every 5 minutes | Quick reset for OTP testing |

## 🚨 Important Notes

### For Development:
- ✅ Higher limits are fine for testing
- ✅ Monitor usage to understand your app's needs
- ✅ Test with realistic user scenarios

### For Production:
- ⚠️ Don't set limits too high (security risk)
- ✅ Monitor for abuse patterns  
- ✅ Consider implementing additional rate limiting in your application
- ✅ Set up alerting for unusual traffic patterns

## 🔧 Alternative Solutions

If you still hit limits even after increasing them:

### 1. Custom SMTP Provider
Set up Resend or another email provider to bypass Supabase's email limits entirely.

### 2. Batch Testing
Create multiple test accounts at once rather than one by one.

### 3. Email Confirmation Bypass (Dev Only)
Temporarily disable email confirmation for rapid development.

### 4. Upgrade to Pro Plan
Consider Supabase Pro ($25/month) for much higher limits.

## ✅ Success Checklist

After making changes:

- [ ] Increased email sending limit to 500/hour
- [ ] Increased token verification limit to 100 per 5min  
- [ ] Increased signup/signin limit to 100 per 5min
- [ ] Saved changes in Supabase dashboard
- [ ] Waited 1-2 minutes for propagation
- [ ] Tested account creation successfully
- [ ] Can create multiple test accounts without errors

---

**Quick Action**: Increase your email sending rate limit to 500/hour and auth limits to 100 per 5min, then test account creation again!
