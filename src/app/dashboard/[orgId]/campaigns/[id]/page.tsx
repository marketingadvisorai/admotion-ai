import { getCampaign } from '@/modules/campaigns/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import GenerationList from '@/components/campaigns/generation-list';
import GenerationDialog from '@/components/campaigns/generation-dialog';
import { ChatInterface } from '@/components/campaigns/chat-interface';
import { StrategyCard } from '@/components/campaigns/strategy-card';
import { updateStrategyAction } from '@/modules/campaigns/agent-actions';

export default async function CampaignDetailsPage({ params }: { params: Promise<{ orgId: string, id: string }> }) {
    const { orgId, id } = await params;
    const campaign = await getCampaign(id);

    if (!campaign) {
        notFound();
    }

    // Agent Workflow: Chat Phase
    if (campaign.agent_status === 'draft_chat') {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href={`/dashboard/${orgId}`} className="text-sm text-gray-500 hover:text-gray-900 flex items-center mb-4">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Campaigns
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">AI Strategy Session</h1>
                    <p className="text-gray-500">Chat with the agent to define your campaign goals.</p>
                </div>
                <ChatInterface
                    campaignId={id}
                    initialHistory={campaign.chat_history || []}
                    onStrategyGenerated={async () => {
                        'use server';
                        // This is just a placeholder, the client triggers the refresh
                    }}
                />
            </div>
        );
    }

    // Agent Workflow: Strategy Review Phase
    if (campaign.agent_status === 'strategy_review' && campaign.strategy) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href={`/dashboard/${orgId}`} className="text-sm text-gray-500 hover:text-gray-900 flex items-center mb-4">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Campaigns
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Strategy Review</h1>
                    <p className="text-gray-500">Review the AI-generated plan before creating your video.</p>
                </div>
                <StrategyCard
                    campaignId={id}
                    strategy={campaign.strategy}
                    onApprove={async () => {
                        'use server';
                        // We need a server action to transition to 'generating' or 'completed'
                        // For now, let's just update the status to 'completed' so we see the dashboard
                        // In a real app, this would trigger video generation
                        const { createClient } = await import('@/lib/db/server');
                        const { revalidatePath } = await import('next/cache');
                        const supabase = await createClient();
                        await supabase.from('campaigns').update({ status: 'completed', agent_status: 'completed' }).eq('id', id);
                        revalidatePath(`/dashboard/${orgId}/campaigns/${id}`);
                    }}
                />
            </div>
        );
    }

    // Standard Dashboard View (Completed/Generating)
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
                        <p className="text-gray-500 mt-1 capitalize">{campaign.platform?.replace('_', ' ') || 'Multi-Platform'} • {campaign.status}</p>
                    </div>
                    <GenerationDialog orgId={orgId} campaignId={id} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Strategy & Brief */}
                <div className="space-y-6">
                    {campaign.strategy && (
                        <Card className="border-blue-100 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-900">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center text-blue-700 dark:text-blue-400">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approved Strategy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm mb-1">Target Audience</h4>
                                    <p className="text-sm text-gray-700">{campaign.strategy.target_audience}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm mb-1">Tone</h4>
                                    <p className="text-sm text-gray-700">{campaign.strategy.tone}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm mb-1">Hooks</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-700">
                                        {campaign.strategy.hooks.map((hook, i) => (
                                            <li key={i}>{hook}</li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Brief</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 whitespace-pre-wrap">{campaign.brief || 'No brief provided.'}</p>
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
