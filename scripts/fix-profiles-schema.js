#!/usr/bin/env node

// One-off schema fixer for profiles onboarding fields
// Usage: node scripts/fix-profiles-schema.js

const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set. Set it in .env.local or environment variables.')
    process.exit(1)
  }
  const sql = neon(url)

  console.log('🔧 Ensuring onboarding columns exist on profiles (and users fallback)...')
  try {
    // Ensure gen_random_uuid exists
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
    } catch {}

    // Create profiles table if it doesn't exist (minimal shape used by app)
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id UUID PRIMARY KEY,
        email TEXT,
        name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Add columns to profiles
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'explorer'`;

    // Also add to users table as a fallback if some environments use users
    await sql`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'explorer'`;

    console.log('✅ Schema ensured: onboarding_complete and plan are present.')
  } catch (e) {
    console.error('❌ Failed to ensure schema:', e.message || e)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

