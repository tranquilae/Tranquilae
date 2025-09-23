# Tranquilae Supabase Email Templates

Beautiful, branded email templates for Supabase authentication flows that match your Tranquilae wellness aesthetic.

## 📧 Templates Included

1. **01-confirm-signup.html** - Account confirmation email
2. **02-invite-user.html** - User invitation email
3. **03-magic-link.html** - Passwordless sign-in email
4. **04-change-email.html** - Email address change confirmation
5. **05-reset-password.html** - Password reset email
6. **06-reauthentication.html** - Identity verification email

## 🎨 Brand Design Features

- **Color Scheme**: Tranquilae's nature green (#6ba368), soft blue (#a7c7e7), and soft cream (#fdfbf7)
- **Logo**: Integrated from https://www.tranquilae.com/logo.svg
- **Typography**: Clean, modern system fonts for maximum compatibility
- **Layout**: Mobile-responsive with 600px max-width container
- **Accessibility**: High contrast ratios and semantic HTML structure

## 🚀 How to Implement

### Step 1: Access Supabase Dashboard
1. Log into your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure Each Template
For each email type, copy and paste the corresponding HTML template:

#### Confirm Signup
- **Template**: `01-confirm-signup.html`
- **Subject**: `Welcome to Tranquilae - Confirm Your Account`
- **Variables Used**: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`

#### Invite User
- **Template**: `02-invite-user.html`
- **Subject**: `You're Invited to Join Tranquilae`
- **Variables Used**: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`

#### Magic Link
- **Template**: `03-magic-link.html`
- **Subject**: `Your Tranquilae Sign-in Link`
- **Variables Used**: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`

#### Change Email Address
- **Template**: `04-change-email.html`
- **Subject**: `Confirm Your New Email - Tranquilae`
- **Variables Used**: `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`, `{{ .Data.Date }}`

#### Reset Password
- **Template**: `05-reset-password.html`
- **Subject**: `Reset Your Tranquilae Password`
- **Variables Used**: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`

#### Reauthentication
- **Template**: `06-reauthentication.html`
- **Subject**: `Verify Your Identity - Tranquilae`
- **Variables Used**: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`

## 📱 Features & Compatibility

### Email Client Support
- ✅ Gmail (Desktop & Mobile)
- ✅ Outlook (2016+, Web)
- ✅ Apple Mail (iOS, macOS)
- ✅ Yahoo Mail
- ✅ Thunderbird
- ✅ Samsung Email
- ✅ Most other major clients

### Responsive Design
- Mobile-first approach with media queries
- Optimal display on screens 320px - 600px+
- Touch-friendly button sizes (minimum 44px)
- Readable font sizes across all devices

### Dark Mode Support
- Automatic adaptation to user's dark mode preference
- Maintained brand colors with appropriate contrast
- Enhanced readability in low-light conditions

## 🔧 Customization Options

### Updating Your Logo
Replace the logo URL in each template:
```html
<img src="https://www.tranquilae.com/logo.svg" alt="Tranquilae">
```

### Modifying Colors
Key color variables used throughout:
- **Primary Green**: `#6ba368` - Main CTA buttons
- **Secondary Blue**: `#a7c7e7` - Secondary links and accents
- **Background**: `#fdfbf7` - Soft cream background
- **Text**: `#2d3748` - Main text color
- **Gray Text**: `#718096` - Secondary text

### Custom Links
Update support and website links:
```html
<a href="{{ .SiteURL }}/support">Support</a>
<a href="{{ .SiteURL }}">Visit Tranquilae</a>
```

## 📊 Analytics Integration (Optional)

To track email engagement, you can add UTM parameters to your links:

```html
<a href="{{ .ConfirmationURL }}?utm_source=email&utm_medium=auth&utm_campaign=signup">
```

## 🔒 Security Best Practices

- All templates include security notices about link expiration
- Clear instructions for users who didn't initiate the action
- Direct support contact links for security concerns
- Fallback plain-text links for accessibility

## 🧪 Testing

### Before Going Live
1. Send test emails to yourself across different devices
2. Check rendering in Gmail, Outlook, and Apple Mail
3. Verify all links work correctly
4. Test both light and dark mode appearance
5. Confirm mobile responsiveness

### Testing Tools (Recommended)
- [Litmus](https://litmus.com/) - Email client testing
- [Email on Acid](https://www.emailonacid.com/) - Cross-client preview
- [Mailtrap](https://mailtrap.io/) - Email testing sandbox

## 💡 Tips for Success

1. **Always test first**: Use Supabase's email testing features before going live
2. **Monitor deliverability**: Check spam folder placement across providers
3. **Keep it simple**: Avoid complex layouts that might break in older clients
4. **Update regularly**: Review and refresh templates quarterly
5. **User feedback**: Monitor support requests for email-related issues

## 📞 Support

If you need help implementing these templates:
1. Check the [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
2. Review the [Email Templates guide](https://supabase.com/docs/guides/auth/auth-email-templates)
3. Contact your development team for technical assistance

---

**Created with ❤️ for Tranquilae's wellness journey**

*Templates are optimized for modern email clients and include fallbacks for older systems. All code follows email development best practices and accessibility guidelines.*
