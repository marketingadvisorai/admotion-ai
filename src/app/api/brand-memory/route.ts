import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { 
    getActiveBrandMemory, 
    updateBrandMemory 
} from '@/modules/creative-studio/services/brand-memory.service';

/**
 * GET /api/brand-memory - Get active brand memory for an organization
 */
export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

        if (!orgId) {
            return NextResponse.json(
                { success: false, error: 'orgId is required' },
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

        const brandMemory = await getActiveBrandMemory(orgId);

        return NextResponse.json({
            success: true,
            brandMemory,
        });

    } catch (error) {
        console.error('Get brand memory error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/brand-memory - Update brand memory (creates new version)
 */
export async function PUT(request: NextRequest) {
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
        const { orgId, updates } = body;

        if (!orgId) {
            return NextResponse.json(
                { success: false, error: 'orgId is required' },
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

        const brandMemory = await updateBrandMemory(orgId, updates);

        return NextResponse.json({
            success: true,
            brandMemory,
        });

    } catch (error) {
        console.error('Update brand memory error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
