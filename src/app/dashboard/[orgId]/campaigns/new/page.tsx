'use client';

import { createDraftCampaignAction } from '@/modules/campaigns/agent-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowRight, Smartphone, Monitor, Square } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function NewCampaignPage() {
    const params = useParams();
    const orgId = params.orgId as string;

    const [isLoading, setIsLoading] = useState(false);
    const [duration, setDuration] = useState('30');
    const [aspectRatio, setAspectRatio] = useState('9:16');
    const router = useRouter();

    const handleStart = async () => {
        if (!orgId) {
            toast.error('Organization ID not found');
            return;
        }

        setIsLoading(true);
        try {
            const result = await createDraftCampaignAction(orgId, { duration, aspectRatio });
            if (result.success && result.campaignId) {
                toast.success('Strategy session started');
                router.push(`/dashboard/${orgId}/campaigns/${result.campaignId}`);
            } else {
                console.error(result.error);
                toast.error(result.error || 'Failed to start session');
                setIsLoading(false);
            }
        } catch (error) {
            console.error(error);
            toast.error('An unexpected error occurred');
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-[80vh] flex items-center justify-center">
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
                <CardContent className="space-y-8 pb-10">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Video Duration</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {['15', '30', '60'].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDuration(d)}
                                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${duration === d
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'bg-background hover:bg-muted'
                                            }`}
                                    >
                                        {d}s
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Aspect Ratio</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: '9:16', icon: Smartphone, label: 'Vertical' },
                                    { value: '1:1', icon: Square, label: 'Square' },
                                    { value: '16:9', icon: Monitor, label: 'Wide' }
                                ].map((ratio) => (
                                    <button
                                        key={ratio.value}
                                        onClick={() => setAspectRatio(ratio.value)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all gap-1 ${aspectRatio === ratio.value
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'bg-background hover:bg-muted'
                                            }`}
                                    >
                                        <ratio.icon className="w-4 h-4" />
                                        {ratio.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 pt-4">
                        <Button
                            size="lg"
                            onClick={handleStart}
                            disabled={isLoading}
                            className="h-14 px-10 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
                        >
                            {isLoading ? 'Initializing...' : 'Start Strategy Session'}
                            {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Includes: Strategy • Scripting • Asset Selection • Video Generation
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
