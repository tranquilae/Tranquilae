'use client';
// Prevent prerendering of dashboard pages
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getNeonClient } from '@/lib/neonClient';

interface Achievement {
  id: number;
  key: string;
  title: string;
  description: string;
  criteria: any;
  created_at: string;
}

interface UserAchievement {
  id: number;
  achievement_id: number;
  awarded_at: string;
  achievement: Achievement;
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const sql = getNeonClient();
      
      // Load all achievements
      const allAchievements = await sql`
        SELECT id, key, title, description, criteria, created_at
        FROM achievements 
        ORDER BY title ASC
      `;
      
      // Load user's earned achievements
      const earned = await sql`
        SELECT ua.id, ua.achievement_id, ua.awarded_at, 
               a.key, a.title, a.description, a.criteria, a.created_at
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.supabase_user_id = ${user.id}
        ORDER BY ua.awarded_at DESC
      `;

      setAchievements(allAchievements as Achievement[]);
      setUserAchievements(earned.map(item => ({
        id: item?.['id'],
        achievement_id: item?.['achievement_id'],
        awarded_at: item?.['awarded_at'],
        achievement: {
          id: item?.['achievement_id'],
          key: item?.['key'],
          title: item?.['title'],
          description: item?.['description'],
          criteria: item?.['criteria'],
          created_at: item?.['created_at']
        }
      })) as UserAchievement[]);
    } catch (err) {
      console.error('Error loading achievements:', err);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user, loadAchievements]);


  const isEarned = (achievementId: number) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getAchievementIcon = (key: string, earned: boolean) => {
    const baseClasses = `w-8 h-8 ${earned ? 'text-yellow-500' : 'text-gray-400'}`;
    
    switch (key) {
      case 'first_workout':
        return (
          <svg className={baseClasses} fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'week_warrior':
        return (
          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'early_bird':
        return (
          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'consistency_king':
        return (
          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'explorer_badge':
        return (
          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="glass-card p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="text-lg font-medium">Loading achievements...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Achievements
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={loadAchievements}
            className="accent-button px-4 py-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const earnedCount = userAchievements.length;
  const totalCount = achievements.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">Achievements</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track your progress and unlock rewards as you reach new milestones
        </p>
      </div>

      {/* Progress Overview */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Progress</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {earnedCount} of {totalCount} earned
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <div 
            className="h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{earnedCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Achievements Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalCount - earnedCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">To Unlock</div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {userAchievements.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Achievements</h2>
          <div className="space-y-3">
            {userAchievements.slice(0, 3).map((ua) => (
              <div key={ua.id} className="flex items-center space-x-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                {getAchievementIcon(ua.achievement.key, true)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {ua.achievement.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Earned on {formatDate(ua.awarded_at)}
                  </p>
                </div>
                <div className="text-yellow-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Achievements */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Achievements</h2>
        
        {achievements.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No achievements available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Achievements will appear here once they're added to the database.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => {
              const earned = isEarned(achievement.id);
              const earnedDate = userAchievements.find(ua => ua.achievement_id === achievement.id);
              
              return (
                <div 
                  key={achievement.id} 
                  className={`glass-card p-6 transition-all duration-200 ${
                    earned ? 'ring-2 ring-purple-200 dark:ring-purple-800' : 'opacity-75'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-xl ${earned ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      {getAchievementIcon(achievement.key, earned)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`font-semibold ${earned ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {achievement.title}
                      </h3>
                      <p className={`text-sm mt-1 ${earned ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        {achievement.description}
                      </p>
                      
                      {earned && earnedDate && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✓ Earned {formatDate(earnedDate.awarded_at)}
                          </span>
                        </div>
                      )}
                      
                      {!earned && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            🔒 Not yet earned
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
