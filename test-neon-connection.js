const { neon } = require('@neondatabase/serverless')

console.log('🧪 Testing Neon DB Connection...')

// Check if DATABASE_URL exists
const databaseUrl = process.env.DATABASE_URL
console.log('DATABASE_URL exists:', !!databaseUrl)
console.log('DATABASE_URL preview:', databaseUrl ? databaseUrl.substring(0, 50) + '...' : 'NOT SET')

if (!databaseUrl) {
  console.log('❌ DATABASE_URL is not set!')
  console.log('You need to add your Neon connection string to .env.local')
  console.log('Example: DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.neon.tech/db"')
  process.exit(1)
}

// Test connection
const sql = neon(databaseUrl)

async function testConnection() {
  try {
    console.log('\n1️⃣ Testing basic connection...')
    const result = await sql`SELECT NOW() as current_time`
    console.log('✅ Connection successful!')
    console.log('Database time:', result[0].current_time)

    console.log('\n2️⃣ Testing profiles table...')
    const profiles = await sql`SELECT COUNT(*) as profile_count FROM profiles`
    console.log('✅ Profiles table exists!')
    console.log('Profile count:', profiles[0].profile_count)

    console.log('\n3️⃣ Testing table structure...')
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      ORDER BY ordinal_position
    `
    console.log('Profiles table columns:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'YES' ? ' (nullable)' : ' (required)'}`)
    })

    console.log('\n✅ Neon DB is ready for signup!')
    
  } catch (error) {
    console.error('❌ Neon DB connection failed:', error.message)
    
    if (error.message.includes('relation "users" does not exist')) {
      console.log('\n🗃️ Users table does not exist!')
      console.log('Run your database migrations or create the users table.')
    }
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n🔑 Authentication failed!')
      console.log('Check your DATABASE_URL credentials.')
    }
  }
}

testConnection().then(() => {
  process.exit(0)
}).catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
