import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface UserStats {
  dailyCalorieGoal: number
  consumedCalories: number
  burnedCalories: number
  steps: number
  stepsGoal: number
  waterGlasses: number
  waterGoal: number
  sleepHours: number
  sleepGoal: number
  activeMinutes: number
  activeGoal: number
  macros: {
    carbs: { consumed: number; goal: number }
    protein: { consumed: number; goal: number }
    fat: { consumed: number; goal: number }
  }
}

export interface Meal {
  id: string
  name: string
  time: string
  calories: number
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foods: Array<{
    name: string
    calories: number
    quantity: string
  }>
  date: string
  user_id: string
}

export interface UserProfile {
  id: string
  user_id: string
  email: string
  name: string
  onboarding_complete: boolean
  plan: 'explorer' | 'pathfinder'
  created_at: string
  updated_at: string
}

// Hook for user profile data
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          setError('Authentication required')
          return
        }

        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }

        const profileData = await response.json()
        setProfile(profileData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return { profile, loading, error }
}

// Hook for today's meals
export function useTodaysMeals() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMeals = async () => {
    try {
      setLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setError('Authentication required')
        return
      }

      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/meals?date=${today}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch meals')
      }

      const mealsData = await response.json()
      setMeals(mealsData.meals || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeals()
  }, [])

  const addMeal = async (meal: Omit<Meal, 'id' | 'user_id' | 'date'>) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('Authentication required')
      }

      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          ...meal,
          date: new Date().toISOString().split('T')[0]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add meal')
      }

      const newMeal = await response.json()
      setMeals(prev => [...prev, newMeal])
      return newMeal
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add meal')
      throw err
    }
  }

  return { meals, loading, error, addMeal, refetch: fetchMeals }
}

// Hook for user daily stats
export function useDailyStats() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          setError('Authentication required')
          return
        }

        const today = new Date().toISOString().split('T')[0]
        const response = await fetch(`/api/stats/daily?date=${today}`, {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const statsData = await response.json()
        setStats(statsData.stats || getDefaultStats())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats')
        // Use default stats on error
        setStats(getDefaultStats())
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}

// Default stats for new users
function getDefaultStats(): UserStats {
  return {
    dailyCalorieGoal: 2000,
    consumedCalories: 0,
    burnedCalories: 0,
    steps: 0,
    stepsGoal: 10000,
    waterGlasses: 0,
    waterGoal: 8,
    sleepHours: 0,
    sleepGoal: 8,
    activeMinutes: 0,
    activeGoal: 60,
    macros: {
      carbs: { consumed: 0, goal: 250 },
      protein: { consumed: 0, goal: 150 },
      fat: { consumed: 0, goal: 67 }
    }
  }
}
