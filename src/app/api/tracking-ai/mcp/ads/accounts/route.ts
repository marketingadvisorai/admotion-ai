/**
 * Google Ads MCP Accounts API
 * GET - List Google Ads customer accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleAdsMcpService } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');
    
    if (!integrationId) {
      return NextResponse.json({ error: 'integrationId is required' }, { status: 400 });
    }
    
    const customers = await googleAdsMcpService.listCustomers(integrationId);
    
    return NextResponse.json({ customers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
