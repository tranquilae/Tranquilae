'use client';
// Prevent prerendering of dashboard pages
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface UserData {
  id: number;
  email: string;
  fullName: string | null;
  plan: string;
  timezone: string | null;
  unitsPreference: string | null;
  createdAt: string;
}

interface UserPreferences {
  notifications: {
    workouts: boolean;
    achievements: boolean;
    reminders: boolean;
    email: boolean;
    push: boolean;
  };
  privacy: {
    profilePublic: boolean;
    workoutHistoryPublic: boolean;
    achievementsPublic: boolean;
  };
  fitness: {
    weeklyWorkoutGoal: number;
    preferredWorkoutTime: string | null;
    preferredWorkoutDuration: number;
    fitnessLevel: string;
    workoutReminders: boolean;
  };
  lastUpdated: string | null;
}

export default function SettingsPage() {
  const { user, neonUser, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && neonUser && !authLoading) {
      loadUserPreferences();
    }
  }, [user, neonUser, authLoading]);

  const loadUserPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load preferences');
      }

      setUserData(result.data.user);
      setPreferences(result.data.preferences);
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!userData || !preferences) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            fullName: userData.fullName,
            timezone: userData.timezone,
            unitsPreference: userData.unitsPreference
          },
          preferences
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save preferences');
      }

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updateUserData = (updates: Partial<UserData>) => {
    if (userData) {
      setUserData({ ...userData, ...updates });
    }
  };

  const updatePreferences = (section: keyof UserPreferences, updates: any) => {
    if (preferences) {
      const currentSection = preferences[section];
      const sectionData = (typeof currentSection === 'object' && currentSection !== null) ? currentSection : {};
      
      setPreferences({
        ...preferences,
        [section]: {
          ...sectionData,
          ...updates
        }
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="glass-card p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="text-lg font-medium">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="glass-card p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Settings
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={loadUserPreferences}
            className="accent-button px-4 py-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userData || !preferences) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your account, preferences, and fitness goals
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {successMessage && (
            <div className="flex items-center text-green-600 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="flex items-center text-red-600 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
              {error}
            </div>
          )}

          <button
            onClick={savePreferences}
            disabled={saving}
            className="accent-button px-6 py-2 flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <div className="glass-card">
          <div className="p-6 border-b border-glass-border">
            <h2 className="text-xl font-semibold">Profile</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Update your personal information
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={userData.fullName || ''}
                onChange={(e) => updateUserData({ fullName: e.target.value })}
                className="w-full p-3 glass-subtle rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={userData.email}
                disabled
                className="w-full p-3 glass-subtle rounded-lg opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={userData.timezone || ''}
                  onChange={(e) => updateUserData({ timezone: e.target.value })}
                  className="w-full p-3 glass-subtle rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select timezone</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Units
                </label>
                <select
                  value={userData.unitsPreference || 'metric'}
                  onChange={(e) => updateUserData({ unitsPreference: e.target.value })}
                  className="w-full p-3 glass-subtle rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="metric">Metric (kg, cm)</option>
                  <option value="imperial">Imperial (lbs, ft)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-glass-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Current Plan</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Member since {new Date(userData.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  userData.plan === 'pro' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {userData.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fitness Goals */}
        <div className="glass-card">
          <div className="p-6 border-b border-glass-border">
            <h2 className="text-xl font-semibold">Fitness Goals</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Set your workout preferences and goals
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Weekly Workout Goal
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={preferences.fitness.weeklyWorkoutGoal}
                  onChange={(e) => updatePreferences('fitness', { weeklyWorkoutGoal: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <span className="text-lg font-bold text-purple-600 min-w-16">
                  {preferences.fitness.weeklyWorkoutGoal} {preferences.fitness.weeklyWorkoutGoal === 1 ? 'workout' : 'workouts'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferred Workout Time
                </label>
                <select
                  value={preferences.fitness.preferredWorkoutTime || ''}
                  onChange={(e) => updatePreferences('fitness', { preferredWorkoutTime: e.target.value || null })}
                  className="w-full p-3 glass-subtle rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">No preference</option>
                  <option value="morning">Morning (6AM - 12PM)</option>
                  <option value="afternoon">Afternoon (12PM - 6PM)</option>
                  <option value="evening">Evening (6PM - 10PM)</option>
                  <option value="night">Night (10PM - 12AM)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferred Duration
                </label>
                <select
                  value={preferences.fitness.preferredWorkoutDuration}
                  onChange={(e) => updatePreferences('fitness', { preferredWorkoutDuration: parseInt(e.target.value) })}
                  className="w-full p-3 glass-subtle rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fitness Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                  <button
                    key={level}
                    onClick={() => updatePreferences('fitness', { fitnessLevel: level })}
                    className={`p-3 rounded-lg text-center font-medium capitalize transition-colors ${
                      preferences.fitness.fitnessLevel === level
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 ring-2 ring-purple-500'
                        : 'glass-subtle text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 glass-subtle rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Workout Reminders</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get reminded to maintain your workout schedule
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.fitness.workoutReminders}
                  onChange={(e) => updatePreferences('fitness', { workoutReminders: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card">
          <div className="p-6 border-b border-glass-border">
            <h2 className="text-xl font-semibold">Notifications</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Choose what notifications you'd like to receive
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {[
              { key: 'workouts', label: 'Workout Completions', description: 'Notifications when you complete workouts' },
              { key: 'achievements', label: 'New Achievements', description: 'When you unlock new achievements' },
              { key: 'reminders', label: 'Workout Reminders', description: 'Daily reminders to stay active' },
              { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
              { key: 'push', label: 'Push Notifications', description: 'Browser and mobile push notifications' }
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-4 glass-subtle rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.notifications[key as keyof typeof preferences.notifications]}
                    onChange={(e) => updatePreferences('notifications', { [key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="glass-card">
          <div className="p-6 border-b border-glass-border">
            <h2 className="text-xl font-semibold">Privacy</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Control what information is visible to others
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {[
              { key: 'profilePublic', label: 'Public Profile', description: 'Make your profile visible to other users' },
              { key: 'workoutHistoryPublic', label: 'Workout History', description: 'Show your workout history publicly' },
              { key: 'achievementsPublic', label: 'Achievements', description: 'Display your achievements publicly' }
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-4 glass-subtle rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.privacy[key as keyof typeof preferences.privacy]}
                    onChange={(e) => updatePreferences('privacy', { [key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Need help?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Contact our support team if you have any questions
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button className="glass-button px-4 py-2">
              Contact Support
            </button>
            <button 
              onClick={savePreferences}
              disabled={saving}
              className="accent-button px-6 py-2"
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
