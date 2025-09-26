/**
 * Health Integration Sync Statistics API
 * GET /api/integrations/sync/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthDataSyncEngine } from '@/lib/integrations/sync-engine';

export async function GET(request: NextRequest) {
  try {
    // Get sync statistics from the engine
    const stats = await healthDataSyncEngine.getSyncStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting sync stats:', error);
    
    return NextResponse.json(
      { error: 'Failed to get sync statistics' },
      { status: 500 }
    );
  }
}

