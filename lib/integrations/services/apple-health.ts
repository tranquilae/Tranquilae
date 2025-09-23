/**
 * Apple HealthKit Integration Service
 * Implements Apple Health Records API and HealthKit integration
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

export class AppleHealthService implements HealthIntegrationService {
  public readonly serviceName: HealthServiceName = 'apple-health';
  public readonly config = HEALTH_SERVICE_CONFIGS['apple-health'];

  /**
   * Initiate OAuth flow for Apple Health Records API
   */
  async initiateOAuth(userId: string, scopes: string[]): Promise<{ authUrl: string; state: string }> {
    const oauthState = await createOAuthState(userId, this.serviceName, scopes);
    
    const { generatePKCE } = await import('../oauth');
    const { codeChallenge } = generatePKCE();
    
    const authUrl = OAuthUrlBuilders['apple-health'](oauthState.state, codeChallenge);
    
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
      throw new Error('Invalid OAuth state for Apple Health');
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
   * Sync health data from Apple Health Records API
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
        const typeData = await this.fetchDataTypeFromAppleHealth(
          accessToken, 
          dataType, 
          fromDate, 
          toDate
        );
        dataPoints.push(...typeData);
      } catch (error) {
        console.error(`Error syncing ${dataType} from Apple Health:`, error);
      }
    }

    return dataPoints;
  }

  /**
   * Fetch specific data type from Apple Health Records API
   */
  private async fetchDataTypeFromAppleHealth(
    accessToken: string,
    dataType: HealthDataType,
    fromDate: Date,
    toDate: Date
  ): Promise<HealthDataPoint[]> {
    const fhirResource = this.getAppleHealthFHIRResource(dataType);
    if (!fhirResource) {
      console.warn(`No Apple Health FHIR resource for ${dataType}`);
      return [];
    }

    // Apple Health Records API uses FHIR R4 format
    const url = new URL(`${this.config.api.baseUrl}/${fhirResource}`);
    url.searchParams.set('date', `ge${fromDate.toISOString().split('T')[0]}`);
    url.searchParams.set('date', `le${toDate.toISOString().split('T')[0]}`);
    url.searchParams.set('_format', 'json');
    url.searchParams.set('_count', '1000'); // Limit results

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      }
    });

    if (!response.ok) {
      throw new Error(`Apple Health API error: ${response.status} ${response.statusText}`);
    }

    const data: ServiceAPIs.AppleHealthFHIRBundle = await response.json();
    
    return this.transformAppleHealthData(data, dataType);
  }

  /**
   * Get FHIR resource type for health data type
   */
  private getAppleHealthFHIRResource(dataType: HealthDataType): string | null {
    const resourceMap: Record<HealthDataType, string> = {
      'steps': 'Observation?code=55423-8', // Daily step count
      'heart_rate': 'Observation?code=8867-4', // Heart rate
      'calories': 'Observation?code=41981-2', // Calories burned
      'weight': 'Observation?code=29463-7', // Body weight
      'sleep': 'Observation?code=93832-4', // Sleep duration
      'exercise': 'DiagnosticReport?category=survey', // Exercise/Activity
      'blood_pressure': 'Observation?code=85354-9' // Blood pressure panel
    };

    return resourceMap[dataType] || null;
  }

  /**
   * Transform Apple Health FHIR data to our standard format
   */
  private transformAppleHealthData(
    data: ServiceAPIs.AppleHealthFHIRBundle, 
    dataType: HealthDataType
  ): HealthDataPoint[] {
    const dataPoints: HealthDataPoint[] = [];

    if (!data.entry || data.entry.length === 0) {
      return dataPoints;
    }

    for (const entry of data.entry) {
      const resource = entry.resource;
      
      if (resource.resourceType === 'Observation') {
        const observation = resource as ServiceAPIs.AppleHealthObservation;
        const dataPoint = this.transformObservation(observation, dataType);
        if (dataPoint) {
          dataPoints.push(dataPoint);
        }
      } else if (resource.resourceType === 'DiagnosticReport') {
        const report = resource as ServiceAPIs.AppleHealthDiagnosticReport;
        const dataPoint = this.transformDiagnosticReport(report, dataType);
        if (dataPoint) {
          dataPoints.push(dataPoint);
        }
      }
    }

    return dataPoints;
  }

  /**
   * Transform FHIR Observation to HealthDataPoint
   */
  private transformObservation(
    observation: ServiceAPIs.AppleHealthObservation, 
    dataType: HealthDataType
  ): HealthDataPoint | null {
    if (!observation.valueQuantity && !observation.component) {
      return null;
    }

    const effectiveDateTime = observation.effectiveDateTime || observation.effectivePeriod?.start;
    if (!effectiveDateTime) {
      return null;
    }

    let value: number = 0;
    let unit: string = '';

    if (observation.valueQuantity) {
      value = observation.valueQuantity.value || 0;
      unit = this.normalizeUnit(observation.valueQuantity.unit || '', dataType);
    } else if (observation.component && observation.component.length > 0) {
      // Handle multi-component observations (like blood pressure)
      const component = observation.component[0];
      if (component.valueQuantity) {
        value = component.valueQuantity.value || 0;
        unit = this.normalizeUnit(component.valueQuantity.unit || '', dataType);
      }
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
      timestamp: new Date(effectiveDateTime),
      metadata: {
        source: 'apple-health',
        confidence: 1.0,
        additionalData: {
          fhirId: observation.id,
          status: observation.status,
          category: observation.category?.[0]?.coding?.[0]?.display,
          code: observation.code?.coding?.[0]?.code,
          rawData: observation
        }
      }
    };
  }

  /**
   * Transform FHIR DiagnosticReport to HealthDataPoint
   */
  private transformDiagnosticReport(
    report: ServiceAPIs.AppleHealthDiagnosticReport, 
    dataType: HealthDataType
  ): HealthDataPoint | null {
    if (dataType !== 'exercise') {
      return null;
    }

    const effectiveDateTime = report.effectiveDateTime || report.effectivePeriod?.start;
    if (!effectiveDateTime) {
      return null;
    }

    // Extract exercise duration from the report
    let durationMinutes = 0;
    
    if (report.effectivePeriod?.start && report.effectivePeriod?.end) {
      const start = new Date(report.effectivePeriod.start);
      const end = new Date(report.effectivePeriod.end);
      durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    }

    if (durationMinutes <= 0) {
      return null;
    }

    return {
      userId: '',
      integrationId: '',
      dataType: 'exercise',
      value: durationMinutes,
      unit: 'minutes',
      timestamp: new Date(effectiveDateTime),
      metadata: {
        source: 'apple-health',
        confidence: 1.0,
        additionalData: {
          fhirId: report.id,
          status: report.status,
          category: report.category?.[0]?.coding?.[0]?.display,
          rawData: report
        }
      }
    };
  }

  /**
   * Normalize units to our standard format
   */
  private normalizeUnit(fhirUnit: string, dataType: HealthDataType): string {
    const unitMap: Record<string, string> = {
      // UCUM units to our standard
      '{steps}': 'steps',
      '/min': 'bpm',
      'beats/min': 'bpm',
      'kcal': 'kcal',
      'cal': 'kcal',
      'kg': 'kg',
      'lb': 'kg', // Convert pounds to kg (would need conversion factor)
      'h': 'minutes', // Hours to minutes (would need conversion)
      'min': 'minutes',
      'mm[Hg]': 'mmHg'
    };

    return unitMap[fhirUnit] || this.getDefaultUnit(dataType);
  }

  /**
   * Get default unit for data type
   */
  private getDefaultUnit(dataType: HealthDataType): string {
    const defaultUnits: Record<HealthDataType, string> = {
      'steps': 'steps',
      'heart_rate': 'bpm',
      'calories': 'kcal',
      'weight': 'kg',
      'sleep': 'minutes',
      'exercise': 'minutes',
      'blood_pressure': 'mmHg'
    };

    return defaultUnits[dataType] || '';
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/Patient`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/fhir+json'
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user info from Apple Health Records API
   */
  async getUserInfo(accessToken: string): Promise<{ id: string; name?: string; email?: string }> {
    try {
      const response = await fetch(`${this.config.api.baseUrl}/Patient`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/fhir+json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      const bundle: ServiceAPIs.AppleHealthFHIRBundle = await response.json();
      
      if (bundle.entry && bundle.entry.length > 0) {
        const patient = bundle.entry[0].resource as ServiceAPIs.AppleHealthPatient;
        
        return {
          id: patient.id || '',
          name: patient.name?.[0] ? 
            `${patient.name[0].given?.join(' ')} ${patient.name[0].family}`.trim() : 
            undefined,
          email: patient.telecom?.find(t => t.system === 'email')?.value
        };
      }

      throw new Error('No patient data found');
    } catch (error) {
      console.error('Error getting Apple Health user info:', error);
      throw error;
    }
  }

  /**
   * Setup webhooks (Apple Health Records API doesn't support webhooks directly)
   * This would typically be handled through iOS HealthKit notifications
   */
  async setupWebhook(accessToken: string, webhookUrl: string): Promise<void> {
    // Apple Health Records API doesn't support traditional webhooks
    // Real-time updates would be handled through:
    // 1. iOS HealthKit background delivery
    // 2. Push notifications from iOS app
    // 3. Periodic sync scheduling
    
    console.log('Apple Health webhook setup: Using iOS HealthKit background delivery');
    
    // In a real implementation, you would:
    // 1. Configure HealthKit background delivery in your iOS app
    // 2. Set up push notifications to trigger sync
    // 3. Use silent push notifications for data updates
  }

  /**
   * Handle webhook notifications (from iOS app via push notifications)
   */
  async handleWebhook(payload: any, signature: string): Promise<HealthDataPoint[]> {
    try {
      console.log('Received Apple Health webhook:', payload);
      
      // Expected payload format from iOS app:
      // {
      //   "user_id": "string",
      //   "notification_type": "health_data_update",
      //   "data_types": ["steps", "heart_rate"],
      //   "updated_since": "2023-01-01T00:00:00Z"
      // }
      
      if (payload.notification_type === 'health_data_update' && 
          payload.data_types && 
          Array.isArray(payload.data_types)) {
        
        // This would trigger a fresh sync for the updated data types
        console.log(`Apple Health data updated for types: ${payload.data_types.join(', ')}`);
        
        // In practice, you would:
        // 1. Identify the user from payload.user_id
        // 2. Schedule immediate sync for the updated data types
        // 3. Return empty array since webhook doesn't contain actual data
      }
      
      return [];
    } catch (error) {
      console.error('Error handling Apple Health webhook:', error);
      return [];
    }
  }

  /**
   * iOS HealthKit specific methods
   * These would be called from a native iOS app integration
   */

  /**
   * Request HealthKit permissions (to be called from iOS app)
   */
  async requestHealthKitPermissions(dataTypes: HealthDataType[]): Promise<boolean> {
    // This method would be implemented in the iOS app using HealthKit
    // Here we just return true to indicate the method exists
    console.log('HealthKit permissions requested for:', dataTypes);
    return true;
  }

  /**
   * Check HealthKit authorization status (to be called from iOS app)
   */
  async checkHealthKitAuthorizationStatus(dataType: HealthDataType): Promise<'authorized' | 'denied' | 'not_determined'> {
    // This would be implemented in the iOS app
    console.log('Checking HealthKit authorization for:', dataType);
    return 'not_determined';
  }

  /**
   * Enable HealthKit background delivery (to be called from iOS app)
   */
  async enableBackgroundDelivery(dataTypes: HealthDataType[]): Promise<void> {
    // This would be implemented in the iOS app to enable background sync
    console.log('Enabling HealthKit background delivery for:', dataTypes);
  }

  /**
   * Sync data directly from HealthKit (to be called from iOS app)
   */
  async syncFromHealthKit(
    dataTypes: HealthDataType[],
    fromDate: Date,
    toDate: Date
  ): Promise<HealthDataPoint[]> {
    // This would be implemented in the iOS app using HealthKit APIs
    // The app would call this method and send data to our API
    console.log('Syncing from HealthKit:', { dataTypes, fromDate, toDate });
    return [];
  }
}

// Export singleton instance
export const appleHealthService = new AppleHealthService();
