/**
 * Tracking AI Plans API
 * GET - List plans
 * POST - Generate new plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { trackingAiPlannerService, TrackingAIPlanInput } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    
    const { data: plans, error } = await supabase
      .from('tracking_ai_plans')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ plans });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, websiteId, businessGoals, industry, websiteAnalysis, existingTracking, integrations } = body;
    
    if (!orgId || !businessGoals || businessGoals.length === 0) {
      return NextResponse.json(
        { error: 'orgId and businessGoals are required' },
        { status: 400 }
      );
    }
    
    const input: TrackingAIPlanInput = {
      orgId,
      websiteId,
      businessGoals,
      industry,
      websiteAnalysis: websiteAnalysis || {
        detectedPages: [],
        detectedForms: [],
        detectedEvents: [],
      },
      existingTracking: existingTracking || {
        adsConversions: [],
        ga4Events: [],
        gtmTags: [],
      },
      integrations: integrations || {},
    };
    
    const plan = await trackingAiPlannerService.generatePlan(input);
    
    return NextResponse.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
