'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  estimatedDuration: number;
  equipmentNeeded: string[];
  exerciseCount: number;
  exerciseCategories: string[];
  recommendationScore: number;
  reasons: string[];
}

interface RecommendationContext {
  userFitnessLevel: string;
  preferredDuration: number;
  weeklyProgress: {
    completed: number;
    goal: number;
    remaining: number;
  };
  topCategories: string[];
  hasHistory: boolean;
}

interface WorkoutRecommendationsProps {
  limit?: number;
  filters?: {
    difficulty?: string;
    category?: string;
    duration?: number;
  };
  onWorkoutSelect?: (workoutId: number) => void;
}

export function WorkoutRecommendations({ 
  limit = 6, 
  filters = {}, 
  onWorkoutSelect 
}: WorkoutRecommendationsProps) {
  const { user, neonUser } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [context, setContext] = useState<RecommendationContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && neonUser) {
      loadRecommendations();
    }
  }, [user, neonUser, filters]);

  const loadRecommendations = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.category && { category: filters.category }),
        ...(filters.duration && { duration: filters.duration.toString() })
      });

      const response = await fetch(`/api/workouts/recommendations?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load recommendations');
      }

      setRecommendations(result.data.recommendations);
      setContext(result.data.context);
      setError(null);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadRecommendations(true);
  };

  const handleWorkoutClick = (workoutId: number) => {
    if (onWorkoutSelect) {
      onWorkoutSelect(workoutId);
    } else {
      window.location.href = `/dashboard/workouts/${workoutId}`;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recommended for You</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span>Loading recommendations...</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Unable to Load Recommendations
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button 
          onClick={handleRefresh}
          className="accent-button px-4 py-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Context */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {context?.hasHistory ? 'Recommended for You' : 'Start Your Fitness Journey'}
          </h2>
          {context && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {context.weeklyProgress.remaining > 0 
                ? `${context.weeklyProgress.remaining} more workouts to reach your weekly goal`
                : 'You\'ve achieved your weekly workout goal! Keep it up!'
              }
            </p>
          )}
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="glass-button px-4 py-2 flex items-center space-x-2"
        >
          <svg 
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Weekly Progress Bar */}
      {context && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Weekly Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {context.weeklyProgress.completed} / {context.weeklyProgress.goal} workouts
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((context.weeklyProgress.completed / context.weeklyProgress.goal) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      {recommendations.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No recommendations available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your filters or completing more workouts to get personalized recommendations.
          </p>
          <button
            onClick={handleRefresh}
            className="accent-button px-4 py-2"
          >
            Refresh Recommendations
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((workout, index) => (
            <div 
              key={workout.id} 
              className="glass-card p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => handleWorkoutClick(workout.id)}
            >
              {/* Recommendation Badge */}
              {index === 0 && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    TOP PICK
                  </div>
                </div>
              )}
              
              {/* Workout Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-purple-600 transition-colors">
                  {workout.title}
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(workout.difficulty)}`}>
                    {workout.difficulty}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                    {workout.category}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                    {formatDuration(workout.estimatedDuration)}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3 line-clamp-2">
                  {workout.description}
                </p>
              </div>

              {/* Workout Details */}
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {workout.exerciseCount} exercises
                </div>

                {workout.equipmentNeeded.length > 0 && (
                  <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                    </svg>
                    <span className="line-clamp-1">
                      {workout.equipmentNeeded.slice(0, 3).join(', ')}
                      {workout.equipmentNeeded.length > 3 && ` +${workout.equipmentNeeded.length - 3} more`}
                    </span>
                  </div>
                )}

                {/* Recommendation Reasons */}
                {workout.reasons.length > 0 && (
                  <div className="pt-3 border-t border-glass-border">
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                      Why we recommend this:
                    </div>
                    <div className="space-y-1">
                      {workout.reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <div className="w-1 h-1 bg-purple-400 rounded-full mr-2 flex-shrink-0"></div>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-glass-border">
                <button className="w-full accent-button py-2 text-sm font-medium group-hover:bg-purple-700 transition-colors">
                  Start Workout
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Additional Context */}
      {context?.topCategories && context.topCategories.length > 0 && (
        <div className="glass-card p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-100">Your favorite workout types:</span>
            {' '}{context.topCategories.slice(0, 3).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
