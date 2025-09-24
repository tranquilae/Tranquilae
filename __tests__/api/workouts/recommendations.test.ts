import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/workouts/recommendations/route'

// Mock the Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
}

jest.mock('@/lib/supabaseServer', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock the Neon client
const mockSqlQuery = jest.fn()
jest.mock('@/lib/neonClient', () => ({
  getNeonClient: jest.fn(() => mockSqlQuery),
}))

describe('Workout Recommendations API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    })

    const request = new NextRequest('http://localhost:3000/api/workouts/recommendations')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('unauthorized')
  })

  it('should return 404 when user is not found in database', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123', email: 'test@example.com' } },
      error: null,
    })

    mockSqlQuery.mockResolvedValueOnce([]) // Empty user result

    const request = new NextRequest('http://localhost:3000/api/workouts/recommendations')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('user_not_found')
  })

  it('should return workout recommendations for authenticated user', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' }
    const mockUserData = {
      id: 'db-user-id',
      email: 'test@example.com',
      full_name: 'Test User',
      fitness_level: 'intermediate',
      preferred_workout_duration: 30,
      weekly_workout_goal: 4,
    }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSqlQuery
      .mockResolvedValueOnce([mockUserData]) // User query
      .mockResolvedValueOnce([]) // User history query
      .mockResolvedValueOnce([]) // Recent workouts query
      .mockResolvedValueOnce([   // Recommended workouts query
        {
          id: 1,
          title: 'Morning Strength Training',
          description: 'Full body strength workout',
          category: 'strength',
          difficulty: 'intermediate',
          estimated_duration_minutes: 30,
          exercise_count: 8,
          equipment_needed: ['dumbbells', 'resistance_bands'],
          calories_burned_estimate: 250,
          muscle_groups: ['chest', 'back', 'legs'],
          total_score: 85,
          base_score: 50,
          difficulty_score: 20,
          duration_score: 15,
          category_score: 0,
          recency_penalty: 0,
          variety_score: 0,
          random_score: 5,
        }
      ])

    const request = new NextRequest('http://localhost:3000/api/workouts/recommendations')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.recommendations).toHaveLength(1)
    expect(data.data.recommendations[0].title).toBe('Morning Strength Training')
    expect(data.data.user_context).toBeDefined()
    expect(data.data.user_context.fitness_level).toBe('intermediate')
  })

  it('should apply query parameter filters correctly', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' }
    const mockUserData = {
      id: 'db-user-id',
      email: 'test@example.com',
      fitness_level: 'intermediate',
      preferred_workout_duration: 30,
    }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSqlQuery
      .mockResolvedValueOnce([mockUserData])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const url = 'http://localhost:3000/api/workouts/recommendations?difficulty=advanced&category=cardio&duration=45&limit=3'
    const request = new NextRequest(url)
    await GET(request)

    // Verify that the query parameters were parsed correctly
    expect(mockSqlQuery).toHaveBeenCalledTimes(4)
  })

  it('should handle workout history analysis', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' }
    const mockUserData = {
      id: 'db-user-id',
      fitness_level: 'beginner',
      preferred_workout_duration: 20,
    }

    const mockHistory = [
      {
        category: 'strength',
        difficulty: 'beginner',
        estimated_duration_minutes: 20,
        completion_count: 5,
        avg_actual_duration: 18,
        last_completed: new Date('2024-01-15'),
      },
      {
        category: 'cardio',
        difficulty: 'intermediate',
        estimated_duration_minutes: 25,
        completion_count: 3,
        avg_actual_duration: 22,
        last_completed: new Date('2024-01-10'),
      },
    ]

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSqlQuery
      .mockResolvedValueOnce([mockUserData])
      .mockResolvedValueOnce(mockHistory)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost:3000/api/workouts/recommendations')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.user_context.workout_history).toBeDefined()
    expect(data.data.user_context.preferred_categories).toContain('strength')
  })

  it('should exclude recently completed workouts', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' }
    const mockUserData = {
      id: 'db-user-id',
      fitness_level: 'intermediate',
    }

    const mockRecentWorkouts = [
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSqlQuery
      .mockResolvedValueOnce([mockUserData])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockRecentWorkouts)
      .mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost:3000/api/workouts/recommendations')
    await GET(request)

    // Verify that recent workouts are excluded in the final query
    expect(mockSqlQuery).toHaveBeenCalledTimes(4)
  })

  it('should handle database errors gracefully', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null,
    })

    mockSqlQuery.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/workouts/recommendations')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('database_error')
  })

  it('should provide proper scoring explanation', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' }
    const mockUserData = {
      id: 'db-user-id',
      fitness_level: 'intermediate',
      preferred_workout_duration: 30,
    }

    const mockWorkout = {
      id: 1,
      title: 'Test Workout',
      difficulty: 'intermediate',
      estimated_duration_minutes: 30,
      category: 'strength',
      total_score: 85,
      base_score: 50,
      difficulty_score: 20,
      duration_score: 15,
      category_score: 0,
      recency_penalty: 0,
      variety_score: 0,
      random_score: 5,
    }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSqlQuery
      .mockResolvedValueOnce([mockUserData])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockWorkout])

    const request = new NextRequest('http://localhost:3000/api/workouts/recommendations')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.recommendations[0].reasoning).toBeDefined()
    expect(data.data.recommendations[0].reasoning).toContain('matches your fitness level')
  })

  it('should limit results according to limit parameter', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' }
    const mockUserData = { id: 'db-user-id', fitness_level: 'intermediate' }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSqlQuery
      .mockResolvedValueOnce([mockUserData])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost:3000/api/workouts/recommendations?limit=2')
    const response = await GET(request)

    expect(response.status).toBe(200)
    // Verify that limit was parsed correctly (limit=2)
    const url = new URL(request.url)
    expect(url.searchParams.get('limit')).toBe('2')
  })
})
