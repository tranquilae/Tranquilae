'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export function Header() {
  const { user, neonUser, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-glass-bg/70 border-b border-glass-border/60 shadow-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold text-gradient">Tranquilae</span>
            </Link>
          </div>

          {/* Center Navigation - hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/dashboard" 
              className="text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/dashboard/workouts" 
              className="text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
            >
              Workouts
            </Link>
            <Link 
              href="/dashboard/achievements" 
              className="text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
            >
              Achievements
            </Link>
          </nav>

          {/* Right Side - User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            {user && (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {neonUser?.display_name || user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {neonUser?.explorer ? 'Explorer' : 'Pathfinder'}
                  </p>
                </div>
                
                {/* Avatar */}
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {(neonUser?.display_name || user.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Settings & Sign Out */}
            <div className="flex items-center space-x-2">
              <Link 
                href="/dashboard/settings"
                className="glass-button p-2 rounded-xl hover:scale-105 transition-transform"
                aria-label="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>

              <button
                onClick={signOut}
                className="glass-button p-2 rounded-xl hover:scale-105 transition-transform text-red-600 dark:text-red-400"
                aria-label="Sign out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
