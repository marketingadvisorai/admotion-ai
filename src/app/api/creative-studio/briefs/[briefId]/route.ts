import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { getBrief, updateCopy, confirmCopy, updateStyleDirection } from '@/modules/creative-studio/services/brief.service';

/**
 * GET /api/creative-studio/briefs/[briefId] - Get a specific brief
 */
export async function GET(
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

        const brief = await getBrief(briefId);
        if (!brief) {
            return NextResponse.json({ success: false, error: 'Brief not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, brief });

    } catch (error) {
        console.error('Get brief error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/creative-studio/briefs/[briefId] - Update brief copy or style
 */
export async function PUT(
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
        const { action, copy, styleDirection } = body;

        let brief;
        
        switch (action) {
            case 'update_copy':
                brief = await updateCopy(briefId, copy);
                break;
            case 'confirm_copy':
                brief = await confirmCopy(briefId);
                break;
            case 'update_style':
                brief = await updateStyleDirection(briefId, styleDirection);
                break;
            default:
                return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true, brief });

    } catch (error) {
        console.error('Update brief error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
}
