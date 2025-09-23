'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import WelcomeStep from './steps/WelcomeStep';
import GoalsStep from './steps/GoalsStep';
import ConnectDevicesStep from './steps/ConnectDevicesStep';
import PersonalisationStep from './steps/PersonalisationStep';
import PlanSelectionStep from './steps/PlanSelectionStep';
const StripePaymentStep = dynamic(() => import('./steps/StripePaymentStep'), { ssr: false });
import FinishStep from './steps/FinishStep';
import { Progress } from '@/components/ui/progress';

interface OnboardingData {
  goals: string[];
  devicesConnected: boolean | null;
  personalData: {
    name?: string;
    dateOfBirth?: string;
    sex?: 'male' | 'female' | 'other';
    height?: number;
    weight?: number;
  } | null;
  selectedPlan: 'explorer' | 'pathfinder' | null;
  paymentStatus: 'pending' | 'success' | 'failed' | null;
}

const steps = [
  { id: 0, component: WelcomeStep, title: 'Welcome' },
  { id: 1, component: GoalsStep, title: 'Goals' },
  { id: 2, component: ConnectDevicesStep, title: 'Connect' },
  { id: 3, component: PersonalisationStep, title: 'Personalise' },
  { id: 4, component: PlanSelectionStep, title: 'Plan Selection' },
  { id: 5, component: StripePaymentStep, title: 'Payment' },
  { id: 6, component: FinishStep, title: 'Finish' },
];

const STORAGE_KEY = 'tranquilae_onboarding_progress';

export default function OnboardingStepper() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    goals: [],
    devicesConnected: null,
    personalData: null,
    selectedPlan: null,
    paymentStatus: null,
  });

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setStep(parsed.step || 0);
        setOnboardingData(parsed.data || onboardingData);
      } catch (e) {
        console.error('Error parsing saved onboarding progress:', e);
      }
    }
  }, []);

  // Save progress to localStorage and server
  const saveProgress = useCallback(async (newStep: number, newData: Partial<OnboardingData>) => {
    const updatedData = { ...onboardingData, ...newData };
    setOnboardingData(updatedData);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: newStep, data: updatedData }));
    
    // Save to server
    try {
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: newStep, data: updatedData }),
      });
    } catch (error) {
      console.error('Error saving progress to server:', error);
    }
  }, [onboardingData]);

  const nextStep = async (data?: any) => {
    setError(null);
    setIsLoading(true);
    
    const newStep = Math.min(step + 1, steps.length - 1);
    let updateData: Partial<OnboardingData> = {};
    
    if (step === 1 && data) updateData.goals = data;
    if (step === 2 && typeof data === 'boolean') updateData.devicesConnected = data;
    if (step === 3 && data) updateData.personalData = data;
    
    await saveProgress(newStep, updateData);
    setStep(newStep);
    setIsLoading(false);
  };

  const prevStep = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handlePlanSelect = async (plan: 'explorer' | 'pathfinder') => {
    setError(null);
    setIsLoading(true);
    
    const updateData = { selectedPlan: plan };
    await saveProgress(plan === 'pathfinder' ? 5 : 6, updateData);
    
    if (plan === 'pathfinder') {
      setStep(5); // Stripe payment step
    } else {
      // Complete onboarding for Explorer plan
      try {
        const response = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: 'explorer' }),
        });
        
        if (response.ok) {
          setStep(6); // Finish step
        } else {
          throw new Error('Failed to complete onboarding');
        }
      } catch (error) {
        setError('Failed to complete onboarding. Please try again.');
        console.error('Onboarding completion error:', error);
      }
    }
    setIsLoading(false);
  };

  const handlePaymentSuccess = async () => {
    const updateData = { paymentStatus: 'success' as const };
    await saveProgress(6, updateData);
    setStep(6); // Finish step
  };

  const handlePaymentFailure = async () => {
    const updateData = { 
      paymentStatus: 'failed' as const, 
      selectedPlan: 'explorer' as const 
    };
    await saveProgress(6, updateData);
    setStep(6); // Finish step with downgrade
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);
      
      // Redirect to dashboard
      router.push('/dashboard?onboarding=complete');
    } catch (error) {
      setError('Error completing onboarding. Please try again.');
      setIsLoading(false);
    }
  };

  const currentStep = steps[step];
  const StepComponent = currentStep.component;
  const progressPercentage = ((step) / (steps.length - 1)) * 100;
  
  let stepProps: any = { isLoading, error };
  if (step === 0) stepProps = { ...stepProps, onNext: nextStep };
  if (step === 1) stepProps = { ...stepProps, onNext: nextStep, onBack: prevStep, initialGoals: onboardingData.goals };
  if (step === 2) stepProps = { ...stepProps, onNext: nextStep, onBack: prevStep };
  if (step === 3) stepProps = { ...stepProps, onNext: nextStep, onBack: prevStep, initialData: onboardingData.personalData };
  if (step === 4) stepProps = { ...stepProps, onSelect: handlePlanSelect, onBack: prevStep, initialPlan: onboardingData.selectedPlan };
  if (step === 5) stepProps = { ...stepProps, onSuccess: handlePaymentSuccess, onFailure: handlePaymentFailure, onBack: () => setStep(4) };
  if (step === 6) stepProps = { ...stepProps, plan: onboardingData.selectedPlan || 'explorer', onFinish: handleFinish, paymentStatus: onboardingData.paymentStatus };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f5f0] via-green-50 to-blue-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-[#6ba368]">
              Step {step + 1} of {steps.length}
            </div>
            <div className="text-sm text-gray-600">
              {currentStep.title}
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Main Content */}
        <div className="rounded-3xl bg-white/70 backdrop-blur-md shadow-xl border border-white/20 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-8"
            >
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              <StepComponent {...stepProps} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
