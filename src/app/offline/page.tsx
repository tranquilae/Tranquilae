'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, RefreshCw, Home, Activity, User } from 'lucide-react';

const OfflinePage = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [lastAttempt, setLastAttempt] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setRetryCount(0);
      // Redirect to last page or dashboard after coming back online
      setTimeout(() => {
        const lastPage = localStorage.getItem('lastVisitedPage') || '/dashboard';
        router.push(lastPage);
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const handleRetry = async () => {
    setLastAttempt(new Date());
    setRetryCount(prev => prev + 1);

    try {
      // Test connectivity by fetching a simple endpoint
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        setIsOnline(true);
        const lastPage = localStorage.getItem('lastVisitedPage') || '/dashboard';
        router.push(lastPage);
      }
    } catch (error) {
      console.log('Still offline, retry failed');
    }
  };

  const navigateOffline = (path: string) => {
    // Try to navigate to cached pages
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Status Icon */}
        <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
          isOnline ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          {isOnline ? (
            <Wifi className="w-10 h-10 text-green-600" />
          ) : (
            <WifiOff className="w-10 h-10 text-gray-500" />
          )}
        </div>

        {/* Title and Status */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {isOnline ? '🎉 Back Online!' : '🌿 You\'re Offline'}
        </h1>
        
        <p className="text-gray-600 mb-8">
          {isOnline 
            ? 'Great! Your connection has been restored. Redirecting you now...'
            : 'No worries! You can still access some features while offline.'
          }
        </p>

        {/* Connection Status Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Status:</span>
            <span className={`font-medium ${
              isOnline ? 'text-green-600' : 'text-gray-700'
            }`}>
              {isOnline ? 'Connected' : 'Offline'}
            </span>
          </div>
          
          {!isOnline && retryCount > 0 && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-500">Retry attempts:</span>
              <span className="font-medium text-gray-700">{retryCount}</span>
            </div>
          )}
          
          {lastAttempt && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-500">Last attempt:</span>
              <span className="font-medium text-gray-700">
                {lastAttempt.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isOnline && (
            <button
              onClick={handleRetry}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}

          {/* Offline Navigation */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            <button
              onClick={() => navigateOffline('/dashboard')}
              className="flex flex-col items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5 text-gray-600 mb-1" />
              <span className="text-xs text-gray-600">Dashboard</span>
            </button>
            
            <button
              onClick={() => navigateOffline('/workouts')}
              className="flex flex-col items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Activity className="w-5 h-5 text-gray-600 mb-1" />
              <span className="text-xs text-gray-600">Workouts</span>
            </button>
            
            <button
              onClick={() => navigateOffline('/profile')}
              className="flex flex-col items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <User className="w-5 h-5 text-gray-600 mb-1" />
              <span className="text-xs text-gray-600">Profile</span>
            </button>
          </div>
        </div>

        {/* Offline Features Info */}
        {!isOnline && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Available Offline:</h3>
            <ul className="text-sm text-blue-700 space-y-1 text-left">
              <li>• View cached workout data</li>
              <li>• Access your workout history</li>
              <li>• Browse exercise library</li>
              <li>• Track workouts (syncs when online)</li>
              <li>• View your profile information</li>
            </ul>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 text-xs text-gray-500">
          💡 Tip: Your data will automatically sync when you come back online
        </div>
      </div>

      {/* Background Animation */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-green-100/20 to-transparent rounded-full animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-100/20 to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
};

export default OfflinePage;
