import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { initBrandMemoryFromKit } from '@/modules/creative-studio/services/brand-memory.service';

/**
 * POST /api/brand-memory/sync - Sync brand memory from brand kit
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { orgId, brandKitId } = body;

        if (!orgId || !brandKitId) {
            return NextResponse.json(
                { success: false, error: 'orgId and brandKitId are required' },
                { status: 400 }
            );
        }

        // Verify user has access to the organization
        const { data: membership } = await supabase
            .from('organization_memberships')
            .select('role')
            .eq('org_id', orgId)
            .eq('user_id', user.id)
            .single();

        if (!membership) {
            return NextResponse.json(
                { success: false, error: 'You do not have access to this organization' },
                { status: 403 }
            );
        }

        const brandMemory = await initBrandMemoryFromKit(orgId, brandKitId);

        return NextResponse.json({
            success: true,
            brandMemory,
        });

    } catch (error) {
        console.error('Sync brand memory error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
