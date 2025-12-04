'use server';

import { AgentService } from './agent';
import { createClient } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';
import { CampaignStrategy, VideoAspectRatio, VideoDuration } from './types';

export async function sendMessageAction(campaignId: string, message: string, modelSlug = 'gpt-5.1') {
    try {
        const response = await AgentService.chat(campaignId, message, modelSlug);
        revalidatePath(`/dashboard/[orgId]/campaigns/${campaignId}`);
        return { success: true, response };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generateStrategyAction(campaignId: string, modelSlug = 'gpt-5.1') {
    try {
        const strategy = await AgentService.generateStrategy(campaignId, modelSlug);
        revalidatePath(`/dashboard/[orgId]/campaigns/${campaignId}`);
        return { success: true, strategy };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generateStrategyFromPromptAction(formData: FormData) {
    const campaignId = formData.get('campaignId') as string;
    const orgId = formData.get('orgId') as string;
    const prompt = formData.get('prompt') as string;
    const modelSlug = (formData.get('modelSlug') as string | null) || 'gpt-5.1';

    try {
        const strategy = await AgentService.generateStrategy(campaignId, modelSlug, prompt);
        revalidatePath(`/dashboard/${orgId}/campaigns/${campaignId}`);
        return { success: true, strategy };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateStrategyAction(campaignId: string, strategy: CampaignStrategy) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('campaigns')
            .update({ strategy })
            .eq('id', campaignId);

        if (error) throw error;

        revalidatePath(`/dashboard/[orgId]/campaigns/${campaignId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateVideoBlueprintAction(
    campaignId: string,
    input: { strategy: CampaignStrategy; duration: VideoDuration; aspectRatio: VideoAspectRatio },
) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('campaigns')
            .update({
                strategy: input.strategy,
                duration: input.duration,
                aspect_ratio: input.aspectRatio,
            })
            .eq('id', campaignId);

        if (error) throw error;

        revalidatePath(`/dashboard/[orgId]/campaigns/${campaignId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createDraftCampaignAction(orgId: string, specs: { duration: string, aspectRatio: string }) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('campaigns')
            .insert({
                org_id: orgId,
                name: 'New Campaign',
                status: 'draft_chat',
                agent_status: 'draft_chat',
                chat_history: [],
                duration: specs.duration,
                aspect_ratio: specs.aspectRatio
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, campaignId: data.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
