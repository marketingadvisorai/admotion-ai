import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { getBrief, canGenerateCreatives } from '@/modules/creative-studio/services/brief.service';
import { generateCreativePack } from '@/modules/creative-studio/services/pack-generator.service';

export const maxDuration = 120; // Allow up to 2 minutes for pack generation

/**
 * POST /api/creative-studio/briefs/[briefId]/generate - Generate creative pack
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ briefId: string }> }
) {
    try {
        const { briefId } = await params;
        const supabase = await createClient();
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { model = 'openai' } = body;

        // Get brief
        const brief = await getBrief(briefId);
        if (!brief) {
            return NextResponse.json({ success: false, error: 'Brief not found' }, { status: 404 });
        }

        // Check if can generate (HARD GATE - copy must be confirmed)
        const { canGenerate, reason } = canGenerateCreatives(brief);
        if (!canGenerate) {
            return NextResponse.json({ success: false, error: reason }, { status: 400 });
        }

        // Generate creative pack
        const result = await generateCreativePack({
            brief_id: briefId,
            org_id: brief.org_id,
            model: model as 'openai' | 'gemini',
        });

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            pack: result.pack,
            assets: result.assets,
        });

    } catch (error) {
        console.error('Generate pack error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
}
