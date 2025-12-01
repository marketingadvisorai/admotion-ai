import { createClient } from '@/lib/db/server';
import { Campaign } from './types';
import { cache } from 'react';

export const getCampaigns = cache(async (orgId: string): Promise<Campaign[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data as Campaign[];
});

export const getCampaign = cache(async (campaignId: string): Promise<Campaign | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

    if (error) return null;
    return data as Campaign;
});
