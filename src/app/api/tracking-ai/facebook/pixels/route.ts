/**
 * Facebook Pixels API
 * GET - List available pixels
 * POST - Select a pixel
 */

import { NextRequest, NextResponse } from 'next/server';
import { facebookPixelService, facebookAuthService } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    const integration = await facebookAuthService.getOrgIntegration(orgId);
    
    if (!integration) {
      return NextResponse.json({ error: 'Facebook not connected' }, { status: 400 });
    }
    
    const pixels = await facebookPixelService.listPixels(integration.id);
    
    return NextResponse.json({
      pixels,
      selectedPixelId: integration.pixelId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, pixelId } = body;
    
    if (!orgId || !pixelId) {
      return NextResponse.json(
        { error: 'orgId and pixelId are required' },
        { status: 400 }
      );
    }
    
    const integration = await facebookAuthService.getOrgIntegration(orgId);
    
    if (!integration) {
      return NextResponse.json({ error: 'Facebook not connected' }, { status: 400 });
    }
    
    await facebookPixelService.selectPixel(integration.id, pixelId);
    
    return NextResponse.json({ success: true, pixelId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
