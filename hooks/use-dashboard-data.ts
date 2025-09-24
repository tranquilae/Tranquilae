import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchWithAuth } from '@/lib/api'

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

        const response = await fetchWithAuth('/api/user/profile')

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
      const response = await fetchWithAuth(`/api/meals?date=${today}`)

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

      const response = await fetchWithAuth(`/api/meals`, {
        method: 'POST',
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

        // Fetch user settings (goals)
        const token = (await supabase.auth.getSession()).data.session?.access_token
        const settingsRes = await fetchWithAuth('/api/user/settings')
        let goals = getDefaultStats()
        if (settingsRes.ok) {
          const s = await settingsRes.json()
          goals = {
            dailyCalorieGoal: Number(s.daily_calorie_goal || 0),
            consumedCalories: 0,
            burnedCalories: 0,
            steps: 0,
            stepsGoal: Number(s.steps_goal || 0),
            waterGlasses: 0,
            waterGoal: Number(s.water_goal || 0),
            sleepHours: 0,
            sleepGoal: Number(s.sleep_goal || 0),
            activeMinutes: 0,
            activeGoal: Number(s.active_minutes_goal || 0),
            macros: {
              carbs: { consumed: 0, goal: Number(s?.macros_goal?.carbs || 0) },
              protein: { consumed: 0, goal: Number(s?.macros_goal?.protein || 0) },
              fat: { consumed: 0, goal: Number(s?.macros_goal?.fat || 0) },
            }
          }
        }

        // Fetch daily stats (if endpoint exists); otherwise keep goals/zeros
        const today = new Date().toISOString().split('T')[0]
        const response = await fetchWithAuth(`/api/stats/daily?date=${today}`)

        if (response.ok) {
          const statsData = await response.json()
          setStats({ ...goals, ...(statsData.stats || {}) })
        } else {
          setStats(goals)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats')
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
    dailyCalorieGoal: 0,
    consumedCalories: 0,
    burnedCalories: 0,
    steps: 0,
    stepsGoal: 0,
    waterGlasses: 0,
    waterGoal: 0,
    sleepHours: 0,
    sleepGoal: 0,
    activeMinutes: 0,
    activeGoal: 0,
    macros: {
      carbs: { consumed: 0, goal: 0 },
      protein: { consumed: 0, goal: 0 },
      fat: { consumed: 0, goal: 0 }
    }
  }
}
