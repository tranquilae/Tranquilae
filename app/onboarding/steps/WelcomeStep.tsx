'use client';

import React from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Sparkles, Heart, Brain } from 'lucide-react';

// Lazy load Lottie player for performance
const LottiePlayer = dynamic(
  () => import('@lottiefiles/react-lottie-player').then(module => module.Player),
  { ssr: false, loading: () => <WelcomeSVG /> }
);

// SVG Fallback for low-bandwidth
const WelcomeSVG = () => (
  <div className="w-48 h-48 flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100 rounded-full">
    <div className="text-6xl">🌅</div>
  </div>
);

interface WelcomeStepProps {
  onNext: () => void;
  isLoading?: boolean;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, isLoading }) => {

  return (
    <div className="flex flex-col items-center text-center space-y-8">
      {/* Hero Animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative"
      >
        <LottiePlayer
          autoplay
          loop
          src="https://lottie.host/4d5a5c8e-8c2a-4f5e-b8a3-9e1f2d3c4b5a/bK9qJ8uXrR.json" // Optimized welcome animation
          style={{ height: '200px', width: '200px' }}
        />
        
        {/* Floating elements */}
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-4 -right-4"
        >
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="space-y-6"
      >
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#6ba368] to-[#a7c7e7] bg-clip-text text-transparent">
            Welcome to Tranquilae
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Your personal wellness companion
          </p>
        </div>

        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
          Let's create a personalized wellness journey that fits your lifestyle and goals. 
          We'll guide you through a few simple steps.
        </p>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center space-x-8 pt-4"
        >
          <div className="flex flex-col items-center space-y-2">
            <Heart className="w-8 h-8 text-red-400" />
            <span className="text-xs text-gray-500">Health</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Brain className="w-8 h-8 text-blue-400" />
            <span className="text-xs text-gray-500">Mindfulness</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Sparkles className="w-8 h-8 text-green-400" />
            <span className="text-xs text-gray-500">Wellness</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="pt-6"
      >
        <Button
          onClick={onNext}
          disabled={isLoading}
          size="lg"
          className="px-10 py-4 bg-gradient-to-r from-[#6ba368] to-[#5a8c57] hover:from-[#5a8c57] to-[#4a7a47] text-white font-semibold rounded-full shadow-xl transform transition-all duration-200 hover:scale-105 hover:shadow-2xl"
          aria-label="Start onboarding process"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Starting...
            </>
          ) : (
            "Let's Get Started"
          )}
        </Button>
      </motion.div>

      {/* Progress hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-xs text-gray-400 mt-4"
      >
        Takes about 2-3 minutes to complete
      </motion.p>
    </div>
  );
};

export default WelcomeStep;
