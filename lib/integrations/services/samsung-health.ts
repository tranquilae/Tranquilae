/**
 * Samsung Health Integration Service
 * Implements Samsung Health Android SDK and Partner API integration
 */

import { 
  HealthIntegrationService, 
  HealthServiceName, 
  HealthDataType, 
  HealthDataPoint,
  OAuthTokenResponse,
  ServiceAPIs,
  HEALTH_SERVICE_CONFIGS 
} from '../types';
import { 
  createOAuthState, 
  exchangeCodeForTokens, 
  refreshOAuthTokens,
  OAuthUrlBuilders 
} from '../oauth';

export class SamsungHealthService implements HealthIntegrationService {
  public readonly serviceName: HealthServiceName = 'samsung-health';
  public readonly config = HEALTH_SERVICE_CONFIGS['samsung-health'];

  // Samsung Health data type identifiers
  private readonly SAMSUNG_DATA_TYPES = {
    'steps': 'com.samsung.health.step_count',
    'heart_rate': 'com.samsung.health.heart_rate',
    'calories': 'com.samsung.health.calorie_burned',
    'weight': 'com.samsung.health.weight',
    'sleep': 'com.samsung.health.sleep',
    'exercise': 'com.samsung.health.exercise',
    'blood_pressure': 'com.samsung.health.blood_pressure'
  } as const;

  /**
   * Initiate OAuth flow for Samsung Health Partner API
   */
  async initiateOAuth(userId: string, scopes: string[]): Promise<{ authUrl: string; state: string }> {
    const oauthState = await createOAuthState(userId, this.serviceName, scopes);
    
    const authUrl = OAuthUrlBuilders['samsung-health'](oauthState.state);
    
    return {
      authUrl,
      state: oauthState.state
    };
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleOAuthCallback(code: string, state: string): Promise<OAuthTokenResponse> {
    const { validateOAuthState, getCallbackUrl } = await import('../oauth');
    const oauthState = await validateOAuthState(state);
    
    if (!oauthState || oauthState.serviceName !== this.serviceName) {
      throw new Error('Invalid OAuth state for Samsung Health');
    }

    return exchangeCodeForTokens(
      this.config.oauth.tokenUrl,
      this.config.oauth.clientId,
      this.config.oauth.clientSecret,
      code,
      oauthState.codeVerifier!,
      getCallbackUrl(this.serviceName)
    );
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    return refreshOAuthTokens(
      this.config.oauth.tokenUrl,
      this.config.oauth.clientId,
      this.config.oauth.clientSecret,
      refreshToken
    );
  }

  /**
   * Sync health data from Samsung Health Partner API
   */
  async syncHealthData(
    accessToken: string, 
    dataTypes: HealthDataType[], 
    fromDate: Date, 
    toDate: Date
  ): Promise<HealthDataPoint[]> {
    const dataPoints: HealthDataPoint[] = [];

    for (const dataType of dataTypes) {
      try {
        const typeData = await this.fetchDataTypeFromSamsungHealth(
          accessToken, 
          dataType, 
          fromDate, 
          toDate
        );
        dataPoints.push(...typeData);
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error syncing ${dataType} from Samsung Health:`, error);
      }
    }

    return dataPoints;
  }

  /**
   * Fetch specific data type from Samsung Health Partner API
   */
  private async fetchDataTypeFromSamsungHealth(
    accessToken: string,
    dataType: HealthDataType,
    fromDate: Date,
    toDate: Date
  ): Promise<HealthDataPoint[]> {
    const samsungDataType = this.SAMSUNG_DATA_TYPES[dataType];
    if (!samsungDataType) {
      console.warn(`No Samsung Health data type for ${dataType}`);
      return [];
    }

    const startTime = fromDate.getTime();
    const endTime = toDate.getTime();

    // Samsung Health Partner API endpoint
    const url = `${this.config.api.baseUrl}/v1/healthdata/${samsungDataType}`;

    const params = new URLSearchParams({
      start_time: startTime.toString(),
      end_time: endTime.toString(),
      time_offset: '0', // UTC
      limit: '1000'
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Samsung Health API error: ${response.status} ${response.statusText}`);
    }

    const data: ServiceAPIs.SamsungHealthResponse = await response.json();
    
    return this.transformSamsungHealthData(data, dataType);
  }

  /**
   * Transform Samsung Health data to our standard format
   */
  private transformSamsungHealthData(
    data: ServiceAPIs.SamsungHealthResponse, 
    dataType: HealthDataType
  ): HealthDataPoint[] {
    const dataPoints: HealthDataPoint[] = [];

    if (!data.data || data.data.length === 0) {
      return dataPoints;
    }

    for (const item of data.data) {
      try {
        const dataPoint = this.transformSamsungHealthItem(item, dataType);
        if (dataPoint) {
          dataPoints.push(dataPoint);
        }
      } catch (error) {
        console.error('Error transforming Samsung Health item:', error);
      }
    }

    return dataPoints;
  }

  /**
   * Transform individual Samsung Health data item
   */
  private transformSamsungHealthItem(
    item: ServiceAPIs.SamsungHealthDataItem, 
    dataType: HealthDataType
  ): HealthDataPoint | null {
    if (!item.start_time) {
      return null;
    }

    let value: number = 0;
    let unit: string = '';

    switch (dataType) {
      case 'steps':
        value = item.count || 0;
        unit = 'steps';
        break;
        
      case 'heart_rate':
        value = item.heart_rate || item.value || 0;
        unit = 'bpm';
        break;
        
      case 'calories':
        value = item.calorie || item.value || 0;
        unit = 'kcal';
        break;
        
      case 'weight':
        value = item.weight || item.value || 0;
        unit = 'kg';
        break;
        
      case 'sleep':
        // Samsung Health sleep duration in milliseconds
        const sleepDuration = item.end_time && item.start_time 
          ? item.end_time - item.start_time 
          : item.duration || 0;
        value = sleepDuration / (1000 * 60); // Convert to minutes
        unit = 'minutes';
        break;
        
      case 'exercise':
        // Exercise duration in milliseconds
        const exerciseDuration = item.end_time && item.start_time 
          ? item.end_time - item.start_time 
          : item.duration || 0;
        value = exerciseDuration / (1000 * 60); // Convert to minutes
        unit = 'minutes';
        break;
        
      case 'blood_pressure':
        // Use systolic blood pressure as primary value
        value = item.systolic || item.value || 0;
        unit = 'mmHg';
        break;
        
      default:
        return null;
    }

    if (value <= 0) {
      return null;
    }

    return {
      userId: '', // Will be set by calling function
      integrationId: '', // Will be set by calling function
      dataType,
      value,
      unit,
      timestamp: new Date(item.start_time),
      metadata: {
        source: 'samsung-health',
        confidence: 1.0,
        additionalData: {
          samsungId: item.uuid || item.id,
          deviceUuid: item.device_uuid,
          packageName: item.package_name,
          dataTypeName: item.data_type_name,
          endTime: item.end_time ? new Date(item.end_time) : undefined,
          rawData: item
        }
      }
    };
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/v1/user/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user info from Samsung Health Partner API
   */
  async getUserInfo(accessToken: string): Promise<{ id: string; name?: string; email?: string }> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/v1/user/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      const userInfo = await response.json();

      return {
        id: userInfo.user_id || userInfo.uuid || '',
        name: userInfo.name || userInfo.display_name,
        email: userInfo.email
      };
    } catch (error) {
      console.error('Error getting Samsung Health user info:', error);
      throw error;
    }
  }

  /**
   * Setup webhooks (Samsung Health Partner API webhook support)
   */
  async setupWebhook(accessToken: string, webhookUrl: string): Promise<void> {
    try {
      // Register webhook for data updates
      const webhookData = {
        callback_url: webhookUrl,
        data_types: Object.values(this.SAMSUNG_DATA_TYPES),
        events: ['create', 'update', 'delete']
      };

      const response = await fetch(`${this.config.api.baseUrl}/v1/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        throw new Error(`Failed to setup webhook: ${response.status}`);
      }

      console.log('Samsung Health webhook subscription created successfully');
    } catch (error) {
      console.error('Error setting up Samsung Health webhook:', error);
      throw error;
    }
  }

  /**
   * Handle webhook notifications from Samsung Health
   */
  async handleWebhook(payload: any, signature: string): Promise<HealthDataPoint[]> {
    try {
      console.log('Received Samsung Health webhook:', payload);
      
      // Expected webhook format:
      // {
      //   "user_id": "string",
      //   "data_type": "com.samsung.health.step_count",
      //   "event": "create|update|delete",
      //   "timestamp": 1234567890,
      //   "data": { ... }
      // }
      
      if (payload.user_id && payload.data_type && payload.event) {
        // Find corresponding health data type
        const healthDataType = this.getHealthDataTypeFromSamsung(payload.data_type);
        
        if (healthDataType && payload.event !== 'delete' && payload.data) {
          // Transform webhook data to health data points
          const dataPoint = this.transformSamsungHealthItem(payload.data, healthDataType);
          return dataPoint ? [dataPoint] : [];
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error handling Samsung Health webhook:', error);
      return [];
    }
  }

  /**
   * Get health data type from Samsung data type identifier
   */
  private getHealthDataTypeFromSamsung(samsungDataType: string): HealthDataType | null {
    for (const [healthType, samsungType] of Object.entries(this.SAMSUNG_DATA_TYPES)) {
      if (samsungType === samsungDataType) {
        return healthType as HealthDataType;
      }
    }
    return null;
  }

  /**
   * Android SDK specific methods
   * These would be called from a native Android app integration
   */

  /**
   * Request Samsung Health permissions (to be called from Android app)
   */
  async requestSamsungHealthPermissions(dataTypes: HealthDataType[]): Promise<boolean> {
    // This method would be implemented in the Android app using Samsung Health SDK
    console.log('Samsung Health permissions requested for:', dataTypes);
    return true;
  }

  /**
   * Check Samsung Health authorization status (to be called from Android app)
   */
  async checkSamsungHealthAuthorizationStatus(dataType: HealthDataType): Promise<'authorized' | 'denied' | 'not_determined'> {
    // This would be implemented in the Android app
    console.log('Checking Samsung Health authorization for:', dataType);
    return 'not_determined';
  }

  /**
   * Connect to Samsung Health service (to be called from Android app)
   */
  async connectSamsungHealthService(): Promise<boolean> {
    // This would be implemented in the Android app to establish connection
    console.log('Connecting to Samsung Health service');
    return true;
  }

  /**
   * Sync data directly from Samsung Health SDK (to be called from Android app)
   */
  async syncFromSamsungHealthSDK(
    dataTypes: HealthDataType[],
    fromDate: Date,
    toDate: Date
  ): Promise<HealthDataPoint[]> {
    // This would be implemented in the Android app using Samsung Health SDK
    console.log('Syncing from Samsung Health SDK:', { dataTypes, fromDate, toDate });
    return [];
  }

  /**
   * Setup Samsung Health data observers (to be called from Android app)
   */
  async setupSamsungHealthObservers(dataTypes: HealthDataType[]): Promise<void> {
    // This would setup real-time observers in the Android app
    console.log('Setting up Samsung Health observers for:', dataTypes);
  }

  /**
   * Get Samsung Health app info
   */
  async getSamsungHealthAppInfo(accessToken: string): Promise<{
    version: string;
    isInstalled: boolean;
    permissions: HealthDataType[];
  }> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/v1/app/info`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get app info: ${response.status}`);
      }

      const appInfo = await response.json();

      return {
        version: appInfo.version || 'unknown',
        isInstalled: appInfo.is_installed || false,
        permissions: appInfo.granted_permissions || []
      };
    } catch (error) {
      console.error('Error getting Samsung Health app info:', error);
      return {
        version: 'unknown',
        isInstalled: false,
        permissions: []
      };
    }
  }

  /**
   * Get available Samsung Health data sources
   */
  async getAvailableDataSources(accessToken: string): Promise<{
    dataType: string;
    sources: Array<{
      packageName: string;
      displayName: string;
      isEnabled: boolean;
    }>;
  }[]> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/v1/datasources`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get data sources: ${response.status}`);
      }

      const dataSources = await response.json();
      return dataSources.data_sources || [];
    } catch (error) {
      console.error('Error getting Samsung Health data sources:', error);
      return [];
    }
  }

  /**
   * Enable/disable specific data sources
   */
  async configureDataSource(
    accessToken: string,
    dataType: string,
    packageName: string,
    enabled: boolean
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/v1/datasources/configure`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data_type: dataType,
          package_name: packageName,
          enabled
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error configuring Samsung Health data source:', error);
      return false;
    }
  }

  /**
   * Get Samsung Health device information
   */
  async getConnectedDevices(accessToken: string): Promise<Array<{
    uuid: string;
    name: string;
    type: string;
    manufacturer: string;
    isConnected: boolean;
  }>> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/v1/devices`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get devices: ${response.status}`);
      }

      const devices = await response.json();
      return devices.devices || [];
    } catch (error) {
      console.error('Error getting Samsung Health connected devices:', error);
      return [];
    }
  }
}

// Export singleton instance
export const samsungHealthService = new SamsungHealthService();
