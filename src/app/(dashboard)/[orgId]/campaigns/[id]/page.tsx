import { getCampaign } from '@/modules/campaigns/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import GenerationList from '@/components/campaigns/generation-list';
import GenerationDialog from '@/components/campaigns/generation-dialog';

export default async function CampaignDetailsPage({ params }: { params: Promise<{ orgId: string, id: string }> }) {
    const { orgId, id } = await params;
    const campaign = await getCampaign(id);

    if (!campaign) {
        notFound();
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <Link href={`/dashboard/${orgId}`} className="text-sm text-gray-500 hover:text-gray-900 flex items-center mb-4">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Campaigns
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                        <p className="text-gray-500 mt-1 capitalize">{campaign.platform?.replace('_', ' ')} • {campaign.status}</p>
                    </div>
                    <GenerationDialog orgId={orgId} campaignId={id} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Brief & Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Brief</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 whitespace-pre-wrap">{campaign.brief}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Generated Videos */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-semibold">Generated Videos</h2>
                    <GenerationList campaignId={id} />
                </div>
            </div>
        </div>
    );
}
