'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

interface AchievementNotificationProps {
  achievements: Achievement[];
  onDismiss: () => void;
}

export function AchievementNotification({ achievements, onDismiss }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (achievements.length > 0) {
      setIsVisible(true);
      
      // Auto-dismiss after showing all achievements
      const timeout = setTimeout(() => {
        handleDismiss();
      }, achievements.length * 3000 + 1000);

      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [achievements]);

  useEffect(() => {
    if (achievements.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev < achievements.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 3000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [achievements.length]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation to complete
  }, [onDismiss]);

  if (!achievements.length || !isVisible) {
    return null;
  }

  const currentAchievement = achievements[currentIndex];

  if (!currentAchievement) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={handleDismiss}
      />

      {/* Notification */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={`glass-card p-8 w-full max-w-md text-center pointer-events-auto transform transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Confetti Animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>

          {/* Achievement Content */}
          <div className="relative z-10">
            <div className="text-6xl mb-4 animate-bounce">
              {currentAchievement.icon}
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {currentAchievement.name}
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {currentAchievement.description}
            </p>

            {/* Progress Indicator */}
            {achievements.length > 1 && (
              <div className="flex justify-center space-x-2 mb-6">
                {achievements.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      index === currentIndex 
                        ? 'bg-purple-600' 
                        : index < currentIndex 
                          ? 'bg-purple-300' 
                          : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleDismiss}
                className="flex-1 glass-button py-3 font-medium"
              >
                {achievements.length > 1 && currentIndex < achievements.length - 1 ? 'Skip All' : 'Continue'}
              </button>
              
              {achievements.length > 1 && currentIndex < achievements.length - 1 && (
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(prev + 1, achievements.length - 1))}
                  className="flex-1 accent-button py-3 font-medium"
                >
                  Next Achievement
                </button>
              )}
            </div>

            {/* Achievement Count */}
            {achievements.length > 1 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                {currentIndex + 1} of {achievements.length} new achievements
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        .confetti {
          animation: confetti-fall 3s linear infinite;
        }
      `}</style>
    </>
  );
}
