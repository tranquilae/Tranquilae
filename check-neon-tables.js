const { neon } = require('@neondatabase/serverless')

console.log('🗃️ Checking Existing Neon Database Structure...')

const databaseUrl = "postgresql://neondb_owner:npg_KUnqR3tVSsg7@ep-wild-pine-advqkvr0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
const sql = neon(databaseUrl)

async function checkDatabase() {
  try {
    console.log('\n1️⃣ Listing all tables in database...')
    const tables = await sql`
      SELECT schemaname, tablename, tableowner 
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
      ORDER BY schemaname, tablename
    `
    
    if (tables.length === 0) {
      console.log('❌ No tables found in database')
      return
    }
    
    console.log('📋 Found tables:')
    tables.forEach(table => {
      console.log(`  - ${table.schemaname}.${table.tablename} (owner: ${table.tableowner})`)
    })

    console.log('\n2️⃣ Checking for user-related tables...')
    const userTables = tables.filter(t => 
      t.tablename.toLowerCase().includes('user') || 
      t.tablename.toLowerCase().includes('profile') ||
      t.tablename.toLowerCase().includes('auth')
    )
    
    if (userTables.length > 0) {
      console.log('👤 User-related tables found:')
      for (const table of userTables) {
        console.log(`\n📊 Table: ${table.schemaname}.${table.tablename}`)
        
        // Get column details
        const columns = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = ${table.schemaname} 
          AND table_name = ${table.tablename}
          ORDER BY ordinal_position
        `
        
        console.log('   Columns:')
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'nullable' : 'required'
          const defaultVal = col.column_default ? ` (default: ${col.column_default})` : ''
          console.log(`     - ${col.column_name}: ${col.data_type} (${nullable})${defaultVal}`)
        })
      }
    }

    console.log('\n3️⃣ Checking for subscription-related tables...')
    const subscriptionTables = tables.filter(t => 
      t.tablename.toLowerCase().includes('subscription') || 
      t.tablename.toLowerCase().includes('plan') ||
      t.tablename.toLowerCase().includes('payment')
    )
    
    if (subscriptionTables.length > 0) {
      console.log('💳 Subscription-related tables:')
      subscriptionTables.forEach(table => {
        console.log(`  - ${table.schemaname}.${table.tablename}`)
      })
    }

    console.log('\n4️⃣ All existing tables:')
    for (const table of tables) {
      if (!table.tablename.toLowerCase().includes('user') && 
          !table.tablename.toLowerCase().includes('subscription')) {
        console.log(`📋 ${table.schemaname}.${table.tablename}`)
        
        // Quick column count
        const colCount = await sql`
          SELECT COUNT(*) as col_count
          FROM information_schema.columns 
          WHERE table_schema = ${table.schemaname} 
          AND table_name = ${table.tablename}
        `
        console.log(`     (${colCount[0].col_count} columns)`)
      }
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message)
  }
}

checkDatabase().then(() => {
  console.log('\n✅ Database structure check complete!')
  process.exit(0)
}).catch(err => {
  console.error('Check failed:', err)
  process.exit(1)
})
