# Supabase Configuration Guide for Tranquilae

Complete setup guide for configuring Supabase authentication with your `https://tranquilae.com` domain.

## 🔧 **Required Supabase Dashboard Configuration**

### **Step 1: Access Supabase Dashboard**
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your Tranquilae project

### **Step 2: Configure Authentication URLs**
Navigate to: **Authentication** → **Settings** → **URL Configuration**

#### **Site URL (Primary)**
Set this as your main production domain:
```
https://tranquilae.com
```

#### **Additional Redirect URLs**
Add all domains where your app will run (one per line):

```
# Production
https://tranquilae.com
https://www.tranquilae.com

# Development (if testing locally)
http://localhost:3000

# Staging (if you have a staging environment)
https://staging.tranquilae.com
https://your-app.vercel.app

# Specific auth callback paths
https://tranquilae.com/auth/callback
https://www.tranquilae.com/auth/callback
http://localhost:3000/auth/callback
```

### **Step 3: Email Template Configuration**
Navigate to: **Authentication** → **Email Templates**

For each email type, configure:

#### **Confirm Signup**
- **Subject**: `Welcome to Tranquilae - Confirm Your Account`
- **Template**: Use the HTML from `lib/email-templates/supabase/01-confirm-signup.html`

#### **Invite User**
- **Subject**: `You're Invited to Join Tranquilae`
- **Template**: Use the HTML from `lib/email-templates/supabase/02-invite-user.html`

#### **Magic Link**
- **Subject**: `Your Tranquilae Sign-in Link`
- **Template**: Use the HTML from `lib/email-templates/supabase/03-magic-link.html`

#### **Change Email Address**
- **Subject**: `Confirm Your New Email - Tranquilae`
- **Template**: Use the HTML from `lib/email-templates/supabase/04-change-email.html`

#### **Reset Password**
- **Subject**: `Reset Your Tranquilae Password`
- **Template**: Use the HTML from `lib/email-templates/supabase/05-reset-password.html`

#### **Reauthentication**
- **Subject**: `Verify Your Identity - Tranquilae`
- **Template**: Use the HTML from `lib/email-templates/supabase/06-reauthentication.html`

## 📧 **Email Flow Testing**

### **Test Each Email Type**

1. **Signup Confirmation**
   - Create a new account via `/auth/signup`
   - Check email delivery and click confirmation link
   - Verify redirect to `/dashboard` or `/onboarding`

2. **Password Reset**
   - Go to `/auth/forgot-password`
   - Enter email and submit
   - Check email and click reset link
   - Verify redirect to `/auth/reset-password`

3. **Magic Link**
   - Use magic link login (if implemented)
   - Check email delivery and click link
   - Verify direct login to dashboard

## 🔒 **Environment Variables**

Ensure your environment variables are properly configured:

### **Required Variables**
```bash
# Add to your .env.local
NEXT_PUBLIC_SITE_URL="https://tranquilae.com"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### **For Development**
```bash
# Development overrides in .env.local
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## 🚀 **Deployment Checklist**

- [ ] **Supabase Site URL** set to `https://tranquilae.com`
- [ ] **Redirect URLs** include all necessary domains
- [ ] **Email templates** uploaded with correct subjects
- [ ] **Environment variables** configured in production
- [ ] **Auth callback route** deployed (`/auth/callback`)
- [ ] **Email deliverability** tested in production
- [ ] **All auth flows** tested (signup, login, reset, magic link)

## 🐛 **Troubleshooting**

### **Common Issues**

#### **"Invalid redirect URL" Error**
- Check that the redirect URL is exactly listed in Supabase settings
- Ensure no trailing slashes unless consistently used
- Verify HTTPS vs HTTP matches

#### **Email Links Don't Work**
- Confirm Site URL matches your domain exactly
- Check email template variables are correct
- Verify auth callback route exists and is deployed

#### **Authentication Loops**
- Check that callback route handles session properly
- Verify redirect logic doesn't create infinite loops
- Ensure user onboarding status is properly checked

### **Debugging Commands**
```bash
# Test environment variables
npm run validate-env

# Check auth callback locally
curl http://localhost:3000/auth/callback?code=test

# Verify production URLs
curl -I https://tranquilae.com/auth/callback
```

## 🔐 **Security Notes**

- **Only add trusted domains** to redirect URLs
- **Use HTTPS** for all production URLs
- **Test email deliverability** before going live
- **Monitor auth logs** for suspicious activity
- **Keep service role key secure** and never expose in frontend

## 📊 **Monitoring**

After setup, monitor:
- Email delivery rates
- Authentication success/failure rates
- User onboarding completion
- Auth-related error logs

---

## 🎯 **Quick Setup Summary**

1. **Supabase Dashboard**: Add `https://tranquilae.com` as Site URL
2. **Redirect URLs**: Add all necessary domains including callback URLs
3. **Email Templates**: Upload all 6 branded templates with correct subjects
4. **Environment**: Set `NEXT_PUBLIC_SITE_URL="https://tranquilae.com"`
5. **Test**: Verify all auth flows work end-to-end
6. **Deploy**: Ensure callback route is live at `/auth/callback`

Your authentication system is now fully configured for your `https://tranquilae.com` domain! 🌿
