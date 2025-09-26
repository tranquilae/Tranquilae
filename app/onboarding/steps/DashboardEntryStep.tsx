import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues
const Player = dynamic(
  () => import('@lottiefiles/react-lottie-player').then(module => module.Player),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-45 h-45 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 rounded-full">
        <div className="text-6xl">👤</div>
      </div>
    )
  }
);

interface DashboardEntryStepProps {
  plan: 'explorer' | 'pathfinder';
  onFinish: () => void;
}

const messages = {
  explorer: {
    title: "You're all set!",
    text: 'Start your health journey now.',
    lottie: 'https://assets2.lottiefiles.com/packages/lf20_1pxqjqps.json', // Achievement/unlock placeholder
    button: 'Go to Dashboard',
  },
  pathfinder: {
    title: 'Your 7-day trial has begun!',
    text: 'Enjoy your personalised AI coaching.',
    lottie: 'https://assets2.lottiefiles.com/packages/lf20_1pxqjqps.json', // Achievement/unlock placeholder
    button: 'Go to Dashboard',
  },
};

const DashboardEntryStep: React.FC<DashboardEntryStepProps> = ({ plan, onFinish }) => {
  const msg = messages[plan];
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <Player
        autoplay
        loop
        src={msg.lottie}
        style={{ height: '180px', width: '180px' }}
      />
      <h2 className="text-xl font-bold text-green-800">{msg.title}</h2>
      <p className="text-blue-900/80 max-w-md">{msg.text}</p>
      <button
        className="mt-4 px-8 py-3 rounded-full bg-green-500 text-white font-semibold shadow-lg hover:bg-green-600 transition"
        onClick={onFinish}
      >
        {msg.button}
      </button>
    </div>
  );
};

export default DashboardEntryStep;
