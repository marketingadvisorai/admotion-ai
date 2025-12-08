/**
 * Facebook Integration API
 * GET - Get integration status
 * DELETE - Disconnect integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { facebookAuthService } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    const integration = await facebookAuthService.getOrgIntegration(orgId);
    
    if (!integration) {
      return NextResponse.json({ connected: false });
    }
    
    // Validate token is still working
    const isValid = await facebookAuthService.validateToken(integration.id);
    
    return NextResponse.json({
      connected: isValid,
      integration: {
        id: integration.id,
        pixelId: integration.pixelId,
        adAccountId: integration.adAccountId,
        businessId: integration.businessId,
        facebookUserName: integration.facebookUserName,
        lastValidatedAt: integration.lastValidatedAt,
        validationError: integration.validationError,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');
    
    if (!integrationId) {
      return NextResponse.json({ error: 'integrationId is required' }, { status: 400 });
    }
    
    await facebookAuthService.disconnect(integrationId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
