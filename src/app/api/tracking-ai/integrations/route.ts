/**
 * Tracking AI Integrations API
 * GET - List integrations
 * POST - Create/update integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    const { data: integrations, error } = await supabase
      .from('tracking_integrations')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ integrations });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { orgId, provider, accountId, accountName, metadata } = body;
    
    if (!orgId || !provider) {
      return NextResponse.json(
        { error: 'orgId and provider are required' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('tracking_integrations')
      .upsert({
        org_id: orgId,
        provider,
        account_id: accountId,
        account_name: accountName,
        metadata,
        status: 'disconnected',
      }, {
        onConflict: 'org_id,provider,account_id',
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ integration: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
