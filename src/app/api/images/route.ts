import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { getImageGenerations, deleteImageGeneration } from '@/modules/image-generation/service';

/**
 * GET /api/images - Get image generations for an organization
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
        const campaignId = searchParams.get('campaignId');

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

        const images = await getImageGenerations(orgId, campaignId || undefined);

        return NextResponse.json({
            success: true,
            images,
        });

    } catch (error) {
        console.error('Get images API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/images - Delete an image generation
 */
export async function DELETE(request: NextRequest) {
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
        const imageId = searchParams.get('id');

        if (!imageId) {
            return NextResponse.json(
                { success: false, error: 'Image ID is required' },
                { status: 400 }
            );
        }

        await deleteImageGeneration(imageId);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete image API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
