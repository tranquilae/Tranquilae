import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getNeonClient } from '@/lib/neonClient';

export async function POST(request: NextRequest) {
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
    const { userWorkoutId, exerciseId, setsCompleted, repsCompleted, durationCompletedSeconds, isCompleted } = body;

    if (!userWorkoutId || !exerciseId) {
      return NextResponse.json(
        { success: false, error: { code: 'missing_data', message: 'Missing required workout and exercise IDs' } },
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

    // Verify that the user_workout belongs to the current user
    const userWorkoutResult = await sql`
      SELECT id, user_id, workout_id
      FROM user_workouts
      WHERE id = ${userWorkoutId} AND user_id = ${userId}
    `;

    if (userWorkoutResult.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized_workout', message: 'Workout session not found or unauthorized' } },
        { status: 403 }
      );
    }

    // Update or insert exercise progress
    const progressResult = await sql`
      INSERT INTO user_exercise_progress (
        user_workout_id, 
        exercise_id, 
        sets_completed, 
        reps_completed, 
        duration_completed_seconds,
        completed_at,
        updated_at
      )
      VALUES (
        ${userWorkoutId},
        ${exerciseId},
        ${setsCompleted || 0},
        ${repsCompleted || 0},
        ${durationCompletedSeconds || 0},
        ${isCompleted ? 'CURRENT_TIMESTAMP' : null},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_workout_id, exercise_id)
      DO UPDATE SET
        sets_completed = EXCLUDED.sets_completed,
        reps_completed = EXCLUDED.reps_completed,
        duration_completed_seconds = EXCLUDED.duration_completed_seconds,
        completed_at = CASE 
          WHEN ${isCompleted} THEN CURRENT_TIMESTAMP 
          ELSE user_exercise_progress.completed_at 
        END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, completed_at
    `;

    const progress = progressResult[0];

    // If exercise is completed, check if we should trigger any achievements
    if (isCompleted) {
      // Get exercise details for achievement tracking
      const exerciseResult = await sql`
        SELECT name, category, difficulty_level
        FROM exercises
        WHERE id = ${exerciseId}
      `;

      if (exerciseResult.length > 0) {
        const exercise = exerciseResult[0];
        
        // Check for category-based achievements
        const categoryAchievements = await sql`
          SELECT a.id, a.name, a.description, a.category_filter
          FROM achievements a
          LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ${userId}
          WHERE a.category_filter = ${exercise.category} 
            AND ua.id IS NULL
            AND a.trigger_type = 'exercise_completion'
        `;

        // Award any applicable achievements
        for (const achievement of categoryAchievements) {
          try {
            await sql`
              INSERT INTO user_achievements (user_id, achievement_id, earned_at)
              VALUES (${userId}, ${achievement.id}, CURRENT_TIMESTAMP)
              ON CONFLICT (user_id, achievement_id) DO NOTHING
            `;
          } catch (err) {
            console.warn(`Failed to award achievement ${achievement.id}:`, err);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        progressId: progress.id,
        completedAt: progress.completed_at,
        isCompleted: !!progress.completed_at
      }
    });

  } catch (error) {
    console.error('Error updating exercise progress:', error);
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
