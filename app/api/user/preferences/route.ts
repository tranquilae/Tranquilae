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

    // Get user data and preferences from Neon DB
    const sql = getNeonClient();
    const userResult = await sql`
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.plan,
        u.timezone,
        u.units_preference,
        u.created_at,
        up.notification_workouts,
        up.notification_achievements,
        up.notification_reminders,
        up.notification_email,
        up.notification_push,
        up.privacy_profile_public,
        up.privacy_workout_history_public,
        up.privacy_achievements_public,
        up.weekly_workout_goal,
        up.preferred_workout_time,
        up.preferred_workout_duration,
        up.fitness_level,
        up.workout_reminders,
        up.updated_at as preferences_updated_at
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE u.supabase_user_id = ${user.id}
    `;

    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'user_not_found', message: 'User not found in database' } },
        { status: 404 }
      );
    }

    const userData = userResult[0];

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          fullName: userData.full_name,
          plan: userData.plan,
          timezone: userData.timezone,
          unitsPreference: userData.units_preference,
          createdAt: userData.created_at
        },
        preferences: {
          notifications: {
            workouts: userData.notification_workouts ?? true,
            achievements: userData.notification_achievements ?? true,
            reminders: userData.notification_reminders ?? true,
            email: userData.notification_email ?? true,
            push: userData.notification_push ?? true
          },
          privacy: {
            profilePublic: userData.privacy_profile_public ?? false,
            workoutHistoryPublic: userData.privacy_workout_history_public ?? false,
            achievementsPublic: userData.privacy_achievements_public ?? true
          },
          fitness: {
            weeklyWorkoutGoal: userData.weekly_workout_goal ?? 3,
            preferredWorkoutTime: userData.preferred_workout_time,
            preferredWorkoutDuration: userData.preferred_workout_duration ?? 30,
            fitnessLevel: userData.fitness_level ?? 'intermediate',
            workoutReminders: userData.workout_reminders ?? true
          },
          lastUpdated: userData.preferences_updated_at
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user preferences:', error);
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
    const { user: userUpdates, preferences } = body;

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

    // Update user basic info if provided
    if (userUpdates) {
      await sql`
        UPDATE users
        SET 
          full_name = COALESCE(${userUpdates.fullName || null}, full_name),
          timezone = COALESCE(${userUpdates.timezone || null}, timezone),
          units_preference = COALESCE(${userUpdates.unitsPreference || null}, units_preference),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
      `;
    }

    // Update or insert user preferences
    if (preferences) {
      await sql`
        INSERT INTO user_preferences (
          user_id,
          notification_workouts,
          notification_achievements,
          notification_reminders,
          notification_email,
          notification_push,
          privacy_profile_public,
          privacy_workout_history_public,
          privacy_achievements_public,
          weekly_workout_goal,
          preferred_workout_time,
          preferred_workout_duration,
          fitness_level,
          workout_reminders,
          updated_at
        )
        VALUES (
          ${userId},
          ${preferences.notifications?.workouts ?? null},
          ${preferences.notifications?.achievements ?? null},
          ${preferences.notifications?.reminders ?? null},
          ${preferences.notifications?.email ?? null},
          ${preferences.notifications?.push ?? null},
          ${preferences.privacy?.profilePublic ?? null},
          ${preferences.privacy?.workoutHistoryPublic ?? null},
          ${preferences.privacy?.achievementsPublic ?? null},
          ${preferences.fitness?.weeklyWorkoutGoal ?? null},
          ${preferences.fitness?.preferredWorkoutTime || null},
          ${preferences.fitness?.preferredWorkoutDuration ?? null},
          ${preferences.fitness?.fitnessLevel || null},
          ${preferences.fitness?.workoutReminders ?? null},
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
          notification_workouts = COALESCE(EXCLUDED.notification_workouts, user_preferences.notification_workouts),
          notification_achievements = COALESCE(EXCLUDED.notification_achievements, user_preferences.notification_achievements),
          notification_reminders = COALESCE(EXCLUDED.notification_reminders, user_preferences.notification_reminders),
          notification_email = COALESCE(EXCLUDED.notification_email, user_preferences.notification_email),
          notification_push = COALESCE(EXCLUDED.notification_push, user_preferences.notification_push),
          privacy_profile_public = COALESCE(EXCLUDED.privacy_profile_public, user_preferences.privacy_profile_public),
          privacy_workout_history_public = COALESCE(EXCLUDED.privacy_workout_history_public, user_preferences.privacy_workout_history_public),
          privacy_achievements_public = COALESCE(EXCLUDED.privacy_achievements_public, user_preferences.privacy_achievements_public),
          weekly_workout_goal = COALESCE(EXCLUDED.weekly_workout_goal, user_preferences.weekly_workout_goal),
          preferred_workout_time = COALESCE(EXCLUDED.preferred_workout_time, user_preferences.preferred_workout_time),
          preferred_workout_duration = COALESCE(EXCLUDED.preferred_workout_duration, user_preferences.preferred_workout_duration),
          fitness_level = COALESCE(EXCLUDED.fitness_level, user_preferences.fitness_level),
          workout_reminders = COALESCE(EXCLUDED.workout_reminders, user_preferences.workout_reminders),
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating user preferences:', error);
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
