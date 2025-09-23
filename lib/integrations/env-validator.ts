/**
 * Environment Variable Validation for Health Integrations
 * Auto-detects which health services are properly configured
 */

import { HealthServiceName } from './types';

export interface IntegrationEnvConfig {
  serviceName: HealthServiceName;
  requiredVars: string[];
  isConfigured: boolean;
  status: 'ready' | 'coming-soon' | 'missing-config';
  missingVars: string[];
}

/**
 * Validates if an environment variable is properly configured
 * Returns false for undefined, empty strings, or placeholder values like "#"
 */
function isValidEnvVar(value: string | undefined): boolean {
  if (!value || value.trim() === '') return false;
  if (value.trim() === '#') return false;
  if (value.startsWith('your-') || value.startsWith('REPLACE_')) return false;
  if (value.includes('placeholder') || value.includes('example')) return false;
  return true;
}

/**
 * Required environment variables for each health service
 */
const HEALTH_SERVICE_ENV_REQUIREMENTS: Record<HealthServiceName, string[]> = {
  'google-fit': [
    'GOOGLE_FIT_CLIENT_ID',
    'GOOGLE_FIT_CLIENT_SECRET'
  ],
  'fitbit': [
    'FITBIT_CLIENT_ID',
    'FITBIT_CLIENT_SECRET'
  ],
  'apple-health': [
    'APPLE_HEALTH_CLIENT_ID',
    'APPLE_HEALTH_CLIENT_SECRET'
  ],
  'samsung-health': [
    'SAMSUNG_HEALTH_CLIENT_ID',
    'SAMSUNG_HEALTH_CLIENT_SECRET'
  ],
  'garmin-connect': [
    'GARMIN_CONSUMER_KEY',
    'GARMIN_CONSUMER_SECRET'
  ]
};

/**
 * Validates environment configuration for a specific health service
 */
export function validateServiceConfig(serviceName: HealthServiceName): IntegrationEnvConfig {
  const requiredVars = HEALTH_SERVICE_ENV_REQUIREMENTS[serviceName];
  const missingVars: string[] = [];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!isValidEnvVar(value)) {
      missingVars.push(varName);
    }
  }
  
  const isConfigured = missingVars.length === 0;
  
  return {
    serviceName,
    requiredVars,
    isConfigured,
    status: isConfigured ? 'ready' : 'coming-soon',
    missingVars
  };
}

/**
 * Validates all health service environment configurations
 */
export function validateAllHealthIntegrations(): Record<HealthServiceName, IntegrationEnvConfig> {
  const services: HealthServiceName[] = [
    'google-fit',
    'fitbit', 
    'apple-health',
    'samsung-health',
    'garmin-connect'
  ];
  
  const result: Record<HealthServiceName, IntegrationEnvConfig> = {} as any;
  
  for (const service of services) {
    result[service] = validateServiceConfig(service);
  }
  
  return result;
}

/**
 * Gets list of enabled (properly configured) health services
 */
export function getEnabledHealthServices(): HealthServiceName[] {
  const allConfigs = validateAllHealthIntegrations();
  return Object.values(allConfigs)
    .filter(config => config.isConfigured)
    .map(config => config.serviceName);
}

/**
 * Gets list of disabled (not configured) health services
 */
export function getDisabledHealthServices(): HealthServiceName[] {
  const allConfigs = validateAllHealthIntegrations();
  return Object.values(allConfigs)
    .filter(config => !config.isConfigured)
    .map(config => config.serviceName);
}

/**
 * Checks if integration token encryption key is configured
 */
export function isIntegrationEncryptionConfigured(): boolean {
  return isValidEnvVar(process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY);
}

/**
 * Comprehensive health integration environment status
 */
export interface HealthIntegrationEnvStatus {
  encryptionConfigured: boolean;
  totalServices: number;
  enabledServices: number;
  disabledServices: number;
  serviceConfigs: Record<HealthServiceName, IntegrationEnvConfig>;
  readyToUse: boolean;
}

/**
 * Gets complete health integration environment status
 */
export function getHealthIntegrationStatus(): HealthIntegrationEnvStatus {
  const serviceConfigs = validateAllHealthIntegrations();
  const enabledServices = getEnabledHealthServices();
  const disabledServices = getDisabledHealthServices();
  const encryptionConfigured = isIntegrationEncryptionConfigured();
  
  return {
    encryptionConfigured,
    totalServices: Object.keys(serviceConfigs).length,
    enabledServices: enabledServices.length,
    disabledServices: disabledServices.length,
    serviceConfigs,
    readyToUse: encryptionConfigured && enabledServices.length > 0
  };
}

/**
 * Runtime check for development - logs current integration status
 */
export function logIntegrationStatus(): void {
  if (process.env.NODE_ENV === 'development') {
    const status = getHealthIntegrationStatus();
    
    console.log('🏥 Health Integrations Status:', {
      encryption: status.encryptionConfigured ? '✅ Configured' : '❌ Missing INTEGRATION_TOKEN_ENCRYPTION_KEY',
      enabled: status.enabledServices,
      disabled: status.disabledServices,
      total: `${status.enabledServices}/${status.totalServices} services ready`
    });
    
    // Log individual service status
    Object.entries(status.serviceConfigs).forEach(([service, config]) => {
      const statusIcon = config.isConfigured ? '✅' : '🔄';
      console.log(`  ${statusIcon} ${service}: ${config.status}${!config.isConfigured ? ` (missing: ${config.missingVars.join(', ')})` : ''}`);
    });
  }
}
