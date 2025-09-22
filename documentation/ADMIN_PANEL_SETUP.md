# 🛡️ Tranquilae Admin Panel Setup Guide

This guide walks you through setting up the fully integrated admin panel for Tranquilae with secure authentication, user management, and audit logging.

## 🚀 Quick Start

### 1. Database Setup

First, run the admin panel database migration:

```sql
-- Run this in your Supabase SQL editor
-- File: scripts/admin-migration.sql
```

Copy and paste the contents of `scripts/admin-migration.sql` into your Supabase SQL editor and execute it. This will:

- Add `role` and `status` columns to the `users` table
- Create the `audit_logs` table with proper indexes
- Set up Row Level Security (RLS) policies
- Create admin utility functions

### 2. Environment Configuration

Update your `.env.local` file with admin configuration:

```env
# Admin Panel Configuration
ADMIN_USER_IDS="your-supabase-user-uuid,another-admin-uuid"
SUPER_ADMIN_USER_IDS="your-supabase-user-uuid"
```

**How to get your user UUID:**
1. Create an account through your app's regular signup flow
2. Go to Supabase Dashboard → Authentication → Users
3. Find your user and copy the UUID
4. Add it to the environment variables

### 3. Create Admin Accounts

Admin accounts must be created through the regular user signup flow, then their UUIDs added to the environment variables. There's no separate admin signup process for security reasons.

### 4. Deploy and Test

Deploy your application with the new environment variables:

```bash
npm run build
npm start
```

Visit `/admin` - you should be redirected to login if not authenticated, or see a 403 page if not an admin.

## 🔧 Features Overview

### Admin Dashboard (`/admin`)
- Real-time user statistics and metrics
- Recent activity feed from audit logs
- Quick actions for common admin tasks
- System health monitoring

### User Management (`/admin` → Users)
- View, search, and filter all users
- Edit user details and subscription plans
- Suspend/activate user accounts
- Reset passwords and change email addresses
- Delete users (super admin only)

### Subscription Management (`/admin` → Subscriptions)
- View all subscriptions and payment statuses
- Sync data with Stripe
- Manual plan upgrades/downgrades
- Trial period management
- Handle failed payments

### Audit Logs (`/admin` → Logs)
- Complete audit trail of all admin actions
- Security event logging (login/logout attempts)
- Payment and subscription event tracking
- Searchable and filterable log viewer

### System Settings (`/admin` → Settings)
- Super admin only section
- System status and health checks
- Configuration overview
- Security policy status

## 🔒 Security Features

### Authentication & Authorization
- **Environment-based admin control**: Admin access controlled via `ADMIN_USER_IDS` and `SUPER_ADMIN_USER_IDS` environment variables
- **Role-based access**: Admins can access most features, super admins can access system settings
- **Session validation**: Every admin action validates the user session and admin status
- **Automatic logout**: Failed authentication attempts automatically redirect to login

### Row Level Security (RLS)
All sensitive database operations are protected by Supabase RLS policies:

- **Users table**: Users can only see their own data unless they're an admin
- **Subscriptions table**: Similar restrictions with admin override
- **Audit logs table**: Only admins can read audit logs
- **Admin functions**: Database functions verify admin status before execution

### Audit Logging
Every admin action is logged with:
- Event type and timestamp
- Admin user ID who performed the action
- Target user ID (if applicable)
- IP address and user agent
- Action metadata and context

### API Security
- **Server-side validation**: All admin API endpoints verify admin access
- **Service role usage**: Sensitive operations use the Supabase service role key
- **Rate limiting**: Standard rate limiting applies to admin endpoints
- **CSRF protection**: Admin actions protected against cross-site request forgery

## 🔧 API Endpoints

### Admin Authentication
- `GET /api/admin/auth/check` - Verify admin access and get role

### Dashboard Data
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/activity/recent` - Get recent audit log entries

### User Management
- `GET /api/admin/users` - List and search users
- `PUT /api/admin/users/[id]` - Update user details
- `POST /api/admin/users/[id]/suspend` - Suspend user account
- `POST /api/admin/users/[id]/password-reset` - Reset user password
- `POST /api/admin/users/[id]/change-email` - Change user email
- `DELETE /api/admin/users/[id]` - Delete user (super admin only)

### Subscription Management
- `GET /api/admin/subscriptions` - List all subscriptions
- `PUT /api/admin/subscriptions/[id]` - Update subscription
- `POST /api/admin/stripe/sync` - Sync with Stripe
- `POST /api/admin/subscriptions/[id]/upgrade` - Upgrade plan
- `POST /api/admin/subscriptions/[id]/trial` - Manage trial period

### Audit Logs
- `GET /api/admin/logs` - Get audit logs with filtering
- `GET /api/admin/logs/export` - Export audit logs

## 🚨 Important Security Notes

### Admin Account Management
- **No self-service admin creation**: Admins can only be created by adding their UUID to environment variables
- **Environment variable security**: Keep `ADMIN_USER_IDS` and `SUPER_ADMIN_USER_IDS` secure and don't commit them to version control
- **Regular account auditing**: Regularly review who has admin access
- **Multi-factor authentication**: Consider enabling MFA for admin accounts in Supabase

### Production Deployment
1. **Use environment variables on Vercel**:
   - Set `ADMIN_USER_IDS` and `SUPER_ADMIN_USER_IDS` in Vercel dashboard
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is properly set
   
2. **Database security**:
   - Verify RLS policies are active
   - Test admin functions work only for authorized users
   - Monitor audit logs for suspicious activity

3. **Regular monitoring**:
   - Set up alerts for failed admin login attempts
   - Monitor audit logs for unusual activity
   - Regularly review admin access logs

## 🐛 Troubleshooting

### "Access Denied" Error
- Verify your user UUID is in `ADMIN_USER_IDS` environment variable
- Check that you're logged in with the correct account
- Ensure environment variables are properly set in your deployment

### Dashboard Not Loading Data
- Check that the database migration ran successfully
- Verify the `get_admin_stats()` function exists in your database
- Look for errors in browser console and server logs

### Audit Logs Not Appearing
- Ensure the `audit_logs` table was created by the migration
- Check that RLS policies allow admin access to audit logs
- Verify the logging functions are being called in API routes

### Can't Delete Users
- User deletion requires super admin privileges
- Cannot delete your own account
- Cannot delete the last super admin
- Check that the `admin_delete_user()` function exists

## 📚 Additional Resources

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Stripe Admin API](https://stripe.com/docs/api)
- [Security Best Practices](./SECURITY.md)

## 💬 Support

If you encounter issues with the admin panel setup:

1. Check the troubleshooting section above
2. Review server logs for detailed error messages
3. Ensure all environment variables are properly configured
4. Verify the database migration completed successfully

---

**⚠️ Important**: The admin panel provides powerful system access. Always test changes in a development environment before deploying to production, and regularly audit admin access and actions.
