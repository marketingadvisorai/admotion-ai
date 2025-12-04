import React from 'react';
import { Metadata } from 'next';
import { ImageGenerator } from '@/components/image-ads/image-generator';

export const metadata: Metadata = {
    title: 'AI Image Ads Maker | Admotion AI',
    description: 'Generate professional AI images for your ads.',
};

export default function ImageAdsPage() {
    return (
        <div className="flex flex-col h-full w-full bg-background text-foreground">
            <div className="flex-1 p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">AI Image Ads Maker</h1>
                        <p className="text-muted-foreground">
                            Create stunning, brand-aligned images for your campaigns in seconds.
                        </p>
                    </div>

                    <ImageGenerator />
                </div>
            </div>
        </div>
    );
}

