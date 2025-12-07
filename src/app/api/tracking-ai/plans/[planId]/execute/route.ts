/**
 * Execute Tracking AI Plan API
 * POST - Execute a plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackingExecutorService } from '@/modules/tracking-ai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
    
    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 });
    }
    
    // Start execution (async)
    trackingExecutorService.executePlan(planId).catch(console.error);
    
    return NextResponse.json({ 
      message: 'Plan execution started',
      planId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
