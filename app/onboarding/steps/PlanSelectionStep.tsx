import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues
const Player = dynamic(
  () => import('@lottiefiles/react-lottie-player').then(module => module.Player),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-45 h-45 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-full">
        <div className="text-6xl">🚪</div>
      </div>
    )
  }
);

interface PlanSelectionStepProps {
  onSelect: (plan: 'explorer' | 'pathfinder') => void;
  onBack: () => void;
  initialPlan?: 'explorer' | 'pathfinder';
}

const plans = [
  {
    key: 'explorer',
    title: 'Explorer (Free Forever)',
    description: [
      'Essentials for casual users',
      'AI Basics, calorie & workout tracking',
    ],
    button: 'Start Free with Explorer',
    highlight: false,
  },
  {
    key: 'pathfinder',
    title: 'Pathfinder (£10 GBP / $13 USD PCM)',
    description: [
      'Advanced for serious users',
      'Full integrations, personalised AI coaching, detailed analytics',
      '7-Day Free Trial (card required)',
    ],
    button: 'Start 7-Day Trial',
    highlight: true,
  },
];

const PlanSelectionStep: React.FC<PlanSelectionStepProps> = ({ onSelect, onBack, initialPlan }) => {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <Player
        autoplay
        loop
        src="https://assets2.lottiefiles.com/packages/lf20_2glqweqs.json" // Placeholder for branching paths
        style={{ height: '180px', width: '180px' }}
      />
      <h2 className="text-xl font-bold text-green-800">Choose Your Plan</h2>
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl justify-center">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`flex flex-col items-center p-6 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg border-2 transition-all duration-200 w-full sm:w-80
              ${plan.highlight ? 'border-blue-400 ring-2 ring-blue-200' : 'border-transparent hover:border-green-200'}`}
          >
            <h3 className="text-lg font-bold text-blue-900 mb-2">{plan.title}</h3>
            <ul className="text-blue-900/80 text-sm mb-4 space-y-1">
              {plan.description.map((desc, i) => (
                <li key={i}>{desc}</li>
              ))}
            </ul>
            <button
              className={`mt-auto px-6 py-2 rounded-full font-semibold shadow-md transition
                ${plan.highlight ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
              onClick={() => onSelect(plan.key as 'explorer' | 'pathfinder')}
            >
              {plan.button}
            </button>
          </div>
        ))}
      </div>
      <button
        className="mt-2 text-sm text-blue-700 underline hover:text-blue-900"
        onClick={onBack}
      >
        Back
      </button>
    </div>
  );
};

export default PlanSelectionStep;
