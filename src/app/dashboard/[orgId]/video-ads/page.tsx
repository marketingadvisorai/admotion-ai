import React from 'react';
import { Metadata } from 'next';
import { getCurrentUser, getUserProfile } from '@/modules/auth/service';
import { getBrandKits } from '@/modules/brand-kits/service';
import { getActiveLlmProfiles } from '@/modules/llm/service';
import { VideoGenerator } from '@/components/video-ads/video-generator';

export const metadata: Metadata = {
    title: 'AI Video Ads Maker | Admotion AI',
    description: 'Generate AI-powered video ads with your brand kits.',
};

export default async function VideoAdsPage({ params }: { params: Promise<{ orgId: string }> }) {
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
            <VideoGenerator
                displayName={displayName}
                brandKits={brandKits}
                llmProfiles={llmProfiles}
                orgId={orgId}
            />
        </div>
    );
}
