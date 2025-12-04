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
        <div className="p-8 max-w-5xl mx-auto min-h-[85vh] flex items-center justify-center relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />

            <Card className="w-full max-w-3xl glass-panel border-white/20 dark:border-white/10 shadow-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent dark:from-white/5 pointer-events-none" />

                <CardHeader className="text-center space-y-6 pb-8 pt-10 relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform duration-500">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Create High-Converting Video Ads
                        </CardTitle>
                        <CardDescription className="text-xl max-w-xl mx-auto text-muted-foreground/90 font-light">
                            Chat with our AI Video Strategist to plan, script, and generate professional video ads.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-10 pb-12 px-10 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Label className="text-sm font-medium uppercase tracking-wider text-muted-foreground ml-1">
                                Video Duration
                            </Label>
                            <div className="flex gap-3">
                                {['15', '30', '60'].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDuration(d)}
                                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border ${duration === d
                                            ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25 scale-105'
                                            : 'bg-white/5 border-transparent hover:bg-white/10 text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {d}s
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-sm font-medium uppercase tracking-wider text-muted-foreground ml-1">
                                Aspect Ratio
                            </Label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: '9:16', icon: Smartphone, label: 'Vertical' },
                                    { value: '1:1', icon: Square, label: 'Square' },
                                    { value: '16:9', icon: Monitor, label: 'Wide' }
                                ].map((ratio) => (
                                    <button
                                        key={ratio.value}
                                        onClick={() => setAspectRatio(ratio.value)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all duration-300 gap-2 ${aspectRatio === ratio.value
                                            ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25 scale-105'
                                            : 'bg-white/5 border-transparent hover:bg-white/10 text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <ratio.icon className="w-5 h-5" />
                                        {ratio.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-6 pt-6">
                        <Button
                            size="lg"
                            onClick={handleStart}
                            disabled={isLoading}
                            className="h-16 px-12 text-xl font-semibold glass-button rounded-full w-full sm:w-auto min-w-[300px] group"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 animate-spin" />
                                    Initializing...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Start Strategy Session
                                    <ArrowRight className="w-6 h-6 ml-1 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground/80 font-medium">
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Strategy
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Scripting
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Generation
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
