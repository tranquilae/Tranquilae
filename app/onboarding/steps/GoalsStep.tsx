import React, { useState } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';

const GOALS = [
  { key: 'nutrition', label: 'Nutrition & Calories', icon: '🥗' },
  { key: 'fitness', label: 'Fitness & Workouts', icon: '🏋️' },
  { key: 'mindfulness', label: 'Mindfulness & Journaling', icon: '🧘' },
  { key: 'balance', label: 'Goal Setting & Lifestyle Balance', icon: '🎯' },
];

interface GoalsStepProps {
  onNext: (selected: string[]) => void;
  onBack: () => void;
  initialGoals?: string[];
}

const GoalsStep: React.FC<GoalsStepProps> = ({ onNext, onBack, initialGoals = [] }) => {
  const [selected, setSelected] = useState<string[]>(initialGoals);

  const toggleGoal = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]
    );
  };

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <Player
        autoplay
        loop
        src="https://assets2.lottiefiles.com/packages/lf20_8wREpI.json" // Placeholder for goals/paths
        style={{ height: '180px', width: '180px' }}
      />
      <h2 className="text-xl font-bold text-green-800">Choose Your Goals</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        {GOALS.map((goal) => (
          <button
            key={goal.key}
            type="button"
            className={`flex flex-col items-center justify-center p-5 rounded-2xl bg-white/70 backdrop-blur-md shadow-md border-2 transition-all duration-200
              ${selected.includes(goal.key) ? 'border-green-500 ring-2 ring-green-300' : 'border-transparent hover:border-blue-200'}`}
            onClick={() => toggleGoal(goal.key)}
          >
            <span className="text-3xl mb-2">{goal.icon}</span>
            <span className="font-medium text-blue-900/90">{goal.label}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-4 mt-6">
        <button
          className="px-6 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="px-8 py-2 rounded-full bg-green-500 text-white font-semibold shadow-lg hover:bg-green-600 transition disabled:opacity-50"
          onClick={() => onNext(selected)}
          disabled={selected.length === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default GoalsStep;
