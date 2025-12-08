/**
 * Facebook CAPI Events API
 * POST - Send server-side events
 * GET - Get server events history
 */

import { NextRequest, NextResponse } from 'next/server';
import { facebookCapiService, facebookAuthService } from '@/modules/tracking-ai';
import type { SendCapiEventInput } from '@/modules/tracking-ai/providers/facebook/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, events } = body;
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'events array is required' }, { status: 400 });
    }
    
    const integration = await facebookAuthService.getOrgIntegration(orgId);
    
    if (!integration) {
      return NextResponse.json({ error: 'Facebook not connected' }, { status: 400 });
    }
    
    if (!integration.pixelId) {
      return NextResponse.json({ error: 'No pixel selected' }, { status: 400 });
    }
    
    // Add pixel ID to events
    const eventsWithPixel: SendCapiEventInput[] = events.map((e: Partial<SendCapiEventInput>) => ({
      ...e,
      pixelId: integration.pixelId!,
    })) as SendCapiEventInput[];
    
    const response = await facebookCapiService.sendBatchEvents(
      integration.id,
      eventsWithPixel
    );
    
    return NextResponse.json({ response });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const pixelId = searchParams.get('pixelId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    const events = await facebookCapiService.getServerEvents(orgId, {
      pixelId: pixelId || undefined,
      status: status || undefined,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    
    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
