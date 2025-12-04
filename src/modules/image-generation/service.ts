import { createClient } from '@/lib/db/server';
import OpenAI from 'openai';
import { uploadFromUrl } from '@/lib/storage';
import { recordLlmUsage } from '@/modules/llm/usage';

export interface CreateImageGenerationInput {
    orgId: string;
    campaignId: string;
    prompt: string;
    size?: '1024x1024' | '1024x576' | '576x1024';
}

async function getOpenAiKeyForOrg(orgId: string): Promise<string> {
    const supabase = await createClient();

    const { data } = await supabase
        .from('organization_secrets')
        .select('value')
        .eq('org_id', orgId)
        .eq('name', 'OPENAI_API_KEY')
        .single();

    const key = data?.value || process.env.OPENAI_API_KEY;
    if (!key) {
        throw new Error('OpenAI API Key is not configured. Add it in Settings → Integrations.');
    }

    return key;
}

export async function createImageGeneration(input: CreateImageGenerationInput) {
    const supabase = await createClient();

    const apiKey = await getOpenAiKeyForOrg(input.orgId);
    const openai = new OpenAI({ apiKey });

    const size = input.size || '1024x1024';

    const image = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: input.prompt,
        size,
    });

    const url = image.data[0]?.url;
    if (!url) {
        throw new Error('Image generation did not return a URL.');
    }

    const fileName = `${input.campaignId}/${Date.now()}-image.png`;
    const storageUrl = await uploadFromUrl(url, fileName); // uses default bucket

    const { data, error } = await supabase
        .from('image_generations')
        .insert({
            org_id: input.orgId,
            campaign_id: input.campaignId,
            provider: 'openai',
            prompt_used: input.prompt,
            status: 'completed',
            result_url: storageUrl,
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    await recordLlmUsage({
        orgId: input.orgId,
        campaignId: input.campaignId,
        provider: 'openai',
        model: 'gpt-image-1',
        kind: 'image',
        unitCount: 1,
    });

    return data;
}

export async function getImageGenerations(campaignId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('image_generations')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data;
}
