import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Video } from 'lucide-react';
import Link from 'next/link';
import { getCampaigns } from '@/modules/campaigns/service';

export default async function OrgDashboardPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const campaigns = await getCampaigns(orgId);

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
                    <p className="text-gray-500">Manage your video ad campaigns.</p>
                </div>
                <Link href={`/dashboard/${orgId}/campaigns/new`}>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Campaign
                    </Button>
                </Link>
            </div>

            {campaigns.length === 0 ? (
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle>No campaigns yet</CardTitle>
                        <CardDescription>Create your first campaign to get started.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href={`/dashboard/${orgId}/campaigns/new`}>
                            <Button variant="outline" className="w-full">Create Campaign</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((campaign) => (
                        <Link key={campaign.id} href={`/dashboard/${orgId}/campaigns/${campaign.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                                        <span className={`text-xs px-2 py-1 rounded-full ${campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                campaign.status === 'generating' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {campaign.status}
                                        </span>
                                    </div>
                                    <CardDescription className="line-clamp-2 h-10">
                                        {campaign.brief || 'No brief provided'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Video className="w-4 h-4 mr-2" />
                                        {campaign.platform ? campaign.platform.replace('_', ' ') : 'Unknown Platform'}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
