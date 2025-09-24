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
    const userWorkoutId = searchParams.get('userWorkoutId');

    if (!userWorkoutId) {
      return NextResponse.json(
        { success: false, error: { code: 'missing_workout_id', message: 'Missing user workout ID' } },
        { status: 400 }
      );
    }

    // Get user data from Neon DB
    const sql = getNeonClient();
    const neonUserResult = await sql`
      SELECT id, email, full_name
      FROM users 
      WHERE supabase_user_id = ${user.id}
    `;

    if (neonUserResult.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'user_not_found', message: 'User not found in database' } },
        { status: 404 }
      );
    }

    const userId = neonUserResult[0]?.['id'];

    // Get workout completion details
    const workoutDetailsResult = await sql`
      SELECT 
        uw.id as user_workout_id,
        uw.completed_at,
        uw.duration_minutes,
        uw.notes,
        w.id as workout_id,
        w.title as workout_title,
        w.difficulty as workout_difficulty
      FROM user_workouts uw
      JOIN workouts w ON uw.workout_id = w.id
      WHERE uw.id = ${parseInt(userWorkoutId)} AND uw.user_id = ${userId}
    `;

    if (workoutDetailsResult.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'workout_not_found', message: 'Workout completion not found' } },
        { status: 404 }
      );
    }

    const workoutDetails = workoutDetailsResult[0];

    // Get total completed workouts count
    const totalWorkoutsResult = await sql`
      SELECT COUNT(*)::int as total_workouts
      FROM user_workouts
      WHERE user_id = ${userId} AND completed_at IS NOT NULL
    `;

    const totalWorkouts = totalWorkoutsResult[0].total_workouts;

    // Get recent achievements (earned within the last 24 hours)
    const recentAchievementsResult = await sql`
      SELECT 
        a.id,
        a.name,
        a.description,
        a.icon,
        ua.earned_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ${userId}
        AND ua.earned_at >= NOW() - INTERVAL '24 hours'
      ORDER BY ua.earned_at DESC
      LIMIT 10
    `;

    // Get current streak
    const streakResult = await sql`
      WITH workout_dates AS (
        SELECT DISTINCT DATE(completed_at) as workout_date
        FROM user_workouts 
        WHERE user_id = ${userId} AND completed_at IS NOT NULL
        ORDER BY workout_date DESC
      ),
      date_series AS (
        SELECT 
          workout_date,
          LAG(workout_date) OVER (ORDER BY workout_date DESC) as prev_date,
          ROW_NUMBER() OVER (ORDER BY workout_date DESC) as rn
        FROM workout_dates
      ),
      streak_breaks AS (
        SELECT 
          workout_date,
          rn,
          CASE 
            WHEN rn = 1 AND workout_date = CURRENT_DATE THEN 0
            WHEN rn = 1 AND workout_date = CURRENT_DATE - INTERVAL '1 day' THEN 0
            WHEN prev_date IS NOT NULL AND workout_date - prev_date > 1 THEN 1
            ELSE 0
          END as is_break
        FROM date_series
      )
      SELECT 
        COALESCE(
          (SELECT COUNT(*) FROM streak_breaks WHERE rn <= (
            SELECT MIN(rn) FROM streak_breaks WHERE is_break = 1
          ) - 1),
          (SELECT COUNT(*) FROM workout_dates)
        )::int as current_streak
    `;

    const currentStreak = streakResult[0]?.current_streak || 0;

    return NextResponse.json({
      success: true,
      data: {
        workout: {
          id: workoutDetails.workout_id,
          title: workoutDetails.workout_title,
          difficulty: workoutDetails.workout_difficulty
        },
        completion: {
          completedAt: workoutDetails.completed_at,
          durationMinutes: workoutDetails.duration_minutes,
          notes: workoutDetails.notes
        },
        totalWorkouts,
        currentStreak,
        newAchievements: recentAchievementsResult.map(achievement => ({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon || '🏆',
          earnedAt: achievement.earned_at
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching completion stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'server_error', 
          message: process.env['NODE_ENV'] === 'production' 
            ? 'Internal server error' 
            : error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

