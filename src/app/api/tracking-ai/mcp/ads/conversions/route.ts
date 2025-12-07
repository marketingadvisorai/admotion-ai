/**
 * Google Ads MCP Conversions API
 * GET - List conversion actions
 * POST - Create conversion action
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleAdsMcpService, CreateConversionActionInput } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');
    const customerId = searchParams.get('customerId');
    
    if (!integrationId || !customerId) {
      return NextResponse.json(
        { error: 'integrationId and customerId are required' },
        { status: 400 }
      );
    }
    
    const conversions = await googleAdsMcpService.listConversionActions(integrationId, customerId);
    
    return NextResponse.json({ conversions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { integrationId, customerId, name, category, countingType, defaultValue, currencyCode } = body;
    
    if (!integrationId || !customerId || !name || !category) {
      return NextResponse.json(
        { error: 'integrationId, customerId, name, and category are required' },
        { status: 400 }
      );
    }
    
    const input: CreateConversionActionInput = {
      customerId,
      name,
      category,
      countingType,
      defaultValue,
      currencyCode,
    };
    
    const conversion = await googleAdsMcpService.createConversionAction(integrationId, input);
    
    return NextResponse.json({ conversion });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
