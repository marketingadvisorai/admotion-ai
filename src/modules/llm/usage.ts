import { createClient } from '@/lib/db/server';

export interface LlmUsageEventInput {
    orgId: string;
    campaignId?: string;
    provider: string;
    model: string;
    kind: string; // 'chat', 'brand_analysis', 'image', 'video'
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    unitCount?: number;
}

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 5.00 / 1000000, output: 15.00 / 1000000 },
    'gpt-4-turbo': { input: 10.00 / 1000000, output: 30.00 / 1000000 },
    'gpt-3.5-turbo': { input: 0.50 / 1000000, output: 1.50 / 1000000 },
    'gemini-1.5-pro': { input: 3.50 / 1000000, output: 10.50 / 1000000 },
    'gemini-1.5-flash': { input: 0.35 / 1000000, output: 1.05 / 1000000 },
};

export async function recordLlmUsage(input: LlmUsageEventInput) {
    try {
        const supabase = await createClient();

        // Calculate cost
        const modelCost = MODEL_COSTS[input.model] || { input: 0, output: 0 };
        const inputCost = (input.inputTokens || 0) * modelCost.input;
        const outputCost = (input.outputTokens || 0) * modelCost.output;
        const totalCost = inputCost + outputCost;

        const { error } = await supabase
            .from('llm_usage_events')
            .insert({
                org_id: input.orgId,
                campaign_id: input.campaignId ?? null,
                provider: input.provider,
                model: input.model,
                kind: input.kind,
                input_tokens: input.inputTokens ?? 0,
                output_tokens: input.outputTokens ?? 0,
                total_tokens: input.totalTokens ?? (input.inputTokens || 0) + (input.outputTokens || 0),
                unit_count: input.unitCount ?? 1,
                cost: totalCost
            });

        if (error) {
            console.error('Failed to record LLM usage:', error);
        }

        return { cost: totalCost };
    } catch (error) {
        console.error('LLM usage logging error:', error);
        return { cost: 0 };
    }
}

