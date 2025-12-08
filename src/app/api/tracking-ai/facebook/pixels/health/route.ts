/**
 * Facebook Pixel Health API
 * GET - Get pixel health status
 * POST - Run health check
 */

import { NextRequest, NextResponse } from 'next/server';
import { facebookPixelService, facebookAuthService } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const pixelId = searchParams.get('pixelId');
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    const integration = await facebookAuthService.getOrgIntegration(orgId);
    
    if (!integration) {
      return NextResponse.json({ error: 'Facebook not connected' }, { status: 400 });
    }
    
    const targetPixelId = pixelId || integration.pixelId;
    
    if (!targetPixelId) {
      return NextResponse.json({ error: 'No pixel selected' }, { status: 400 });
    }
    
    // Get stored health or null
    const health = await facebookPixelService.getStoredHealth(orgId, targetPixelId);
    
    return NextResponse.json({ health });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId } = body;
    
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
    
    const health = await facebookPixelService.checkPixelHealth(integration.id);
    
    return NextResponse.json({ health });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
