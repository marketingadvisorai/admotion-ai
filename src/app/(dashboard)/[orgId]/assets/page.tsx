import { getOrgAssets } from '@/modules/assets/service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AssetsPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const assets = await getOrgAssets(orgId);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Asset Library</h1>
                <p className="text-gray-500">All your generated video creatives in one place.</p>
            </div>

            {assets.length === 0 ? (
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle>No assets found</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center py-8 text-gray-500">
                        Generate videos in your campaigns to see them here.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {assets.map((asset: any) => (
                        <Card key={asset.id} className="overflow-hidden group">
                            <div className="aspect-video bg-black relative flex items-center justify-center">
                                <video
                                    src={asset.result_url}
                                    className="w-full h-full object-cover"
                                    controls
                                />
                            </div>
                            <CardHeader className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-sm font-medium truncate w-40">
                                            {asset.campaign?.name || 'Untitled Campaign'}
                                        </CardTitle>
                                        <p className="text-xs text-gray-500 capitalize">{asset.provider} • {new Date(asset.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <a href={asset.result_url} download target="_blank" rel="noopener noreferrer">
                                        <Button size="icon" variant="ghost" className="h-8 w-8">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </a>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
