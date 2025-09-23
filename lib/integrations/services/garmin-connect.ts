/**
 * Garmin Connect IQ Integration Service
 * Implements Garmin Connect IQ API for activity and wellness data
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

export class GarminConnectService implements HealthIntegrationService {
  public readonly serviceName: HealthServiceName = 'garmin-connect';
  public readonly config = HEALTH_SERVICE_CONFIGS['garmin-connect'];

  // Garmin Connect IQ data type mappings
  private readonly GARMIN_ACTIVITY_TYPES = {
    'steps': 'steps',
    'heart_rate': 'heart_rate',
    'calories': 'calories',
    'weight': 'weight',
    'sleep': 'sleep',
    'exercise': 'activities',
    'blood_pressure': 'blood_pressure'
  } as const;

  /**
   * Initiate OAuth flow for Garmin Connect IQ
   */
  async initiateOAuth(userId: string, scopes: string[]): Promise<{ authUrl: string; state: string }> {
    const oauthState = await createOAuthState(userId, this.serviceName, scopes);
    
    const { generatePKCE } = await import('../oauth');
    const { codeChallenge } = generatePKCE();
    
    const authUrl = OAuthUrlBuilders['garmin-connect'](oauthState.state, codeChallenge);
    
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
      throw new Error('Invalid OAuth state for Garmin Connect');
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
   * Sync health data from Garmin Connect IQ API
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
        const typeData = await this.fetchDataTypeFromGarmin(
          accessToken, 
          dataType, 
          fromDate, 
          toDate
        );
        dataPoints.push(...typeData);
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error syncing ${dataType} from Garmin Connect:`, error);
      }
    }

    return dataPoints;
  }

  /**
   * Fetch specific data type from Garmin Connect IQ API
   */
  private async fetchDataTypeFromGarmin(
    accessToken: string,
    dataType: HealthDataType,
    fromDate: Date,
    toDate: Date
  ): Promise<HealthDataPoint[]> {
    const endpoint = this.getGarminEndpoint(dataType);
    if (!endpoint) {
      console.warn(`No Garmin Connect endpoint for ${dataType}`);
      return [];
    }

    const formatDate = (date: Date) => date.toISOString().split('T')[0]; // YYYY-MM-DD
    const startDate = formatDate(fromDate);
    const endDate = formatDate(toDate);

    let url: string;

    // Different endpoints have different URL patterns
    switch (dataType) {
      case 'steps':
        url = `${this.config.api.baseUrl}/wellness-api/rest/dailies/${startDate}/${endDate}`;
        break;
      case 'heart_rate':
        url = `${this.config.api.baseUrl}/wellness-api/rest/heartRate/daily/${startDate}/${endDate}`;
        break;
      case 'calories':
        url = `${this.config.api.baseUrl}/wellness-api/rest/dailies/${startDate}/${endDate}`;
        break;
      case 'weight':
        url = `${this.config.api.baseUrl}/weight-api/rest/weight/${startDate}/${endDate}`;
        break;
      case 'sleep':
        url = `${this.config.api.baseUrl}/wellness-api/rest/sleepData/${startDate}/${endDate}`;
        break;
      case 'exercise':
        url = `${this.config.api.baseUrl}/activitylist-service/activities/search/activities?startDate=${startDate}&endDate=${endDate}&limit=100`;
        break;
      case 'blood_pressure':
        url = `${this.config.api.baseUrl}/biometrics-service/biometric-types/bloodPressure/readings/${startDate}/${endDate}`;
        break;
      default:
        return [];
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Garmin Connect API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return this.transformGarminData(data, dataType);
  }

  /**
   * Get Garmin Connect endpoint for health data type
   */
  private getGarminEndpoint(dataType: HealthDataType): string | null {
    const endpointMap: Record<HealthDataType, string> = {
      'steps': 'wellness-api/rest/dailies',
      'heart_rate': 'wellness-api/rest/heartRate/daily',
      'calories': 'wellness-api/rest/dailies',
      'weight': 'weight-api/rest/weight',
      'sleep': 'wellness-api/rest/sleepData',
      'exercise': 'activitylist-service/activities/search/activities',
      'blood_pressure': 'biometrics-service/biometric-types/bloodPressure/readings'
    };

    return endpointMap[dataType] || null;
  }

  /**
   * Transform Garmin Connect data to our standard format
   */
  private transformGarminData(
    data: any, 
    dataType: HealthDataType
  ): HealthDataPoint[] {
    const dataPoints: HealthDataPoint[] = [];

    try {
      switch (dataType) {
        case 'steps':
          this.transformStepsData(data, dataPoints);
          break;
          
        case 'heart_rate':
          this.transformHeartRateData(data, dataPoints);
          break;
          
        case 'calories':
          this.transformCaloriesData(data, dataPoints);
          break;
          
        case 'weight':
          this.transformWeightData(data, dataPoints);
          break;
          
        case 'sleep':
          this.transformSleepData(data, dataPoints);
          break;
          
        case 'exercise':
          this.transformExerciseData(data, dataPoints);
          break;
          
        case 'blood_pressure':
          this.transformBloodPressureData(data, dataPoints);
          break;
          
        default:
          console.warn(`Unsupported Garmin Connect data type: ${dataType}`);
      }
    } catch (error) {
      console.error(`Error transforming Garmin ${dataType} data:`, error);
    }

    return dataPoints;
  }

  /**
   * Transform steps data from dailies endpoint
   */
  private transformStepsData(data: any, dataPoints: HealthDataPoint[]): void {
    if (Array.isArray(data)) {
      for (const daily of data) {
        if (daily.totalSteps > 0) {
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: 'steps',
            value: daily.totalSteps,
            unit: 'steps',
            timestamp: new Date(daily.calendarDate),
            metadata: {
              source: 'garmin-connect',
              confidence: 1.0,
              additionalData: {
                deviceId: daily.deviceId,
                rawData: daily
              }
            }
          });
        }
      }
    }
  }

  /**
   * Transform heart rate data
   */
  private transformHeartRateData(data: any, dataPoints: HealthDataPoint[]): void {
    if (Array.isArray(data)) {
      for (const hrData of data) {
        // Use resting heart rate as primary metric
        if (hrData.restingHeartRate > 0) {
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: 'heart_rate',
            value: hrData.restingHeartRate,
            unit: 'bpm',
            timestamp: new Date(hrData.calendarDate),
            metadata: {
              source: 'garmin-connect',
              confidence: 1.0,
              additionalData: {
                type: 'resting',
                maxHeartRate: hrData.maxHeartRate,
                minHeartRate: hrData.minHeartRate,
                deviceId: hrData.deviceId,
                rawData: hrData
              }
            }
          });
        }
      }
    }
  }

  /**
   * Transform calories data from dailies endpoint
   */
  private transformCaloriesData(data: any, dataPoints: HealthDataPoint[]): void {
    if (Array.isArray(data)) {
      for (const daily of data) {
        if (daily.totalKilocalories > 0) {
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: 'calories',
            value: daily.totalKilocalories,
            unit: 'kcal',
            timestamp: new Date(daily.calendarDate),
            metadata: {
              source: 'garmin-connect',
              confidence: 1.0,
              additionalData: {
                activeKilocalories: daily.activeKilocalories,
                bmrKilocalories: daily.bmrKilocalories,
                deviceId: daily.deviceId,
                rawData: daily
              }
            }
          });
        }
      }
    }
  }

  /**
   * Transform weight data
   */
  private transformWeightData(data: any, dataPoints: HealthDataPoint[]): void {
    if (Array.isArray(data)) {
      for (const weightEntry of data) {
        if (weightEntry.weight > 0) {
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: 'weight',
            value: weightEntry.weight / 1000, // Convert grams to kg
            unit: 'kg',
            timestamp: new Date(weightEntry.date || weightEntry.timestampGMT),
            metadata: {
              source: 'garmin-connect',
              confidence: 1.0,
              additionalData: {
                bodyMassIndex: weightEntry.bodyMassIndex,
                bodyFatPercentage: weightEntry.bodyFatPercentage,
                boneMass: weightEntry.boneMass,
                muscleMass: weightEntry.muscleMass,
                rawData: weightEntry
              }
            }
          });
        }
      }
    }
  }

  /**
   * Transform sleep data
   */
  private transformSleepData(data: any, dataPoints: HealthDataPoint[]): void {
    if (Array.isArray(data)) {
      for (const sleepData of data) {
        if (sleepData.sleepTimeSeconds > 0) {
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: 'sleep',
            value: sleepData.sleepTimeSeconds / 60, // Convert to minutes
            unit: 'minutes',
            timestamp: new Date(sleepData.calendarDate),
            metadata: {
              source: 'garmin-connect',
              confidence: 1.0,
              additionalData: {
                deepSleepSeconds: sleepData.deepSleepSeconds,
                lightSleepSeconds: sleepData.lightSleepSeconds,
                remSleepSeconds: sleepData.remSleepSeconds,
                awakeSleepSeconds: sleepData.awakeSleepSeconds,
                sleepStartTimestampGMT: sleepData.sleepStartTimestampGMT,
                sleepEndTimestampGMT: sleepData.sleepEndTimestampGMT,
                deviceId: sleepData.deviceId,
                rawData: sleepData
              }
            }
          });
        }
      }
    }
  }

  /**
   * Transform exercise/activity data
   */
  private transformExerciseData(data: any, dataPoints: HealthDataPoint[]): void {
    if (Array.isArray(data)) {
      for (const activity of data) {
        if (activity.duration > 0) {
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: 'exercise',
            value: activity.duration / 60, // Convert seconds to minutes
            unit: 'minutes',
            timestamp: new Date(activity.startTimeGMT),
            metadata: {
              source: 'garmin-connect',
              confidence: 1.0,
              additionalData: {
                activityId: activity.activityId,
                activityName: activity.activityName,
                activityType: activity.activityType?.typeKey,
                distance: activity.distance,
                calories: activity.calories,
                averageSpeed: activity.averageSpeed,
                maxSpeed: activity.maxSpeed,
                elevationGain: activity.elevationGain,
                deviceId: activity.deviceId,
                rawData: activity
              }
            }
          });
        }
      }
    }
  }

  /**
   * Transform blood pressure data
   */
  private transformBloodPressureData(data: any, dataPoints: HealthDataPoint[]): void {
    if (Array.isArray(data)) {
      for (const bpReading of data) {
        if (bpReading.systolic > 0) {
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: 'blood_pressure',
            value: bpReading.systolic,
            unit: 'mmHg',
            timestamp: new Date(bpReading.measurementTimeStampGMT),
            metadata: {
              source: 'garmin-connect',
              confidence: 1.0,
              additionalData: {
                systolic: bpReading.systolic,
                diastolic: bpReading.diastolic,
                pulse: bpReading.pulse,
                notes: bpReading.notes,
                rawData: bpReading
              }
            }
          });
        }
      }
    }
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/userprofile-service/userprofile`, {
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
   * Get user info from Garmin Connect
   */
  async getUserInfo(accessToken: string): Promise<{ id: string; name?: string; email?: string }> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/userprofile-service/userprofile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      const userProfile = await response.json();

      return {
        id: userProfile.profileId || userProfile.userId || '',
        name: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`.trim(),
        email: userProfile.email
      };
    } catch (error) {
      console.error('Error getting Garmin Connect user info:', error);
      throw error;
    }
  }

  /**
   * Setup webhooks (Garmin Connect IQ Push API)
   */
  async setupWebhook(accessToken: string, webhookUrl: string): Promise<void> {
    try {
      // Register for push notifications
      const subscriptionData = {
        callbackURL: webhookUrl,
        eventTypes: [
          'activity',
          'wellness',
          'sleep',
          'biometric'
        ]
      };

      const response = await fetch(`${this.config.api.baseUrl}/push-service/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        throw new Error(`Failed to setup webhook: ${response.status}`);
      }

      console.log('Garmin Connect webhook subscription created successfully');
    } catch (error) {
      console.error('Error setting up Garmin Connect webhook:', error);
      throw error;
    }
  }

  /**
   * Handle webhook notifications from Garmin Connect
   */
  async handleWebhook(payload: any, signature: string): Promise<HealthDataPoint[]> {
    try {
      console.log('Received Garmin Connect webhook:', payload);
      
      // Garmin Connect webhook format:
      // {
      //   "userAccessToken": "string",
      //   "activities": [{"activityId": 123, "eventType": "create"}],
      //   "dailies": [{"calendarDate": "2023-01-01", "eventType": "create"}]
      // }
      
      const dataPoints: HealthDataPoint[] = [];

      // Handle activity events
      if (payload.activities && Array.isArray(payload.activities)) {
        for (const activityEvent of payload.activities) {
          if (activityEvent.eventType === 'create') {
            // Fetch the actual activity data
            try {
              const activityData = await this.fetchActivityDetails(
                payload.userAccessToken, 
                activityEvent.activityId
              );
              if (activityData) {
                const transformed = this.transformExerciseData([activityData], []);
                dataPoints.push(...transformed);
              }
            } catch (error) {
              console.error('Error fetching Garmin activity details:', error);
            }
          }
        }
      }

      // Handle daily wellness events
      if (payload.dailies && Array.isArray(payload.dailies)) {
        for (const dailyEvent of payload.dailies) {
          if (dailyEvent.eventType === 'create') {
            // Fetch the wellness data for that day
            try {
              const date = dailyEvent.calendarDate;
              const wellnessData = await this.fetchDailyWellnessData(
                payload.userAccessToken, 
                date
              );
              if (wellnessData) {
                // Transform steps and calories from wellness data
                const stepsData = this.transformStepsData([wellnessData], []);
                const caloriesData = this.transformCaloriesData([wellnessData], []);
                dataPoints.push(...stepsData, ...caloriesData);
              }
            } catch (error) {
              console.error('Error fetching Garmin daily wellness data:', error);
            }
          }
        }
      }

      return dataPoints;
    } catch (error) {
      console.error('Error handling Garmin Connect webhook:', error);
      return [];
    }
  }

  /**
   * Fetch detailed activity information
   */
  private async fetchActivityDetails(userAccessToken: string, activityId: number): Promise<any> {
    const response = await fetch(
      `${this.config.api.baseUrl}/activity-service/activity/${activityId}`,
      {
        headers: {
          'Authorization': `Bearer ${userAccessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch activity ${activityId}: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch daily wellness data for a specific date
   */
  private async fetchDailyWellnessData(userAccessToken: string, date: string): Promise<any> {
    const response = await fetch(
      `${this.config.api.baseUrl}/wellness-api/rest/dailies/${date}/${date}`,
      {
        headers: {
          'Authorization': `Bearer ${userAccessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch daily wellness for ${date}: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }

  /**
   * Get user's Garmin devices
   */
  async getUserDevices(accessToken: string): Promise<Array<{
    deviceId: string;
    deviceName: string;
    deviceType: string;
    softwareVersion: string;
    isActive: boolean;
  }>> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/device-service/deviceregistration/devices`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get devices: ${response.status}`);
      }

      const devices = await response.json();
      return devices.map((device: any) => ({
        deviceId: device.deviceId?.toString() || '',
        deviceName: device.deviceTypeName || device.productDisplayName || '',
        deviceType: device.deviceCategory || 'unknown',
        softwareVersion: device.softwareVersion || '',
        isActive: device.active || false
      }));
    } catch (error) {
      console.error('Error getting Garmin devices:', error);
      return [];
    }
  }

  /**
   * Get activity summary for a date range
   */
  async getActivitySummary(
    accessToken: string,
    fromDate: Date,
    toDate: Date
  ): Promise<{
    totalActivities: number;
    totalDuration: number; // minutes
    totalDistance: number; // meters
    totalCalories: number;
    activityTypes: Record<string, number>;
  }> {
    try {
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      const startDate = formatDate(fromDate);
      const endDate = formatDate(toDate);

      const response = await fetch(
        `${this.config.api.baseUrl}/activitylist-service/activities/search/activities?startDate=${startDate}&endDate=${endDate}&limit=1000`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get activity summary: ${response.status}`);
      }

      const activities = await response.json();
      
      const summary = {
        totalActivities: activities.length,
        totalDuration: 0,
        totalDistance: 0,
        totalCalories: 0,
        activityTypes: {} as Record<string, number>
      };

      for (const activity of activities) {
        summary.totalDuration += (activity.duration || 0) / 60; // Convert to minutes
        summary.totalDistance += activity.distance || 0;
        summary.totalCalories += activity.calories || 0;
        
        const activityType = activity.activityType?.typeKey || 'unknown';
        summary.activityTypes[activityType] = (summary.activityTypes[activityType] || 0) + 1;
      }

      return summary;
    } catch (error) {
      console.error('Error getting Garmin activity summary:', error);
      return {
        totalActivities: 0,
        totalDuration: 0,
        totalDistance: 0,
        totalCalories: 0,
        activityTypes: {}
      };
    }
  }

  /**
   * Get wellness trends for a user
   */
  async getWellnessTrends(
    accessToken: string,
    fromDate: Date,
    toDate: Date
  ): Promise<{
    averageSteps: number;
    averageCalories: number;
    averageRestingHeartRate: number;
    averageSleepHours: number;
    trends: {
      steps: 'up' | 'down' | 'stable';
      calories: 'up' | 'down' | 'stable';
      heartRate: 'up' | 'down' | 'stable';
      sleep: 'up' | 'down' | 'stable';
    };
  }> {
    // This would analyze the wellness data over time
    // For now, return a basic structure
    return {
      averageSteps: 0,
      averageCalories: 0,
      averageRestingHeartRate: 0,
      averageSleepHours: 0,
      trends: {
        steps: 'stable',
        calories: 'stable',
        heartRate: 'stable',
        sleep: 'stable'
      }
    };
  }
}

// Export singleton instance
export const garminConnectService = new GarminConnectService();
