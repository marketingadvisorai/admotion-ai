'use server';

import { createClient } from '@/lib/db/server';

export interface ApiUsageStats {
    [providerId: string]: {
        calls: number;
        cost: string;
        models: string[];
    };
}

export async function getApiUsageStatsAction(orgId: string): Promise<{ success: boolean; data?: ApiUsageStats; error?: string }> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('llm_usage_events')
            .select('provider, model, unit_count, cost')
            .eq('org_id', orgId);

        if (error) {
            console.error('Error fetching usage stats:', error);
            return { success: false, error: 'Failed to fetch usage stats' };
        }

        const stats: ApiUsageStats = {};

        data?.forEach((event: { provider: string; model: string; unit_count: number; cost: number }) => {
            const provider = event.provider;
            if (!stats[provider]) {
                stats[provider] = {
                    calls: 0,
                    cost: '$0.00',
                    models: [],
                };
            }

            stats[provider].calls += event.unit_count || 1;

            // Accumulate cost
            const currentCost = parseFloat(stats[provider].cost.replace('$', ''));
            const eventCost = event.cost || 0;
            stats[provider].cost = `$${(currentCost + eventCost).toFixed(2)}`;

            // Collect unique models
            if (!stats[provider].models.includes(event.model)) {
                stats[provider].models.push(event.model);
            }
        });

        return { success: true, data: stats };
    } catch (error) {
        console.error('Unexpected error fetching usage stats:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}
