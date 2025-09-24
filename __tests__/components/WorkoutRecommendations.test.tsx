import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkoutRecommendations } from '@/components/WorkoutRecommendations'

// Mock the AuthProvider hook
const mockUseAuth = {
  user: { id: 'test-user', email: 'test@example.com' },
  neonUser: { id: 'neon-user-id', email: 'test@example.com' },
}

jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => mockUseAuth,
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('WorkoutRecommendations Component', () => {
  const mockRecommendationsResponse = {
    success: true,
    data: {
      recommendations: [
        {
          id: 1,
          title: 'Morning Strength Training',
          description: 'Full body strength workout for beginners',
          difficulty: 'beginner',
          category: 'strength',
          estimatedDuration: 30,
          equipmentNeeded: ['dumbbells'],
          exerciseCount: 8,
          exerciseCategories: ['chest', 'back'],
          recommendationScore: 85,
          reasons: ['Matches your fitness level', 'Perfect duration for your schedule'],
        },
        {
          id: 2,
          title: 'HIIT Cardio Blast',
          description: 'High-intensity interval training',
          difficulty: 'intermediate',
          category: 'cardio',
          estimatedDuration: 25,
          equipmentNeeded: [],
          exerciseCount: 6,
          exerciseCategories: ['cardio'],
          recommendationScore: 78,
          reasons: ['Great for cardiovascular health', 'No equipment needed'],
        },
      ],
      context: {
        userFitnessLevel: 'beginner',
        preferredDuration: 30,
        weeklyProgress: {
          completed: 2,
          goal: 4,
          remaining: 2,
        },
        topCategories: ['strength', 'cardio'],
        hasHistory: true,
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockRecommendationsResponse,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders loading state initially', async () => {
    // Make fetch hang to keep loading state
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<WorkoutRecommendations />)

    expect(screen.getByText('Recommended for You')).toBeInTheDocument()
    expect(screen.getByText('Loading recommendations...')).toBeInTheDocument()
    expect(screen.getByRole('generic', { hidden: true })).toHaveClass('animate-spin')
  })

  it('renders recommendations after loading', async () => {
    render(<WorkoutRecommendations />)

    await waitFor(() => {
      expect(screen.getByText('Morning Strength Training')).toBeInTheDocument()
    })

    expect(screen.getByText('HIIT Cardio Blast')).toBeInTheDocument()
    expect(screen.getByText('Full body strength workout for beginners')).toBeInTheDocument()
    expect(screen.getByText('2 more workouts to reach your weekly goal')).toBeInTheDocument()
  })

  it('displays workout details correctly', async () => {
    render(<WorkoutRecommendations />)

    await waitFor(() => {
      expect(screen.getByText('Morning Strength Training')).toBeInTheDocument()
    })

    // Check difficulty badge
    expect(screen.getByText('Beginner')).toBeInTheDocument()
    expect(screen.getByText('Beginner')).toHaveClass('text-green-600')

    // Check duration
    expect(screen.getByText('30 min')).toBeInTheDocument()

    // Check exercise count
    expect(screen.getByText('8 exercises')).toBeInTheDocument()

    // Check category
    expect(screen.getByText('Strength')).toBeInTheDocument()
  })

  it('handles error state', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<WorkoutRecommendations />)

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Recommendations')).toBeInTheDocument()
    })

    expect(screen.getByText('Network error')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('handles API error response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        error: { message: 'User not authenticated' },
      }),
    })

    render(<WorkoutRecommendations />)

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Recommendations')).toBeInTheDocument()
    })

    expect(screen.getByText('User not authenticated')).toBeInTheDocument()
  })

  it('allows refreshing recommendations', async () => {
    render(<WorkoutRecommendations />)

    await waitFor(() => {
      expect(screen.getByText('Morning Strength Training')).toBeInTheDocument()
    })

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    fireEvent.click(refreshButton)

    expect(mockFetch).toHaveBeenCalledTimes(2) // Initial load + refresh
  })

  it('calls onWorkoutSelect when workout is clicked', async () => {
    const onWorkoutSelect = jest.fn()
    render(<WorkoutRecommendations onWorkoutSelect={onWorkoutSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Morning Strength Training')).toBeInTheDocument()
    })

    const workoutCard = screen.getByText('Morning Strength Training').closest('.glass-card')
    expect(workoutCard).toBeInTheDocument()
    
    if (workoutCard) {
      fireEvent.click(workoutCard)
      expect(onWorkoutSelect).toHaveBeenCalledWith(1)
    }
  })

  it('navigates to workout page when no onWorkoutSelect prop', async () => {
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })

    render(<WorkoutRecommendations />)

    await waitFor(() => {
      expect(screen.getByText('Morning Strength Training')).toBeInTheDocument()
    })

    const workoutCard = screen.getByText('Morning Strength Training').closest('.glass-card')
    if (workoutCard) {
      fireEvent.click(workoutCard)
      expect(window.location.href).toBe('/dashboard/workouts/1')
    }
  })

  it('applies filters correctly', async () => {
    const filters = {
      difficulty: 'intermediate',
      category: 'cardio',
      duration: 25,
    }

    render(<WorkoutRecommendations filters={filters} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const fetchUrl = mockFetch.mock.calls[0][0]
    expect(fetchUrl).toContain('difficulty=intermediate')
    expect(fetchUrl).toContain('category=cardio')
    expect(fetchUrl).toContain('duration=25')
  })

  it('respects limit prop', async () => {
    render(<WorkoutRecommendations limit={3} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const fetchUrl = mockFetch.mock.calls[0][0]
    expect(fetchUrl).toContain('limit=3')
  })

  it('formats duration correctly', async () => {
    const responseWithLongDuration = {
      ...mockRecommendationsResponse,
      data: {
        ...mockRecommendationsResponse.data,
        recommendations: [
          {
            ...mockRecommendationsResponse.data.recommendations[0],
            estimatedDuration: 75, // 1 hour 15 minutes
          },
        ],
      },
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => responseWithLongDuration,
    })

    render(<WorkoutRecommendations />)

    await waitFor(() => {
      expect(screen.getByText('1h 15m')).toBeInTheDocument()
    })
  })

  it('shows correct message when weekly goal is achieved', async () => {
    const responseWithCompletedGoal = {
      ...mockRecommendationsResponse,
      data: {
        ...mockRecommendationsResponse.data,
        context: {
          ...mockRecommendationsResponse.data.context,
          weeklyProgress: {
            completed: 4,
            goal: 4,
            remaining: 0,
          },
        },
      },
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => responseWithCompletedGoal,
    })

    render(<WorkoutRecommendations />)

    await waitFor(() => {
      expect(screen.getByText("You've achieved your weekly workout goal! Keep it up!")).toBeInTheDocument()
    })
  })

  it('shows different header for new users without history', async () => {
    const responseForNewUser = {
      ...mockRecommendationsResponse,
      data: {
        ...mockRecommendationsResponse.data,
        context: {
          ...mockRecommendationsResponse.data.context,
          hasHistory: false,
        },
      },
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => responseForNewUser,
    })

    render(<WorkoutRecommendations />)

    await waitFor(() => {
      expect(screen.getByText('Start Your Fitness Journey')).toBeInTheDocument()
    })
  })

  it('does not load recommendations when user is not authenticated', () => {
    mockUseAuth.user = null
    mockUseAuth.neonUser = null

    render(<WorkoutRecommendations />)

    // Should not make any fetch calls
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('shows equipment needed', async () => {
    render(<WorkoutRecommendations />)

    await waitFor(() => {
      expect(screen.getByText('Equipment: dumbbells')).toBeInTheDocument()
    })
  })

  it('shows no equipment needed message', async () => {
    render(<WorkoutRecommendations />)

    await waitFor(() => {
      expect(screen.getByText('No equipment needed')).toBeInTheDocument()
    })
  })

  it('displays recommendation reasons', async () => {
    render(<WorkoutRecommendations />)

    await waitFor(() => {
      expect(screen.getByText('Matches your fitness level')).toBeInTheDocument()
      expect(screen.getByText('Perfect duration for your schedule')).toBeInTheDocument()
    })
  })
})
