'use server';

import { AgentService } from './agent';
import { createClient } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';
import { CampaignStrategy } from './types';

export async function sendMessageAction(campaignId: string, message: string) {
    try {
        const response = await AgentService.chat(campaignId, message);
        revalidatePath(`/dashboard/[orgId]/campaigns/${campaignId}`);
        return { success: true, response };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generateStrategyAction(campaignId: string) {
    try {
        const strategy = await AgentService.generateStrategy(campaignId);
        revalidatePath(`/dashboard/[orgId]/campaigns/${campaignId}`);
        return { success: true, strategy };
    } catch (error: any) {
        return { success: false, error: error.message };
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

export async function createDraftCampaignAction(orgId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('campaigns')
            .insert({
                org_id: orgId,
                name: 'New Campaign', // Default name, can be updated later by AI
                status: 'draft_chat',
                agent_status: 'draft_chat',
                chat_history: []
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, campaignId: data.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
