/**
 * Tracking AI Health API
 * GET - Get health status
 * POST - Run health check
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { trackingHealthService, HealthCheckType } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    const { data: healthStatuses, error } = await supabase
      .from('tracking_health_status')
      .select('*')
      .eq('org_id', orgId)
      .order('last_checked_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ healthStatuses });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, checkType } = body;
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    let healthStatuses;
    
    if (checkType) {
      // Run specific check
      const status = await trackingHealthService.runSpecificCheck(orgId, checkType as HealthCheckType);
      healthStatuses = [status];
    } else {
      // Run all checks
      healthStatuses = await trackingHealthService.runHealthCheck(orgId);
    }
    
    return NextResponse.json({ healthStatuses });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
