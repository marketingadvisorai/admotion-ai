/**
 * Facebook Event Mapping by ID API
 * GET - Get mapping details
 * PATCH - Update mapping
 * DELETE - Delete mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { facebookEventMappingService } from '@/modules/tracking-ai';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mappingId: string }> }
) {
  try {
    const { mappingId } = await params;
    
    const mapping = await facebookEventMappingService.getMapping(mappingId);
    
    return NextResponse.json({ mapping });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ mappingId: string }> }
) {
  try {
    const { mappingId } = await params;
    const body = await request.json();
    
    const mapping = await facebookEventMappingService.updateMapping(mappingId, body);
    
    return NextResponse.json({ mapping });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mappingId: string }> }
) {
  try {
    const { mappingId } = await params;
    
    await facebookEventMappingService.deleteMapping(mappingId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
