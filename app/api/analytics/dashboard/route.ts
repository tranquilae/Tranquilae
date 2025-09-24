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
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range
    const now = new Date();
    const getDaysAgo = (days: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() - days);
      return date;
    };

    let startDate: Date;
    switch (timeRange) {
      case '7d':
        startDate = getDaysAgo(7);
        break;
      case '30d':
        startDate = getDaysAgo(30);
        break;
      case '90d':
        startDate = getDaysAgo(90);
        break;
      case '1y':
        startDate = getDaysAgo(365);
        break;
      default:
        startDate = getDaysAgo(30);
    }

    const sql = getNeonClient();

    // Get user from Neon DB
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

    const userId = neonUserResult[0]!['id'];

    // Get workout statistics
    const workoutStatsResult = await sql`
      SELECT 
        COUNT(DISTINCT uw.id) as total_workouts,
        COALESCE(SUM(uw.duration_minutes), 0) as total_duration,
        COALESCE(SUM(uw.calories_burned), 0) as calories_burned,
        COALESCE(AVG(uw.avg_heart_rate), 0) as avg_heart_rate,
        COUNT(DISTINCT DATE(uw.completed_at)) as streak_days,
        up.weekly_workout_goal,
        COUNT(CASE WHEN uw.completed_at >= DATE_TRUNC('week', NOW()) THEN 1 END) as weekly_progress
      FROM user_workouts uw
      LEFT JOIN user_preferences up ON up.user_id = ${userId}
      WHERE uw.user_id = ${userId} 
        AND uw.completed_at IS NOT NULL
        AND uw.completed_at >= ${startDate.toISOString()}
      GROUP BY up.weekly_workout_goal
    `;

    const workoutStats = workoutStatsResult[0] || {
      total_workouts: 0,
      total_duration: 0,
      calories_burned: 0,
      avg_heart_rate: 0,
      streak_days: 0,
      weekly_workout_goal: 4,
      weekly_progress: 0
    };

    // Get daily progress data
    const progressDataResult = await sql`
      WITH date_series AS (
        SELECT generate_series(
          ${startDate.toISOString()}::date,
          ${now.toISOString()}::date,
          '1 day'::interval
        )::date as date
      ),
      daily_stats AS (
        SELECT 
          DATE(uw.completed_at) as workout_date,
          COUNT(DISTINCT uw.id) as workouts,
          COALESCE(SUM(uw.duration_minutes), 0) as duration,
          COALESCE(SUM(uw.calories_burned), 0) as calories,
          AVG(hw.weight) as weight,
          AVG(ci.mood_score) as mood
        FROM user_workouts uw
        LEFT JOIN health_metrics hw ON hw.user_id = uw.user_id AND DATE(hw.recorded_at) = DATE(uw.completed_at)
        LEFT JOIN check_ins ci ON ci.user_id = uw.user_id AND DATE(ci.created_at) = DATE(uw.completed_at)
        WHERE uw.user_id = ${userId} 
          AND uw.completed_at IS NOT NULL
          AND uw.completed_at >= ${startDate.toISOString()}
        GROUP BY DATE(uw.completed_at)
      )
      SELECT 
        ds.date,
        COALESCE(dst.workouts, 0) as workouts,
        COALESCE(dst.duration, 0) as duration,
        COALESCE(dst.calories, 0) as calories,
        dst.weight,
        dst.mood
      FROM date_series ds
      LEFT JOIN daily_stats dst ON ds.date = dst.workout_date
      ORDER BY ds.date
    `;

    // Get workout distribution by category
    const workoutDistributionResult = await sql`
      SELECT 
        w.category,
        COUNT(uw.id) as count,
        SUM(uw.duration_minutes) as duration,
        SUM(uw.calories_burned) as calories,
        CASE w.category
          WHEN 'strength' THEN '#7c3aed'
          WHEN 'cardio' THEN '#f59e0b'
          WHEN 'yoga' THEN '#10b981'
          WHEN 'flexibility' THEN '#3b82f6'
          WHEN 'hiit' THEN '#ef4444'
          ELSE '#6b7280'
        END as color
      FROM user_workouts uw
      JOIN workouts w ON w.id = uw.workout_id
      WHERE uw.user_id = ${userId} 
        AND uw.completed_at IS NOT NULL
        AND uw.completed_at >= ${startDate.toISOString()}
      GROUP BY w.category
      ORDER BY count DESC
    `;

    // Get performance metrics with trends
    const performanceMetricsResult = await sql`
      WITH current_period AS (
        SELECT 
          'Avg Duration' as metric,
          AVG(uw.duration_minutes) as current_value
        FROM user_workouts uw
        WHERE uw.user_id = ${userId} 
          AND uw.completed_at >= ${startDate.toISOString()}
          AND uw.completed_at IS NOT NULL
        UNION ALL
        SELECT 
          'Avg Calories',
          AVG(uw.calories_burned)
        FROM user_workouts uw
        WHERE uw.user_id = ${userId} 
          AND uw.completed_at >= ${startDate.toISOString()}
          AND uw.completed_at IS NOT NULL
        UNION ALL
        SELECT 
          'Avg Heart Rate',
          AVG(uw.avg_heart_rate)
        FROM user_workouts uw
        WHERE uw.user_id = ${userId} 
          AND uw.completed_at >= ${startDate.toISOString()}
          AND uw.completed_at IS NOT NULL
          AND uw.avg_heart_rate > 0
        UNION ALL
        SELECT 
          'Weekly Frequency',
          COUNT(*) / GREATEST(1, EXTRACT(EPOCH FROM (${now.toISOString()}::date - ${startDate.toISOString()}::date)) / 604800)
        FROM user_workouts uw
        WHERE uw.user_id = ${userId} 
          AND uw.completed_at >= ${startDate.toISOString()}
          AND uw.completed_at IS NOT NULL
      ),
      previous_period AS (
        SELECT 
          'Avg Duration' as metric,
          AVG(uw.duration_minutes) as previous_value
        FROM user_workouts uw
        WHERE uw.user_id = ${userId} 
          AND uw.completed_at >= ${new Date(startDate.getTime() - (now.getTime() - startDate.getTime())).toISOString()}
          AND uw.completed_at < ${startDate.toISOString()}
          AND uw.completed_at IS NOT NULL
        UNION ALL
        SELECT 
          'Avg Calories',
          AVG(uw.calories_burned)
        FROM user_workouts uw
        WHERE uw.user_id = ${userId} 
          AND uw.completed_at >= ${new Date(startDate.getTime() - (now.getTime() - startDate.getTime())).toISOString()}
          AND uw.completed_at < ${startDate.toISOString()}
          AND uw.completed_at IS NOT NULL
        UNION ALL
        SELECT 
          'Avg Heart Rate',
          AVG(uw.avg_heart_rate)
        FROM user_workouts uw
        WHERE uw.user_id = ${userId} 
          AND uw.completed_at >= ${new Date(startDate.getTime() - (now.getTime() - startDate.getTime())).toISOString()}
          AND uw.completed_at < ${startDate.toISOString()}
          AND uw.completed_at IS NOT NULL
          AND uw.avg_heart_rate > 0
        UNION ALL
        SELECT 
          'Weekly Frequency',
          COUNT(*) / GREATEST(1, EXTRACT(EPOCH FROM (${startDate.toISOString()}::date - ${new Date(startDate.getTime() - (now.getTime() - startDate.getTime())).toISOString()}::date)) / 604800)
        FROM user_workouts uw
        WHERE uw.user_id = ${userId} 
          AND uw.completed_at >= ${new Date(startDate.getTime() - (now.getTime() - startDate.getTime())).toISOString()}
          AND uw.completed_at < ${startDate.toISOString()}
          AND uw.completed_at IS NOT NULL
      )
      SELECT 
        cp.metric,
        COALESCE(cp.current_value, 0) as current,
        COALESCE(pp.previous_value, 0) as previous,
        CASE cp.metric
          WHEN 'Avg Duration' THEN 45
          WHEN 'Avg Calories' THEN 400
          WHEN 'Avg Heart Rate' THEN 140
          WHEN 'Weekly Frequency' THEN 4
        END as target
      FROM current_period cp
      LEFT JOIN previous_period pp ON cp.metric = pp.metric
    `;

    // Get recent achievements
    const achievementsResult = await sql`
      SELECT 
        ua.id,
        a.title,
        a.description,
        a.icon,
        a.category,
        ua.unlocked_at
      FROM user_achievements ua
      JOIN achievements a ON a.id = ua.achievement_id
      WHERE ua.user_id = ${userId}
        AND ua.unlocked_at >= ${startDate.toISOString()}
      ORDER BY ua.unlocked_at DESC
      LIMIT 10
    `;

    // Get social stats
    const socialStatsResult = await sql`
      WITH user_stats AS (
        SELECT 
          COUNT(DISTINCT f.id) as friends_count,
          COUNT(DISTINCT ws.id) as shares_count,
          COUNT(DISTINCT wl.id) as likes_received,
          COALESCE(SUM(uw.duration_minutes), 0) + COALESCE(COUNT(DISTINCT ua.id), 0) * 10 as user_score
        FROM users u
        LEFT JOIN friendships f ON (f.user_id = ${userId} OR f.friend_id = ${userId}) AND f.status = 'accepted'
        LEFT JOIN workout_shares ws ON ws.user_id = ${userId}
        LEFT JOIN workout_likes wl ON wl.workout_share_id IN (SELECT id FROM workout_shares WHERE user_id = ${userId})
        LEFT JOIN user_workouts uw ON uw.user_id = ${userId} AND uw.completed_at >= ${startDate.toISOString()}
        LEFT JOIN user_achievements ua ON ua.user_id = ${userId}
        WHERE u.id = ${userId}
      ),
      leaderboard AS (
        SELECT 
          u.id,
          u.full_name as name,
          u.avatar_url,
          COALESCE(SUM(uw.duration_minutes), 0) + COALESCE(COUNT(DISTINCT ua.id), 0) * 10 as score,
          RANK() OVER (ORDER BY COALESCE(SUM(uw.duration_minutes), 0) + COALESCE(COUNT(DISTINCT ua.id), 0) * 10 DESC) as rank
        FROM users u
        LEFT JOIN user_workouts uw ON uw.user_id = u.id AND uw.completed_at >= ${startDate.toISOString()}
        LEFT JOIN user_achievements ua ON ua.user_id = u.id
        WHERE EXISTS (
          SELECT 1 FROM friendships f 
          WHERE (f.user_id = ${userId} AND f.friend_id = u.id) 
             OR (f.friend_id = ${userId} AND f.user_id = u.id)
          AND f.status = 'accepted'
        ) OR u.id = ${userId}
        GROUP BY u.id, u.full_name, u.avatar_url
        ORDER BY score DESC
        LIMIT 10
      )
      SELECT 
        us.*,
        COALESCE(
          (SELECT rank FROM leaderboard WHERE id = ${userId}), 
          (SELECT COUNT(*) + 1 FROM users WHERE id != ${userId})
        ) as user_rank,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'rank', l.rank,
            'name', l.name,
            'score', l.score,
            'avatar', COALESCE(l.avatar_url, '')
          ) ORDER BY l.rank
        ) as leaderboard
      FROM user_stats us, leaderboard l
      GROUP BY us.friends_count, us.shares_count, us.likes_received, us.user_score
    `;

    const socialStats = socialStatsResult[0] || {
      'friends_count': 0,
      'shares_count': 0,
      'likes_received': 0,
      'user_rank': 1,
      'leaderboard': []
    };

    const analyticsData = {
      workoutStats: {
        totalWorkouts: parseInt(workoutStats['total_workouts']) || 0,
        totalDuration: parseInt(workoutStats['total_duration']) || 0,
        caloriesBurned: parseInt(workoutStats['calories_burned']) || 0,
        avgHeartRate: Math.round(parseFloat(workoutStats['avg_heart_rate'])) || 0,
        streak: parseInt(workoutStats['streak_days']) || 0,
        weeklyGoal: parseInt(workoutStats['weekly_workout_goal']) || 4,
        weeklyProgress: parseInt(workoutStats['weekly_progress']) || 0,
      },
      progressData: progressDataResult.map(row => ({
        date: row['date'],
        workouts: parseInt(row['workouts']) || 0,
        duration: parseInt(row['duration']) || 0,
        calories: parseInt(row['calories']) || 0,
        weight: row['weight'] ? parseFloat(row['weight']) : undefined,
        mood: row['mood'] ? parseFloat(row['mood']) : undefined,
      })),
      workoutDistribution: workoutDistributionResult.map(row => ({
        category: row['category'],
        count: parseInt(row['count']) || 0,
        duration: parseInt(row['duration']) || 0,
        calories: parseInt(row['calories']) || 0,
        color: row['color'],
      })),
      performanceMetrics: performanceMetricsResult.map(row => ({
        metric: row['metric'],
        current: parseFloat(row['current']) || 0,
        previous: parseFloat(row['previous']) || 0,
        target: parseFloat(row['target']) || 0,
        trend: parseFloat(row['current']) > parseFloat(row['previous']) ? 'up' : 
               parseFloat(row['current']) < parseFloat(row['previous']) ? 'down' : 'stable',
      })),
      achievements: achievementsResult.map(row => ({
        id: row['id'],
        title: row['title'],
        description: row['description'],
        unlockedAt: row['unlocked_at'],
        category: row['category'],
        icon: row['icon'],
      })),
      socialStats: {
        friendsCount: parseInt(socialStats['friends_count']) || 0,
        sharesCount: parseInt(socialStats['shares_count']) || 0,
        likesReceived: parseInt(socialStats['likes_received']) || 0,
        rank: parseInt(socialStats['user_rank']) || 1,
        leaderboard: socialStats['leaderboard'] || [],
      },
    };

    return NextResponse.json({
      success: true,
      data: analyticsData,
      timeRange,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'internal_error', 
          message: 'Failed to generate analytics dashboard' 
        } 
      },
      { status: 500 }
    );
  }
}

