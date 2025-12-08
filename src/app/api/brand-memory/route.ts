import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import {
    getActiveBrandMemory,
    updateBrandMemory,
    getAllBrandMemoryVersions,
    deleteBrandMemory,
} from '@/modules/creative-studio/services/brand-memory.service';

async function assertOrgAccess(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string, userId: string) {
    const { data: membership, error } = await supabase
        .from('organization_memberships')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .single();

    if (error || !membership) {
        throw new Error('access-denied');
    }
}

/**
 * GET /api/brand-memory - Get active brand memory for an organization
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');
        const listAll = searchParams.get('all') === 'true';
        if (!orgId) return NextResponse.json({ success: false, error: 'orgId is required' }, { status: 400 });

        await assertOrgAccess(supabase, orgId, user.id);

        if (listAll) {
            const memories = await getAllBrandMemoryVersions(orgId);
            return NextResponse.json({ success: true, brandMemories: memories });
        }

        const brandMemory = await getActiveBrandMemory(orgId);
        return NextResponse.json({ success: true, brandMemory });
    } catch (error) {
        if (error instanceof Error && error.message === 'access-denied') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
        console.error('Get brand memory error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/brand-memory - Update brand memory (creates new version)
 */
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { orgId, updates } = body;
        if (!orgId) return NextResponse.json({ success: false, error: 'orgId is required' }, { status: 400 });

        await assertOrgAccess(supabase, orgId, user.id);

        const brandMemory = await updateBrandMemory(orgId, updates);
        return NextResponse.json({ success: true, brandMemory });
    } catch (error) {
        if (error instanceof Error && error.message === 'access-denied') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
        console.error('Update brand memory error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/brand-memory?id=...&orgId=...
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');
        const id = searchParams.get('id');
        if (!orgId || !id) return NextResponse.json({ success: false, error: 'orgId and id are required' }, { status: 400 });

        await assertOrgAccess(supabase, orgId, user.id);

        await deleteBrandMemory(orgId, id);
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'access-denied') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
        console.error('Delete brand memory error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
