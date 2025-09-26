'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { getNeonClient } from '@/lib/neonClient';

// Prevent prerendering of admin pages
export const dynamic = 'force-dynamic';

interface MediaOverride {
  id: number;
  workout_id: number;
  media_url: string;
  source: string;
  active: boolean;
  created_at: string;
  created_by: string;
  workout_title?: string;
}

export default function AdminMediaPage() {
  const { user } = useAuth();
  const [mediaOverrides, setMediaOverrides] = useState<MediaOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Check if user has admin privileges
  const isAdmin = user?.email?.includes('admin') || false;

  useEffect(() => {
    if (user && isAdmin) {
      loadMediaOverrides();
    }
  }, [user, isAdmin]);

  const loadMediaOverrides = async () => {
    try {
      const sql = getNeonClient();
      const result = await sql`
        SELECT mo.id, mo.workout_id, mo.media_url, mo.source, mo.active, 
               mo.created_at, mo.created_by, w.title as workout_title
        FROM exercise_media_overrides mo
        LEFT JOIN workouts w ON mo.workout_id = w.id
        ORDER BY mo.created_at DESC
      `;
      setMediaOverrides(result as MediaOverride[]);
    } catch (err) {
      console.error('Error loading media overrides:', err);
      setError('Failed to load media overrides');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: number, currentActive: boolean) => {
    try {
      const sql = getNeonClient();
      await sql`
        UPDATE exercise_media_overrides 
        SET active = ${!currentActive}
        WHERE id = ${id}
      `;
      await loadMediaOverrides();
    } catch (err) {
      console.error('Error toggling media override:', err);
      setError('Failed to update media override');
    }
  };

  const deleteOverride = async (id: number) => {
    if (!confirm('Are you sure you want to delete this media override?')) {
      return;
    }

    try {
      const sql = getNeonClient();
      await sql`
        DELETE FROM exercise_media_overrides 
        WHERE id = ${id}
      `;
      await loadMediaOverrides();
    } catch (err) {
      console.error('Error deleting media override:', err);
      setError('Failed to delete media override');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return (
      <div className="glass-card p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="glass-card p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="text-lg font-medium">Loading media overrides...</span>
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
            Error Loading Media Overrides
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={loadMediaOverrides}
            className="accent-button px-4 py-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Media Overrides</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage custom media content for workout exercises
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="accent-button px-4 py-2 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Override</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {mediaOverrides.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Overrides
          </div>
        </div>
        
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {mediaOverrides.filter(m => m.active).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Active Overrides
          </div>
        </div>
        
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-2">
            {mediaOverrides.filter(m => !m.active).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Inactive Overrides
          </div>
        </div>
      </div>

      {/* Media Overrides List */}
      <div className="glass-card">
        <div className="p-6 border-b border-glass-border">
          <h2 className="text-xl font-semibold">All Media Overrides</h2>
        </div>

        {mediaOverrides.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No media overrides
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first media override to customize workout content.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="accent-button px-4 py-2"
            >
              Add First Override
            </button>
          </div>
        ) : (
          <div className="divide-y divide-glass-border">
            {mediaOverrides.map((override) => (
              <div key={override.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {override.workout_title || `Workout ID: ${override.workout_id}`}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        override.active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {override.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p><span className="font-medium">URL:</span> {override.media_url}</p>
                      <p><span className="font-medium">Source:</span> {override.source || 'Not specified'}</p>
                      <p><span className="font-medium">Created:</span> {formatDate(override.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleActive(override.id, override.active)}
                      className={`glass-button px-3 py-2 text-sm font-medium ${
                        override.active ? 'text-orange-600' : 'text-green-600'
                      }`}
                    >
                      {override.active ? 'Deactivate' : 'Activate'}
                    </button>
                    
                    <a
                      href={override.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button p-2 text-blue-600"
                      title="View media"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    
                    <button
                      onClick={() => deleteOverride(override.id)}
                      className="glass-button p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete override"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Form Modal Placeholder */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Media Override</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Add form implementation would go here.
                <br />
                For now, you can manually add overrides via SQL.
              </p>
              <button
                onClick={() => setShowAddForm(false)}
                className="mt-4 accent-button px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
