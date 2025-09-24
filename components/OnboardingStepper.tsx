'use client';

import React from 'react';

interface OnboardingStepperProps {
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onBack?: () => void;
  onStepClick?: (step: number) => void;
  stepLabels?: string[];
  disabled?: boolean;
  className?: string;
}

export function OnboardingStepper({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onStepClick,
  stepLabels = [],
  disabled = false,
  className = ''
}: OnboardingStepperProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepClasses = (step: number) => {
    const status = getStepStatus(step);
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 cursor-pointer';
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-gradient-to-r from-purple-500 to-blue-500 text-white transform scale-105`;
      case 'current':
        return `${baseClasses} glass-card border-2 border-purple-400 text-purple-700 dark:text-purple-300 shadow-glass scale-110`;
      case 'upcoming':
        return `${baseClasses} bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400`;
      default:
        return baseClasses;
    }
  };

  const getConnectorClasses = (step: number) => {
    const isCompleted = step < currentStep;
    return `flex-1 h-0.5 mx-2 transition-all duration-300 ${
      isCompleted 
        ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
        : 'bg-gray-200 dark:bg-gray-700'
    }`;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={getStepClasses(step)}
                onClick={() => !disabled && onStepClick?.(step)}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                  if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onStepClick?.(step);
                  }
                }}
                aria-label={`Step ${step}${stepLabels[index] ? `: ${stepLabels[index]}` : ''}`}
                aria-current={step === currentStep ? 'step' : undefined}
              >
                {getStepStatus(step) === 'completed' ? (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{step}</span>
                )}
              </div>
              
              {/* Step label */}
              {stepLabels[index] && (
                <div className="mt-2 text-xs text-center max-w-20">
                  <span className={`font-medium ${
                    getStepStatus(step) === 'current' 
                      ? 'text-purple-700 dark:text-purple-300' 
                      : getStepStatus(step) === 'completed'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {stepLabels[index]}
                  </span>
                </div>
              )}
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={getConnectorClasses(step)} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          disabled={disabled || currentStep <= 1}
          className="glass-button px-6 py-2 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          Step {currentStep} of {totalSteps}
        </div>
        
        <button
          type="button"
          onClick={onNext}
          disabled={disabled || currentStep >= totalSteps}
          className="accent-button px-6 py-2 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep >= totalSteps ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
}

// Progress bar variant for simpler use cases
interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function OnboardingProgressBar({ currentStep, totalSteps, className = '' }: ProgressBarProps) {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
        <span>Progress</span>
        <span>{currentStep} / {totalSteps}</span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(progressPercentage, 0)}%` }}
        />
      </div>
    </div>
  );
}
