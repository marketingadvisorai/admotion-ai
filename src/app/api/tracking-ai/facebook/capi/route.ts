/**
 * Facebook CAPI API
 * GET - Get CAPI settings
 * POST - Enable/configure CAPI
 * PATCH - Update CAPI settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { facebookCapiService, facebookAuthService } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    const integration = await facebookAuthService.getOrgIntegration(orgId);
    
    if (!integration || !integration.pixelId) {
      return NextResponse.json({ error: 'Facebook not connected or no pixel selected' }, { status: 400 });
    }
    
    const settings = await facebookCapiService.getCapiSettings(orgId, integration.pixelId);
    
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, pixelId } = body;
    
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
    
    const settings = await facebookCapiService.enableCapi(integration.id, targetPixelId);
    
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { settingsId, ...updates } = body;
    
    if (!settingsId) {
      return NextResponse.json({ error: 'settingsId is required' }, { status: 400 });
    }
    
    const settings = await facebookCapiService.updateCapiSettings(settingsId, updates);
    
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    
    await facebookCapiService.disableCapi(integration.id, targetPixelId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
