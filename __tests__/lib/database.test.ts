import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'

// Mock the neon client before importing the database module
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(),
}))

// Mock console methods to avoid noise in tests
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
}

describe('Database Connection and Initialization', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should warn when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL
    
    // Re-import the module to trigger initialization
    await import('../../lib/database')
    
    expect(consoleSpy.warn).toHaveBeenCalledWith('❌ DATABASE_URL is not set!')
    expect(consoleSpy.warn).toHaveBeenCalledWith('📝 Please configure it in .env.local or Vercel environment variables')
    expect(consoleSpy.warn).toHaveBeenCalledWith('🔗 Get your connection string from: https://console.neon.tech/app/projects')
    expect(consoleSpy.warn).toHaveBeenCalledWith('⚠️ Running in offline mode - some features may use fallback data')
  })

  it('should warn when DATABASE_URL contains placeholder values', async () => {
    process.env.DATABASE_URL = 'postgresql://user:your_password_here@host:5432/db'
    
    await import('../../lib/database')
    
    expect(consoleSpy.warn).toHaveBeenCalledWith('❌ DATABASE_URL contains placeholder values!')
    expect(consoleSpy.warn).toHaveBeenCalledWith('📝 Please set your real Neon database connection string')
    expect(consoleSpy.warn).toHaveBeenCalledWith('⚠️ Running in offline mode - some features may use fallback data')
  })

  it('should initialize successfully with valid DATABASE_URL', async () => {
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/testdb'
    
    const { neon } = require('@neondatabase/serverless')
    const mockSql = jest.fn()
    neon.mockReturnValue(mockSql)
    
    await import('../../lib/database')
    
    expect(neon).toHaveBeenCalledWith(process.env.DATABASE_URL)
    expect(consoleSpy.log).toHaveBeenCalledWith('✅ Database connection configured successfully')
  })

  it('should handle connection errors gracefully', async () => {
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/testdb'
    
    const { neon } = require('@neondatabase/serverless')
    neon.mockImplementation(() => {
      throw new Error('Connection failed')
    })
    
    await import('../../lib/database')
    
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      '⚠️ Database connection failed, running in offline mode:',
      expect.any(Error)
    )
  })
})

describe('Database Migration Functions', () => {
  let database: any
  let mockSql: jest.Mock

  beforeEach(async () => {
    jest.resetModules()
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/testdb'
    
    const { neon } = require('@neondatabase/serverless')
    mockSql = jest.fn()
    neon.mockReturnValue(mockSql)
    
    database = await import('../../lib/database')
  })

  describe('Lock Management', () => {
    it('should acquire advisory lock successfully', async () => {
      mockSql.mockResolvedValue([{ locked: true }])
      
      const result = await database.migrations.tryAcquireLock()
      
      expect(result).toBe(true)
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining(['SELECT pg_try_advisory_lock(', ') as locked'])
      )
    })

    it('should fail to acquire lock when already taken', async () => {
      mockSql.mockResolvedValue([{ locked: false }])
      
      const result = await database.migrations.tryAcquireLock()
      
      expect(result).toBe(false)
    })

    it('should handle lock acquisition errors', async () => {
      mockSql.mockRejectedValue(new Error('Lock error'))
      
      const result = await database.migrations.tryAcquireLock()
      
      expect(result).toBe(false)
    })

    it('should release advisory lock', async () => {
      mockSql.mockResolvedValue([])
      
      await database.migrations.releaseLock()
      
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining(['SELECT pg_advisory_unlock(', ')'])
      )
    })
  })

  describe('Table Creation', () => {
    it('should create profiles extensions', async () => {
      mockSql.mockResolvedValue([])
      
      await database.migrations.createProfilesExtensions()
      
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('ALTER TABLE profiles'),
          expect.stringContaining('ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE'),
          expect.stringContaining('ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT'),
        ])
      )
    })

    it('should create subscriptions table with proper constraints', async () => {
      mockSql.mockResolvedValue([])
      
      await database.migrations.createSubscriptionsTable()
      
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('CREATE TABLE IF NOT EXISTS subscriptions'),
          expect.stringContaining('CONSTRAINT subscriptions_plan_check CHECK (plan IN'),
          expect.stringContaining('CONSTRAINT subscriptions_status_check CHECK (status IN'),
        ])
      )
    })

    it('should create onboarding progress table', async () => {
      mockSql.mockResolvedValue([])
      
      await database.migrations.createOnboardingProgressTable()
      
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('CREATE TABLE IF NOT EXISTS onboarding_progress'),
          expect.stringContaining('UNIQUE(user_id)'),
        ])
      )
    })

    it('should create health integrations table with service constraints', async () => {
      mockSql.mockResolvedValue([])
      
      await database.migrations.createHealthIntegrationsTable()
      
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('CREATE TABLE IF NOT EXISTS health_integrations'),
          expect.stringContaining('CONSTRAINT health_integrations_service_check'),
          expect.stringContaining('apple-health'),
          expect.stringContaining('google-fit'),
        ])
      )
    })

    it('should create health data points table with indexes', async () => {
      mockSql.mockResolvedValue([])
      
      await database.migrations.createHealthDataPointsTable()
      
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('CREATE TABLE IF NOT EXISTS health_data_points'),
          expect.stringContaining('CONSTRAINT health_data_points_type_check'),
        ])
      )
    })
  })
})

describe('Database Types', () => {
  it('should define proper User interface', () => {
    const user: import('../../lib/database').User = {
      id: '123',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      onboarding_complete: true,
      plan: 'explorer',
      created_at: new Date(),
      updated_at: new Date(),
    }
    
    expect(user.plan).toBe('explorer')
    expect(user.onboarding_complete).toBe(true)
  })

  it('should define proper Subscription interface', () => {
    const subscription: import('../../lib/database').Subscription = {
      id: '123',
      user_id: '456',
      plan: 'pathfinder',
      status: 'active',
      stripe_subscription_id: 'sub_123',
      stripe_customer_id: 'cus_123',
      cancel_at_period_end: false,
      created_at: new Date(),
      updated_at: new Date(),
    }
    
    expect(subscription.plan).toBe('pathfinder')
    expect(subscription.status).toBe('active')
  })

  it('should define proper OnboardingProgress interface', () => {
    const progress: import('../../lib/database').OnboardingProgress = {
      id: '123',
      user_id: '456',
      step: 2,
      data: {
        goals: ['weight-loss', 'muscle-gain'],
        devicesConnected: true,
        selectedHealthServices: ['apple-health'],
        personalData: {
          name: 'John Doe',
          sex: 'male',
          height: 180,
          weight: 75,
        },
      },
      created_at: new Date(),
      updated_at: new Date(),
    }
    
    expect(progress.step).toBe(2)
    expect(progress.data.goals).toContain('weight-loss')
  })

  it('should define proper HealthIntegration interface', () => {
    const integration: import('../../lib/database').HealthIntegration = {
      id: '123',
      user_id: '456',
      service_name: 'apple-health',
      status: 'connected',
      access_token: 'encrypted_token',
      scopes: ['read_health_data'],
      sync_status: 'idle',
      settings: {
        auto_sync: true,
        data_types: ['steps', 'heart_rate'],
        sync_frequency: 'daily',
      },
      created_at: new Date(),
      updated_at: new Date(),
    }
    
    expect(integration.service_name).toBe('apple-health')
    expect(integration.settings.auto_sync).toBe(true)
  })
})
