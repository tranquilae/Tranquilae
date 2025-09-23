import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/database';
import { HEALTH_SERVICE_CONFIGS, HealthServiceName } from '@/lib/integrations/types';

/**
 * Get specific integration details
 * GET /api/user/integrations/[service]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const serviceName = params.service as HealthServiceName;
    
    // Validate service
    if (!HEALTH_SERVICE_CONFIGS[serviceName]) {
      return NextResponse.json(
        { error: 'Invalid service name', code: 'INVALID_SERVICE' },
        { status: 400 }
      );
    }

    // Get integration details
    const integration = await db.getHealthIntegration(user.id, serviceName);

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const serviceConfig = HEALTH_SERVICE_CONFIGS[serviceName];

    // Get recent health data points for this integration
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const healthDataSummary = await Promise.all(
      serviceConfig.supportedDataTypes.map(async (dataType) => {
        const dataPoints = await db.getHealthDataPoints(
          user.id,
          dataType,
          thirtyDaysAgo,
          new Date()
        );
        
        return {
          dataType,
          count: dataPoints.length,
          latestValue: dataPoints[dataPoints.length - 1]?.value || null,
          latestTimestamp: dataPoints[dataPoints.length - 1]?.timestamp || null
        };
      })
    );

    return NextResponse.json({
      success: true,
      integration: {
        serviceName: integration.service_name,
        displayName: serviceConfig.displayName,
        status: integration.status,
        syncStatus: integration.sync_status,
        lastSyncAt: integration.last_sync_at,
        errorMessage: integration.error_message,
        settings: integration.settings,
        scopes: integration.scopes,
        createdAt: integration.created_at,
        updatedAt: integration.updated_at
      },
      healthDataSummary,
      serviceConfig: {
        displayName: serviceConfig.displayName,
        description: serviceConfig.description,
        supportedDataTypes: serviceConfig.supportedDataTypes,
        icon: serviceConfig.icon,
        colors: serviceConfig.colors
      }
    });

  } catch (error: any) {
    console.error(`Error fetching integration ${params.service}:`, error);

    return NextResponse.json(
      { 
        error: 'Failed to fetch integration details', 
        code: 'FETCH_FAILED',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Disconnect/Delete integration
 * DELETE /api/user/integrations/[service]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const serviceName = params.service as HealthServiceName;

    // Validate service
    if (!HEALTH_SERVICE_CONFIGS[serviceName]) {
      return NextResponse.json(
        { error: 'Invalid service name', code: 'INVALID_SERVICE' },
        { status: 400 }
      );
    }

    // Check if integration exists
    const integration = await db.getHealthIntegration(user.id, serviceName);

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    console.log(`Disconnecting ${serviceName} for user ${user.id}`);

    // TODO: Revoke tokens with the service if they support it
    // This would involve making API calls to each service's token revocation endpoint

    // Delete integration from database
    await db.deleteHealthIntegration(user.id, serviceName);

    // TODO: Optionally delete associated health data points
    // You might want to keep historical data even after disconnecting
    
    console.log(`Successfully disconnected ${serviceName} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected ${HEALTH_SERVICE_CONFIGS[serviceName].displayName}`,
      serviceName
    });

  } catch (error: any) {
    console.error(`Error disconnecting integration ${params.service}:`, error);

    return NextResponse.json(
      { 
        error: 'Failed to disconnect integration', 
        code: 'DISCONNECT_FAILED',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Trigger manual sync for integration
 * POST /api/user/integrations/[service]
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const serviceName = params.service as HealthServiceName;

    // Validate service
    if (!HEALTH_SERVICE_CONFIGS[serviceName]) {
      return NextResponse.json(
        { error: 'Invalid service name', code: 'INVALID_SERVICE' },
        { status: 400 }
      );
    }

    // Check if integration exists and is connected
    const integration = await db.getHealthIntegration(user.id, serviceName);

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (integration.status !== 'connected') {
      return NextResponse.json(
        { error: 'Integration is not connected', code: 'NOT_CONNECTED' },
        { status: 400 }
      );
    }

    if (integration.sync_status === 'syncing') {
      return NextResponse.json(
        { error: 'Sync already in progress', code: 'SYNC_IN_PROGRESS' },
        { status: 409 }
      );
    }

    console.log(`Manual sync triggered for ${serviceName} by user ${user.id}`);

    // Update sync status to 'syncing'
    await db.updateHealthIntegration(user.id, serviceName, {
      sync_status: 'syncing'
    });

    // TODO: Implement actual data sync logic
    // This would involve:
    // 1. Decrypting access tokens
    // 2. Making API calls to the health service
    // 3. Transforming and storing the data
    // 4. Updating sync status and timestamp
    
    // For now, simulate sync completion
    setTimeout(async () => {
      try {
        await db.updateHealthIntegration(user.id, serviceName, {
          sync_status: 'idle',
          last_sync_at: new Date()
        });
        console.log(`Sync completed for ${serviceName} user ${user.id}`);
      } catch (error) {
        console.error(`Error updating sync status:`, error);
        await db.updateHealthIntegration(user.id, serviceName, {
          sync_status: 'error',
          error_message: 'Sync failed'
        });
      }
    }, 5000);

    return NextResponse.json({
      success: true,
      message: `Manual sync started for ${HEALTH_SERVICE_CONFIGS[serviceName].displayName}`,
      serviceName,
      syncStatus: 'syncing'
    });

  } catch (error: any) {
    console.error(`Error triggering sync for ${params.service}:`, error);

    return NextResponse.json(
      { 
        error: 'Failed to trigger sync', 
        code: 'SYNC_FAILED',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
