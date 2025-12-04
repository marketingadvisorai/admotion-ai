import { Metadata } from 'next';
import { ImageGenerator } from '@/components/image-ads/image-generator';
import { getCurrentUser, getUserProfile } from '@/modules/auth/service';
import { getBrandKits } from '@/modules/brand-kits/service';
import { getActiveLlmProfiles } from '@/modules/llm/service';

export const metadata: Metadata = {
    title: 'AI Image Ads Maker | Admotion AI',
    description: 'Generate professional AI images for your ads.',
};

export default async function ImageAdsPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const user = await getCurrentUser();
    const profile = user ? await getUserProfile(user.id) : null;
    const displayName =
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        user?.email?.split('@')?.[0] ||
        'Creator';
    const brandKits = orgId ? await getBrandKits(orgId) : [];
    const llmProfiles = await getActiveLlmProfiles();

    return (
        <div className="flex-1 w-full">
            <ImageGenerator
                displayName={displayName}
                brandKits={brandKits}
                llmProfiles={llmProfiles}
                orgId={orgId}
            />
        </div>
    );
}
