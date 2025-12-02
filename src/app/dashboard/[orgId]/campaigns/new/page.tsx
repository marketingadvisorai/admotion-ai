'use client';

import { createDraftCampaignAction } from '@/modules/campaigns/agent-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewCampaignPage({ params }: { params: { orgId: string } }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleStart = async () => {
        setIsLoading(true);
        const result = await createDraftCampaignAction(params.orgId);
        if (result.success && result.campaignId) {
            router.push(`/dashboard/${params.orgId}/campaigns/${result.campaignId}`);
        } else {
            console.error(result.error);
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto h-[80vh] flex items-center justify-center">
            <Card className="w-full max-w-2xl border-2 border-blue-100 dark:border-blue-900 shadow-xl">
                <CardHeader className="text-center space-y-4 pb-8">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-3xl font-bold">Create High-Converting Video Ads</CardTitle>
                    <CardDescription className="text-lg max-w-lg mx-auto">
                        Chat with our AI Video Strategist to plan, script, and generate professional video ads for your brand.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 pb-10">
                    <Button
                        size="lg"
                        onClick={handleStart}
                        disabled={isLoading}
                        className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
                    >
                        {isLoading ? 'Initializing...' : 'Start Strategy Session'}
                        {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                        Includes: Strategy • Scripting • Asset Selection • Video Generation
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
