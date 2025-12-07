/**
 * Google Analytics MCP Properties API
 * GET - List GA4 properties
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleAnalyticsMcpService } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');
    
    if (!integrationId) {
      return NextResponse.json({ error: 'integrationId is required' }, { status: 400 });
    }
    
    const { accounts, properties } = await googleAnalyticsMcpService.listAccountSummaries(integrationId);
    
    return NextResponse.json({ accounts, properties });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
