import { NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';

export async function GET(
    _request: Request,
    { params }: { params: { id: string } },
) {
    const campaignId = params.id;
    const supabase = await createClient();

    const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

    if (campaignError || !campaign) {
        return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    const { data: kits } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('org_id', campaign.org_id)
        .order('created_at', { ascending: false })
        .limit(1);

    const brandKit = kits && kits.length > 0 ? kits[0] : null;

    const strategy = campaign.strategy || {};
    const firstHook = Array.isArray(strategy.hooks) && strategy.hooks.length > 0 ? strategy.hooks[0] : '';
    const visualStyle = strategy.visual_style || '';
    const tone = strategy.tone || '';
    const audience = strategy.target_audience || '';

    const primaryColor = brandKit?.colors?.find((c: any) => c.type === 'primary')?.value || '#111827';
    const secondaryColor = brandKit?.colors?.find((c: any) => c.type === 'secondary')?.value || '#F3F4F6';
    const brandName = brandKit?.business_name || brandKit?.name || campaign.name;
    const body =
        brandKit?.description ||
        campaign.brief ||
        'Highlight the main benefit in one sentence.';
    const cta = 'Learn more';

    const baseParts: string[] = [];

    baseParts.push(`High-conversion advertising image for ${brandName}.`);

    if (audience) {
        baseParts.push(`Target audience: ${audience}.`);
    }

    if (visualStyle) {
        baseParts.push(`Visual style: ${visualStyle}.`);
    }

    if (tone) {
        baseParts.push(`Overall tone: ${tone}.`);
    }

    if (primaryColor || secondaryColor) {
        baseParts.push(
            `Apply brand colors (primary ${primaryColor}${
                secondaryColor ? `, secondary ${secondaryColor}` : ''
            }).`,
        );
    }

    baseParts.push(
        'Layout: product or service focal point, clear subject separation from background, enough safe space for overlaid UI in video editors.',
    );

    const basePrompt = baseParts.join(' ');

    const headline = firstHook || `Why ${brandName}?`;

    const prompt = `${basePrompt} Headline text: "${headline}". Supporting copy: "${body}". Call-to-action button label: "${cta}". Avoid heavy text walls; focus on visual storytelling.`;

    return NextResponse.json({
        success: true,
        prompt,
        copy: {
            headline,
            body,
            cta,
        },
        layout: {
            primaryColor,
            secondaryColor,
        },
        meta: {
            usedBrandKit: !!brandKit,
            usedStrategy: !!campaign.strategy,
        },
    });
}

