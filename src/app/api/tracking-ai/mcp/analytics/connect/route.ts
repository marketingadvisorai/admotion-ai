/**
 * Google Analytics MCP Connect API
 * POST - Get OAuth URL for Google Analytics connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleAnalyticsMcpService } from '@/modules/tracking-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId } = body;
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/tracking-ai/callback/google-analytics`;
    const authUrl = await googleAnalyticsMcpService.getAuthUrl(orgId, redirectUri);
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
