/**
 * React hook for checking health integration availability status
 * Automatically detects which integrations are configured and ready to use
 */

import { useState, useEffect, useCallback } from 'react';
import { HealthServiceName } from '@/lib/integrations/types';

export interface HealthIntegrationStatusData {
  encryptionConfigured: boolean;
  totalServices: number;
  enabledServices: number;
  disabledServices: number;
  readyToUse: boolean;
  services: Record<HealthServiceName, {
    serviceName: HealthServiceName;
    isConfigured: boolean;
    status: 'ready' | 'coming-soon' | 'missing-config';
    missingVars?: string[];
    requiredVars?: string[];
  }>;
}

interface UseHealthIntegrationStatusReturn {
  data: HealthIntegrationStatusData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isServiceEnabled: (serviceName: HealthServiceName) => boolean;
  getEnabledServices: () => HealthServiceName[];
  getDisabledServices: () => HealthServiceName[];
}

export function useHealthIntegrationStatus(): UseHealthIntegrationStatusReturn {
  const [data, setData] = useState<HealthIntegrationStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/health-integrations/status');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch integration status');
      }

      setData(result.data);
    } catch (err) {
      console.error('Error fetching health integration status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Helper function to check if a specific service is enabled
  const isServiceEnabled = useCallback((serviceName: HealthServiceName): boolean => {
    return data?.services[serviceName]?.isConfigured ?? false;
  }, [data]);

  // Helper function to get list of enabled services
  const getEnabledServices = useCallback((): HealthServiceName[] => {
    if (!data) return [];
    return Object.values(data.services)
      .filter(service => service.isConfigured)
      .map(service => service.serviceName);
  }, [data]);

  // Helper function to get list of disabled services
  const getDisabledServices = useCallback((): HealthServiceName[] => {
    if (!data) return [];
    return Object.values(data.services)
      .filter(service => !service.isConfigured)
      .map(service => service.serviceName);
  }, [data]);

  return {
    data,
    loading,
    error,
    refetch: fetchStatus,
    isServiceEnabled,
    getEnabledServices,
    getDisabledServices
  };
}

/**
 * Custom hook to check status of a specific health integration service
 */
export function useHealthServiceStatus(serviceName: HealthServiceName) {
  const { data, loading, error, refetch } = useHealthIntegrationStatus();
  
  const serviceConfig = data?.services[serviceName];
  
  return {
    isConfigured: serviceConfig?.isConfigured ?? false,
    status: serviceConfig?.status ?? 'coming-soon',
    loading,
    error,
    refetch,
    missingVars: serviceConfig?.missingVars,
    requiredVars: serviceConfig?.requiredVars
  };
}

/**
 * Hook that automatically refetches integration status at intervals
 * Useful for development when environment variables might change
 */
export function useHealthIntegrationStatusWithPolling(intervalMs: number = 30000) {
  const hookReturn = useHealthIntegrationStatus();
  const { refetch } = hookReturn;

  useEffect(() => {
    // Only poll in development mode
    if (process.env.NODE_ENV !== 'development') return;

    const interval = setInterval(() => {
      refetch();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [refetch, intervalMs]);

  return hookReturn;
}
