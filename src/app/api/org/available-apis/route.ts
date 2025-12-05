import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';

interface AvailableApis {
    openai: boolean;
    gemini: boolean;
    anthropic: boolean;
}

/**
 * GET /api/org/available-apis
 * Check which API keys are configured for an organization
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

        if (!orgId) {
            return NextResponse.json(
                { success: false, error: 'orgId is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
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
                { success: false, error: 'Access denied' },
                { status: 403 }
            );
        }

        // Check which API keys are configured
        const { data: secrets } = await supabase
            .from('organization_secrets')
            .select('name')
            .eq('org_id', orgId);

        const secretNames = secrets?.map(s => s.name) || [];

        // Also check environment variables as fallback
        const apis: AvailableApis = {
            openai: secretNames.includes('OPENAI_API_KEY') || !!process.env.OPENAI_API_KEY,
            gemini: secretNames.includes('GOOGLE_GEMINI_API_KEY') || 
                    secretNames.includes('GOOGLE_GEMINI_VEO_API_KEY') || 
                    !!process.env.GEMINI_API_KEY ||
                    !!process.env.GEMINI_VEO_IMAGE_API_KEY,
            anthropic: secretNames.includes('ANTHROPIC_API_KEY') || !!process.env.ANTHROPIC_API_KEY,
        };

        return NextResponse.json({
            success: true,
            apis,
        });

    } catch (error) {
        console.error('Available APIs check error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
