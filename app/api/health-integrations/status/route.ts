/**
 * Health Integrations Status API
 * Returns which integrations are currently available based on environment configuration
 */

import { NextResponse } from 'next/server';
import { getHealthIntegrationStatus } from '@/lib/integrations/env-validator';

export async function GET() {
  try {
    const integrationStatus = getHealthIntegrationStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        encryptionConfigured: integrationStatus.encryptionConfigured,
        totalServices: integrationStatus.totalServices,
        enabledServices: integrationStatus.enabledServices,
        disabledServices: integrationStatus.disabledServices,
        readyToUse: integrationStatus.readyToUse,
        services: Object.entries(integrationStatus.serviceConfigs).reduce((acc, [serviceName, config]) => {
          acc[serviceName] = {
            serviceName: config.serviceName,
            isConfigured: config.isConfigured,
            status: config.status,
            // Don't expose missing variable names in production for security
            ...(process.env['NODE_ENV'] === 'development' && {
              missingVars: config.missingVars,
              requiredVars: config.requiredVars
            })
          };
          return acc;
        }, {} as any)
      }
    });
  } catch (error) {
    console.error('Error checking health integration status:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTEGRATION_STATUS_ERROR',
        message: 'Failed to check integration status'
      }
    }, { status: 500 });
  }
}

