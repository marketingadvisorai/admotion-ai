import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { checkVideoJobStatus } from '@/modules/video-generation/service';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;

        // Check and update job status
        const video = await checkVideoJobStatus(id);

        if (!video) {
            return NextResponse.json(
                { success: false, error: 'Video not found' },
                { status: 404 }
            );
        }

        // Verify user has access to the organization
        const { data: membership } = await supabase
            .from('organization_memberships')
            .select('role')
            .eq('org_id', video.org_id)
            .eq('user_id', user.id)
            .single();

        if (!membership) {
            return NextResponse.json(
                { success: false, error: 'You do not have access to this video' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            video,
        });

    } catch (error) {
        console.error('Video status API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
