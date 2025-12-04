import OpenAI from 'openai';
import { createClient } from '@/lib/db/server';
import { Campaign, ChatMessage, CampaignStrategy } from './types';
import { recordLlmUsage } from '@/modules/llm/usage';
import { getProviderApiKey, resolveLlmConfig } from '@/modules/llm/config';

const SYSTEM_PROMPT = `You are an expert Video Marketing Strategist for Admotion AI. 
Your goal is to help the user create a high-converting video ad.
You will interview the user to understand their product, goal, audience, and offer.
Do not ask all questions at once. Ask 1-2 clarifying questions at a time.
Be professional, concise, and helpful.
Once you have enough information, you will suggest they proceed to the strategy phase.`;

const STRATEGY_PROMPT = `Based on the conversation history, generate a comprehensive video ad strategy.
Return the response in valid JSON format matching the following schema:
{
    "hooks": ["Hook 1", "Hook 2", "Hook 3"],
    "script": [
        { "scene": 1, "description": "...", "visual_cue": "...", "voiceover": "..." }
    ],
    "visual_style": "...",
    "target_audience": "...",
    "tone": "..."
}`;

export class AgentService {
    static async chat(campaignId: string, message: string, modelSlug = 'gpt-5.1'): Promise<string> {
        const supabase = await createClient();

        // 1. Fetch Campaign
        const { data: campaign, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (error || !campaign) throw new Error('Campaign not found');

        // 2. Update History
        const history: ChatMessage[] = (campaign.chat_history as any) || [];
        const newHistory = [...history, { role: 'user', content: message }];

        const config = await resolveLlmConfig(modelSlug);
        if (config.provider !== 'openai') {
            throw new Error(`Provider ${config.provider} is not yet enabled for campaign chat. Please select an OpenAI-based profile.`);
        }
        const apiKey = await getProviderApiKey('openai', campaign.org_id);
        const openai = new OpenAI({ apiKey });

        // 3. Call OpenAI
        const completion = await openai.chat.completions.create({
            model: config.model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...(newHistory as any),
            ],
        });

        const aiResponse = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
        const finalHistory = [...newHistory, { role: 'assistant', content: aiResponse }];

        // 4. Save to DB
        await supabase
            .from('campaigns')
            .update({ chat_history: finalHistory })
            .eq('id', campaignId);

        if (completion.usage && campaign.org_id) {
            await recordLlmUsage({
                orgId: campaign.org_id,
                campaignId,
                provider: config.provider,
                model: config.model,
                kind: 'chat',
                inputTokens: completion.usage.prompt_tokens ?? 0,
                outputTokens: completion.usage.completion_tokens ?? 0,
                totalTokens: completion.usage.total_tokens ?? 0,
            });
        }

        return aiResponse;
    }

    static async generateStrategy(campaignId: string, modelSlug = 'gpt-5.1', prompt?: string): Promise<CampaignStrategy> {
        const supabase = await createClient();

        const { data: campaign, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (error || !campaign) throw new Error('Campaign not found');

        const history = (campaign.chat_history as any) || [];

        const config = await resolveLlmConfig(modelSlug);
        if (config.provider !== 'openai') {
            throw new Error(`Provider ${config.provider} is not yet enabled for strategy generation. Please select an OpenAI-based profile.`);
        }
        const apiKey = await getProviderApiKey('openai', campaign.org_id);
        const openai = new OpenAI({ apiKey });

        const completion = await openai.chat.completions.create({
            model: config.model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...(history as any),
                ...(prompt ? [{ role: 'user', content: `Here is the context for the strategy: ${prompt}` }] : []),
                { role: 'system', content: STRATEGY_PROMPT }
            ],
            response_format: { type: "json_object" }
        });

        const strategyJson = JSON.parse(completion.choices[0].message.content || '{}');

        // Validate and cast to CampaignStrategy (basic validation)
        const strategy: CampaignStrategy = {
            hooks: strategyJson.hooks || [],
            script: strategyJson.script || [],
            visual_style: strategyJson.visual_style || '',
            target_audience: strategyJson.target_audience || '',
            tone: strategyJson.tone || ''
        };

        // Save strategy and update status
        await supabase
            .from('campaigns')
            .update({
                strategy: strategy,
                status: 'strategy_review',
                agent_status: 'strategy_review'
            })
            .eq('id', campaignId);

        if (completion.usage && campaign.org_id) {
            await recordLlmUsage({
                orgId: campaign.org_id,
                campaignId,
                provider: config.provider,
                model: config.model,
                kind: 'strategy',
                inputTokens: completion.usage.prompt_tokens ?? 0,
                outputTokens: completion.usage.completion_tokens ?? 0,
                totalTokens: completion.usage.total_tokens ?? 0,
            });
        }

        return strategy;
    }
}
