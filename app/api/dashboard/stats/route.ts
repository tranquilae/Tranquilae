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
    if (!neonUser) {
      return NextResponse.json(
        { success: false, error: { code: 'user_not_found', message: 'User data not found' } },
        { status: 404 }
      );
    }
    const userId = neonUser['id'];

    // Fetch dashboard stats in parallel
    const [
      workoutStatsResult,
      achievementStatsResult,
      recentActivityResult,
      streakResult
    ] = await Promise.all([
      // Workout stats
      sql`
        SELECT 
          COUNT(*)::int as total_workouts,
          COALESCE(SUM(duration_minutes)::int, 0) as total_minutes,
          COUNT(CASE WHEN completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::int as this_week,
          COUNT(CASE WHEN completed_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::int as this_month
        FROM user_workouts 
        WHERE user_id = ${userId} AND completed_at IS NOT NULL
      `,
      
      // Achievement stats  
      sql`
        SELECT 
          COUNT(DISTINCT a.id)::int as total_achievements,
          COUNT(DISTINCT ua.achievement_id)::int as earned_achievements
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ${userId}
      `,
      
      // Recent activity (last 5 workouts)
      sql`
        SELECT 
          uw.id,
          w.title,
          w.difficulty,
          uw.duration_minutes,
          uw.completed_at
        FROM user_workouts uw
        JOIN workouts w ON uw.workout_id = w.id
        WHERE uw.user_id = ${userId} AND uw.completed_at IS NOT NULL
        ORDER BY uw.completed_at DESC
        LIMIT 5
      `,
      
      // Current streak calculation
      sql`
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
      `
    ]);

    const workoutStats = workoutStatsResult[0] || {
      total_workouts: 0,
      total_minutes: 0,
      this_week: 0,
      this_month: 0
    };

    const achievementStats = achievementStatsResult[0] || {
      total_achievements: 0,
      earned_achievements: 0
    };

    const recentActivity = recentActivityResult || [];
    const currentStreak = streakResult[0]?.['current_streak'] || 0;

    // Calculate progress percentage
    const progressPercentage = achievementStats['total_achievements'] > 0 
      ? Math.round((achievementStats['earned_achievements'] / achievementStats['total_achievements']) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userId,
          email: neonUser['email'],
          full_name: neonUser['full_name'],
          plan: neonUser['plan']
        },
        stats: {
          workouts: {
            total: workoutStats['total_workouts'],
            totalMinutes: workoutStats['total_minutes'],
            thisWeek: workoutStats['this_week'],
            thisMonth: workoutStats['this_month']
          },
          achievements: {
            total: achievementStats['total_achievements'],
            earned: achievementStats['earned_achievements'],
            progressPercentage
          },
          currentStreak,
          recentActivity: recentActivity.map(activity => ({
            id: activity['id'],
            title: activity['title'],
            difficulty: activity['difficulty'],
            duration: activity['duration_minutes'],
            completedAt: activity['completed_at']
          }))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
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

