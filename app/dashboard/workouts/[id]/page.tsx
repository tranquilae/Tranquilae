'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { WorkoutPlayer } from '@/components/WorkoutPlayer';
import { useRouter } from 'next/navigation';

interface WorkoutPageProps {
  params: { id: string };
}

interface WorkoutData {
  userWorkoutId?: number;
  workout: {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    estimated_duration_minutes: number;
    category: string;
    equipment_needed: string[];
    exercises: any[];
  };
  isResuming?: boolean;
}

export default function WorkoutPage({ params }: WorkoutPageProps) {
  const { user, neonUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const workoutId = parseInt(params.id);

  const loadWorkoutDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/workouts/${workoutId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load workout');
      }

      setWorkoutData({ workout: result.data });
    } catch (err) {
      console.error('Error loading workout:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workout');
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    if (user && neonUser && !authLoading) {
      loadWorkoutDetails();
    }
  }, [user, neonUser, authLoading, workoutId, loadWorkoutDetails]);

  const handleStartWorkout = async () => {
    try {
      const response = await fetch(`/api/workouts/${workoutId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to start workout');
      }

      setWorkoutData({
        userWorkoutId: result.data.userWorkoutId,
        workout: result.data.workout,
        isResuming: result.data.isResuming
      });
      setIsPlaying(true);
    } catch (err) {
      console.error('Error starting workout:', err);
      setError(err instanceof Error ? err.message : 'Failed to start workout');
    }
  };

  const handleWorkoutComplete = (userWorkoutId: number, durationMinutes: number, notes?: string) => {
    setIsPlaying(false);
    router.push(`/dashboard/workouts/complete?userWorkoutId=${userWorkoutId}&duration=${durationMinutes}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`);
  };

  const handleExitWorkout = () => {
    setIsPlaying(false);
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="glass-card p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="text-lg font-medium">Loading workout...</span>
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
            Error Loading Workout
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="flex space-x-4 justify-center">
            <button 
              onClick={loadWorkoutDetails}
              className="accent-button px-4 py-2"
            >
              Try Again
            </button>
            <button 
              onClick={() => router.push('/dashboard/workouts')}
              className="glass-button px-4 py-2"
            >
              Back to Workouts
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!workoutData) {
    return null;
  }

  // If playing workout, show the workout player
  if (isPlaying && workoutData.userWorkoutId) {
    return (
      <WorkoutPlayer
        userWorkoutId={workoutData.userWorkoutId}
        workout={workoutData.workout}
        isResuming={workoutData.isResuming || false}
        onComplete={handleWorkoutComplete}
        onExit={handleExitWorkout}
      />
    );
  }

  // Otherwise show workout details and start button
  const { workout } = workoutData;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={() => router.back()}
          className="glass-button px-4 py-2 flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Workouts</span>
        </button>
      </div>

      {/* Workout Header */}
      <div className="glass-card p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gradient mb-4">{workout.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getDifficultyColor(workout.difficulty)}`}>
                {workout.difficulty}
              </span>
              <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                {workout.category}
              </span>
              <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
                {formatDuration(workout.estimated_duration_minutes)}
              </span>
              <span className="px-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-full text-sm font-medium">
                {workout.exercises.length} exercises
              </span>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              {workout.description}
            </p>

            {/* Equipment Needed */}
            {workout.equipment_needed && workout.equipment_needed.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Equipment Needed</h3>
                <div className="flex flex-wrap gap-2">
                  {workout.equipment_needed.map((equipment, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-sm"
                    >
                      {equipment}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="ml-8">
            <button
              onClick={handleStartWorkout}
              className="accent-button px-8 py-4 text-lg font-semibold flex items-center space-x-3 min-w-48 justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10v18a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <span>Start Workout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="glass-card">
        <div className="p-6 border-b border-glass-border">
          <h2 className="text-2xl font-semibold">Exercise Overview</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {workout.exercises.length} exercises in this workout
          </p>
        </div>

        <div className="divide-y divide-glass-border">
          {workout.exercises.map((exercise, index) => (
            <div key={exercise.id} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {exercise.exercise_name}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                      {exercise.exercise_category}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(exercise.difficulty_level)}`}>
                      {exercise.difficulty_level}
                    </span>
                    
                    {exercise.sets && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {exercise.sets} sets
                      </span>
                    )}
                    {exercise.reps && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {exercise.reps} reps
                      </span>
                    )}
                    {exercise.duration_seconds && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.floor(exercise.duration_seconds / 60)}:{(exercise.duration_seconds % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {exercise.exercise_description}
                  </p>

                  {/* Target Muscles */}
                  {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {exercise.muscle_groups.map((muscle: string, idx: number) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Ready to get started?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This workout will take approximately {formatDuration(workout.estimated_duration_minutes)}
            </p>
          </div>
          
          <button
            onClick={handleStartWorkout}
            className="accent-button px-8 py-3 text-lg font-semibold flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Start Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
