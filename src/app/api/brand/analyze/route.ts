import { NextResponse } from 'next/server';
import { BrandAnalyzer } from '@/modules/brand-kits/brand-analyzer';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const url = (body?.url as string || '').trim();

        if (!url) {
            return NextResponse.json({ error: 'Missing url' }, { status: 400 });
        }

        const identity = await BrandAnalyzer.analyze(url);

        // Return only what the UI needs to stay lean.
        return NextResponse.json({
            success: true,
            data: {
                business_name: identity.business_name,
                description: identity.description,
                logo_url: identity.logo_url,
                colors: identity.colors,
                fonts: identity.fonts,
                social_links: identity.social_links,
                locations: identity.locations,
                offerings: identity.offerings,
                strategy: identity.strategy,
            }
        });
    } catch (error: any) {
        console.error('Brand analyze API error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to analyze brand' }, { status: 500 });
    }
}
