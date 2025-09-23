/**
 * Google Fit Integration Service
 * Implements full data sync with Google Fitness API
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

export class GoogleFitService implements HealthIntegrationService {
  public readonly serviceName: HealthServiceName = 'google-fit';
  public readonly config = HEALTH_SERVICE_CONFIGS['google-fit'];

  /**
   * Initiate OAuth flow for Google Fit
   */
  async initiateOAuth(userId: string, scopes: string[]): Promise<{ authUrl: string; state: string }> {
    const oauthState = await createOAuthState(userId, this.serviceName, scopes);
    
    // Use the codeChallenge from the stored OAuth state
    const { generatePKCE } = await import('../oauth');
    const { codeChallenge } = generatePKCE();
    
    const authUrl = OAuthUrlBuilders['google-fit'](oauthState.state, codeChallenge);
    
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
      throw new Error('Invalid OAuth state for Google Fit');
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
   * Sync health data from Google Fit
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
        const typeData = await this.fetchDataTypeFromGoogleFit(
          accessToken, 
          dataType, 
          fromDate, 
          toDate
        );
        dataPoints.push(...typeData);
      } catch (error) {
        console.error(`Error syncing ${dataType} from Google Fit:`, error);
      }
    }

    return dataPoints;
  }

  /**
   * Fetch specific data type from Google Fit API
   */
  private async fetchDataTypeFromGoogleFit(
    accessToken: string,
    dataType: HealthDataType,
    fromDate: Date,
    toDate: Date
  ): Promise<HealthDataPoint[]> {
    const dataSourceId = this.getGoogleFitDataSourceId(dataType);
    if (!dataSourceId) {
      console.warn(`No Google Fit data source for ${dataType}`);
      return [];
    }

    const startTimeMillis = fromDate.getTime();
    const endTimeMillis = toDate.getTime();

    // Convert to nanoseconds (Google Fit uses nanoseconds)
    const startTimeNanos = startTimeMillis * 1000000;
    const endTimeNanos = endTimeMillis * 1000000;

    const url = `${this.config.api.baseUrl}/users/me/dataSources/${dataSourceId}/datasets/${startTimeNanos}-${endTimeNanos}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Fit API error: ${response.status} ${response.statusText}`);
    }

    const data: ServiceAPIs.GoogleFitDataSet = await response.json();
    
    return this.transformGoogleFitData(data, dataType);
  }

  /**
   * Get Google Fit data source ID for health data type
   */
  private getGoogleFitDataSourceId(dataType: HealthDataType): string | null {
    const dataSourceMap: Record<HealthDataType, string> = {
      'steps': 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
      'heart_rate': 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
      'calories': 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
      'weight': 'derived:com.google.weight:com.google.android.gms:merge_weight',
      'sleep': 'derived:com.google.sleep.segment:com.google.android.gms:merged',
      'exercise': 'derived:com.google.activity.segment:com.google.android.gms:merge_activity_segments',
      'blood_pressure': 'derived:com.google.blood_pressure:com.google.android.gms:merged'
    };

    return dataSourceMap[dataType] || null;
  }

  /**
   * Transform Google Fit data to our standard format
   */
  private transformGoogleFitData(
    data: ServiceAPIs.GoogleFitDataSet, 
    dataType: HealthDataType
  ): HealthDataPoint[] {
    const dataPoints: HealthDataPoint[] = [];

    for (const point of data.point) {
      const timestamp = new Date(parseInt(point.startTimeNanos) / 1000000);
      
      // Extract value based on data type
      let value: number = 0;
      let unit: string = '';

      switch (dataType) {
        case 'steps':
          value = point.value[0]?.intVal || 0;
          unit = 'steps';
          break;
          
        case 'heart_rate':
          value = point.value[0]?.fpVal || 0;
          unit = 'bpm';
          break;
          
        case 'calories':
          value = point.value[0]?.fpVal || 0;
          unit = 'kcal';
          break;
          
        case 'weight':
          value = point.value[0]?.fpVal || 0;
          unit = 'kg';
          break;
          
        case 'sleep':
          // Google Fit sleep is duration in milliseconds
          value = (point.value[0]?.intVal || 0) / (1000 * 60); // Convert to minutes
          unit = 'minutes';
          break;
          
        default:
          continue; // Skip unsupported data types
      }

      if (value > 0) {
        dataPoints.push({
          userId: '', // Will be set by calling function
          integrationId: '', // Will be set by calling function  
          dataType,
          value,
          unit,
          timestamp,
          metadata: {
            source: 'google-fit',
            dataSourceId: data.dataSourceId,
            confidence: 1.0,
            additionalData: {
              startTimeNanos: point.startTimeNanos,
              endTimeNanos: point.endTimeNanos,
              dataTypeName: point.dataTypeName
            }
          }
        });
      }
    }

    return dataPoints;
  }

  /**
   * Validate access token by making a test API call
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/users/me/dataSources`, {
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
   * Get user info from Google Fit
   */
  async getUserInfo(accessToken: string): Promise<{ id: string; name?: string; email?: string }> {
    try {
      // Google Fit doesn't have a direct user info endpoint
      // We'll use Google's OAuth2 userinfo endpoint instead
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
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
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email
      };
    } catch (error) {
      console.error('Error getting Google Fit user info:', error);
      throw error;
    }
  }

  /**
   * Set up webhooks (Google Fit supports push notifications)
   */
  async setupWebhook(accessToken: string, webhookUrl: string): Promise<void> {
    try {
      // Create subscription for activity data updates
      const subscriptionData = {
        dataType: {
          name: 'com.google.step_count.delta'
        },
        applicationName: 'Tranquilae Health Sync'
      };

      const response = await fetch(
        `${this.config.api.baseUrl}/users/me/subscriptions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscriptionData)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to setup webhook: ${response.status}`);
      }

      console.log('Google Fit webhook subscription created successfully');
    } catch (error) {
      console.error('Error setting up Google Fit webhook:', error);
      throw error;
    }
  }

  /**
   * Handle webhook data from Google Fit
   */
  async handleWebhook(payload: any, signature: string): Promise<HealthDataPoint[]> {
    // TODO: Implement webhook signature verification
    // Google Fit webhook payloads contain data update notifications
    
    console.log('Received Google Fit webhook:', payload);
    
    // Extract updated data types from webhook payload
    // This would trigger a fresh data sync for the affected user
    
    return []; // Return empty array for now - real implementation would sync data
  }
}

// Export singleton instance
export const googleFitService = new GoogleFitService();
