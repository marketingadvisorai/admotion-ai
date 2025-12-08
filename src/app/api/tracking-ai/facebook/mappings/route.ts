/**
 * Facebook Event Mappings API
 * GET - List event mappings
 * POST - Create event mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { facebookEventMappingService, facebookAuthService } from '@/modules/tracking-ai';
import type { CreateEventMappingInput } from '@/modules/tracking-ai/providers/facebook/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    const mappings = activeOnly
      ? await facebookEventMappingService.listActiveMappings(orgId)
      : await facebookEventMappingService.listMappings(orgId);
    
    return NextResponse.json({ mappings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, ...mappingData } = body;
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    // Get integration ID
    const integration = await facebookAuthService.getOrgIntegration(orgId);
    
    if (!integration) {
      return NextResponse.json({ error: 'Facebook not connected' }, { status: 400 });
    }
    
    const input: CreateEventMappingInput = {
      orgId,
      integrationId: integration.id,
      ...mappingData,
    };
    
    const mapping = await facebookEventMappingService.createMapping(input);
    
    return NextResponse.json({ mapping });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
