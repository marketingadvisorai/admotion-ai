import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { getVideoGenerations } from '@/modules/video-generation/service';

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
        const campaignId = searchParams.get('campaignId') || undefined;

        if (!orgId) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameter: orgId' },
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

        const videos = await getVideoGenerations(orgId, campaignId);

        return NextResponse.json({
            success: true,
            videos,
        });

    } catch (error) {
        console.error('Videos list API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
