import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { createBrief, getBriefs } from '@/modules/creative-studio/services/brief.service';

/**
 * GET /api/creative-studio/briefs - Get all briefs for an organization
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

        if (!orgId) {
            return NextResponse.json({ success: false, error: 'orgId is required' }, { status: 400 });
        }

        const briefs = await getBriefs(orgId);
        return NextResponse.json({ success: true, briefs });

    } catch (error) {
        console.error('Get briefs error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/creative-studio/briefs - Create a new brief
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { orgId, name, objective, targetAudience, productService, brandMemoryId } = body;

        if (!orgId || !name) {
            return NextResponse.json({ success: false, error: 'orgId and name are required' }, { status: 400 });
        }

        const brief = await createBrief({
            org_id: orgId,
            name,
            objective,
            target_audience: targetAudience,
            product_service: productService,
            brand_memory_id: brandMemoryId,
        });

        return NextResponse.json({ success: true, brief });

    } catch (error) {
        console.error('Create brief error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
