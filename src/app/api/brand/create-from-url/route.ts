import { NextResponse } from 'next/server';
import { createBrandKitFromUrlAction } from '@/modules/brand-kits/actions';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const url = (body?.url as string | undefined)?.trim();
        const orgId = (body?.orgId as string | undefined)?.trim();

        if (!url || !orgId) {
            return NextResponse.json({ success: false, error: 'Missing url or orgId' }, { status: 400 });
        }

        const result = await createBrandKitFromUrlAction(url, orgId);

        if (!result.success || !result.data) {
            return NextResponse.json({ success: false, error: result.error || 'Failed to create brand kit' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (error: any) {
        console.error('Create brand kit from URL API error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
