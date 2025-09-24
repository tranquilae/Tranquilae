# Database Migration Runbook - Tranquilae

## Overview
This runbook covers the migration from the existing v0.dev database to the new Neon database schema for the Tranquilae app rebuild.

## ⚠️ Prerequisites

### Environment Variables Required
- `NEON_DATABASE_URL`: Connection string to your Neon database
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key (new format)
- `SUPABASE_SECRET_KEY`: Supabase service role key (new format)

### Tools Required
- `psql` (PostgreSQL client)
- `pg_dump` (for backups)
- Access to your Neon and Supabase dashboards

## Pre-Migration Steps

### 1. Backup Current Database
```bash
# Create backup of existing data
./scripts/backup_neon_db.sh
```

### 2. Verify Environment
```bash
# Check environment variables
echo "NEON_DATABASE_URL is $([ -n "$NEON_DATABASE_URL" ] && echo "set" || echo "NOT set")"
echo "NEXT_PUBLIC_SUPABASE_URL is $([ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && echo "set" || echo "NOT set")"
```

### 3. Test Database Connection
```bash
# Test Neon connection
psql "$NEON_DATABASE_URL" -c "SELECT version();"
```

## Migration Execution

### Step 1: Apply New Schema
```bash
# Run the migration
psql "$NEON_DATABASE_URL" -f migrations/20250924132000_init_app_schema.sql
```

### Step 2: Verify Schema Creation
```bash
# Connect to database and verify tables
psql "$NEON_DATABASE_URL"

# In psql, run:
\dt                          # List all tables
\d users                     # Describe users table
\d onboarding_progress       # Describe onboarding table
SELECT COUNT(*) FROM achievements; # Should return 5 sample achievements
SELECT COUNT(*) FROM workouts;     # Should return 6 sample workouts
```

### Step 3: Test Application Connectivity
```bash
# Start the development server
npm run dev

# Test endpoints:
# GET /api/health/db - should return database connection status
# Verify authentication flow works
```

## Data Migration (if needed)

### Migrating Existing Users
If you have existing users in v0.dev that need to be preserved:

```sql
-- Example migration query (adjust based on your existing schema)
INSERT INTO users (supabase_user_id, email, display_name, onboarded, explorer)
SELECT 
    auth_user_id,
    email,
    name,
    COALESCE(onboarding_completed, false),
    COALESCE(plan = 'explorer', false)
FROM legacy_users_table
WHERE auth_user_id IS NOT NULL;
```

### Migrating User Settings
```sql
-- Example settings migration
INSERT INTO user_settings (supabase_user_id, timezone, units, preferences)
SELECT 
    user_id,
    COALESCE(timezone, 'Europe/London'),
    COALESCE(units, 'metric'),
    COALESCE(settings_json, '{}')::jsonb
FROM legacy_settings_table;
```

## Post-Migration Verification

### 1. Schema Verification Checklist
- [ ] All 11 tables created successfully
- [ ] All indexes created
- [ ] Foreign key constraints working
- [ ] Triggers for updated_at columns functioning
- [ ] Sample data inserted (achievements, workouts, plans)

### 2. Application Testing Checklist
- [ ] User signup creates record in `users` table
- [ ] Onboarding progress saves to `onboarding_progress` table
- [ ] Dashboard loads without errors
- [ ] Settings can be updated
- [ ] Workout data can be created/retrieved

### 3. Performance Verification
```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE supabase_user_id = 'some-uuid';
EXPLAIN ANALYZE SELECT * FROM onboarding_progress WHERE supabase_user_id = 'some-uuid';
```

## Rollback Procedure

### If Migration Fails or Issues Arise

#### Option 1: Quick Rollback (if backup exists)
```bash
# Restore from backup
./scripts/restore_neon_db.sh backups/neon_backup_YYYYMMDD_HHMMSS.sql.gz
```

#### Option 2: Manual Rollback
```sql
-- Drop new schema (in psql)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Then restore from backup
```

### Rollback Verification
- [ ] Application starts without database errors
- [ ] Existing users can sign in
- [ ] All functionality works as before migration

## Monitoring & Alerts

### Key Metrics to Monitor
- Database connection pool usage
- Query response times
- Error rates in application logs
- User signup/signin success rates

### Log Locations
- Application logs: Check Vercel deployment logs
- Database logs: Neon dashboard > Logs
- Supabase logs: Supabase dashboard > Logs

## Common Issues & Solutions

### Issue: Migration fails with "relation already exists"
**Solution**: The migration script includes `DROP TABLE IF EXISTS` statements. If this fails, manually drop conflicting tables first.

### Issue: Foreign key constraint violations
**Solution**: Ensure Supabase users exist before creating Neon user records. The application should handle this automatically during signup.

### Issue: Environment variables not working
**Solution**: Verify exact variable names and ensure they're set in both local `.env.local` and Vercel deployment settings.

### Issue: Connection timeouts
**Solution**: Check Neon connection limits and consider connection pooling. Neon has connection limits based on your plan.

## Emergency Contacts & Resources

- **Neon Support**: Available through Neon dashboard
- **Supabase Support**: Available through Supabase dashboard
- **Database Schema**: `migrations/20250924132000_init_app_schema.sql`
- **Backup Location**: `backups/` directory
- **Logs**: Check application logs for detailed error messages

## Sign-off Checklist

Before considering migration complete:

- [ ] All tests pass (unit and integration)
- [ ] Performance benchmarks meet requirements
- [ ] Backup and restore procedures tested
- [ ] Rollback procedure documented and tested
- [ ] Application functionality verified in staging
- [ ] Production deployment plan approved
- [ ] Monitoring and alerts configured
- [ ] Team trained on new database schema
- [ ] Documentation updated

---

**Migration Performed By**: ________________  
**Date**: ________________  
**Environment**: ________________  
**Backup Location**: ________________  
**Rollback Tested**: [ ] Yes [ ] No
