'use client';
// Prevent prerendering of dashboard pages
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface CompletionStats {
  userWorkoutId: number;
  durationMinutes: number;
  totalWorkouts: number;
  newAchievements: Array<{
    id: number;
    name: string;
    description: string;
    icon: string;
  }>;
  workout: {
    id: number;
    title: string;
    difficulty: string;
  };
}

function WorkoutCompleteContent() {
  const { user, neonUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [completionStats, setCompletionStats] = useState<CompletionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  const userWorkoutId = searchParams.get('userWorkoutId');
  const duration = parseInt(searchParams.get('duration') || '0');
  const notes = searchParams.get('notes');

  const loadCompletionStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/workouts/completion-stats?userWorkoutId=${userWorkoutId}`);
      const result = await response.json();

      if (result.success) {
        setCompletionStats({
          userWorkoutId: parseInt(userWorkoutId!),
          durationMinutes: duration,
          totalWorkouts: result.data.totalWorkouts,
          newAchievements: result.data.newAchievements || [],
          workout: result.data.workout
        });
      }
    } catch (error) {
      console.error('Error loading completion stats:', error);
    } finally {
      setLoading(false);
    }
  }, [userWorkoutId, duration]);

  useEffect(() => {
    if (userWorkoutId && user && neonUser) {
      loadCompletionStats();
      // Hide confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [userWorkoutId, user, neonUser, loadCompletionStats]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="glass-card p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="text-lg font-medium">Loading completion stats...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-10">
          <div className="confetti-container">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 relative z-20">
        {/* Main Completion Card */}
        <div className="glass-card p-12 text-center mb-8">
          <div className="text-green-500 mb-6">
            <svg className="w-24 h-24 mx-auto animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-5xl font-bold text-gradient mb-4">
            Workout Complete!
          </h1>

          {completionStats && (
            <>
              <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8">
                Congratulations on completing "{completionStats.workout.title}"
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Duration */}
                <div className="glass-subtle p-6 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatDuration(completionStats.durationMinutes)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Workout Duration
                  </div>
                </div>

                {/* Total Workouts */}
                <div className="glass-subtle p-6 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {completionStats.totalWorkouts}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Workouts
                  </div>
                </div>

                {/* Difficulty */}
                <div className="glass-subtle p-6 rounded-lg">
                  <span className={`px-4 py-2 rounded-full text-lg font-medium ${getDifficultyColor(completionStats.workout.difficulty)}`}>
                    {completionStats.workout.difficulty}
                  </span>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Difficulty Level
                  </div>
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <div className="glass-subtle p-6 rounded-lg mb-8 text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Your Notes</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {decodeURIComponent(notes)}
                  </p>
                </div>
              )}

              {/* New Achievements */}
              {completionStats.newAchievements.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                    🏆 New Achievements Unlocked!
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completionStats.newAchievements.map((achievement) => (
                      <div key={achievement.id} className="glass-card p-6 text-center animate-pulse">
                        <div className="text-4xl mb-3">{achievement.icon}</div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {achievement.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="accent-button px-8 py-4 text-lg font-semibold"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push('/dashboard/workouts')}
              className="glass-button px-8 py-4 text-lg font-semibold"
            >
              More Workouts
            </button>
            <button
              onClick={() => router.push('/dashboard/achievements')}
              className="glass-button px-8 py-4 text-lg font-semibold"
            >
              View Achievements
            </button>
          </div>
        </div>

        {/* Motivational Section */}
        <div className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Keep Up the Great Work! 💪
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Every workout brings you closer to your fitness goals. Consistency is key, and you're building amazing habits!
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <div className="glass-subtle px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">💯 Great job!</span>
            </div>
            <div className="glass-subtle px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">🔥 You're on fire!</span>
            </div>
            <div className="glass-subtle px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">⚡ Keep it up!</span>
            </div>
            <div className="glass-subtle px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">🌟 You're a star!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #8B5CF6;
          animation: confetti-fall 3s linear infinite;
        }

        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function WorkoutCompletePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-96">
      <div className="glass-card p-8">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="text-lg font-medium">Loading...</span>
        </div>
      </div>
    </div>}>
      <WorkoutCompleteContent />
    </Suspense>
  );
}
