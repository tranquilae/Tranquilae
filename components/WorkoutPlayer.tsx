'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Exercise {
  id: number;
  exercise_id: number;
  order_in_workout: number;
  sets: number | null;
  reps: number | null;
  duration_seconds: number | null;
  rest_seconds: number | null;
  exercise_name: string;
  exercise_description: string;
  exercise_category: string;
  muscle_groups: string[];
  equipment: string[];
  difficulty_level: string;
  media_url: string | null;
  media_source: string;
  progress: {
    setsCompleted: number;
    repsCompleted: number;
    durationCompleted: number;
    isCompleted: boolean;
  };
}

interface Workout {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  estimated_duration_minutes: number;
  category: string;
  equipment_needed: string[];
  exercises: Exercise[];
}

interface WorkoutPlayerProps {
  userWorkoutId: number;
  workout: Workout;
  isResuming: boolean;
  onComplete: (userWorkoutId: number, durationMinutes: number, notes?: string) => void;
  onExit: () => void;
}

export function WorkoutPlayer({ 
  userWorkoutId, 
  workout, 
  isResuming, 
  onComplete, 
  onExit 
}: WorkoutPlayerProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [workoutStartTime] = useState(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentExercise = workout.exercises[currentExerciseIndex];
  const totalExercises = workout.exercises.length;
  const overallProgress = (completedExercises.size / totalExercises) * 100;

  // Initialize completed exercises from progress data
  useEffect(() => {
    const completed = new Set<number>();
    workout.exercises.forEach((exercise, index) => {
      if (exercise.progress.isCompleted) {
        completed.add(index);
      }
    });
    setCompletedExercises(completed);

    // If resuming, find the first incomplete exercise
    if (isResuming) {
      const firstIncomplete = workout.exercises.findIndex(ex => !ex.progress.isCompleted);
      if (firstIncomplete !== -1) {
        setCurrentExerciseIndex(firstIncomplete);
      }
    }
  }, [workout.exercises, isResuming]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !isPaused) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && (isResting || currentExercise?.duration_seconds)) {
      // Timer finished
      handleTimerComplete();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, isPaused, isResting, currentExercise]);

  // Play audio notification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/timer-end.mp3');
    }
  }, []);

  const handleTimerComplete = () => {
    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(console.warn);
    }

    if (isResting) {
      // Rest period finished, move to next exercise or complete
      setIsResting(false);
      if (currentExerciseIndex < totalExercises - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
      } else {
        // All exercises complete
        setShowCompleteModal(true);
      }
    } else {
      // Exercise finished, start rest period if configured
      handleExerciseComplete();
    }
  };

  const handleExerciseComplete = async () => {
    const exercise = currentExercise;
    
    // Safety check - exit if no current exercise
    if (!exercise) {
      console.error('No current exercise to complete');
      return;
    }
    
    try {
      const response = await fetch('/api/workouts/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWorkoutId,
          exerciseId: exercise.exercise_id,
          setsCompleted: exercise.sets || 1,
          repsCompleted: exercise.reps || 0,
          durationCompletedSeconds: exercise.duration_seconds || Math.floor((Date.now() - workoutStartTime) / 1000),
          isCompleted: true
        })
      });

      if (response.ok) {
        setCompletedExercises(prev => new Set([...prev, currentExerciseIndex]));
        
        // Start rest period if configured
        if (exercise.rest_seconds && exercise.rest_seconds > 0) {
          setIsResting(true);
          setTimeRemaining(exercise.rest_seconds);
        } else {
          // No rest, move to next exercise
          if (currentExerciseIndex < totalExercises - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
          } else {
            setShowCompleteModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleStartTimer = (seconds: number) => {
    setTimeRemaining(seconds);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleSkipExercise = () => {
    if (isResting) {
      setIsResting(false);
      setTimeRemaining(0);
    } else if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setIsResting(false);
      setTimeRemaining(0);
    }
  };

  const handleCompleteWorkout = async () => {
    const durationMinutes = Math.floor((Date.now() - workoutStartTime) / (1000 * 60));
    
    try {
      const response = await fetch(`/api/workouts/${workout.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWorkoutId,
          durationMinutes,
          notes: workoutNotes.trim() || null
        })
      });

      if (response.ok) {
        onComplete(userWorkoutId, durationMinutes, workoutNotes.trim() || undefined);
      } else {
        console.error('Failed to complete workout');
      }
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (showCompleteModal) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="glass-card p-8 w-full max-w-md">
          <div className="text-center">
            <div className="text-green-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Workout Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Great job completing "{workout.title}"
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                className="w-full p-3 glass-subtle rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="How did it go? Any thoughts to remember..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 glass-button py-3 font-medium"
              >
                Continue Workout
              </button>
              <button
                onClick={handleCompleteWorkout}
                className="flex-1 accent-button py-3 font-medium"
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Safety check - if currentExercise is undefined, show loading or error state
  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Loading Exercise...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we prepare your workout.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onExit}
              className="glass-button p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {workout.title}
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(workout.difficulty)}`}>
                  {workout.difficulty}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Exercise {currentExerciseIndex + 1} of {totalExercises}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(overallProgress)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Complete
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {isResting ? (
        /* Rest Period */
        <div className="glass-card p-8 mb-6 text-center">
          <div className="text-blue-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m9-9H3" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Rest Time
          </h2>
          
          <div className="text-6xl font-bold text-blue-600 mb-4">
            {formatTime(timeRemaining)}
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Take a break before the next exercise
          </p>

          <div className="flex justify-center space-x-4">
            <button
              onClick={handlePauseResume}
              className="glass-button px-6 py-3 font-medium"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleSkipExercise}
              className="accent-button px-6 py-3 font-medium"
            >
              Skip Rest
            </button>
          </div>
        </div>
      ) : (
        /* Exercise Display */
        <div className="glass-card p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Exercise Info */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {currentExercise.exercise_name}
                </h2>
                {completedExercises.has(currentExerciseIndex) && (
                  <div className="text-green-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                    {currentExercise.exercise_category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(currentExercise.difficulty_level)}`}>
                    {currentExercise.difficulty_level}
                  </span>
                </div>

                {currentExercise.muscle_groups.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Target Muscles</h4>
                    <div className="flex flex-wrap gap-1">
                      {currentExercise.muscle_groups.map((muscle, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentExercise.equipment.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Equipment</h4>
                    <div className="flex flex-wrap gap-1">
                      {currentExercise.equipment.map((item, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {currentExercise.exercise_description}
                  </p>
                </div>
              </div>

              {/* Exercise Specifications */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {currentExercise.sets && (
                  <div className="text-center p-4 glass-subtle rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{currentExercise.sets}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Sets</div>
                  </div>
                )}
                
                {currentExercise.reps && (
                  <div className="text-center p-4 glass-subtle rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{currentExercise.reps}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Reps</div>
                  </div>
                )}
                
                {currentExercise.duration_seconds && (
                  <div className="text-center p-4 glass-subtle rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatTime(currentExercise.duration_seconds)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Duration</div>
                  </div>
                )}
                
                {currentExercise.rest_seconds && (
                  <div className="text-center p-4 glass-subtle rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatTime(currentExercise.rest_seconds)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Rest</div>
                  </div>
                )}
              </div>
            </div>

            {/* Media/Timer Section */}
            <div>
              {currentExercise.media_url ? (
                <div className="mb-6">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    {currentExercise.media_url.includes('youtube.com') || currentExercise.media_url.includes('youtu.be') ? (
                      <iframe
                        src={currentExercise.media_url.replace('watch?v=', 'embed/')}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={currentExercise.media_url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Source: {currentExercise.media_source}
                  </p>
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p>No media available</p>
                  </div>
                </div>
              )}

              {/* Timer Section */}
              {currentExercise.duration_seconds && (
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-green-600 mb-4">
                    {timeRemaining > 0 ? formatTime(timeRemaining) : formatTime(currentExercise.duration_seconds)}
                  </div>
                  
                  <div className="flex justify-center space-x-2 mb-4">
                    {timeRemaining === 0 ? (
                      <button
                        onClick={() => handleStartTimer(currentExercise.duration_seconds!)}
                        className="accent-button px-6 py-3 font-medium"
                      >
                        Start Timer
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handlePauseResume}
                          className="glass-button px-4 py-2 font-medium"
                        >
                          {isPaused ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          onClick={() => setTimeRemaining(0)}
                          className="glass-button px-4 py-2 font-medium"
                        >
                          Reset
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-glass-border">
            <button
              onClick={handlePreviousExercise}
              disabled={currentExerciseIndex === 0}
              className="glass-button px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              <button
                onClick={handleSkipExercise}
                className="glass-button px-6 py-3 font-medium"
              >
                Skip
              </button>
              <button
                onClick={handleExerciseComplete}
                className="accent-button px-6 py-3 font-medium"
              >
                {currentExerciseIndex === totalExercises - 1 ? 'Complete Workout' : 'Complete Exercise'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
