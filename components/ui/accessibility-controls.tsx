'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessibilityControlsProps {
  className?: string;
}

export default function AccessibilityControls({ className = '' }: AccessibilityControlsProps) {
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load user preference from localStorage
    const savedPreference = localStorage.getItem('reduce-transparency');
    const shouldReduce = savedPreference === 'true';
    setReduceTransparency(shouldReduce);
    applyTransparencyMode(shouldReduce);
    setIsLoaded(true);
  }, []);

  const applyTransparencyMode = (reduce: boolean) => {
    if (reduce) {
      document.documentElement.classList.add('reduce-transparency');
    } else {
      document.documentElement.classList.remove('reduce-transparency');
    }
  };

  const toggleTransparency = () => {
    const newValue = !reduceTransparency;
    setReduceTransparency(newValue);
    localStorage.setItem('reduce-transparency', newValue.toString());
    applyTransparencyMode(newValue);
    
    // Announce change to screen readers
    const message = newValue ? 'Transparency reduced for better readability' : 'Transparency effects restored';
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  if (!isLoaded) return null;

  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      <button
        onClick={toggleTransparency}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-nature-green focus:ring-offset-2',
          reduceTransparency
            ? 'bg-nature-green text-white shadow-nature'
            : 'glass-button text-text-700 hover:text-text-900'
        )}
        aria-label={reduceTransparency ? 'Enable transparency effects' : 'Reduce transparency for better readability'}
        title={reduceTransparency ? 'Enable transparency effects' : 'Reduce transparency'}
      >
        {reduceTransparency ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {reduceTransparency ? 'Show Effects' : 'Reduce Motion'}
        </span>
      </button>
    </div>
  );
}

// Add corresponding CSS to globals.css
export const AccessibilityStyles = `
/* Accessibility: Reduce transparency mode */
.reduce-transparency .glass-card {
  background: rgba(255,255,255,0.95) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border: 1px solid rgba(0,0,0,0.1) !important;
}

.reduce-transparency .dark .glass-card {
  background: rgba(16,16,16,0.95) !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
}

.reduce-transparency .glass-button {
  background: rgba(255,255,255,0.95) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.reduce-transparency .glass-input {
  background: rgba(255,255,255,0.95) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* High contrast focus indicators */
.reduce-transparency *:focus-visible {
  outline: 3px solid #6DA06E !important;
  outline-offset: 2px !important;
}

/* Ensure text contrast is always sufficient */
.reduce-transparency .glass-card {
  color: #0F1724 !important;
}

.reduce-transparency .dark .glass-card {
  color: #FDFBF7 !important;
}

/* Screen reader only utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`;