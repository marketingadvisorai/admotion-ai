/**
 * Google Tag Manager Triggers API
 * GET - List triggers
 * POST - Create trigger
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleTagManagerService } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');
    const accountId = searchParams.get('accountId');
    const containerId = searchParams.get('containerId');
    const workspaceId = searchParams.get('workspaceId');
    
    if (!integrationId || !accountId || !containerId || !workspaceId) {
      return NextResponse.json(
        { error: 'integrationId, accountId, containerId, and workspaceId are required' },
        { status: 400 }
      );
    }
    
    const triggers = await googleTagManagerService.listTriggers(
      integrationId,
      accountId,
      containerId,
      workspaceId
    );
    
    return NextResponse.json({ triggers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { integrationId, containerId, workspaceId, name, type, filter, customEventFilter } = body;
    
    if (!integrationId || !containerId || !workspaceId || !name || !type) {
      return NextResponse.json(
        { error: 'integrationId, containerId, workspaceId, name, and type are required' },
        { status: 400 }
      );
    }
    
    const trigger = await googleTagManagerService.createTrigger(integrationId, {
      containerId,
      workspaceId,
      name,
      type,
      filter,
      customEventFilter,
    });
    
    return NextResponse.json({ trigger });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
