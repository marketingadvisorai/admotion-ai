/**
 * Tracking AI Health Auto-Fix API
 * POST - Attempt to auto-fix an issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackingHealthService } from '@/modules/tracking-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { healthStatusId } = body;
    
    if (!healthStatusId) {
      return NextResponse.json({ error: 'healthStatusId is required' }, { status: 400 });
    }
    
    const result = await trackingHealthService.autoFix(healthStatusId);
    
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
