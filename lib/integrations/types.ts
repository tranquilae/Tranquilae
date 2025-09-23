/**
 * Core types and interfaces for health app integrations
 */

export type HealthServiceName = 'apple-health' | 'google-fit' | 'fitbit' | 'samsung-health' | 'garmin-connect';

export type HealthDataType = 'steps' | 'heart_rate' | 'sleep' | 'weight' | 'calories' | 'exercise' | 'blood_pressure';

export type IntegrationStatus = 'connected' | 'pending' | 'disconnected' | 'error';

export type SyncStatus = 'idle' | 'syncing' | 'error';

/**
 * Health service configuration
 */
export interface HealthServiceConfig {
  name: HealthServiceName;
  displayName: string;
  description: string;
  icon: string;
  colors: {
    primary: string;
    secondary: string;
  };
  supportedDataTypes: HealthDataType[];
  oauth: {
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
    requiresPKCE: boolean;
    clientId: string;
    clientSecret?: string; // Not needed for PKCE
  };
  api: {
    baseUrl: string;
    rateLimits: {
      requestsPerMinute: number;
      requestsPerDay: number;
    };
  };
  webhooks?: {
    supported: boolean;
    subscriptionUrl?: string;
    verificationRequired?: boolean;
  };
}

/**
 * OAuth flow state
 */
export interface OAuthFlowState {
  userId: string;
  serviceName: HealthServiceName;
  state: string;
  codeVerifier?: string; // For PKCE
  codeChallengeMethod?: 'S256' | 'plain';
  redirectUrl?: string;
  scopes: string[];
  expiresAt: Date;
}

/**
 * OAuth token response
 */
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type: string;
}

/**
 * Health data point structure
 */
export interface HealthDataPoint {
  id?: string;
  userId: string;
  integrationId: string;
  dataType: HealthDataType;
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: {
    source?: string;
    device?: string;
    confidence?: number;
    duration?: number; // For activities/sleep
    additionalData?: Record<string, any>;
  };
}

/**
 * Data sync configuration
 */
export interface DataSyncConfig {
  autoSync: boolean;
  dataTypes: HealthDataType[];
  syncFrequency: 'hourly' | 'daily' | 'weekly';
  syncWindow: {
    startHour: number; // 0-23
    endHour: number;   // 0-23
  };
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    initialDelay: number; // milliseconds
  };
}

/**
 * Integration sync result
 */
export interface SyncResult {
  serviceName: HealthServiceName;
  success: boolean;
  dataPointsSynced: number;
  errors?: string[];
  lastSyncAt: Date;
  nextSyncAt?: Date;
  metadata?: {
    syncDuration: number; // milliseconds
    apiCallsUsed: number;
    dataTypesCovered: HealthDataType[];
  };
}

/**
 * Service-specific API responses
 */
export namespace ServiceAPIs {
  // Apple Health
  export interface AppleHealthData {
    data: {
      type: string;
      value: number;
      unit: string;
      startDate: string;
      endDate: string;
      source: string;
      metadata?: Record<string, any>;
    }[];
  }

  // Google Fit
  export interface GoogleFitDataSet {
    dataSourceId: string;
    maxEndTimeNs: string;
    minStartTimeNs: string;
    point: {
      dataTypeName: string;
      endTimeNanos: string;
      startTimeNanos: string;
      value: {
        fpVal?: number;
        intVal?: number;
        stringVal?: string;
      }[];
    }[];
  }

  // Fitbit
  export interface FitbitResponse<T> {
    [key: string]: T[];
  }

  export interface FitbitActivityData {
    dateTime: string;
    value: string;
  }

  // Apple Health FHIR API types
  export interface AppleHealthFHIRBundle {
    resourceType: 'Bundle';
    entry?: Array<{
      resource: AppleHealthObservation | AppleHealthDiagnosticReport | AppleHealthPatient;
    }>;
  }
  
  export interface AppleHealthObservation {
    resourceType: 'Observation';
    id?: string;
    status: string;
    category?: Array<{ coding?: Array<{ display?: string }> }>;
    code?: { coding?: Array<{ code?: string }> };
    effectiveDateTime?: string;
    effectivePeriod?: { start?: string; end?: string };
    valueQuantity?: { value?: number; unit?: string };
    component?: Array<{ valueQuantity?: { value?: number; unit?: string } }>;
  }
  
  export interface AppleHealthDiagnosticReport {
    resourceType: 'DiagnosticReport';
    id?: string;
    status: string;
    category?: Array<{ coding?: Array<{ display?: string }> }>;
    effectiveDateTime?: string;
    effectivePeriod?: { start?: string; end?: string };
  }
  
  export interface AppleHealthPatient {
    resourceType: 'Patient';
    id?: string;
    name?: Array<{ given?: string[]; family?: string }>;
    telecom?: Array<{ system?: string; value?: string }>;
  }

  // Samsung Health
  export interface SamsungHealthResponse {
    data: SamsungHealthDataItem[];
    count: number;
  }
  
  export interface SamsungHealthDataItem {
    uuid?: string;
    id?: string;
    start_time: number;
    end_time?: number;
    duration?: number;
    count?: number;
    value?: number;
    heart_rate?: number;
    calorie?: number;
    weight?: number;
    systolic?: number;
    diastolic?: number;
    device_uuid?: string;
    package_name?: string;
    data_type_name?: string;
  }
  
  // Legacy Samsung Health (keeping for compatibility)
  export interface SamsungHealthData {
    count: number;
    result: {
      dateuuid: string;
      day_time: string;
      count?: number;
      calorie?: number;
      distance?: number;
      [key: string]: any;
    }[];
  }

  // Garmin Connect
  export interface GarminActivity {
    activityId: number;
    activityName: string;
    description?: string;
    startTimeGMT: string;
    activityType?: {
      typeId: number;
      typeKey: string;
    };
    distance?: number;
    duration: number;
    calories?: number;
    averageHR?: number;
    maxHR?: number;
    averageSpeed?: number;
    maxSpeed?: number;
    elevationGain?: number;
    deviceId?: string;
  }
  
  export interface GarminDailyWellness {
    calendarDate: string;
    totalSteps: number;
    totalKilocalories: number;
    activeKilocalories?: number;
    bmrKilocalories?: number;
    deviceId?: string;
  }
  
  export interface GarminSleepData {
    calendarDate: string;
    sleepTimeSeconds: number;
    deepSleepSeconds?: number;
    lightSleepSeconds?: number;
    remSleepSeconds?: number;
    awakeSleepSeconds?: number;
    sleepStartTimestampGMT?: string;
    sleepEndTimestampGMT?: string;
    deviceId?: string;
  }
}

/**
 * Error types for integrations
 */
export class IntegrationError extends Error {
  constructor(
    message: string,
    public serviceName: HealthServiceName,
    public code: string,
    public isRetryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}

export class OAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public description?: string
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

/**
 * Integration service interface
 */
export interface HealthIntegrationService {
  serviceName: HealthServiceName;
  config: HealthServiceConfig;
  
  // OAuth flow
  initiateOAuth(userId: string, scopes: string[]): Promise<{ authUrl: string; state: string }>;
  handleOAuthCallback(code: string, state: string): Promise<OAuthTokenResponse>;
  refreshToken(refreshToken: string): Promise<OAuthTokenResponse>;
  
  // Data sync
  syncHealthData(accessToken: string, dataTypes: HealthDataType[], fromDate: Date, toDate: Date): Promise<HealthDataPoint[]>;
  
  // Webhook support (optional)
  setupWebhook?(accessToken: string, webhookUrl: string): Promise<void>;
  handleWebhook?(payload: any, signature: string): Promise<HealthDataPoint[]>;
  
  // Utility methods
  validateToken(accessToken: string): Promise<boolean>;
  getUserInfo(accessToken: string): Promise<{ id: string; name?: string; email?: string }>;
}

/**
 * Integration manager interface
 */
export interface IntegrationManager {
  // Service registration
  registerService(service: HealthIntegrationService): void;
  getService(serviceName: HealthServiceName): HealthIntegrationService | null;
  
  // Integration management
  initiateConnection(userId: string, serviceName: HealthServiceName): Promise<{ authUrl: string }>;
  completeConnection(userId: string, code: string, state: string): Promise<void>;
  disconnectService(userId: string, serviceName: HealthServiceName): Promise<void>;
  
  // Data synchronization
  syncUserData(userId: string, serviceName?: HealthServiceName): Promise<SyncResult[]>;
  scheduleDataSync(userId: string, config: DataSyncConfig): Promise<void>;
  
  // Status and monitoring
  getUserIntegrations(userId: string): Promise<IntegrationStatus[]>;
  getIntegrationHealth(): Promise<{ serviceName: HealthServiceName; status: 'healthy' | 'degraded' | 'down' }[]>;
}

/**
 * Webhook payload types
 */
export interface WebhookPayload {
  serviceName: HealthServiceName;
  userId: string;
  eventType: 'data_updated' | 'permission_revoked' | 'rate_limit_exceeded';
  timestamp: Date;
  data?: any;
}

/**
 * Configuration for each service
 */
export const HEALTH_SERVICE_CONFIGS_BASE: Record<HealthServiceName, HealthServiceConfig> = {
  'apple-health': {
    name: 'apple-health',
    displayName: 'Apple Health',
    description: 'Sync your health data from iPhone and Apple Watch',
    icon: '🍎',
    colors: {
      primary: '#007AFF',
      secondary: '#F7F7F7'
    },
    supportedDataTypes: ['steps', 'heart_rate', 'sleep', 'weight', 'calories', 'exercise'],
    oauth: {
      authUrl: 'https://developer.apple.com/health/authorize',
      tokenUrl: 'https://developer.apple.com/health/token',
      scopes: ['healthkit.read'],
      requiresPKCE: true,
      clientId: process.env.APPLE_HEALTH_CLIENT_ID || ''
    },
    api: {
      baseUrl: 'https://api.health.apple.com/v1',
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerDay: 10000
      }
    },
    webhooks: {
      supported: false // Apple Health doesn't support webhooks directly
    }
  },
  'google-fit': {
    name: 'google-fit',
    displayName: 'Google Fit',
    description: 'Connect your Google fitness and health data',
    icon: '🏃‍♂️',
    colors: {
      primary: '#4285F4',
      secondary: '#F1F3F4'
    },
    supportedDataTypes: ['steps', 'heart_rate', 'calories', 'weight', 'sleep'],
    oauth: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.body.read',
        'https://www.googleapis.com/auth/fitness.heart_rate.read'
      ],
      requiresPKCE: true,
      clientId: process.env.GOOGLE_FIT_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_FIT_CLIENT_SECRET || ''
    },
    api: {
      baseUrl: 'https://www.googleapis.com/fitness/v1',
      rateLimits: {
        requestsPerMinute: 100,
        requestsPerDay: 25000
      }
    },
    webhooks: {
      supported: true,
      subscriptionUrl: 'https://www.googleapis.com/fitness/v1/users/{userId}/subscriptions'
    }
  },
  'fitbit': {
    name: 'fitbit',
    displayName: 'Fitbit',
    description: 'Import data from your Fitbit devices',
    icon: '⌚',
    colors: {
      primary: '#00B2A9',
      secondary: '#F0F9F9'
    },
    supportedDataTypes: ['steps', 'heart_rate', 'sleep', 'calories', 'exercise', 'weight'],
    oauth: {
      authUrl: 'https://www.fitbit.com/oauth2/authorize',
      tokenUrl: 'https://api.fitbit.com/oauth2/token',
      scopes: ['activity', 'heartrate', 'sleep', 'weight', 'profile'],
      requiresPKCE: true,
      clientId: process.env.FITBIT_CLIENT_ID || '',
      clientSecret: process.env.FITBIT_CLIENT_SECRET || ''
    },
    api: {
      baseUrl: 'https://api.fitbit.com/1',
      rateLimits: {
        requestsPerMinute: 150,
        requestsPerDay: 100000
      }
    },
    webhooks: {
      supported: true,
      subscriptionUrl: 'https://api.fitbit.com/1/user/-/subscriptions.json',
      verificationRequired: true
    }
  },
  'samsung-health': {
    name: 'samsung-health',
    displayName: 'Samsung Health',
    description: 'Sync Samsung health and fitness data',
    icon: '📱',
    colors: {
      primary: '#1428A0',
      secondary: '#F7F7FF'
    },
    supportedDataTypes: ['steps', 'heart_rate', 'sleep', 'calories', 'weight'],
    oauth: {
      authUrl: 'https://account.samsung.com/mobile/account/check.do',
      tokenUrl: 'https://auth.samsunghealth.com/auth/token',
      scopes: ['health:read'],
      requiresPKCE: false,
      clientId: process.env.SAMSUNG_HEALTH_CLIENT_ID || '',
      clientSecret: process.env.SAMSUNG_HEALTH_CLIENT_SECRET || ''
    },
    api: {
      baseUrl: 'https://api.samsunghealth.com',
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerDay: 5000
      }
    }
  },
  'garmin-connect': {
    name: 'garmin-connect',
    displayName: 'Garmin Connect',
    description: 'Connect your Garmin devices and training data',
    icon: '🚴‍♂️',
    colors: {
      primary: '#007CC3',
      secondary: '#F0F9FF'
    },
    supportedDataTypes: ['exercise', 'heart_rate', 'sleep', 'calories'],
    oauth: {
      authUrl: 'https://connect.garmin.com/oauthConfirm',
      tokenUrl: 'https://connect.garmin.com/oauth-service/oauth/request_token',
      scopes: ['read'],
      requiresPKCE: false,
      clientId: process.env.GARMIN_CONSUMER_KEY || '',
      clientSecret: process.env.GARMIN_CONSUMER_SECRET || ''
    },
    api: {
      baseUrl: 'https://apis.garmin.com',
      rateLimits: {
        requestsPerMinute: 200,
        requestsPerDay: 10000
      }
    },
    webhooks: {
      supported: true,
      subscriptionUrl: 'https://apis.garmin.com/webhook-service/webhooks'
    }
  }
};

/**
 * Get health service configurations filtered by environment availability
 * This function dynamically returns only properly configured services
 */
export function getAvailableHealthServiceConfigs(): Record<HealthServiceName, HealthServiceConfig> {
  // Import here to avoid circular dependency issues
  const { validateAllHealthIntegrations } = require('./env-validator');
  const envStatus = validateAllHealthIntegrations();
  
  const availableConfigs: Record<string, HealthServiceConfig> = {};
  
  for (const [serviceName, config] of Object.entries(HEALTH_SERVICE_CONFIGS_BASE)) {
    const envConfig = envStatus[serviceName as HealthServiceName];
    
    // Always include the configuration, but mark availability status
    availableConfigs[serviceName] = {
      ...config,
      // Add environment status to config
      oauth: {
        ...config.oauth,
        // Override with actual env values if available
        clientId: config.oauth.clientId || '',
        clientSecret: config.oauth.clientSecret || ''
      }
    };
  }
  
  return availableConfigs as Record<HealthServiceName, HealthServiceConfig>;
}

/**
 * Legacy export - use getAvailableHealthServiceConfigs() for dynamic configuration
 */
export const HEALTH_SERVICE_CONFIGS = HEALTH_SERVICE_CONFIGS_BASE;
