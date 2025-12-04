import { NextResponse } from 'next/server';
import { createBrandKitAction } from '@/modules/brand-kits/actions';

export async function GET() {
    const mockData = {
        org_id: '6e3897ba-26a2-429e-98e5-0456971b936f',
        name: 'OpenAI API Test',
        website_url: 'openai.com', // Test normalization
        business_name: 'OpenAI',
        description: 'AI Research Company',
        colors: [],
        fonts: { heading: 'Inter', body: 'Inter' },
        social_links: {},
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png', // Real external URL
        offerings: [],
        strategy: {
            vision: 'AGI for all',
            mission: 'Benefit humanity',
            values: [],
            target_audience: 'Everyone',
            brand_voice: 'Helpful',
            key_differentiators: []
        }
    };

    try {
        const result = await createBrandKitAction(mockData);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
