// Database migration script
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');

    // Check if profiles table exists (assuming it does since it's from existing schema)
    const profilesCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'profiles'
      );
    `;

    if (!profilesCheck[0].exists) {
      throw new Error('Base profiles table not found. Please run base migrations first.');
    }

    // Create health integrations table
    console.log('📊 Creating health_integrations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS health_integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        service_name VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'disconnected',
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expires_at TIMESTAMPTZ,
        scopes TEXT[] NOT NULL DEFAULT '{}',
        last_sync_at TIMESTAMPTZ,
        sync_status VARCHAR(20) NOT NULL DEFAULT 'idle',
        error_message TEXT,
        settings JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        CONSTRAINT health_integrations_service_check CHECK (service_name IN ('apple-health', 'google-fit', 'fitbit', 'samsung-health', 'garmin-connect')),
        CONSTRAINT health_integrations_status_check CHECK (status IN ('connected', 'pending', 'disconnected', 'error')),
        CONSTRAINT health_integrations_sync_status_check CHECK (sync_status IN ('idle', 'syncing', 'error')),
        UNIQUE(user_id, service_name)
      )
    `;

    // Create indexes for health integrations
    await sql`CREATE INDEX IF NOT EXISTS health_integrations_user_id_idx ON health_integrations(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS health_integrations_service_idx ON health_integrations(service_name)`;
    await sql`CREATE INDEX IF NOT EXISTS health_integrations_status_idx ON health_integrations(status)`;

    // Create health data points table
    console.log('📈 Creating health_data_points table...');
    await sql`
      CREATE TABLE IF NOT EXISTS health_data_points (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        integration_id UUID NOT NULL REFERENCES health_integrations(id) ON DELETE CASCADE,
        data_type VARCHAR(50) NOT NULL,
        value DECIMAL NOT NULL,
        unit VARCHAR(20) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        
        CONSTRAINT health_data_points_type_check CHECK (data_type IN ('steps', 'heart_rate', 'sleep', 'weight', 'calories', 'exercise', 'blood_pressure'))
      )
    `;

    // Create indexes for health data points (optimized for queries)
    await sql`CREATE INDEX IF NOT EXISTS health_data_points_user_id_idx ON health_data_points(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS health_data_points_integration_id_idx ON health_data_points(integration_id)`;
    await sql`CREATE INDEX IF NOT EXISTS health_data_points_type_idx ON health_data_points(data_type)`;
    await sql`CREATE INDEX IF NOT EXISTS health_data_points_timestamp_idx ON health_data_points(timestamp)`;
    await sql`CREATE INDEX IF NOT EXISTS health_data_points_user_type_timestamp_idx ON health_data_points(user_id, data_type, timestamp)`;

    // Create OAuth states table
    console.log('🔐 Creating oauth_states table...');
    await sql`
      CREATE TABLE IF NOT EXISTS oauth_states (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        service_name VARCHAR(50) NOT NULL,
        state VARCHAR(255) NOT NULL,
        code_verifier VARCHAR(255),
        redirect_url TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(state)
      )
    `;

    // Create indexes for OAuth states
    await sql`CREATE INDEX IF NOT EXISTS oauth_states_user_id_idx ON oauth_states(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS oauth_states_state_idx ON oauth_states(state)`;
    await sql`CREATE INDEX IF NOT EXISTS oauth_states_expires_idx ON oauth_states(expires_at)`;

    // Update onboarding_progress table to include selectedHealthServices
    console.log('🔄 Updating onboarding_progress table...');
    // This is safe to run multiple times - it will only add the column if it doesn't exist
    const onboardingCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'onboarding_progress' 
      AND column_name = 'selected_health_services'
    `;

    if (onboardingCheck.length === 0) {
      console.log('📝 Adding selected_health_services to onboarding data...');
      // Note: We can't directly add to JSONB with ALTER, but this structure should already support it
      console.log('ℹ️  selectedHealthServices will be stored in the existing data JSONB column');
    }

    console.log('✅ All database migrations completed successfully!');
    console.log('');
    console.log('📊 Created tables:');
    console.log('  - health_integrations (OAuth connections & tokens)');
    console.log('  - health_data_points (synced health data)');
    console.log('  - oauth_states (OAuth flow security)');
    console.log('');
    console.log('🎉 Your database is ready for health integrations!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
