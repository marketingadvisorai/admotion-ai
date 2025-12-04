import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { generateImages } from '@/modules/image-generation/service';
import { ImageProvider, ImageAspectRatio } from '@/modules/image-generation/types';

export const maxDuration = 60; // Allow up to 60 seconds for image generation

interface GenerateRequestBody {
    orgId: string;
    campaignId?: string;
    prompt: string;
    provider?: ImageProvider;
    aspectRatio?: ImageAspectRatio;
    style?: string;
    numberOfImages?: number;
    brandContext?: {
        businessName?: string;
        colors?: string[];
        brandVoice?: string;
        targetAudience?: string;
    };
}

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

        const body: GenerateRequestBody = await request.json();

        // Validate required fields
        if (!body.orgId || !body.prompt) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: orgId and prompt are required' },
                { status: 400 }
            );
        }

        // Verify user has access to the organization
        const { data: membership } = await supabase
            .from('organization_memberships')
            .select('role')
            .eq('org_id', body.orgId)
            .eq('user_id', user.id)
            .single();

        if (!membership) {
            return NextResponse.json(
                { success: false, error: 'You do not have access to this organization' },
                { status: 403 }
            );
        }

        // Generate images
        const result = await generateImages({
            orgId: body.orgId,
            campaignId: body.campaignId,
            prompt: body.prompt,
            provider: body.provider || 'openai',
            aspectRatio: body.aspectRatio || '1:1',
            style: body.style,
            numberOfImages: body.numberOfImages || 1,
            brandContext: body.brandContext,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            images: result.images,
        });

    } catch (error) {
        console.error('Image generation API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
