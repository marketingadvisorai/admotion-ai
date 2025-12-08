/**
 * Google Tag Manager Containers API
 * GET - List GTM containers
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleTagManagerService } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');
    const accountId = searchParams.get('accountId');
    
    if (!integrationId) {
      return NextResponse.json({ error: 'integrationId is required' }, { status: 400 });
    }
    
    // If no accountId, list accounts first
    if (!accountId) {
      const accounts = await googleTagManagerService.listAccounts(integrationId);
      return NextResponse.json({ accounts });
    }
    
    const containers = await googleTagManagerService.listContainers(integrationId, accountId);
    
    return NextResponse.json({ containers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
