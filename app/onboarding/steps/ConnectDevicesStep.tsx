import React, { useState } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, Watch, Activity, Heart, Calendar, CheckCircle } from 'lucide-react';

interface ConnectDevicesStepProps {
  onNext: (connected: boolean) => void;
  onBack: () => void;
}

const healthServices = [
  {
    id: 'apple-health',
    name: 'Apple Health',
    icon: <Smartphone className="w-8 h-8 text-gray-700" />,
    description: 'Sync your health data from iPhone',
    supported: ['Steps', 'Heart Rate', 'Sleep', 'Workouts'],
    color: 'bg-gray-100 hover:bg-gray-200'
  },
  {
    id: 'google-fit',
    name: 'Google Fit',
    icon: <Activity className="w-8 h-8 text-blue-600" />,
    description: 'Connect your Google fitness data',
    supported: ['Steps', 'Activities', 'Weight', 'Sleep'],
    color: 'bg-blue-50 hover:bg-blue-100'
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    icon: <Watch className="w-8 h-8 text-teal-600" />,
    description: 'Import data from your Fitbit device',
    supported: ['Steps', 'Heart Rate', 'Sleep', 'Exercise'],
    color: 'bg-teal-50 hover:bg-teal-100'
  },
  {
    id: 'samsung-health',
    name: 'Samsung Health',
    icon: <Heart className="w-8 h-8 text-purple-600" />,
    description: 'Sync Samsung health and fitness data',
    supported: ['Steps', 'Heart Rate', 'Sleep', 'Nutrition'],
    color: 'bg-purple-50 hover:bg-purple-100'
  },
  {
    id: 'garmin-connect',
    name: 'Garmin Connect',
    icon: <Calendar className="w-8 h-8 text-red-600" />,
    description: 'Connect your Garmin devices and data',
    supported: ['Activities', 'Heart Rate', 'Sleep', 'Training'],
    color: 'bg-red-50 hover:bg-red-100'
  }
];

const ConnectDevicesStep: React.FC<ConnectDevicesStepProps> = ({ onNext, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const handleServiceConnect = async (serviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Here you would implement real integrations for each service
      // For now, simulate a connection attempt
      console.log(`Connecting to ${serviceId}...`);
      await new Promise((res) => setTimeout(res, 1000));
      
      // Add to selected services
      setSelectedServices(prev => [...prev, serviceId]);
      
      // In a real implementation, you would:
      // - Redirect to OAuth flow for the service
      // - Handle the callback and store tokens
      // - Sync initial data
      
      console.log(`Successfully connected to ${serviceId}`);
    } catch (e) {
      setError(`Failed to connect to ${serviceId}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    onNext(selectedServices.length > 0);
  };

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <Player
        autoplay
        loop
        src="https://lottie.host/embed/d4e4063e-ddd8-4c3a-8e2f-8f0e8a5e4c3b/1h2k3j4l5m.lottie" // Health devices animation
        style={{ height: '180px', width: '180px' }}
      />
      <h2 className="text-2xl font-bold text-[#6ba368]">Connect Your Health Apps</h2>
      <p className="text-gray-600 max-w-lg leading-relaxed">
        Sync your health data from your favorite apps and devices for personalized insights and seamless tracking.
      </p>
      
      {selectedServices.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full max-w-md">
          <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
            <CheckCircle className="w-5 h-5" />
            Connected Services
          </div>
          <div className="text-sm text-green-600">
            {selectedServices.map(id => {
              const service = healthServices.find(s => s.id === id);
              return service ? service.name : id;
            }).join(', ')}
          </div>
        </div>
      )}
      
      {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}
      
      <div className="flex gap-4 mt-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              className="px-8 py-3 bg-[#6ba368] hover:bg-[#5a8c57] text-white font-semibold rounded-full shadow-lg transition-all duration-200"
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect Apps'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#6ba368] mb-4">Choose Health Apps to Connect</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {healthServices.map((service) => (
                <div
                  key={service.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    selectedServices.includes(service.id) 
                      ? 'border-[#6ba368] bg-green-50' 
                      : `border-gray-200 ${service.color}`
                  }`}
                  onClick={() => handleServiceConnect(service.id)}
                >
                  <div className="flex items-start gap-3">
                    {service.icon}
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {service.supported.map((feature) => (
                          <span key={feature} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                      {selectedServices.includes(service.id) && (
                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium mt-2">
                          <CheckCircle className="w-4 h-4" />
                          Connected
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleContinue}
                className="px-6"
              >
                Continue with Selected
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Button
          variant="outline"
          onClick={() => onNext(false)}
          disabled={loading}
          className="px-6 py-3 rounded-full font-semibold"
        >
          Skip for Now
        </Button>
      </div>
      
      <Button
        variant="link"
        onClick={onBack}
        disabled={loading}
        className="mt-2 text-[#6ba368] hover:text-[#5a8c57] underline"
      >
        Back
      </Button>
    </div>
  );
};

export default ConnectDevicesStep;
