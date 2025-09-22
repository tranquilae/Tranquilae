import React, { useState } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';

interface ConnectDevicesStepProps {
  onNext: (connected: boolean) => void;
  onBack: () => void;
}

const ConnectDevicesStep: React.FC<ConnectDevicesStepProps> = ({ onNext, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Placeholder for device connection logic
  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      // Here you would implement real integrations for Apple Health, Google Fit, Fitbit, etc.
      // For now, simulate a successful connection
      await new Promise((res) => setTimeout(res, 1200));
      onNext(true);
    } catch (e) {
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <Player
        autoplay
        loop
        src="https://assets2.lottiefiles.com/packages/lf20_2ks3pjua.json" // Placeholder for device sync
        style={{ height: '180px', width: '180px' }}
      />
      <h2 className="text-xl font-bold text-green-800">Connect Your Devices</h2>
      <p className="text-blue-900/80 max-w-md">
        Connect your <span className="font-semibold">Apple Health</span>, <span className="font-semibold">Google Fit</span>, or <span className="font-semibold">Fitbit</span> for real-time updates.
      </p>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex gap-4 mt-4">
        <button
          className="px-8 py-2 rounded-full bg-green-500 text-white font-semibold shadow-lg hover:bg-green-600 transition disabled:opacity-50"
          onClick={handleConnect}
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect Now'}
        </button>
        <button
          className="px-6 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
          onClick={() => onNext(false)}
          disabled={loading}
        >
          Skip for Now
        </button>
      </div>
      <button
        className="mt-2 text-sm text-blue-700 underline hover:text-blue-900"
        onClick={onBack}
        disabled={loading}
      >
        Back
      </button>
    </div>
  );
};

export default ConnectDevicesStep;
