import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/database';
import { HEALTH_SERVICE_CONFIGS, HealthServiceName } from '@/lib/integrations/types';

/**
 * Get user's health integrations
 * GET /api/user/integrations
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Get user's integrations from database
    const integrations = await db.getHealthIntegrations(user.id);

    // Transform data for frontend
    const integrationsData = integrations.map(integration => {
      const serviceConfig = HEALTH_SERVICE_CONFIGS[integration.service_name];
      
      return {
        id: integration.id,
        serviceName: integration.service_name,
        displayName: serviceConfig?.displayName || integration.service_name,
        icon: serviceConfig?.icon || '📱',
        colors: serviceConfig?.colors || { primary: '#666', secondary: '#f0f0f0' },
        status: integration.status,
        syncStatus: integration.sync_status,
        lastSyncAt: integration.last_sync_at,
        supportedDataTypes: serviceConfig?.supportedDataTypes || [],
        settings: integration.settings,
        errorMessage: integration.error_message,
        createdAt: integration.created_at,
        updatedAt: integration.updated_at
      };
    });

    // Get available services (not yet connected)
    const connectedServices = integrations.map(i => i.service_name);
    const availableServices = Object.entries(HEALTH_SERVICE_CONFIGS)
      .filter(([serviceName]) => !connectedServices.includes(serviceName as HealthServiceName))
      .map(([serviceName, config]) => ({
        serviceName,
        displayName: config.displayName,
        description: config.description,
        icon: config.icon,
        colors: config.colors,
        supportedDataTypes: config.supportedDataTypes
      }));

    return NextResponse.json({
      success: true,
      integrations: integrationsData,
      availableServices,
      stats: {
        total: integrationsData.length,
        connected: integrationsData.filter(i => i.status === 'connected').length,
        syncing: integrationsData.filter(i => i.syncStatus === 'syncing').length,
        errors: integrationsData.filter(i => i.status === 'error').length
      }
    });

  } catch (error: any) {
    console.error('Error fetching user integrations:', error);

    return NextResponse.json(
      { 
        error: 'Failed to fetch integrations', 
        code: 'FETCH_FAILED',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Update integration settings
 * PATCH /api/user/integrations
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { serviceName, settings } = body;

    if (!serviceName || !settings) {
      return NextResponse.json(
        { error: 'Service name and settings are required', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Validate service exists
    if (!HEALTH_SERVICE_CONFIGS[serviceName as HealthServiceName]) {
      return NextResponse.json(
        { error: 'Invalid service name', code: 'INVALID_SERVICE' },
        { status: 400 }
      );
    }

    // Update integration settings
    const updatedIntegration = await db.updateHealthIntegration(
      user.id,
      serviceName,
      { settings }
    );

    console.log(`Updated settings for user ${user.id} integration ${serviceName}`);

    return NextResponse.json({
      success: true,
      integration: {
        serviceName: updatedIntegration.service_name,
        settings: updatedIntegration.settings,
        updatedAt: updatedIntegration.updated_at
      }
    });

  } catch (error: any) {
    console.error('Error updating integration settings:', error);

    return NextResponse.json(
      { 
        error: 'Failed to update settings', 
        code: 'UPDATE_FAILED',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

