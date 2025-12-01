'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/db/client';

interface Generation {
    id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    result_url: string | null;
    provider: string;
    created_at: string;
}

export default function GenerationList({ campaignId }: { campaignId: string }) {
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchGenerations = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('video_generations')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false });

        if (data) {
            setGenerations(data as Generation[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchGenerations();

        // Realtime subscription
        const supabase = createClient();
        const channel = supabase
            .channel('generations')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'video_generations',
                filter: `campaign_id=eq.${campaignId}`
            }, (payload) => {
                fetchGenerations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [campaignId]);

    if (loading) {
        return <div className="text-center py-8">Loading generations...</div>;
    }

    if (generations.length === 0) {
        return (
            <Card className="border-dashed bg-gray-50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <Play className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No videos generated yet</h3>
                    <p className="text-gray-500 max-w-sm mt-2">
                        Click the "Generate Videos" button to start creating AI video ads for this campaign.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generations.map((gen) => (
                <Card key={gen.id} className="overflow-hidden">
                    <div className="aspect-video bg-black relative flex items-center justify-center">
                        {gen.status === 'completed' && gen.result_url ? (
                            <video
                                src={gen.result_url}
                                controls
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="text-white flex flex-col items-center">
                                {gen.status === 'processing' || gen.status === 'queued' ? (
                                    <>
                                        <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                                        <span className="capitalize">{gen.status}...</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                                        <span>Failed</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-medium capitalize">
                                {gen.provider} Model
                            </CardTitle>
                            <span className={`text-xs px-2 py-1 rounded-full ${gen.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    gen.status === 'failed' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                }`}>
                                {gen.status}
                            </span>
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}
