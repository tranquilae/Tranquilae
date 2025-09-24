'use client';

/**
 * Health Integrations Dashboard Component
 * Manages health service connections and displays sync status
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Activity, 
  Clock, 
  Smartphone, 
  Watch,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings,
  Unlink,
  Plus,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { HealthServiceName, HealthDataType } from '@/lib/integrations/types';

// Service icon mapping
const SERVICE_ICONS: Record<HealthServiceName, React.ElementType> = {
  'google-fit': Activity,
  'fitbit': Heart,
  'apple-health': Heart,
  'samsung-health': Smartphone,
  'garmin-connect': Watch
};

// Service colors
const SERVICE_COLORS: Record<HealthServiceName, string> = {
  'google-fit': 'text-blue-600 bg-blue-50',
  'fitbit': 'text-green-600 bg-green-50',
  'apple-health': 'text-red-600 bg-red-50',
  'samsung-health': 'text-purple-600 bg-purple-50',
  'garmin-connect': 'text-orange-600 bg-orange-50'
};

// Data type labels
const DATA_TYPE_LABELS: Record<HealthDataType, string> = {
  steps: 'Steps',
  heart_rate: 'Heart Rate',
  calories: 'Calories',
  weight: 'Weight',
  sleep: 'Sleep',
  exercise: 'Exercise',
  blood_pressure: 'Blood Pressure'
};

interface HealthIntegration {
  id: string;
  serviceName: HealthServiceName;
  isActive: boolean;
  lastSyncAt?: Date;
  syncStatus: 'completed' | 'error' | 'syncing' | 'pending';
  lastError?: string;
  dataTypes: HealthDataType[];
  connectedAt: Date;
  dataPointsCount: number;
}

interface SyncStats {
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  failedJobs: number;
  runningJobs: number;
}

export function HealthIntegrationsPanel() {
  const [integrations, setIntegrations] = useState<HealthIntegration[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingService, setConnectingService] = useState<HealthServiceName | null>(null);
  const { toast } = useToast();

  // Available services that aren't connected yet
  const availableServices: HealthServiceName[] = [
    'google-fit',
    'fitbit',
    'apple-health',
    'samsung-health',
    'garmin-connect'
  ];

  const unconnectedServices = availableServices.filter(
    service => !integrations.some(integration => integration.serviceName === service)
  );

  useEffect(() => {
    loadIntegrations();
    loadSyncStats();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      loadIntegrations();
      loadSyncStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadIntegrations = async () => {
    try {
      const { fetchWithAuth } = await import('@/lib/api');
      const response = await fetchWithAuth('/api/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      } else {
        throw new Error('Failed to load integrations');
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load health integrations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStats = async () => {
    try {
      const { fetchWithAuth } = await import('@/lib/api');
      const response = await fetchWithAuth('/api/integrations/sync/stats');
      if (response.ok) {
        const data = await response.json();
        setSyncStats(data);
      }
    } catch (error) {
      console.error('Error loading sync stats:', error);
    }
  };

  const handleConnect = async (serviceName: HealthServiceName) => {
    setConnectingService(serviceName);
    
    try {
      const { fetchWithAuth } = await import('@/lib/api');
      const response = await fetchWithAuth(`/api/integrations/connect`, {
        method: 'POST',
        body: JSON.stringify({ serviceName })
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to OAuth authorization URL
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to initiate connection');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: 'Connection Failed',
        description: `Failed to connect to ${serviceName}`,
        variant: 'destructive',
      });
    } finally {
      setConnectingService(null);
    }
  };

  const handleDisconnect = async (integrationId: string, serviceName: HealthServiceName) => {
    try {
      const { fetchWithAuth } = await import('@/lib/api');
      const response = await fetchWithAuth(`/api/integrations/${integrationId}/disconnect`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Disconnected',
          description: `Successfully disconnected from ${serviceName}`,
        });
        await loadIntegrations(); // Refresh the list
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Error',
        description: `Failed to disconnect from ${serviceName}`,
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (integrationId: string, isActive: boolean) => {
    try {
      const { fetchWithAuth } = await import('@/lib/api');
      const response = await fetchWithAuth(`/api/integrations/${integrationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive })
      });

      if (response.ok) {
        toast({
          title: isActive ? 'Enabled' : 'Disabled',
          description: `Integration ${isActive ? 'enabled' : 'disabled'} successfully`,
        });
        await loadIntegrations();
      } else {
        throw new Error('Failed to update integration');
      }
    } catch (error) {
      console.error('Toggle error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update integration status',
        variant: 'destructive',
      });
    }
  };

  const handleSync = async (integrationId: string, serviceName: HealthServiceName) => {
    try {
      const { fetchWithAuth } = await import('@/lib/api');
      const response = await fetchWithAuth(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Sync Started',
          description: `Started syncing data from ${serviceName}`,
        });
        // Update local state to show syncing status
        setIntegrations(prev => prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, syncStatus: 'syncing' as const }
            : integration
        ));
        
        // Refresh after a delay
        setTimeout(loadIntegrations, 5000);
      } else {
        throw new Error('Failed to start sync');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: `Failed to sync data from ${serviceName}`,
        variant: 'destructive',
      });
    }
  };

  const getSyncStatusIcon = (status: HealthIntegration['syncStatus']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSyncStatusText = (status: HealthIntegration['syncStatus'], lastSyncAt?: Date) => {
    switch (status) {
      case 'completed':
        return lastSyncAt ? `Last synced ${formatRelativeTime(lastSyncAt)}` : 'Synced';
      case 'error':
        return 'Sync failed';
      case 'syncing':
        return 'Syncing...';
      case 'pending':
        return 'Pending sync';
      default:
        return 'Never synced';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading integrations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      {syncStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{integrations.length}</p>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{syncStats.completedJobs}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{syncStats.pendingJobs}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{syncStats.runningJobs}</p>
                  <p className="text-sm text-muted-foreground">Running</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{syncStats.failedJobs}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connected Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health Integrations
          </CardTitle>
          <CardDescription>
            Connect your health and fitness services to sync your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No integrations connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect your health and fitness services to start tracking your data
              </p>
            </div>
          ) : (
            integrations.map((integration) => {
              const IconComponent = SERVICE_ICONS[integration.serviceName];
              const colorClass = SERVICE_COLORS[integration.serviceName];
              
              return (
                <div key={integration.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium capitalize">
                          {integration.serviceName.replace('-', ' ')}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getSyncStatusIcon(integration.syncStatus)}
                          <span className="text-sm text-muted-foreground">
                            {getSyncStatusText(integration.syncStatus, integration.lastSyncAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={integration.isActive}
                        onCheckedChange={(checked) => 
                          handleToggleActive(integration.id, checked)
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(integration.id, integration.serviceName)}
                        disabled={integration.syncStatus === 'syncing'}
                      >
                        <RefreshCw className={`h-4 w-4 ${integration.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(integration.id, integration.serviceName)}
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Error Alert */}
                  {integration.syncStatus === 'error' && integration.lastError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {integration.lastError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Data Types and Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Data Types</p>
                      <div className="flex flex-wrap gap-1">
                        {integration.dataTypes.map((dataType) => (
                          <Badge key={dataType} variant="secondary" className="text-xs">
                            {DATA_TYPE_LABELS[dataType]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium mb-1">Data Points</p>
                      <p className="text-2xl font-bold">{integration.dataPointsCount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Connected {formatRelativeTime(integration.connectedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Available Integrations */}
          {unconnectedServices.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Available Integrations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unconnectedServices.map((serviceName) => {
                    const IconComponent = SERVICE_ICONS[serviceName];
                    const colorClass = SERVICE_COLORS[serviceName];
                    const isConnecting = connectingService === serviceName;
                    
                    return (
                      <Button
                        key={serviceName}
                        variant="outline"
                        className="p-4 h-auto flex flex-col gap-2"
                        onClick={() => handleConnect(serviceName)}
                        disabled={isConnecting}
                      >
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          {isConnecting ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <IconComponent className="h-5 w-5" />
                          )}
                        </div>
                        <span className="capitalize text-sm">
                          {isConnecting ? 'Connecting...' : serviceName.replace('-', ' ')}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default HealthIntegrationsPanel;
