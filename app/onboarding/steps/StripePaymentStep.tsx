import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues
const Player = dynamic(
  () => import('@lottiefiles/react-lottie-player').then(module => module.Player),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-45 h-45 flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 rounded-full">
        <div className="text-6xl">💳</div>
      </div>
    )
  }
);
import { paymentAPI, handleAPIError } from '@/lib/api';

interface StripePaymentStepProps {
  onSuccess: () => void;
  onFailure: () => void;
  onBack: () => void;
}

const plans = [
  {
    key: 'monthly' as const,
    label: 'Monthly',
    price: '£10 GBP / $13 USD',
  },
  {
    key: 'yearly' as const,
    label: 'Yearly',
    price: '£100 GBP / $130 USD',
  },
] as const;

const StripePaymentStep: React.FC<StripePaymentStepProps> = ({ onSuccess, onFailure, onBack }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calls backend API to create Stripe Checkout session
  const handleCheckout = async (planKey: 'monthly' | 'yearly') => {
    setLoading(planKey);
    setError(null);
    try {
      const { url } = await paymentAPI.createCheckoutSession(planKey);
      
      if (url && typeof window !== 'undefined') {
        window.location.href = url; // Redirect to Stripe Checkout
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = handleAPIError(error);
      setError(errorMessage);
      onFailure();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <Player
        autoplay
        loop
        src="https://lottie.host/embed/4a834ebb-31fc-42df-9ae4-8c29d6f6b7a4/h8PtaGHyJm.lottie" // Payment/credit card animation
        style={{ height: '180px', width: '180px' }}
      />
      <h2 className="text-xl font-bold text-green-800">Start Your 7-Day Free Trial</h2>
      <p className="text-blue-900/80 max-w-md">
        Enjoy full access to Pathfinder features. Card required for trial. No charge today. Cancel anytime.
      </p>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
        {plans.map((plan) => (
          <button
            key={plan.key}
            className={`flex-1 px-6 py-4 rounded-2xl bg-white/80 backdrop-blur-md shadow-md border-2 font-semibold text-blue-900 transition-all duration-200
              ${loading === plan.key ? 'opacity-60 cursor-wait' : 'hover:border-green-300'}
            `}
            onClick={() => handleCheckout(plan.key)}
            disabled={!!loading}
          >
            <div className="text-lg font-bold mb-1">{plan.label}</div>
            <div className="text-blue-700 mb-1">{plan.price}</div>
            <div className="text-xs text-blue-500">7-Day Free Trial</div>
          </button>
        ))}
      </div>
      <button
        className="mt-2 text-sm text-blue-700 underline hover:text-blue-900"
        onClick={onBack}
        disabled={!!loading}
      >
        Back
      </button>
    </div>
  );
};

export default StripePaymentStep;
