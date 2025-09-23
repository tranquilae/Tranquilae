'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Watch, Activity, Heart, Calendar, CheckCircle, ExternalLink, Settings, Clock, AlertCircle } from 'lucide-react';
import { useHealthIntegrationStatus } from '@/hooks/useHealthIntegrationStatus';
import { HealthServiceName } from '@/lib/integrations/types';

interface HealthIntegration {
  id: HealthServiceName;
  name: string;
  icon: React.ReactNode;
  description: string;
  status: 'connected' | 'pending' | 'disconnected' | 'coming-soon';
  features: string[];
  lastSync?: Date;
  authUrl?: string; // For OAuth flows
  isConfigured?: boolean;
  configStatus?: 'ready' | 'coming-soon' | 'missing-config';
}

const getBaseIntegrationConfig = (): Omit<HealthIntegration, 'id' | 'name' | 'icon' | 'description' | 'authUrl' | 'features'>[] => [
  {
    status: 'disconnected',
    isConfigured: false,
    configStatus: 'coming-soon'
  }
];

const INTEGRATION_CONFIGS: Record<HealthServiceName, Omit<HealthIntegration, 'status' | 'isConfigured' | 'configStatus'>> = {
  'apple-health': {
    id: 'apple-health',
    name: 'Apple Health',
    icon: <Smartphone className="w-6 h-6 text-gray-700" />,
    description: 'Sync your health data from iPhone and Apple Watch',
    features: ['Steps', 'Heart Rate', 'Sleep', 'Workouts', 'Nutrition'],
    authUrl: '/api/integrations/apple-health/auth'
  },
  'google-fit': {
    id: 'google-fit',
    name: 'Google Fit',
    icon: <Activity className="w-6 h-6 text-blue-600" />,
    description: 'Connect your Google fitness and health data',
    features: ['Steps', 'Activities', 'Weight', 'Sleep', 'Heart Rate'],
    authUrl: '/api/integrations/google-fit/auth'
  },
  'fitbit': {
    id: 'fitbit',
    name: 'Fitbit',
    icon: <Watch className="w-6 h-6 text-teal-600" />,
    description: 'Import data from your Fitbit devices',
    features: ['Steps', 'Heart Rate', 'Sleep', 'Exercise', 'Weight'],
    authUrl: '/api/integrations/fitbit/auth'
  },
  'samsung-health': {
    id: 'samsung-health',
    name: 'Samsung Health',
    icon: <Heart className="w-6 h-6 text-purple-600" />,
    description: 'Sync Samsung health and fitness data',
    features: ['Steps', 'Heart Rate', 'Sleep', 'Nutrition', 'Workouts'],
    authUrl: '/api/integrations/samsung-health/auth'
  },
  'garmin-connect': {
    id: 'garmin-connect',
    name: 'Garmin Connect',
    icon: <Calendar className="w-6 h-6 text-red-600" />,
    description: 'Connect your Garmin devices and training data',
    features: ['Activities', 'Heart Rate', 'Sleep', 'Training', 'Recovery'],
    authUrl: '/api/integrations/garmin/auth'
  }
};

interface HealthIntegrationsProps {
  selectedServices?: string[]; // Services selected during onboarding
}

export default function HealthIntegrations({ selectedServices = [] }: HealthIntegrationsProps) {
  const [integrations, setIntegrations] = useState<HealthIntegration[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const { data: integrationStatus, loading: statusLoading, error: statusError } = useHealthIntegrationStatus();

  // Update integrations based on environment configuration and user connection status
  useEffect(() => {
    if (!integrationStatus) return;

    const updatedIntegrations: HealthIntegration[] = Object.entries(INTEGRATION_CONFIGS).map(([serviceId, config]) => {
      const serviceName = serviceId as HealthServiceName;
      const envConfig = integrationStatus.services[serviceName];
      
      return {
        ...config,
        status: envConfig?.isConfigured ? 'disconnected' : 'coming-soon', // Will be updated with user connection status
        isConfigured: envConfig?.isConfigured ?? false,
        configStatus: envConfig?.status ?? 'coming-soon'
      };
    });

    setIntegrations(updatedIntegrations);

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      const enabledServices = updatedIntegrations.filter(i => i.isConfigured).map(i => i.name);
      const comingSoonServices = updatedIntegrations.filter(i => !i.isConfigured).map(i => i.name);
      
      console.log('🏥 Health Integrations Updated:', {
        enabled: enabledServices.length > 0 ? enabledServices : 'None',
        comingSoon: comingSoonServices.length > 0 ? comingSoonServices : 'None',
        encryptionKey: integrationStatus.encryptionConfigured ? '✅' : '❌ Missing INTEGRATION_TOKEN_ENCRYPTION_KEY'
      });
    }
  }, [integrationStatus]);

  // Load user's actual connection status
  useEffect(() => {
    if (integrations.length > 0) {
      loadUserIntegrationStatus();
    }
  }, [integrations]);

  const loadUserIntegrationStatus = async () => {
    try {
      // TODO: Implement API call to get user's actual integration connections
      // const response = await fetch('/api/user/integrations');
      // const userIntegrations = await response.json();
      // Update integrations with user's actual connection status
      console.log('Loading user integration status...');
    } catch (error) {
      console.error('Failed to load user integration status:', error);
    }
  };

  const handleConnect = async (integration: HealthIntegration) => {
    // Check if integration is properly configured
    if (!integration.isConfigured) {
      console.error(`${integration.name} is not configured. Environment variables missing.`);
      return;
    }

    if (!integration.authUrl) {
      console.error('No auth URL configured for', integration.name);
      return;
    }

    setConnecting(integration.id);

    try {
      console.log(`Connecting to ${integration.name}...`);
      
      // Redirect to OAuth flow
      if (typeof window !== 'undefined') {
        window.location.href = integration.authUrl;
      }
    } catch (error) {
      console.error(`Failed to connect to ${integration.name}:`, error);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      // TODO: Implement API call to disconnect integration
      // await fetch(`/api/user/integrations/${integrationId}`, { method: 'DELETE' });
      
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, status: 'disconnected' as const, lastSync: undefined }
            : integration
        )
      );
      
      console.log(`Disconnected ${integrationId}`);
    } catch (error) {
      console.error(`Failed to disconnect ${integrationId}:`, error);
    }
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const configuredCount = integrations.filter(i => i.isConfigured).length;
  const comingSoonCount = integrations.filter(i => i.status === 'coming-soon').length;
  const priorityIntegrations = selectedServices.length > 0 
    ? integrations.filter(i => selectedServices.includes(i.id))
    : integrations;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Health App Integrations</h2>
          <p className="text-gray-600 mt-1">
            Connect your health apps to get personalized insights and seamless data sync.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={connectedCount > 0 ? "default" : "secondary"} className="text-sm">
            {connectedCount} Connected
          </Badge>
          <Badge variant={configuredCount > 0 ? "default" : "outline"} className="text-sm">
            {configuredCount} Ready
          </Badge>
          {comingSoonCount > 0 && (
            <Badge variant="outline" className="text-sm text-orange-600 border-orange-300">
              {comingSoonCount} Coming Soon
            </Badge>
          )}
        </div>
      </div>

      {selectedServices.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900">Complete Your Setup</CardTitle>
            <CardDescription className="text-blue-700">
              You selected these apps during onboarding. Connect them now to start tracking your wellness data.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {priorityIntegrations.map((integration) => (
          <Card 
            key={integration.id} 
            className={`transition-all duration-200 ${
              selectedServices.includes(integration.id) ? 'border-blue-300 shadow-md' : 'hover:shadow-md'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {integration.icon}
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={integration.status === 'connected' ? 'default' : integration.status === 'coming-soon' ? 'outline' : 'secondary'}
                        className={`text-xs ${
                          integration.status === 'coming-soon' ? 'text-orange-600 border-orange-300' : ''
                        }`}
                      >
                        {integration.status === 'connected' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Connected
                          </>
                        ) : integration.status === 'pending' ? (
                          'Connecting...'
                        ) : integration.status === 'coming-soon' ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Coming Soon
                          </>
                        ) : (
                          'Not Connected'
                        )}
                      </Badge>
                      {selectedServices.includes(integration.id) && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                          Priority
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {integration.status === 'connected' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(integration.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <CardDescription className="mb-3">
                {integration.description}
              </CardDescription>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {integration.features.map((feature) => (
                  <Badge key={feature} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>

              {integration.status === 'connected' ? (
                <div className="space-y-2">
                  {integration.lastSync && (
                    <p className="text-xs text-gray-500">
                      Last synced: {integration.lastSync.toLocaleDateString()}
                    </p>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => console.log('Sync now clicked')}
                  >
                    Sync Now
                  </Button>
                </div>
              ) : integration.status === 'coming-soon' ? (
                <Button 
                  variant="outline"
                  className="w-full text-orange-600 border-orange-300 hover:bg-orange-50" 
                  disabled
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => handleConnect(integration)}
                  disabled={connecting === integration.id || !integration.isConfigured}
                >
                  {connecting === integration.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect {integration.name}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {connectedCount === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Integrations Connected</h3>
            <p className="text-gray-500 max-w-md">
              Connect your health apps to start getting personalized insights and seamless data tracking.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
