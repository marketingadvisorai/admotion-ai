import OpenAI from 'openai';
import { createClient } from '@/lib/db/server';
import { Campaign, ChatMessage, CampaignStrategy } from './types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
    static async chat(campaignId: string, message: string): Promise<string> {
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

        // 3. Call OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
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

        return aiResponse;
    }

    static async generateStrategy(campaignId: string): Promise<CampaignStrategy> {
        const supabase = await createClient();

        const { data: campaign, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (error || !campaign) throw new Error('Campaign not found');

        const history = (campaign.chat_history as any) || [];

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...(history as any),
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

        return strategy;
    }
}
