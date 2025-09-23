# 🚀 Tranquilae Database Setup Guide (Neon + Supabase)

## 🏗️ Architecture Overview

Your Tranquilae app uses a **dual database architecture**:

- **Supabase**: Authentication only (`auth.users` table)
- **Neon DB**: All application data (profiles, onboarding, subscriptions, etc.)

## 📋 Setup Steps

### 1. Configure Neon Database Connection

1. **Get your Neon DB connection string** from your Neon dashboard
2. **Uncomment and set DATABASE_URL** in `.env.local`:

```env
# Database (Neon DB - enable for local development)
DATABASE_URL="postgresql://username:password@your-host.neon.tech/neondb?sslmode=require"
```

### 2. Create Database Schema in Neon

1. **Go to your Neon DB console** or use `psql` with your DATABASE_URL
2. **Copy and run the SQL** from `scripts/setup-neon-database.sql`

This will create all 6 required tables:
- ✅ `profiles` (main user data)
- ✅ `onboarding_progress` 
- ✅ `subscriptions`
- ✅ `health_integrations`
- ✅ `health_data_points`
- ✅ `oauth_states`

### 3. Verify Database Setup

Run this in your Neon DB console to verify:

```sql
-- Check all tables were created
SELECT table_name, 
  CASE WHEN table_name IN ('profiles', 'onboarding_progress', 'subscriptions', 'health_integrations', 'health_data_points', 'oauth_states') 
  THEN '✅ Expected' ELSE '❓ Unexpected' END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected result: All 6 tables with ✅ status

### 4. Test the Complete Setup

```bash
npm run dev
```

Then test:
1. **Sign up** → Creates user in Supabase + profile in Neon
2. **Complete onboarding** → Saves progress in Neon DB
3. **Access dashboard** → Loads data from Neon DB

## 🔄 Data Flow

```
User Sign Up/Login
     ↓
Supabase Auth (auth.users)
     ↓ 
Gets user.id
     ↓
Creates/Updates profile in Neon DB (profiles.user_id = user.id)
     ↓
All app data stored in Neon DB
```

## 🔧 Key Configuration Points

### Environment Variables (.env.local)
```env
# Supabase (Auth only)
NEXT_PUBLIC_SUPABASE_URL=https://fspoavmvfymlunmfubqp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Neon DB (Main data)
DATABASE_URL=your_neon_connection_string
```

### Database Structure
- **Supabase `auth.users`**: Authentication, JWT tokens
- **Neon `profiles`**: User profiles linked via `user_id`
- **Neon `onboarding_progress`**: Onboarding steps data
- **Neon `subscriptions`**: Plan and billing info
- **Neon `health_*`**: Health integrations and data

## 🐛 Troubleshooting

### "relation 'profiles' does not exist"
- ❌ **Issue**: Tables not created in Neon DB
- ✅ **Fix**: Run the SQL setup script in your Neon console

### "DATABASE_URL is not set"
- ❌ **Issue**: Connection string not configured
- ✅ **Fix**: Set DATABASE_URL in `.env.local`

### "Authentication failed"
- ❌ **Issue**: Supabase auth not working
- ✅ **Fix**: Check Supabase keys in `.env.local`

### "User not found in profiles"
- ❌ **Issue**: Profile not created when user signs up
- ✅ **Fix**: Check that your auth flow creates profile in Neon after Supabase signup

## 📊 Testing Checklist

- [ ] Database connection works (no "DATABASE_URL not set" errors)
- [ ] All 6 tables exist in Neon DB
- [ ] User signup creates profile in Neon
- [ ] Onboarding progress saves to Neon
- [ ] Dashboard loads user data from Neon
- [ ] No "relation does not exist" errors

## 🎯 Expected Results

After setup:
- ✅ **Smooth auth flow** (Supabase handles login/signup)
- ✅ **Data persistence** (Neon stores all app data)
- ✅ **No database errors** (all queries work correctly)
- ✅ **Fast performance** (proper indexes in place)

Your dual-database architecture gives you the best of both worlds: Supabase's excellent auth system + Neon's powerful PostgreSQL database for your application data!
