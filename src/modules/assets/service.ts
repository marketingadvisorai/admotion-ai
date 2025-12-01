import { createClient } from '@/lib/db/server';
import { cache } from 'react';

export const getOrgAssets = cache(async (orgId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('video_generations')
        .select('*, campaign:campaigns(name)')
        .eq('org_id', orgId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

    if (error) return [];
    return data;
});
