# 🧪 Admin Panel Testing Guide

## 🚀 Pre-Deployment Setup

### 1. Database Migration
```sql
-- Run in Supabase SQL Editor
-- Copy contents from scripts/admin-migration.sql
```

### 2. Environment Variables
```bash
# Add to your .env.local (development) or Vercel dashboard (production)
ADMIN_USER_IDS="your-admin-uuid,another-admin-uuid"
SUPER_ADMIN_USER_IDS="your-super-admin-uuid"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 3. Test Account Creation
1. Sign up for test accounts through the regular app flow
2. Note the user UUIDs from Supabase → Authentication → Users
3. Add UUIDs to environment variables
4. Deploy/restart your application

## 🔐 Authentication & Access Control Tests

### Test 1: Admin Access Verification
**Steps:**
1. Navigate to `/admin` while not logged in
2. Should redirect to `/auth/login?redirectTo=/admin`
3. Log in with non-admin account
4. Should redirect to `/403` (Access Denied)
5. Log in with admin account
6. Should access admin dashboard successfully

**Expected Results:**
- ✅ Unauthenticated users redirected to login
- ✅ Non-admin users see 403 page
- ✅ Admin users see dashboard

### Test 2: Role-Based Access
**Steps:**
1. Log in as regular admin
2. Navigate to Settings section
3. Should see access denied or redirect to dashboard
4. Log in as super admin
5. Navigate to Settings section
6. Should access system settings successfully

**Expected Results:**
- ✅ Regular admins cannot access system settings
- ✅ Super admins can access all sections

### Test 3: Session Persistence
**Steps:**
1. Log in as admin and access dashboard
2. Refresh the page
3. Should remain on dashboard
4. Open new tab, navigate to `/admin`
5. Should access without re-login

**Expected Results:**
- ✅ Admin session persists across refreshes
- ✅ Admin session works across tabs

## 👥 User Management Tests

### Test 4: User List & Search
**Steps:**
1. Navigate to Users section
2. Verify user list loads
3. Test search by email
4. Test search by name
5. Test role and plan filters
6. Test status filter

**Expected Results:**
- ✅ User list displays with pagination
- ✅ Search filters work correctly
- ✅ Filter combinations work

### Test 5: User Editing
**Steps:**
1. Click edit on a test user
2. Change user name
3. Change user plan (Explorer ↔ Pathfinder)
4. Change user role (if different from your own)
5. Change user status
6. Save changes
7. Verify changes are reflected in UI and database

**Expected Results:**
- ✅ Edit modal opens with current values
- ✅ Changes save successfully
- ✅ UI updates reflect changes
- ✅ Cannot edit your own role/status

### Test 6: Password Reset
**Steps:**
1. Select a test user
2. Click password reset button
3. Confirm action
4. Check user's email for reset link (if email is configured)
5. Verify audit log entry created

**Expected Results:**
- ✅ Password reset email sent
- ✅ Success message displayed
- ✅ Audit log records admin action

### Test 7: Email Change
**Steps:**
1. Select a test user
2. Click change email button
3. Enter new email address
4. Confirm action
5. Verify change in Supabase Auth dashboard
6. Verify audit log entry

**Expected Results:**
- ✅ Email updated in Auth and users table
- ✅ Success message displayed
- ✅ Audit log records change

### Test 8: User Suspension
**Steps:**
1. Select active test user
2. Click suspend button
3. Add reason (optional)
4. Confirm action
5. Verify user status changed to suspended
6. Test user cannot log in (if possible)
7. Reactivate user
8. Verify user can log in again

**Expected Results:**
- ✅ User status changes to suspended
- ✅ Suspended users cannot access app
- ✅ Reactivation works
- ✅ Cannot suspend your own account

### Test 9: User Deletion (Super Admin Only)
**Steps:**
1. Log in as super admin
2. Select test user for deletion
3. Click delete button
4. Confirm action (note warning message)
5. Verify user removed from database
6. Verify related data (subscriptions) removed
7. Test deletion restrictions (own account, last super admin)

**Expected Results:**
- ✅ Only super admins see delete option
- ✅ User and related data removed
- ✅ Cannot delete own account
- ✅ Cannot delete last super admin
- ✅ Warning displayed before deletion

## 💳 Subscription Management Tests

### Test 10: Subscription List
**Steps:**
1. Navigate to Subscriptions section
2. Verify subscription list loads
3. Test status filters (Active, Trialing, Past Due, etc.)
4. Test plan filters (Explorer, Pathfinder)
5. Verify pagination works

**Expected Results:**
- ✅ Subscription list displays with user details
- ✅ Filters work correctly
- ✅ Pagination functions properly

### Test 11: Stripe Sync
**Steps:**
1. Click "Sync Now" button
2. Verify sync status changes to "Syncing"
3. Wait for completion
4. Verify status returns to "Synced"
5. Check for any error messages
6. Verify audit log entry created

**Expected Results:**
- ✅ Sync process runs without errors
- ✅ Status indicators work correctly
- ✅ Audit log records sync action

### Test 12: Plan Upgrades/Downgrades
**Steps:**
1. Select Explorer user
2. Click upgrade to Pathfinder
3. Add reason (optional)
4. Confirm action
5. Verify plan change in database
6. Verify Stripe subscription updated (if applicable)
7. Test downgrade process
8. Verify audit logging

**Expected Results:**
- ✅ Plan changes work correctly
- ✅ Database and Stripe stay in sync
- ✅ Success messages displayed
- ✅ Audit logs record changes

## 📋 Audit Logs Tests

### Test 13: Audit Log Display
**Steps:**
1. Navigate to Audit Logs section
2. Verify logs display chronologically
3. Test event type filters
4. Test user ID filters
5. Test date range filters
6. Verify "Load More" functionality

**Expected Results:**
- ✅ Logs display with proper formatting
- ✅ All filters work correctly
- ✅ Pagination loads more results
- ✅ Sensitive data is redacted

### Test 14: Log Detail Expansion
**Steps:**
1. Find audit log entry with event data
2. Click "View details"
3. Verify event data displays properly
4. Check that sensitive fields are redacted
5. Test collapsing details

**Expected Results:**
- ✅ Event data expands/collapses correctly
- ✅ Sensitive data marked as [REDACTED]
- ✅ JSON formatting is readable

### Test 15: Audit Log Creation
**Steps:**
1. Perform various admin actions (user edit, plan change, etc.)
2. Navigate to audit logs
3. Verify each action created appropriate log entries
4. Check log includes admin ID, timestamp, and action details

**Expected Results:**
- ✅ All admin actions create audit logs
- ✅ Logs contain correct metadata
- ✅ Admin attribution is accurate

## 🔧 System Tests

### Test 16: Dashboard Data
**Steps:**
1. Navigate to main dashboard
2. Verify statistics are loading
3. Check user count, subscription counts
4. Test refresh functionality
5. Verify recent activity feed

**Expected Results:**
- ✅ Statistics display real data
- ✅ Refresh updates data
- ✅ Recent activity shows latest events

### Test 17: Dark/Light Mode
**Steps:**
1. Toggle dark mode switch in sidebar
2. Verify theme changes across all sections
3. Reload page and verify theme persists
4. Test in different browsers

**Expected Results:**
- ✅ Theme toggle works immediately
- ✅ All components respect theme
- ✅ Theme preference persists

### Test 18: Mobile Responsiveness
**Steps:**
1. Access admin panel on mobile device/small screen
2. Test sidebar menu toggle
3. Navigate between sections
4. Test table scrolling on mobile
5. Verify all forms work on touch devices

**Expected Results:**
- ✅ Mobile menu functions correctly
- ✅ All sections accessible on mobile
- ✅ Tables scroll horizontally when needed
- ✅ Touch interactions work properly

## 🔒 Security Tests

### Test 19: Direct API Access
**Steps:**
1. Log out of admin panel
2. Try to access `/api/admin/users` directly
3. Should return 401 Unauthorized
4. Log in as non-admin user
5. Try to access admin APIs
6. Should return 403 Forbidden

**Expected Results:**
- ✅ Unauthenticated API access blocked
- ✅ Non-admin API access blocked
- ✅ Proper HTTP status codes returned

### Test 20: Privilege Escalation Prevention
**Steps:**
1. As regular admin, try to edit your own role
2. Try to access super admin endpoints directly
3. Verify restrictions are enforced
4. Check audit logs for unauthorized attempts

**Expected Results:**
- ✅ Cannot modify own privileges
- ✅ Super admin endpoints blocked for regular admins
- ✅ Failed attempts logged

### Test 21: XSS and Injection Testing
**Steps:**
1. Try entering script tags in user name fields
2. Try SQL injection patterns in search fields
3. Verify input sanitization
4. Check that data is properly escaped in UI

**Expected Results:**
- ✅ Script tags are sanitized/escaped
- ✅ SQL injection attempts fail safely
- ✅ All user input properly handled

## 🔄 Integration Tests

### Test 22: Stripe Integration
**Steps:**
1. Have test Stripe account with test data
2. Test sync functionality
3. Test plan changes with Stripe updates
4. Verify webhook handling still works
5. Test error handling for Stripe failures

**Expected Results:**
- ✅ Stripe sync works without errors
- ✅ Plan changes reflected in Stripe
- ✅ Error handling graceful
- ✅ Webhook integration unaffected

### Test 23: Email Integration
**Steps:**
1. Test password reset emails
2. Verify email templates work
3. Test with different email providers
4. Check spam folder handling

**Expected Results:**
- ✅ Emails send successfully
- ✅ Templates render correctly
- ✅ Delivery is reliable

## 🐛 Error Handling Tests

### Test 24: Network Error Handling
**Steps:**
1. Disconnect from internet
2. Try to perform admin actions
3. Verify error messages are shown
4. Reconnect and verify retry works

**Expected Results:**
- ✅ Network errors handled gracefully
- ✅ User-friendly error messages
- ✅ Retry functionality works

### Test 25: Database Error Handling
**Steps:**
1. Temporarily break database connection (if possible in test env)
2. Try to load admin sections
3. Verify error boundaries catch issues
4. Restore connection and test recovery

**Expected Results:**
- ✅ Database errors don't crash app
- ✅ Error messages are informative
- ✅ App recovers when connection restored

## ✅ Pre-Production Checklist

Before deploying to production:

- [ ] All 25 test scenarios pass
- [ ] Database migration applied
- [ ] Environment variables set correctly
- [ ] Admin accounts created and verified
- [ ] Audit logging working for all actions
- [ ] RLS policies active and tested
- [ ] Stripe integration tested
- [ ] Email system tested
- [ ] Mobile responsiveness verified
- [ ] Security tests pass
- [ ] Performance acceptable with real data volume
- [ ] Backup and recovery procedures documented
- [ ] Monitoring and alerting configured

## 🔍 Ongoing Testing

### Weekly Tests
- [ ] Admin access still working
- [ ] Audit logs populating correctly
- [ ] Stripe sync functioning
- [ ] No unauthorized access attempts

### Monthly Tests  
- [ ] Full security audit
- [ ] Admin user review
- [ ] Performance monitoring
- [ ] Backup verification

---

## 🎯 Test Results Template

```markdown
## Test Session: [Date]
**Tester:** [Name]
**Environment:** [Development/Staging/Production]
**Admin Account:** [Test account used]

### Results Summary
- Total Tests: 25
- Passed: X
- Failed: Y
- Skipped: Z

### Failed Tests
1. **Test #X - [Test Name]**
   - Issue: [Description]
   - Steps to Reproduce: [...]
   - Expected vs Actual: [...]
   - Severity: [High/Medium/Low]

### Notes
[Any additional observations or recommendations]

### Sign-off
- [ ] All critical tests passed
- [ ] Security tests passed  
- [ ] Ready for production deployment

**Tester Signature:** [Name & Date]
```

Use this template to document each testing session and maintain a record of admin panel quality assurance.
