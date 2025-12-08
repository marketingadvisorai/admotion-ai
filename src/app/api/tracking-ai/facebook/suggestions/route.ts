/**
 * Facebook Event Suggestions API
 * GET - Get suggested event mappings based on goals
 */

import { NextRequest, NextResponse } from 'next/server';
import { facebookEventMappingService } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalsParam = searchParams.get('goals');
    
    if (!goalsParam) {
      return NextResponse.json({ error: 'goals parameter is required' }, { status: 400 });
    }
    
    const goals = goalsParam.split(',');
    const suggestions = facebookEventMappingService.getSuggestedMappings(goals);
    
    return NextResponse.json({ suggestions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
