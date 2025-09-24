'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  Plus,
  Search,
  Filter,
  Clock,
  Users,
  Heart,
  Target,
  Flame,
  Play,
  Pause,
  RotateCcw,
  Save,
  Share2,
  Copy,
  Trash2,
  Edit,
  DragHandleDots2Icon as DragHandle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
  estimatedCalories: number;
  defaultDuration?: number;
  defaultReps?: number;
  defaultSets?: number;
}

interface WorkoutExercise extends Exercise {
  duration?: number;
  reps?: number;
  sets?: number;
  restTime?: number;
  notes?: string;
  order: number;
}

interface CustomWorkout {
  id?: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  targetCalories: number;
  exercises: WorkoutExercise[];
  tags: string[];
  isPublic: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function CustomWorkoutBuilder() {
  const { user } = useAuth();
  const [workout, setWorkout] = useState<CustomWorkout>({
    title: '',
    description: '',
    category: 'strength',
    difficulty: 'beginner',
    estimatedDuration: 0,
    targetCalories: 0,
    exercises: [],
    tags: [],
    isPublic: false,
  });

  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAvailableExercises();
  }, []);

  useEffect(() => {
    calculateWorkoutMetrics();
  }, [workout.exercises]);

  const loadAvailableExercises = async () => {
    try {
      const response = await fetch('/api/exercises');
      const result = await response.json();
      if (result.success) {
        setAvailableExercises(result.data);
      }
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  };

  const calculateWorkoutMetrics = useCallback(() => {
    const totalDuration = workout.exercises.reduce((sum, exercise) => {
      const exerciseDuration = exercise.duration || 
        (exercise.sets && exercise.reps ? exercise.sets * 2 : 5); // Estimate 2 min per set
      const restTime = exercise.restTime || 30; // Default 30s rest
      return sum + exerciseDuration + (exercise.sets ? exercise.sets * (restTime / 60) : 0);
    }, 0);

    const totalCalories = workout.exercises.reduce((sum, exercise) => {
      const duration = exercise.duration || 
        (exercise.sets && exercise.reps ? exercise.sets * 2 : 5);
      return sum + ((exercise.estimatedCalories / 60) * duration);
    }, 0);

    setWorkout(prev => ({
      ...prev,
      estimatedDuration: Math.round(totalDuration),
      targetCalories: Math.round(totalCalories),
    }));
  }, [workout.exercises]);

  const filteredExercises = availableExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.muscleGroups.some(group => group.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const addExerciseToWorkout = (exercise: Exercise) => {
    const workoutExercise: WorkoutExercise = {
      ...exercise,
      duration: exercise.defaultDuration,
      reps: exercise.defaultReps,
      sets: exercise.defaultSets,
      restTime: 60, // Default 60 seconds rest
      order: workout.exercises.length,
    };

    setWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, workoutExercise],
    }));
  };

  const removeExerciseFromWorkout = (index: number) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
        .map((exercise, i) => ({ ...exercise, order: i })),
    }));
  };

  const updateExerciseInWorkout = (index: number, updates: Partial<WorkoutExercise>) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, ...updates } : exercise
      ),
    }));
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    setWorkout(prev => {
      const exercises = [...prev.exercises];
      const [movedExercise] = exercises.splice(fromIndex, 1);
      exercises.splice(toIndex, 0, movedExercise);
      
      return {
        ...prev,
        exercises: exercises.map((exercise, i) => ({ ...exercise, order: i })),
      };
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveExercise(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const validateWorkout = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!workout.title.trim()) {
      newErrors.title = 'Workout title is required';
    }

    if (!workout.description.trim()) {
      newErrors.description = 'Workout description is required';
    }

    if (workout.exercises.length === 0) {
      newErrors.exercises = 'At least one exercise is required';
    }

    if (workout.exercises.length > 20) {
      newErrors.exercises = 'Maximum 20 exercises allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveWorkout = async () => {
    if (!validateWorkout()) return;

    setSaving(true);
    try {
      const response = await fetch('/api/workouts/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workout),
      });

      const result = await response.json();
      if (result.success) {
        setWorkout(prev => ({ ...prev, id: result.data.id }));
        // Show success notification
      } else {
        setErrors({ general: result.error?.message || 'Failed to save workout' });
      }
    } catch (error) {
      setErrors({ general: 'Failed to save workout' });
    } finally {
      setSaving(false);
    }
  };

  const shareWorkout = async () => {
    if (!workout.id) {
      await saveWorkout();
      if (!workout.id) return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: workout.title,
          text: workout.description,
          url: `${window.location.origin}/workouts/${workout.id}`,
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/workouts/${workout.id}`);
        // Show copied notification
      }
    } catch (error) {
      console.error('Failed to share workout:', error);
    }
  };

  const duplicateWorkout = () => {
    setWorkout(prev => ({
      ...prev,
      id: undefined,
      title: `${prev.title} (Copy)`,
      createdAt: undefined,
      updatedAt: undefined,
    }));
  };

  const resetWorkout = () => {
    setWorkout({
      title: '',
      description: '',
      category: 'strength',
      difficulty: 'beginner',
      estimatedDuration: 0,
      targetCalories: 0,
      exercises: [],
      tags: [],
      isPublic: false,
    });
    setErrors({});
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Custom Workout Builder
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create personalized workouts tailored to your fitness goals
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="glass-button px-4 py-2"
          >
            {isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
          </button>
          
          <button
            onClick={duplicateWorkout}
            disabled={!workout.exercises.length}
            className="glass-button p-2 disabled:opacity-50"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={shareWorkout}
            disabled={!workout.exercises.length}
            className="glass-button p-2 disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={resetWorkout}
            className="glass-button p-2 text-red-600 dark:text-red-400"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exercise Library */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Exercise Library
            </h3>
            
            {/* Search and Filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="flexibility">Flexibility</option>
                  <option value="yoga">Yoga</option>
                  <option value="hiit">HIIT</option>
                </select>
                
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            
            {/* Exercise List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => addExerciseToWorkout(exercise)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {exercise.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {exercise.muscleGroups.join(', ')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          exercise.difficulty === 'beginner' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                            : exercise.difficulty === 'intermediate'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                        }`}>
                          {exercise.difficulty}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {exercise.estimatedCalories} cal/hr
                        </span>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Workout Builder */}
        <div className="lg:col-span-2 space-y-4">
          {/* Workout Details */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Workout Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Workout Title *
                </label>
                <input
                  type="text"
                  value={workout.title}
                  onChange={(e) => setWorkout(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter workout title..."
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    errors.title ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-600'
                  }`}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={workout.category}
                  onChange={(e) => setWorkout(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="flexibility">Flexibility</option>
                  <option value="yoga">Yoga</option>
                  <option value="hiit">HIIT</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={workout.description}
                onChange={(e) => setWorkout(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your workout..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                  errors.description ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-600'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={workout.difficulty}
                  onChange={(e) => setWorkout(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={workout.isPublic}
                    onChange={(e) => setWorkout(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Make Public
                  </span>
                </label>
              </div>
            </div>
            
            {/* Workout Metrics */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {workout.exercises.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Exercises</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {workout.estimatedDuration}m
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {workout.targetCalories}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Calories</div>
              </div>
            </div>
          </div>

          {/* Exercise List */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Workout Exercises ({workout.exercises.length})
              </h3>
              
              {workout.exercises.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveWorkout}
                    disabled={saving}
                    className="accent-button px-4 py-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Workout'}
                  </button>
                </div>
              )}
            </div>
            
            {errors.exercises && (
              <p className="text-red-500 text-sm mb-4">{errors.exercises}</p>
            )}
            
            {errors.general && (
              <p className="text-red-500 text-sm mb-4">{errors.general}</p>
            )}
            
            {workout.exercises.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No Exercises Added
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Add exercises from the library to build your custom workout.
                </p>
              </div>
            ) : (
              <div className="space-y-3" ref={dragRef}>
                {workout.exercises.map((exercise, index) => (
                  <div
                    key={`${exercise.id}-${index}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 ${
                      draggedIndex === index ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <DragHandle className="w-4 h-4 text-gray-400 cursor-move" />
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {index + 1}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {exercise.name}
                          </h4>
                          <button
                            onClick={() => removeExerciseFromWorkout(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          {exercise.sets !== undefined && (
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Sets
                              </label>
                              <input
                                type="number"
                                value={exercise.sets || ''}
                                onChange={(e) => updateExerciseInWorkout(index, { 
                                  sets: parseInt(e.target.value) || undefined 
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                              />
                            </div>
                          )}
                          
                          {exercise.reps !== undefined && (
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Reps
                              </label>
                              <input
                                type="number"
                                value={exercise.reps || ''}
                                onChange={(e) => updateExerciseInWorkout(index, { 
                                  reps: parseInt(e.target.value) || undefined 
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                              />
                            </div>
                          )}
                          
                          {exercise.duration !== undefined && (
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Duration (min)
                              </label>
                              <input
                                type="number"
                                value={exercise.duration || ''}
                                onChange={(e) => updateExerciseInWorkout(index, { 
                                  duration: parseInt(e.target.value) || undefined 
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                              />
                            </div>
                          )}
                          
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Rest (sec)
                            </label>
                            <input
                              type="number"
                              value={exercise.restTime || ''}
                              onChange={(e) => updateExerciseInWorkout(index, { 
                                restTime: parseInt(e.target.value) || undefined 
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Notes (optional)
                          </label>
                          <input
                            type="text"
                            value={exercise.notes || ''}
                            onChange={(e) => updateExerciseInWorkout(index, { notes: e.target.value })}
                            placeholder="Add exercise notes..."
                            className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded">
                            {exercise.category}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {exercise.muscleGroups.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
