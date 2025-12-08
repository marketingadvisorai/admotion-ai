/**
 * Facebook Event Test API
 * POST - Send test events
 * GET - Get test results
 */

import { NextRequest, NextResponse } from 'next/server';
import { facebookEventTesterService, facebookAuthService } from '@/modules/tracking-ai';
import type { SendCapiEventInput } from '@/modules/tracking-ai/providers/facebook/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, events, testEventCode } = body;
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    const integration = await facebookAuthService.getOrgIntegration(orgId);
    
    if (!integration) {
      return NextResponse.json({ error: 'Facebook not connected' }, { status: 400 });
    }
    
    if (!integration.pixelId) {
      return NextResponse.json({ error: 'No pixel selected' }, { status: 400 });
    }
    
    // If no events provided, use sample events
    let testEvents: SendCapiEventInput[] = events;
    
    if (!events || !Array.isArray(events) || events.length === 0) {
      testEvents = facebookEventTesterService.generateSampleEvents().map(e => ({
        ...e,
        pixelId: integration.pixelId!,
      }));
    } else {
      testEvents = events.map((e: Partial<SendCapiEventInput>) => ({
        ...e,
        pixelId: integration.pixelId!,
      })) as SendCapiEventInput[];
    }
    
    const results = await facebookEventTesterService.testBatchEvents(
      integration.id,
      testEvents,
      testEventCode
    );
    
    return NextResponse.json({
      results,
      testEventCode: results[0]?.testEventCode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const testEventCode = searchParams.get('testEventCode');
    
    if (!orgId || !testEventCode) {
      return NextResponse.json(
        { error: 'orgId and testEventCode are required' },
        { status: 400 }
      );
    }
    
    const integration = await facebookAuthService.getOrgIntegration(orgId);
    
    if (!integration) {
      return NextResponse.json({ error: 'Facebook not connected' }, { status: 400 });
    }
    
    const results = await facebookEventTesterService.getTestResults(
      integration.id,
      testEventCode
    );
    
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
