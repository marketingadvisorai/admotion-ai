import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { generateVideo } from '@/modules/video-generation/service';
import { 
    VideoProvider, 
    VideoAspectRatio, 
    VideoModel,
    VideoDuration,
    AudioConfig,
    SceneDescription,
    VideoAdCopy,
} from '@/modules/video-generation/types';

export const maxDuration = 120; // Allow up to 120 seconds for video generation

interface GenerateRequestBody {
    orgId: string;
    campaignId?: string;
    brandKitId?: string;
    prompt?: string;
    provider?: VideoProvider;
    model?: VideoModel;
    aspectRatio?: VideoAspectRatio;
    duration?: VideoDuration;
    style?: string;
    audio?: AudioConfig;
    adCopy?: VideoAdCopy;
    sceneDescription?: SceneDescription;
    visualTheme?: string;
    brandContext?: {
        businessName?: string;
        colors?: string[];
        brandVoice?: string;
        targetAudience?: string;
        tone?: 'exciting' | 'mysterious' | 'energetic' | 'luxurious' | 'playful' | 'professional' | 'warm';
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
        if (!body.orgId) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: orgId' },
                { status: 400 }
            );
        }

        // Must have either prompt or adCopy
        if (!body.prompt && !body.adCopy?.headline) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: prompt or adCopy.headline' },
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

        // Generate video
        const result = await generateVideo({
            orgId: body.orgId,
            campaignId: body.campaignId,
            brandKitId: body.brandKitId,
            prompt: body.prompt,
            provider: body.provider,
            model: body.model,
            aspectRatio: body.aspectRatio || '16:9',
            duration: body.duration || 10,
            style: body.style,
            audio: body.audio || { enabled: true, style: 'upbeat' },
            adCopy: body.adCopy,
            sceneDescription: body.sceneDescription,
            visualTheme: body.visualTheme,
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
            video: result.video,
            jobId: result.jobId,
            promptUsed: result.promptUsed,
            promptVariations: result.promptVariations,
            brandConsistencyScore: result.brandConsistencyScore,
        });

    } catch (error) {
        console.error('Video generation API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
