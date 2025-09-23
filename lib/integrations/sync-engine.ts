/**
 * Health Data Synchronization Engine
 * Handles background sync jobs, error handling, and data merging
 */

import { supabase } from '@/lib/supabase';
import { 
  HealthDataPoint, 
  HealthServiceName, 
  HealthDataType,
  HealthIntegrationService 
} from './types';
import { googleFitService } from './services/google-fit';
import { fitbitService } from './services/fitbit';
import { appleHealthService } from './services/apple-health';
import { samsungHealthService } from './services/samsung-health';
import { garminConnectService } from './services/garmin-connect';

// Service registry
const serviceRegistry: Record<HealthServiceName, HealthIntegrationService> = {
  'google-fit': googleFitService,
  'fitbit': fitbitService,
  'apple-health': appleHealthService,
  'samsung-health': samsungHealthService,
  'garmin-connect': garminConnectService,
};

export interface SyncResult {
  success: boolean;
  syncedPoints: number;
  errors: string[];
  lastSyncTime: Date;
}

export interface SyncJob {
  id: string;
  userId: string;
  integrationId: string;
  serviceName: HealthServiceName;
  dataTypes: HealthDataType[];
  scheduledFor: Date;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export class HealthDataSyncEngine {
  private readonly MAX_RETRY_COUNT = 3;
  private readonly SYNC_BATCH_SIZE = 1000;
  private readonly DEDUPLICATION_WINDOW = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  // In-memory job queue (in production, use Redis or similar)
  private jobQueue: SyncJob[] = [];
  private isProcessing = false;

  constructor() {
    // Start processing jobs
    this.startJobProcessor();
  }

  /**
   * Schedule a sync job for a user's integration
   */
  async scheduleSyncJob(
    userId: string,
    integrationId: string,
    serviceName: HealthServiceName,
    dataTypes: HealthDataType[],
    delayMinutes: number = 0
  ): Promise<string> {
    const jobId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);

    const job: SyncJob = {
      id: jobId,
      userId,
      integrationId,
      serviceName,
      dataTypes,
      scheduledFor,
      retryCount: 0,
      maxRetries: this.MAX_RETRY_COUNT,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.jobQueue.push(job);
    console.log(`Scheduled sync job ${jobId} for user ${userId} service ${serviceName}`);
    
    return jobId;
  }

  /**
   * Sync health data for a specific integration immediately
   */
  async syncIntegrationNow(
    userId: string,
    integrationId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<SyncResult> {
    try {
      // Get integration details
      const { data: integration, error } = await supabase
        .from('health_integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('user_id', userId)
        .single();

      if (error || !integration) {
        throw new Error('Integration not found');
      }

      if (!integration.is_active) {
        throw new Error('Integration is not active');
      }

      // Get the service
      const service = serviceRegistry[integration.service_name as HealthServiceName];
      if (!service) {
        throw new Error(`Service ${integration.service_name} not implemented`);
      }

      // Set date range (default to last 30 days if not specified)
      const endDate = toDate || new Date();
      const startDate = fromDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      console.log(`Syncing ${integration.service_name} data from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Check and refresh token if needed
      const tokens = await this.ensureValidTokens(integration, service);
      
      // Sync data
      const dataPoints = await service.syncHealthData(
        tokens.accessToken,
        integration.data_types as HealthDataType[],
        startDate,
        endDate
      );

      // Process and store data points
      const syncedCount = await this.processDataPoints(dataPoints, userId, integrationId);

      // Update last sync time
      await supabase
        .from('health_integrations')
        .update({ 
          last_sync_at: new Date().toISOString(),
          sync_status: 'completed'
        })
        .eq('id', integrationId);

      return {
        success: true,
        syncedPoints: syncedCount,
        errors: [],
        lastSyncTime: new Date()
      };

    } catch (error) {
      console.error('Sync error:', error);
      
      // Update integration with error status
      await supabase
        .from('health_integrations')
        .update({ 
          sync_status: 'error',
          last_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', integrationId);

      return {
        success: false,
        syncedPoints: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date()
      };
    }
  }

  /**
   * Ensure access tokens are valid, refresh if needed
   */
  private async ensureValidTokens(
    integration: any,
    service: HealthIntegrationService
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let accessToken = integration.access_token;
    let refreshToken = integration.refresh_token;

    // Check if token is expired (if we have expiry info)
    const isExpired = integration.token_expires_at && 
                     new Date(integration.token_expires_at) <= new Date();

    if (isExpired || !(await service.validateToken(accessToken))) {
      console.log('Access token expired or invalid, refreshing...');
      
      try {
        const tokenResponse = await service.refreshToken(refreshToken);
        accessToken = tokenResponse.access_token;
        refreshToken = tokenResponse.refresh_token || refreshToken;

        // Update stored tokens
        await supabase
          .from('health_integrations')
          .update({
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expires_at: tokenResponse.expires_in 
              ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
              : null
          })
          .eq('id', integration.id);

      } catch (error) {
        console.error('Token refresh failed:', error);
        throw new Error('Failed to refresh access token. User needs to re-authorize.');
      }
    }

    return { accessToken, refreshToken };
  }

  /**
   * Process and store data points with deduplication
   */
  private async processDataPoints(
    dataPoints: HealthDataPoint[],
    userId: string,
    integrationId: string
  ): Promise<number> {
    if (dataPoints.length === 0) {
      return 0;
    }

    // Set user and integration IDs
    const processedPoints = dataPoints.map(point => ({
      ...point,
      userId,
      integrationId
    }));

    // Deduplicate data points
    const deduplicatedPoints = await this.deduplicateDataPoints(processedPoints);

    // Store in batches
    let storedCount = 0;
    for (let i = 0; i < deduplicatedPoints.length; i += this.SYNC_BATCH_SIZE) {
      const batch = deduplicatedPoints.slice(i, i + this.SYNC_BATCH_SIZE);
      
      try {
        const { error } = await supabase
          .from('health_data_points')
          .insert(batch.map(point => ({
            user_id: point.userId,
            integration_id: point.integrationId,
            data_type: point.dataType,
            value: point.value,
            unit: point.unit,
            timestamp: point.timestamp.toISOString(),
            metadata: point.metadata
          })));

        if (error) {
          console.error('Error storing data batch:', error);
        } else {
          storedCount += batch.length;
        }
      } catch (error) {
        console.error('Batch storage error:', error);
      }
    }

    console.log(`Stored ${storedCount} health data points for user ${userId}`);
    return storedCount;
  }

  /**
   * Deduplicate data points based on timestamp, data type, and value
   */
  private async deduplicateDataPoints(
    dataPoints: HealthDataPoint[]
  ): Promise<HealthDataPoint[]> {
    if (dataPoints.length === 0) return [];

    // Get existing data points in the time range for deduplication
    const userId = dataPoints[0].userId;
    const integrationId = dataPoints[0].integrationId;
    const minTimestamp = new Date(Math.min(...dataPoints.map(p => p.timestamp.getTime())));
    const maxTimestamp = new Date(Math.max(...dataPoints.map(p => p.timestamp.getTime())));

    // Expand search window for deduplication
    const searchStart = new Date(minTimestamp.getTime() - this.DEDUPLICATION_WINDOW);
    const searchEnd = new Date(maxTimestamp.getTime() + this.DEDUPLICATION_WINDOW);

    const { data: existingPoints, error } = await supabase
      .from('health_data_points')
      .select('data_type, value, timestamp')
      .eq('user_id', userId)
      .eq('integration_id', integrationId)
      .gte('timestamp', searchStart.toISOString())
      .lte('timestamp', searchEnd.toISOString());

    if (error) {
      console.error('Error fetching existing data points:', error);
      return dataPoints; // Return all points if we can't check for duplicates
    }

    // Create a set of existing data point keys for fast lookup
    const existingKeys = new Set(
      (existingPoints || []).map(point => 
        `${point.data_type}_${point.value}_${new Date(point.timestamp).getTime()}`
      )
    );

    // Filter out duplicates
    const deduplicatedPoints = dataPoints.filter(point => {
      const key = `${point.dataType}_${point.value}_${point.timestamp.getTime()}`;
      return !existingKeys.has(key);
    });

    console.log(`Deduplicated: ${dataPoints.length} -> ${deduplicatedPoints.length} points`);
    return deduplicatedPoints;
  }

  /**
   * Start the background job processor
   */
  private startJobProcessor(): void {
    setInterval(async () => {
      if (this.isProcessing) return;
      
      await this.processNextJob();
    }, 10000); // Check every 10 seconds

    console.log('Health data sync engine started');
  }

  /**
   * Process the next available job
   */
  private async processNextJob(): Promise<void> {
    const now = new Date();
    const availableJob = this.jobQueue.find(job => 
      job.status === 'pending' && 
      job.scheduledFor <= now
    );

    if (!availableJob) return;

    this.isProcessing = true;
    availableJob.status = 'running';
    availableJob.updatedAt = new Date();

    try {
      console.log(`Processing sync job ${availableJob.id}`);
      
      const result = await this.syncIntegrationNow(
        availableJob.userId,
        availableJob.integrationId
      );

      if (result.success) {
        availableJob.status = 'completed';
        console.log(`Sync job ${availableJob.id} completed successfully`);
      } else {
        throw new Error(result.errors.join(', '));
      }

    } catch (error) {
      console.error(`Sync job ${availableJob.id} failed:`, error);
      
      availableJob.retryCount++;
      if (availableJob.retryCount >= availableJob.maxRetries) {
        availableJob.status = 'failed';
      } else {
        availableJob.status = 'pending';
        // Exponential backoff: retry after 2^retryCount minutes
        const delayMinutes = Math.pow(2, availableJob.retryCount);
        availableJob.scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);
      }
    } finally {
      availableJob.updatedAt = new Date();
      this.isProcessing = false;
    }
  }

  /**
   * Get sync job status
   */
  getSyncJob(jobId: string): SyncJob | undefined {
    return this.jobQueue.find(job => job.id === jobId);
  }

  /**
   * Cancel a pending sync job
   */
  cancelSyncJob(jobId: string): boolean {
    const jobIndex = this.jobQueue.findIndex(job => job.id === jobId);
    if (jobIndex === -1) return false;

    const job = this.jobQueue[jobIndex];
    if (job.status === 'pending') {
      this.jobQueue.splice(jobIndex, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all active integrations for periodic sync
   */
  async schedulePeriodicSync(): Promise<void> {
    try {
      const { data: integrations, error } = await supabase
        .from('health_integrations')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching integrations for periodic sync:', error);
        return;
      }

      for (const integration of integrations || []) {
        // Check if we need to sync (e.g., last sync was more than 1 hour ago)
        const lastSync = integration.last_sync_at 
          ? new Date(integration.last_sync_at)
          : new Date(0);
        
        const hoursSinceLastSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastSync >= 1) { // Sync every hour
          await this.scheduleSyncJob(
            integration.user_id,
            integration.id,
            integration.service_name as HealthServiceName,
            integration.data_types as HealthDataType[],
            Math.random() * 10 // Random delay 0-10 minutes to spread load
          );
        }
      }

      console.log('Periodic sync scheduling completed');
    } catch (error) {
      console.error('Error in periodic sync scheduling:', error);
    }
  }

  /**
   * Handle webhook notifications
   */
  async handleWebhookNotification(
    serviceName: HealthServiceName,
    payload: any,
    signature?: string
  ): Promise<void> {
    try {
      const service = serviceRegistry[serviceName];
      if (!service) {
        console.warn(`No service handler for webhook from ${serviceName}`);
        return;
      }

      // Process webhook with the appropriate service
      const dataPoints = await service.handleWebhook(payload, signature || '');
      
      if (dataPoints.length > 0) {
        console.log(`Webhook from ${serviceName} provided ${dataPoints.length} data points`);
        
        // Find affected integrations and trigger immediate sync
        // This is a simplified approach - in reality, you'd extract user info from webhook
        const affectedUserId = this.extractUserIdFromWebhook(payload);
        if (affectedUserId) {
          await this.triggerWebhookSync(serviceName, affectedUserId, dataPoints);
        }
      }
    } catch (error) {
      console.error(`Error handling ${serviceName} webhook:`, error);
    }
  }

  /**
   * Extract user ID from webhook payload (service-specific)
   */
  private extractUserIdFromWebhook(payload: any): string | null {
    // This would be implemented per service based on their webhook format
    // For now, return null to indicate we couldn't extract user ID
    return payload.userId || payload.user_id || payload.ownerId || null;
  }

  /**
   * Trigger sync for webhook-provided data
   */
  private async triggerWebhookSync(
    serviceName: HealthServiceName,
    userId: string,
    dataPoints: HealthDataPoint[]
  ): Promise<void> {
    try {
      // Find the user's integration for this service
      const { data: integration, error } = await supabase
        .from('health_integrations')
        .select('id')
        .eq('user_id', userId)
        .eq('service_name', serviceName)
        .eq('is_active', true)
        .single();

      if (error || !integration) {
        console.warn(`No active integration found for user ${userId} service ${serviceName}`);
        return;
      }

      // Process the webhook data points immediately
      await this.processDataPoints(dataPoints, userId, integration.id);
      
      console.log(`Processed ${dataPoints.length} webhook data points for ${serviceName}`);
    } catch (error) {
      console.error('Error processing webhook sync:', error);
    }
  }

  /**
   * Get sync statistics for monitoring
   */
  async getSyncStats(): Promise<{
    totalJobs: number;
    pendingJobs: number;
    completedJobs: number;
    failedJobs: number;
    runningJobs: number;
  }> {
    const stats = {
      totalJobs: this.jobQueue.length,
      pendingJobs: this.jobQueue.filter(j => j.status === 'pending').length,
      completedJobs: this.jobQueue.filter(j => j.status === 'completed').length,
      failedJobs: this.jobQueue.filter(j => j.status === 'failed').length,
      runningJobs: this.jobQueue.filter(j => j.status === 'running').length
    };

    return stats;
  }

  /**
   * Clean up old completed/failed jobs
   */
  cleanupOldJobs(maxAgeHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    const beforeCount = this.jobQueue.length;
    this.jobQueue = this.jobQueue.filter(job => 
      job.status === 'pending' || 
      job.status === 'running' || 
      job.updatedAt > cutoffTime
    );
    
    const cleanedCount = beforeCount - this.jobQueue.length;
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old sync jobs`);
    }
  }
}

// Export singleton instance
export const healthDataSyncEngine = new HealthDataSyncEngine();

// Schedule periodic cleanup
setInterval(() => {
  healthDataSyncEngine.cleanupOldJobs();
}, 60 * 60 * 1000); // Clean up every hour

// Schedule periodic sync every 30 minutes
setInterval(async () => {
  await healthDataSyncEngine.schedulePeriodicSync();
}, 30 * 60 * 1000);
