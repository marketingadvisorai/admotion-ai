import { getCampaign } from '@/modules/campaigns/service';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChatInterface } from '@/components/campaigns/chat-interface';
import { StrategyCard } from '@/components/campaigns/strategy-card';
import { CampaignStudio } from '@/components/campaigns/campaign-studio';

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
    return <CampaignStudio campaign={campaign} orgId={orgId} />;
}
