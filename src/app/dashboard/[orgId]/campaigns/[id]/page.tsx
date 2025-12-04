import { getCampaign } from '@/modules/campaigns/service';
import { notFound } from 'next/navigation';
import { CampaignAgentWorkspace } from '@/components/campaigns/campaign-agent-workspace';

export default async function CampaignDetailsPage({ params }: { params: Promise<{ orgId: string, id: string }> }) {
    const { orgId, id } = await params;
    const campaign = await getCampaign(id);

    if (!campaign) {
        notFound();
    }

    return <CampaignAgentWorkspace campaign={campaign} orgId={orgId} />;
}
