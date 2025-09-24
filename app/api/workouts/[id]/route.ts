import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getNeonClient } from '@/lib/neonClient';

export async function GET(
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

    // Get workout details with exercises (without user progress for preview)
    const sql = getNeonClient();
    const workoutResult = await sql`
      SELECT 
        w.id,
        w.title,
        w.description,
        w.difficulty,
        w.estimated_duration_minutes,
        w.category,
        w.equipment_needed,
        w.created_at,
        w.updated_at,
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
      GROUP BY w.id, w.title, w.description, w.difficulty, w.estimated_duration_minutes, w.category, w.equipment_needed, w.created_at, w.updated_at
    `;

    if (workoutResult.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'workout_not_found', message: 'Workout not found' } },
        { status: 404 }
      );
    }

    const workout = workoutResult[0];

    // Filter out any null exercises (in case there are workouts with no exercises)
    if (workout.exercises && workout.exercises[0] === null) {
      workout.exercises = [];
    }

    return NextResponse.json({
      success: true,
      data: workout
    });

  } catch (error) {
    console.error('Error fetching workout details:', error);
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
