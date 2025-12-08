/**
 * Facebook Pixel Code API
 * GET - Get pixel installation code
 */

import { NextRequest, NextResponse } from 'next/server';
import { facebookPixelService, facebookAuthService } from '@/modules/tracking-ai';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pixelId: string }> }
) {
  try {
    const { pixelId } = await params;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    const integration = await facebookAuthService.getOrgIntegration(orgId);
    
    if (!integration) {
      return NextResponse.json({ error: 'Facebook not connected' }, { status: 400 });
    }
    
    const code = await facebookPixelService.getPixelCode(integration.id, pixelId);
    
    return NextResponse.json({ code, pixelId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
