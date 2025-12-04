'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/db/client';

interface ImageGeneration {
    id: string;
    status: 'completed' | 'failed' | 'queued' | 'processing';
    result_url: string | null;
    provider: string;
    created_at: string;
}

export function ImageList({ campaignId }: { campaignId: string }) {
    const [images, setImages] = useState<ImageGeneration[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchImages = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('image_generations')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false });

        if (data) {
            setImages(data as ImageGeneration[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchImages();

        const supabase = createClient();
        const channel = supabase
            .channel('image_generations')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'image_generations',
                    filter: `campaign_id=eq.${campaignId}`,
                },
                () => {
                    fetchImages();
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [campaignId]);

    if (loading) {
        return <div className="text-center py-8 text-sm text-muted-foreground">Loading images...</div>;
    }

    if (images.length === 0) {
        return (
            <Card className="border-dashed bg-gray-50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No images generated yet</h3>
                    <p className="text-gray-500 max-w-sm mt-2">
                        Use the &quot;Generate Images&quot; button to create campaign assets.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {images.map((img) => (
                <Card key={img.id} className="overflow-hidden">
                    <div className="aspect-square bg-black/5 flex items-center justify-center">
                        {img.status === 'completed' && img.result_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={img.result_url}
                                alt="Generated campaign asset"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <span className="text-xs text-muted-foreground capitalize">
                                {img.status}
                            </span>
                        )}
                    </div>
                    <CardHeader className="p-3">
                        <CardTitle className="text-xs font-medium flex justify-between">
                            <span>{img.provider}</span>
                            <span className="text-[10px] text-muted-foreground">
                                {new Date(img.created_at).toLocaleDateString()}
                            </span>
                        </CardTitle>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}

