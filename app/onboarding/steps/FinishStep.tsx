'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Player } from '@lottiefiles/react-lottie-player';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

interface FinishStepProps {
  plan: 'explorer' | 'pathfinder';
  onFinish: () => void;
  paymentStatus?: 'pending' | 'success' | 'failed' | null;
  isLoading?: boolean;
}

const FinishStep: React.FC<FinishStepProps> = ({ 
  plan, 
  onFinish, 
  paymentStatus, 
  isLoading 
}) => {
  const isDowngraded = paymentStatus === 'failed' && plan === 'explorer';

  useEffect(() => {
    // Auto-redirect after 5 seconds if not clicked
    const timeout = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => clearTimeout(timeout);
  }, [onFinish]);

  const getContent = () => {
    if (isDowngraded) {
      return {
        icon: <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />,
        title: "Welcome to Explorer",
        subtitle: "Payment verification failed - don't worry!",
        message: "You've been automatically placed on our Explorer plan. You can upgrade to Pathfinder anytime from your dashboard.",
        buttonText: "Continue to Dashboard",
        bgColor: "from-orange-50 to-yellow-50",
        borderColor: "border-orange-200"
      };
    }

    if (plan === 'pathfinder') {
      return {
        lottie: "https://assets2.lottiefiles.com/packages/lf20_touohxv0.json", // Success/celebration animation
        title: "Welcome to Pathfinder!",
        subtitle: "Your 7-day free trial has started",
        message: "You now have full access to personalized AI coaching, advanced analytics, and all integrations. Enjoy exploring!",
        buttonText: "Enter Your Dashboard",
        bgColor: "from-blue-50 to-purple-50",
        borderColor: "border-blue-200"
      };
    }

    return {
      lottie: "https://assets2.lottiefiles.com/packages/lf20_s2lryxtd.json", // Welcome animation
      title: "Welcome to Explorer!",
      subtitle: "You're all set to begin your wellness journey",
      message: "Start tracking your wellness with our essential features. Upgrade to Pathfinder anytime for advanced coaching and analytics.",
      buttonText: "Start Your Journey",
      bgColor: "from-green-50 to-emerald-50",
      borderColor: "border-green-200"
    };
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center text-center space-y-6">
      {/* Animation or Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative"
      >
        {content.lottie ? (
          <Player
            autoplay
            loop={false}
            src={content.lottie}
            style={{ height: '200px', width: '200px' }}
          />
        ) : (
          content.icon
        )}
        {plan === 'pathfinder' && !isDowngraded && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </motion.div>
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-4"
      >
        <h1 className="text-3xl font-bold text-[#6ba368]">
          {content.title}
        </h1>
        
        <p className="text-lg font-medium text-blue-900/80">
          {content.subtitle}
        </p>
        
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          {content.message}
        </p>
      </motion.div>

      {/* Plan Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className={`p-6 rounded-2xl bg-gradient-to-br ${content.bgColor} border ${content.borderColor} w-full max-w-md`}
      >
        <div className="flex items-center justify-center space-x-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-800">
            {plan === 'pathfinder' ? 'Pathfinder Plan Active' : 'Explorer Plan Active'}
          </span>
        </div>
        
        <div className="text-sm text-gray-600 space-y-2">
          {plan === 'pathfinder' ? (
            <>
              <div>✓ 7-day free trial started</div>
              <div>✓ Full AI coaching enabled</div>
              <div>✓ Advanced analytics unlocked</div>
              <div>✓ All integrations available</div>
            </>
          ) : (
            <>
              <div>✓ Essential tracking tools</div>
              <div>✓ Basic AI insights</div>
              <div>✓ Core wellness features</div>
              {isDowngraded && (
                <div className="text-orange-600 font-medium">
                  → Upgrade anytime in settings
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="pt-4"
      >
        <Button
          onClick={onFinish}
          disabled={isLoading}
          className="px-8 py-3 bg-[#6ba368] hover:bg-[#5a8c57] text-white font-semibold rounded-full shadow-lg transform transition-all duration-200 hover:scale-105"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Loading...
            </>
          ) : (
            content.buttonText
          )}
        </Button>
      </motion.div>

      {/* Auto-redirect notice */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="text-xs text-gray-500 mt-4"
      >
        Redirecting automatically in a few seconds...
      </motion.p>
    </div>
  );
};

export default FinishStep;
