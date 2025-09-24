import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getNeonClient } from '@/lib/neonClient';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { userWorkoutId, durationMinutes, notes } = body;

    if (!userWorkoutId) {
      return NextResponse.json(
        { success: false, error: { code: 'missing_data', message: 'Missing user workout ID' } },
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

    const userId = neonUserResult[0].id;

    // Verify that the user_workout belongs to the current user and is not already completed
    const userWorkoutResult = await sql`
      SELECT uw.id, uw.user_id, uw.workout_id, uw.started_at, uw.completed_at, w.title, w.difficulty
      FROM user_workouts uw
      JOIN workouts w ON uw.workout_id = w.id
      WHERE uw.id = ${userWorkoutId} AND uw.user_id = ${userId}
    `;

    if (userWorkoutResult.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized_workout', message: 'Workout session not found or unauthorized' } },
        { status: 403 }
      );
    }

    const userWorkout = userWorkoutResult[0];

    if (userWorkout.completed_at) {
      return NextResponse.json(
        { success: false, error: { code: 'already_completed', message: 'Workout is already completed' } },
        { status: 400 }
      );
    }

    // Complete the workout
    const completionResult = await sql`
      UPDATE user_workouts
      SET 
        completed_at = CURRENT_TIMESTAMP,
        duration_minutes = ${durationMinutes || null},
        notes = ${notes || null}
      WHERE id = ${userWorkoutId}
      RETURNING completed_at
    `;

    const completedAt = completionResult[0].completed_at;

    // Check and award milestone-based achievements
    try {
      // Total workout count achievements
      const totalWorkoutsResult = await sql`
        SELECT COUNT(*)::int as total_workouts
        FROM user_workouts
        WHERE user_id = ${userId} AND completed_at IS NOT NULL
      `;

      const totalWorkouts = totalWorkoutsResult[0].total_workouts;

      // Check for workout count milestones
      const workoutMilestones = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
      const milestoneAchievements = await sql`
        SELECT a.id, a.name, a.description, a.trigger_count
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ${userId}
        WHERE a.trigger_type = 'workout_completion'
          AND a.trigger_count = ANY(${workoutMilestones})
          AND a.trigger_count <= ${totalWorkouts}
          AND ua.id IS NULL
      `;

      // Award milestone achievements
      for (const achievement of milestoneAchievements) {
        await sql`
          INSERT INTO user_achievements (user_id, achievement_id, earned_at)
          VALUES (${userId}, ${achievement.id}, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id, achievement_id) DO NOTHING
        `;
      }

      // Check for streak achievements
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

      // Check for streak milestones
      const streakMilestones = [3, 7, 14, 30, 60, 100];
      const streakAchievements = await sql`
        SELECT a.id, a.name, a.description, a.trigger_count
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ${userId}
        WHERE a.trigger_type = 'streak'
          AND a.trigger_count = ANY(${streakMilestones})
          AND a.trigger_count <= ${currentStreak}
          AND ua.id IS NULL
      `;

      // Award streak achievements
      for (const achievement of streakAchievements) {
        await sql`
          INSERT INTO user_achievements (user_id, achievement_id, earned_at)
          VALUES (${userId}, ${achievement.id}, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id, achievement_id) DO NOTHING
        `;
      }

      // Check for difficulty-based achievements
      if (userWorkout.difficulty) {
        const difficultyAchievements = await sql`
          SELECT a.id, a.name, a.description
          FROM achievements a
          LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ${userId}
          WHERE a.trigger_type = 'difficulty_completion'
            AND a.difficulty_filter = ${userWorkout.difficulty}
            AND ua.id IS NULL
        `;

        for (const achievement of difficultyAchievements) {
          await sql`
            INSERT INTO user_achievements (user_id, achievement_id, earned_at)
            VALUES (${userId}, ${achievement.id}, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, achievement_id) DO NOTHING
          `;
        }
      }

    } catch (achievementError) {
      console.warn('Failed to process achievements:', achievementError);
      // Don't fail the workout completion if achievements fail
    }

    return NextResponse.json({
      success: true,
      data: {
        userWorkoutId,
        completedAt,
        totalWorkouts: await sql`
          SELECT COUNT(*)::int as count
          FROM user_workouts
          WHERE user_id = ${userId} AND completed_at IS NOT NULL
        `.then(r => r[0].count),
        workout: {
          id: userWorkout.workout_id,
          title: userWorkout.title,
          difficulty: userWorkout.difficulty
        }
      }
    });

  } catch (error) {
    console.error('Error completing workout:', error);
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
