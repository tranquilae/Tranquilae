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

    const workoutId = parseInt(params.id);
    if (isNaN(workoutId)) {
      return NextResponse.json(
        { success: false, error: { code: 'invalid_workout_id', message: 'Invalid workout ID' } },
        { status: 400 }
      );
    }

    // Get user data from Neon DB
    const sql = getNeonClient();
    const neonUserResult = await sql`
      SELECT id, email, full_name, onboarding_completed, plan
      FROM users 
      WHERE supabase_user_id = ${user.id}
    `;

    if (neonUserResult.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'user_not_found', message: 'User not found in database' } },
        { status: 404 }
      );
    }

    const neonUser = neonUserResult[0];
    const userId = neonUser?.['id'];

    // Get workout details with exercises
    const workoutResult = await sql`
      SELECT 
        w.id,
        w.title,
        w.description,
        w.difficulty,
        w.estimated_duration_minutes,
        w.category,
        w.equipment_needed,
        json_agg(
          json_build_object(
            'id', we.id,
            'exercise_id', we.exercise_id,
            'order_in_workout', we.order_in_workout,
            'sets', we.sets,
            'reps', we.reps,
            'duration_seconds', we.duration_seconds,
            'rest_seconds', we.rest_seconds,
            'exercise_name', e.name,
            'exercise_description', e.description,
            'exercise_category', e.category,
            'muscle_groups', e.muscle_groups,
            'equipment', e.equipment,
            'difficulty_level', e.difficulty_level,
            'media_url', COALESCE(emo.media_url, e.default_media_url),
            'media_source', COALESCE(emo.source, 'default')
          ) ORDER BY we.order_in_workout
        ) as exercises
      FROM workouts w
      LEFT JOIN workout_exercises we ON w.id = we.workout_id
      LEFT JOIN exercises e ON we.exercise_id = e.id
      LEFT JOIN exercise_media_overrides emo ON e.id = emo.workout_id AND emo.active = true
      WHERE w.id = ${workoutId}
      GROUP BY w.id, w.title, w.description, w.difficulty, w.estimated_duration_minutes, w.category, w.equipment_needed
    `;

    if (workoutResult.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'workout_not_found', message: 'Workout not found' } },
        { status: 404 }
      );
    }

    const workout = workoutResult[0];

    // Check if workout is already in progress
    const existingSessionResult = await sql`
      SELECT id, started_at, completed_at
      FROM user_workouts 
      WHERE user_id = ${userId} AND workout_id = ${workoutId} AND completed_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `;

    let userWorkoutId;

    if (existingSessionResult.length > 0) {
      // Resume existing session
      userWorkoutId = existingSessionResult[0]?.['id'];
    } else {
      // Create new workout session
      const newSessionResult = await sql`
        INSERT INTO user_workouts (user_id, workout_id, started_at)
        VALUES (${userId}, ${workoutId}, CURRENT_TIMESTAMP)
        RETURNING id
      `;
      userWorkoutId = newSessionResult[0]?.['id'];
    }

    // Get exercise progress for this workout session
    const progressResult = await sql`
      SELECT 
        exercise_id,
        sets_completed,
        reps_completed,
        duration_completed_seconds,
        completed_at
      FROM user_exercise_progress
      WHERE user_workout_id = ${userWorkoutId}
    `;

    // Create progress map for easy lookup
    const progressMap = new Map();
    progressResult.forEach(p => {
      progressMap.set(p['exercise_id'], {
        setsCompleted: p['sets_completed'] || 0,
        repsCompleted: p['reps_completed'] || 0,
        durationCompleted: p['duration_completed_seconds'] || 0,
        isCompleted: !!p['completed_at']
      });
    });

    // Enhance exercises with progress data
    const enhancedExercises = workout?.['exercises']?.map((exercise: any) => ({
      ...exercise,
      progress: progressMap.get(exercise.exercise_id) || {
        setsCompleted: 0,
        repsCompleted: 0,
        durationCompleted: 0,
        isCompleted: false
      }
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        userWorkoutId,
        workout: {
          ...workout,
          exercises: enhancedExercises
        },
        isResuming: existingSessionResult.length > 0
      }
    });

  } catch (error) {
    console.error('Error starting workout:', error);
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
