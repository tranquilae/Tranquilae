'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const OnboardingStepper = dynamic(() => import('./Stepper'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f5f0] via-green-50 to-blue-50">
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 w-48 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
});

export default function OnboardingPage() {
  return <OnboardingStepper />;
}
