# 🔄 Supabase Redirect URLs Configuration

## Current Issues with Your Configuration

❌ **Problems Found:**
1. Missing `https://tranquilae.com/auth/callback` (non-www version)
2. `/auth/confirm` doesn't exist in your codebase - should be `/auth/callback`
3. Missing localhost URLs for local development
4. `/auth/reset-password` should redirect to `/auth/login` instead

## ✅ **Correct Redirect URLs Configuration**

Go to your Supabase Dashboard:
`https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/settings/auth`

### **Replace your current URLs with these 7 URLs:**

```
https://www.tranquilae.com
https://tranquilae.com
https://www.tranquilae.com/auth/callback
https://tranquilae.com/auth/callback
https://www.tranquilae.com/auth/login
http://localhost:3000/auth/callback
http://localhost:3000
```

## 📝 **Explanation of Each URL:**

| URL | Purpose |
|-----|---------|
| `https://www.tranquilae.com` | Main domain redirect (with www) |
| `https://tranquilae.com` | Main domain redirect (without www) |
| `https://www.tranquilae.com/auth/callback` | OAuth callback handler (with www) |
| `https://tranquilae.com/auth/callback` | OAuth callback handler (without www) |
| `https://www.tranquilae.com/auth/login` | Login page redirects |
| `http://localhost:3000/auth/callback` | Local development OAuth callback |
| `http://localhost:3000` | Local development general redirects |

## 🔄 **Auth Flow in Your App:**

1. **User initiates login/signup** → Supabase handles authentication
2. **Supabase redirects to** → `/auth/callback` with auth code
3. **Your callback handler** → Exchanges code for session
4. **Final redirect to** → `/dashboard` or `/onboarding`

## ⚠️ **Security Notes:**

- ✅ Only your domain and localhost are allowed
- ✅ HTTPS is used in production
- ✅ Callback handler validates redirects to prevent open redirects
- ✅ HTTP localhost is only for development

## 🧪 **Testing After Update:**

1. **Update the URLs in Supabase**
2. **Test authentication flows:**
   - Sign up new user
   - Login existing user
   - Password reset
   - OAuth providers (if you add them later)
3. **Test both www and non-www versions**
4. **Test locally with localhost:3000**

## 🚨 **What to Remove:**

❌ Remove these incorrect URLs:
- `https://www.tranquilae.com/auth/confirm` (doesn't exist)
- `https://www.tranquilae.com/auth/reset-password` (should go to login instead)

The reset password flow should:
1. User requests reset → Email sent
2. User clicks email link → Goes to `/auth/reset-password` page
3. After successful reset → Redirects to `/auth/login`
