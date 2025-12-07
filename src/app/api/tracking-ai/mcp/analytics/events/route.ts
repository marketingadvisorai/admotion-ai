/**
 * Google Analytics MCP Events API
 * GET - List GA4 events
 * POST - Create GA4 event
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleAnalyticsMcpService, CreateGA4EventInput } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');
    const propertyId = searchParams.get('propertyId');
    
    if (!integrationId || !propertyId) {
      return NextResponse.json(
        { error: 'integrationId and propertyId are required' },
        { status: 400 }
      );
    }
    
    const events = await googleAnalyticsMcpService.listEvents(integrationId, propertyId);
    
    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { integrationId, propertyId, eventName, parameters, markAsConversion } = body;
    
    if (!integrationId || !propertyId || !eventName) {
      return NextResponse.json(
        { error: 'integrationId, propertyId, and eventName are required' },
        { status: 400 }
      );
    }
    
    const input: CreateGA4EventInput = {
      propertyId,
      eventName,
      parameters,
      markAsConversion,
    };
    
    const event = await googleAnalyticsMcpService.createCustomEvent(integrationId, input);
    
    return NextResponse.json({ event });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
