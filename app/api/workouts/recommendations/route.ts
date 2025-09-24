import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getNeonClient } from '@/lib/neonClient';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user session
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');
    const difficulty = searchParams.get('difficulty');
    const category = searchParams.get('category');
    const duration = searchParams.get('duration');

    // Get user data and preferences from Neon DB
    const sql = getNeonClient();
    const neonUserResult = await sql`
      SELECT 
        u.id,
        u.email,
        u.full_name,
        up.fitness_level,
        up.preferred_workout_duration,
        up.preferred_workout_time,
        up.weekly_workout_goal
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE u.supabase_user_id = ${user.id}
    `;

    if (neonUserResult.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'user_not_found', message: 'User not found in database' } },
        { status: 404 }
      );
    }

    const userData = neonUserResult[0];
    const userId = userData.id;

    // Get user's workout history for better recommendations
    const userHistoryResult = await sql`
      SELECT 
        w.category,
        w.difficulty,
        w.estimated_duration_minutes,
        COUNT(*) as completion_count,
        AVG(uw.duration_minutes) as avg_actual_duration,
        MAX(uw.completed_at) as last_completed
      FROM user_workouts uw
      JOIN workouts w ON uw.workout_id = w.id
      WHERE uw.user_id = ${userId} AND uw.completed_at IS NOT NULL
      GROUP BY w.category, w.difficulty, w.estimated_duration_minutes
      ORDER BY completion_count DESC, last_completed DESC
    `;

    // Get recently completed workouts to avoid repetition
    const recentWorkoutsResult = await sql`
      SELECT DISTINCT w.id
      FROM user_workouts uw
      JOIN workouts w ON uw.workout_id = w.id
      WHERE uw.user_id = ${userId} 
        AND uw.completed_at IS NOT NULL 
        AND uw.completed_at >= NOW() - INTERVAL '7 days'
    `;

    const recentWorkoutIds = recentWorkoutsResult.map(row => row.id);

    // Determine user's preferred difficulty based on history and settings
    let preferredDifficulty = difficulty || userData.fitness_level || 'intermediate';
    
    // If user has history, analyze progression
    if (userHistoryResult.length > 0) {
      const completedDifficulties = userHistoryResult.map(h => h.difficulty);
      const advancedCount = completedDifficulties.filter(d => d === 'advanced').length;
      const intermediateCount = completedDifficulties.filter(d => d === 'intermediate').length;
      const beginnerCount = completedDifficulties.filter(d => d === 'beginner').length;

      // Suggest progression if user consistently completes workouts
      if (advancedCount > 3) {
        preferredDifficulty = 'advanced';
      } else if (intermediateCount > 5 && advancedCount === 0) {
        preferredDifficulty = 'advanced'; // Suggest progression
      } else if (beginnerCount > 5 && intermediateCount === 0) {
        preferredDifficulty = 'intermediate'; // Suggest progression
      }
    }

    // Determine preferred duration
    let preferredDuration = duration ? parseInt(duration) : (userData.preferred_workout_duration || 30);
    
    // Adjust based on user's actual completion times
    if (userHistoryResult.length > 0) {
      const avgActualDuration = userHistoryResult.reduce((sum, h) => sum + (h.avg_actual_duration || h.estimated_duration_minutes), 0) / userHistoryResult.length;
      preferredDuration = Math.round(avgActualDuration);
    }

    // Get popular categories from user history
    const popularCategories = userHistoryResult
      .reduce((acc: {[key: string]: number}, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.completion_count;
        return acc;
      }, {});

    const topCategories = Object.entries(popularCategories)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .map(([category]) => category)
      .slice(0, 3);

    // Build the recommendation query
    let whereConditions = [];
    let queryParams: any = {};

    // Exclude recently completed workouts
    if (recentWorkoutIds.length > 0) {
      whereConditions.push(`w.id NOT IN (${recentWorkoutIds.map(() => '?').join(', ')})`);
      recentWorkoutIds.forEach((id, index) => {
        queryParams[`recent_${index}`] = id;
      });
    }

    // Apply filters
    if (difficulty) {
      whereConditions.push('w.difficulty = ?');
      queryParams.difficulty = difficulty;
    }

    if (category) {
      whereConditions.push('w.category = ?');
      queryParams.category = category;
    }

    if (duration) {
      const durationNum = parseInt(duration);
      whereConditions.push('w.estimated_duration_minutes BETWEEN ? AND ?');
      queryParams.durationMin = Math.max(durationNum - 10, 5);
      queryParams.durationMax = durationNum + 10;
    }

    // Get recommended workouts with scoring
    const recommendedWorkoutsResult = await sql`
      WITH workout_scores AS (
        SELECT 
          w.*,
          -- Base score starts at 50
          50 as base_score,
          -- Bonus for matching user's fitness level
          CASE 
            WHEN w.difficulty = ${preferredDifficulty} THEN 20
            WHEN w.difficulty = 'intermediate' AND ${preferredDifficulty} IN ('beginner', 'advanced') THEN 10
            ELSE 0
          END as difficulty_score,
          -- Bonus for matching preferred duration (within 15 minutes)
          CASE 
            WHEN ABS(w.estimated_duration_minutes - ${preferredDuration}) <= 15 THEN 15
            WHEN ABS(w.estimated_duration_minutes - ${preferredDuration}) <= 30 THEN 8
            ELSE 0
          END as duration_score,
          -- Bonus for popular categories from user history
          CASE 
            WHEN w.category = ANY(${topCategories.length > 0 ? topCategories : ['strength']}) THEN 15
            ELSE 0
          END as category_score,
          -- Penalty for recent completion
          CASE 
            WHEN w.id = ANY(${recentWorkoutIds.length > 0 ? recentWorkoutIds : [0]}) THEN -30
            ELSE 0
          END as recency_penalty,
          -- Bonus for variety (different categories than recent ones)
          CASE 
            WHEN w.category NOT IN (
              SELECT DISTINCT category 
              FROM user_workouts uw2 
              JOIN workouts w2 ON uw2.workout_id = w2.id 
              WHERE uw2.user_id = ${userId} 
                AND uw2.completed_at >= NOW() - INTERVAL '3 days'
              LIMIT 5
            ) THEN 10
            ELSE 0
          END as variety_score,
          -- Random factor for discovery
          (RANDOM() * 10)::int as random_score
        FROM workouts w
        WHERE w.id > 0
          ${category ? sql`AND w.category = ${category}` : sql``}
          ${difficulty ? sql`AND w.difficulty = ${difficulty}` : sql``}
          ${duration ? sql`AND w.estimated_duration_minutes BETWEEN ${Math.max(parseInt(duration) - 10, 5)} AND ${parseInt(duration) + 10}` : sql``}
          ${recentWorkoutIds.length > 0 ? sql`AND w.id NOT IN (${recentWorkoutIds})` : sql``}
      )
      SELECT 
        *,
        (base_score + difficulty_score + duration_score + category_score + recency_penalty + variety_score + random_score) as total_score
      FROM workout_scores
      ORDER BY total_score DESC, created_at DESC
      LIMIT ${Math.min(limit, 20)}
    `;

    // Get exercise details for each recommended workout
    const workoutIds = recommendedWorkoutsResult.map(w => w.id);
    let workoutExercises: any[] = [];

    if (workoutIds.length > 0) {
      workoutExercises = await sql`
        SELECT 
          we.workout_id,
          COUNT(we.id) as exercise_count,
          array_agg(DISTINCT e.category) as exercise_categories,
          array_agg(DISTINCT e.equipment) as equipment_needed
        FROM workout_exercises we
        JOIN exercises e ON we.exercise_id = e.id
        WHERE we.workout_id = ANY(${workoutIds})
        GROUP BY we.workout_id
      `;
    }

    // Create exercise map for quick lookup
    const exerciseMap = new Map();
    workoutExercises.forEach(ex => {
      exerciseMap.set(ex.workout_id, {
        exerciseCount: ex.exercise_count,
        exerciseCategories: ex.exercise_categories.flat(),
        equipmentNeeded: ex.equipment_needed.flat().filter(Boolean)
      });
    });

    // Enhance recommendations with additional data
    const enhancedRecommendations = recommendedWorkoutsResult.map(workout => {
      const exerciseData = exerciseMap.get(workout.id) || {
        exerciseCount: 0,
        exerciseCategories: [],
        equipmentNeeded: []
      };

      return {
        id: workout.id,
        title: workout.title,
        description: workout.description,
        difficulty: workout.difficulty,
        category: workout.category,
        estimatedDuration: workout.estimated_duration_minutes,
        equipmentNeeded: workout.equipment_needed || [],
        exerciseCount: exerciseData.exerciseCount,
        exerciseCategories: exerciseData.exerciseCategories,
        createdAt: workout.created_at,
        recommendationScore: workout.total_score,
        reasons: getRecommendationReasons(workout, userData, userHistoryResult)
      };
    });

    // Get user's weekly progress for context
    const weeklyProgressResult = await sql`
      SELECT COUNT(*) as workouts_this_week
      FROM user_workouts
      WHERE user_id = ${userId} 
        AND completed_at IS NOT NULL
        AND completed_at >= DATE_TRUNC('week', NOW())
    `;

    const weeklyProgress = weeklyProgressResult[0]?.workouts_this_week || 0;
    const weeklyGoal = userData.weekly_workout_goal || 3;

    return NextResponse.json({
      success: true,
      data: {
        recommendations: enhancedRecommendations,
        context: {
          userFitnessLevel: userData.fitness_level || 'intermediate',
          preferredDuration: userData.preferred_workout_duration || 30,
          weeklyProgress: {
            completed: weeklyProgress,
            goal: weeklyGoal,
            remaining: Math.max(weeklyGoal - weeklyProgress, 0)
          },
          topCategories,
          hasHistory: userHistoryResult.length > 0
        }
      }
    });

  } catch (error) {
    console.error('Error generating workout recommendations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'server_error', 
          message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

function getRecommendationReasons(workout: any, userData: any, userHistory: any[]): string[] {
  const reasons: string[] = [];

  // Match fitness level
  if (workout.difficulty === userData.fitness_level) {
    reasons.push(`Matches your ${workout.difficulty} fitness level`);
  } else if (workout.difficulty === 'intermediate' && userData.fitness_level === 'beginner') {
    reasons.push('Perfect next step to challenge yourself');
  } else if (workout.difficulty === 'advanced' && userData.fitness_level === 'intermediate') {
    reasons.push('Ready for the next level');
  }

  // Duration matching
  const preferredDuration = userData.preferred_workout_duration || 30;
  if (Math.abs(workout.estimated_duration_minutes - preferredDuration) <= 5) {
    reasons.push('Perfect duration for your schedule');
  } else if (workout.estimated_duration_minutes < preferredDuration) {
    reasons.push('Quick workout option');
  }

  // Category popularity
  const popularCategories = userHistory.map(h => h.category);
  if (popularCategories.includes(workout.category)) {
    reasons.push(`You enjoy ${workout.category} workouts`);
  }

  // Variety
  const recentCategories = userHistory.slice(0, 3).map(h => h.category);
  if (!recentCategories.includes(workout.category)) {
    reasons.push('Try something new');
  }

  // High score
  if (workout.total_score >= 80) {
    reasons.push('Highly recommended for you');
  }

  return reasons.slice(0, 2); // Limit to top 2 reasons
}
