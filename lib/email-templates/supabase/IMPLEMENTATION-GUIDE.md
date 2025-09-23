# Quick Implementation Guide

Copy and paste these templates directly into your Supabase Dashboard.

## 📋 Step-by-Step Instructions

1. **Access Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **Authentication** → **Email Templates**

2. **For Each Template Below:**
   - Click on the template type in Supabase
   - Copy the entire HTML code
   - Paste into the "Message Body" field
   - Update the subject line as suggested
   - Click "Save"

---

## 1. Confirm Signup

**Subject:** `Welcome to Tranquilae - Confirm Your Account`

**Template File:** `01-confirm-signup.html`

---

## 2. Invite User

**Subject:** `You're Invited to Join Tranquilae`

**Template File:** `02-invite-user.html`

---

## 3. Magic Link

**Subject:** `Your Tranquilae Sign-in Link`

**Template File:** `03-magic-link.html`

---

## 4. Change Email Address

**Subject:** `Confirm Your New Email - Tranquilae`

**Template File:** `04-change-email.html`

---

## 5. Reset Password

**Subject:** `Reset Your Tranquilae Password`

**Template File:** `05-reset-password.html`

---

## 6. Reauthentication

**Subject:** `Verify Your Identity - Tranquilae`

**Template File:** `06-reauthentication.html`

---

## ⚡ Quick Checklist

- [ ] All 6 templates uploaded to Supabase
- [ ] Subject lines updated for each template
- [ ] Test emails sent to verify appearance
- [ ] Links working correctly in test emails
- [ ] Mobile display checked on phone
- [ ] Templates saved and enabled in Supabase

## 🔗 Supabase Variables Reference

These variables are automatically populated by Supabase:

- `{{ .ConfirmationURL }}` - The action link (signup, reset, etc.)
- `{{ .SiteURL }}` - Your site's base URL
- `{{ .Email }}` - User's email address (where applicable)
- `{{ .Data.Date }}` - Timestamp data (where applicable)

## 🚨 Important Notes

1. **Logo URL**: Make sure https://www.tranquilae.com/logo.svg is accessible
2. **Support Link**: Update `{{ .SiteURL }}/support` to your actual support page
3. **Testing**: Always test emails before going live
4. **Backup**: Keep copies of your original templates before replacing

## 📱 Mobile Testing

Send test emails to:
- Gmail mobile app
- Apple Mail on iPhone
- Outlook mobile
- Samsung Email

Make sure buttons are easily clickable and text is readable on small screens.

---

**Ready to go live!** 🚀

Once all templates are uploaded and tested, your users will receive beautiful, branded emails that match your Tranquilae aesthetic.
