/**
 * Fitbit Integration Service
 * Implements comprehensive data sync with Fitbit Web API
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

export class FitbitService implements HealthIntegrationService {
  public readonly serviceName: HealthServiceName = 'fitbit';
  public readonly config = HEALTH_SERVICE_CONFIGS['fitbit'];
  
  // Rate limiting - Fitbit allows 150 requests per hour per user
  private readonly RATE_LIMIT = 150;
  private readonly RATE_WINDOW = 60 * 60 * 1000; // 1 hour in ms
  private rateLimitTracker = new Map<string, { count: number; resetTime: number }>();

  /**
   * Initiate OAuth flow for Fitbit
   */
  async initiateOAuth(userId: string, scopes: string[]): Promise<{ authUrl: string; state: string }> {
    const oauthState = await createOAuthState(userId, this.serviceName, scopes);
    
    const { generatePKCE } = await import('../oauth');
    const { codeChallenge } = generatePKCE();
    
    const authUrl = OAuthUrlBuilders['fitbit'](oauthState.state, codeChallenge);
    
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
      throw new Error('Invalid OAuth state for Fitbit');
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
   * Sync health data from Fitbit
   */
  async syncHealthData(
    accessToken: string, 
    dataTypes: HealthDataType[], 
    fromDate: Date, 
    toDate: Date
  ): Promise<HealthDataPoint[]> {
    const dataPoints: HealthDataPoint[] = [];

    // Check rate limiting
    await this.checkRateLimit(accessToken);

    for (const dataType of dataTypes) {
      try {
        const typeData = await this.fetchDataTypeFromFitbit(
          accessToken, 
          dataType, 
          fromDate, 
          toDate
        );
        dataPoints.push(...typeData);
        
        // Increment rate limit counter
        this.incrementRateLimit(accessToken);
        
        // Add small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error syncing ${dataType} from Fitbit:`, error);
        
        // If rate limited, break early
        if (error instanceof Error && error.message.includes('rate limit')) {
          console.warn('Fitbit rate limit reached, stopping sync');
          break;
        }
      }
    }

    return dataPoints;
  }

  /**
   * Fetch specific data type from Fitbit API
   */
  private async fetchDataTypeFromFitbit(
    accessToken: string,
    dataType: HealthDataType,
    fromDate: Date,
    toDate: Date
  ): Promise<HealthDataPoint[]> {
    const endpoint = this.getFitbitEndpoint(dataType);
    if (!endpoint) {
      console.warn(`No Fitbit endpoint for ${dataType}`);
      return [];
    }

    const formatDate = (date: Date) => date.toISOString().split('T')[0]; // YYYY-MM-DD
    const startDate = formatDate(fromDate);
    const endDate = formatDate(toDate);

    let url: string;
    if (dataType === 'sleep') {
      // Sleep endpoint uses different format
      url = `${this.config.api.baseUrl}/1.2/user/-/sleep/date/${startDate}/${endDate}.json`;
    } else if (dataType === 'heart_rate') {
      // Heart rate has special intraday endpoint
      url = `${this.config.api.baseUrl}/1/user/-/activities/heart/date/${startDate}/${endDate}.json`;
    } else {
      // Standard time series endpoint
      url = `${this.config.api.baseUrl}/1/user/-/${endpoint}/date/${startDate}/${endDate}.json`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 429) {
      throw new Error('Fitbit rate limit exceeded');
    }

    if (!response.ok) {
      throw new Error(`Fitbit API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return this.transformFitbitData(data, dataType);
  }

  /**
   * Get Fitbit API endpoint for health data type
   */
  private getFitbitEndpoint(dataType: HealthDataType): string | null {
    const endpointMap: Record<HealthDataType, string> = {
      'steps': 'activities/steps',
      'heart_rate': 'activities/heart', // Special case
      'calories': 'activities/calories',
      'weight': 'body/weight',
      'sleep': 'sleep', // Special case
      'exercise': 'activities',
      'blood_pressure': 'bp' // Requires Fitbit Aria Air or manual entry
    };

    return endpointMap[dataType] || null;
  }

  /**
   * Transform Fitbit data to our standard format
   */
  private transformFitbitData(
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
          
        default:
          console.warn(`Unsupported Fitbit data type: ${dataType}`);
      }
    } catch (error) {
      console.error(`Error transforming Fitbit ${dataType} data:`, error);
    }

    return dataPoints;
  }

  /**
   * Transform steps data
   */
  private transformStepsData(data: any, dataPoints: HealthDataPoint[]): void {
    if (data['activities-steps']) {
      for (const entry of data['activities-steps']) {
        if (parseInt(entry.value) > 0) {
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: 'steps',
            value: parseInt(entry.value),
            unit: 'steps',
            timestamp: new Date(entry.dateTime),
            metadata: {
              source: 'fitbit',
              confidence: 1.0,
              additionalData: { rawData: entry }
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
    if (data['activities-heart']) {
      for (const entry of data['activities-heart']) {
        // Resting heart rate
        if (entry.value?.restingHeartRate) {
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: 'heart_rate',
            value: entry.value.restingHeartRate,
            unit: 'bpm',
            timestamp: new Date(entry.dateTime),
            metadata: {
              source: 'fitbit',
              confidence: 1.0,
              additionalData: { 
                type: 'resting',
                rawData: entry 
              }
            }
          });
        }
      }
    }
  }

  /**
   * Transform calories data
   */
  private transformCaloriesData(data: any, dataPoints: HealthDataPoint[]): void {
    if (data['activities-calories']) {
      for (const entry of data['activities-calories']) {
        if (parseInt(entry.value) > 0) {
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: 'calories',
            value: parseInt(entry.value),
            unit: 'kcal',
            timestamp: new Date(entry.dateTime),
            metadata: {
              source: 'fitbit',
              confidence: 1.0,
              additionalData: { rawData: entry }
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
    if (data['body-weight']) {
      for (const entry of data['body-weight']) {
        if (parseFloat(entry.value) > 0) {
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: 'weight',
            value: parseFloat(entry.value),
            unit: 'kg',
            timestamp: new Date(entry.dateTime),
            metadata: {
              source: 'fitbit',
              confidence: 1.0,
              additionalData: { rawData: entry }
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
    if (data.sleep) {
      for (const sleepEntry of data.sleep) {
        if (sleepEntry.duration > 0) {
          // Convert milliseconds to minutes
          const durationMinutes = sleepEntry.duration / (1000 * 60);
          
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: 'sleep',
            value: durationMinutes,
            unit: 'minutes',
            timestamp: new Date(sleepEntry.startTime),
            metadata: {
              source: 'fitbit',
              confidence: 1.0,
              additionalData: {
                efficiency: sleepEntry.efficiency,
                stages: sleepEntry.levels?.summary,
                rawData: sleepEntry
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
    if (data.activities) {
      for (const activity of data.activities) {
        if (activity.duration > 0) {
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: 'exercise',
            value: activity.duration / (1000 * 60), // Convert to minutes
            unit: 'minutes',
            timestamp: new Date(`${activity.startDate}T${activity.startTime}`),
            metadata: {
              source: 'fitbit',
              confidence: 1.0,
              additionalData: {
                activityName: activity.activityName,
                calories: activity.calories,
                distance: activity.distance,
                steps: activity.steps,
                rawData: activity
              }
            }
          });
        }
      }
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(accessToken: string): Promise<void> {
    const now = Date.now();
    const tokenHash = this.hashToken(accessToken);
    const current = this.rateLimitTracker.get(tokenHash);

    if (current) {
      if (now > current.resetTime) {
        // Reset counter if window has passed
        this.rateLimitTracker.set(tokenHash, { count: 0, resetTime: now + this.RATE_WINDOW });
      } else if (current.count >= this.RATE_LIMIT) {
        const waitTime = current.resetTime - now;
        throw new Error(`Fitbit rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
      }
    } else {
      // Initialize rate limiting for this token
      this.rateLimitTracker.set(tokenHash, { count: 0, resetTime: now + this.RATE_WINDOW });
    }
  }

  /**
   * Increment rate limit counter
   */
  private incrementRateLimit(accessToken: string): void {
    const tokenHash = this.hashToken(accessToken);
    const current = this.rateLimitTracker.get(tokenHash);
    
    if (current) {
      current.count++;
    }
  }

  /**
   * Hash token for rate limiting (privacy)
   */
  private hashToken(token: string): string {
    // Simple hash for privacy - in production, use proper crypto
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/1/user/-/profile.json`, {
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
   * Get user info from Fitbit
   */
  async getUserInfo(accessToken: string): Promise<{ id: string; name?: string; email?: string }> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/1/user/-/profile.json`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      const data = await response.json();
      const user = data.user;

      return {
        id: user.encodedId,
        name: user.displayName || user.fullName,
        email: '' // Fitbit doesn't expose email in profile
      };
    } catch (error) {
      console.error('Error getting Fitbit user info:', error);
      throw error;
    }
  }

  /**
   * Setup webhook subscriptions (Fitbit supports subscriber notifications)
   */
  async setupWebhook(accessToken: string, webhookUrl: string): Promise<void> {
    try {
      // Subscribe to various data types
      const subscriptionTypes = ['activities', 'sleep', 'body', 'foods'];
      
      for (const type of subscriptionTypes) {
        const response = await fetch(
          `${this.config.api.baseUrl}/1/user/-/${type}/apiSubscriptions.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        if (!response.ok) {
          console.warn(`Failed to setup Fitbit webhook for ${type}: ${response.status}`);
        } else {
          console.log(`Fitbit webhook subscription created for ${type}`);
        }
        
        // Rate limit - wait between subscription requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('Error setting up Fitbit webhooks:', error);
      throw error;
    }
  }

  /**
   * Handle webhook notifications from Fitbit
   */
  async handleWebhook(payload: any, signature: string): Promise<HealthDataPoint[]> {
    try {
      // TODO: Implement webhook signature verification for security
      console.log('Received Fitbit webhook:', payload);
      
      // Fitbit webhooks contain information about what data changed
      // Format: { "collectionType": "activities", "date": "2023-01-01", "ownerId": "user_id" }
      
      // This would typically trigger a fresh data sync for the specific data types
      // that changed for the specific user
      
      return []; // Return empty for now - real implementation would sync changed data
    } catch (error) {
      console.error('Error handling Fitbit webhook:', error);
      return [];
    }
  }

  /**
   * Get detailed intraday data (requires special Fitbit permissions)
   */
  async getIntradayData(
    accessToken: string,
    dataType: 'steps' | 'calories' | 'heart_rate',
    date: Date
  ): Promise<HealthDataPoint[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      let endpoint: string;
      
      switch (dataType) {
        case 'steps':
          endpoint = `activities/steps/date/${dateStr}/1d/1min.json`;
          break;
        case 'calories':
          endpoint = `activities/calories/date/${dateStr}/1d/1min.json`;
          break;
        case 'heart_rate':
          endpoint = `activities/heart/date/${dateStr}/1d/1min.json`;
          break;
        default:
          return [];
      }

      const response = await fetch(`${this.config.api.baseUrl}/1/user/-/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Fitbit intraday API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform intraday data to data points
      return this.transformIntradayData(data, dataType, date);
    } catch (error) {
      console.error(`Error getting Fitbit intraday ${dataType} data:`, error);
      return [];
    }
  }

  /**
   * Transform intraday data to health data points
   */
  private transformIntradayData(
    data: any,
    dataType: 'steps' | 'calories' | 'heart_rate',
    baseDate: Date
  ): HealthDataPoint[] {
    const dataPoints: HealthDataPoint[] = [];
    
    // Intraday data is in activities-steps-intraday, activities-calories-intraday, etc.
    const intradayKey = `activities-${dataType.replace('_', '-')}-intraday`;
    const intradayData = data[intradayKey];
    
    if (intradayData?.dataset) {
      for (const point of intradayData.dataset) {
        if (point.value > 0) {
          // Parse time and combine with base date
          const [hours, minutes, seconds] = point.time.split(':').map(Number);
          const timestamp = new Date(baseDate);
          timestamp.setHours(hours, minutes, seconds || 0, 0);
          
          dataPoints.push({
            userId: '',
            integrationId: '',
            dataType: dataType === 'heart_rate' ? 'heart_rate' : dataType,
            value: point.value,
            unit: dataType === 'steps' ? 'steps' : dataType === 'heart_rate' ? 'bpm' : 'kcal',
            timestamp,
            metadata: {
              source: 'fitbit',
              confidence: 1.0,
              additionalData: {
                intraday: true,
                level: point.level || 0,
                rawData: point
              }
            }
          });
        }
      }
    }
    
    return dataPoints;
  }
}

// Export singleton instance
export const fitbitService = new FitbitService();
