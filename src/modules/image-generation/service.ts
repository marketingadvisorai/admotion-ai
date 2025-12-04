import { createClient } from '@/lib/db/server';
import OpenAI from 'openai';
import { uploadFromUrl } from '@/lib/storage';
import { recordLlmUsage } from '@/modules/llm/usage';
import { getProviderApiKey, resolveLlmConfig } from '@/modules/llm/config';

export interface CreateImageGenerationInput {
    orgId: string;
    campaignId: string;
    prompt: string;
    size?: '1024x1024' | '1024x576' | '576x1024';
    modelSlug?: string;
}

export async function createImageGeneration(input: CreateImageGenerationInput) {
    const supabase = await createClient();

    const config = await resolveLlmConfig(input.modelSlug || 'gpt-5.1');
    if (config.provider !== 'openai') {
        throw new Error(`Image generation currently supports OpenAI only. Please select an OpenAI-based model.`);
    }

    const apiKey = await getProviderApiKey('openai', input.orgId);
    const openai = new OpenAI({ apiKey });

    let size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024';
    if (input.size === '1024x576') size = '1792x1024';
    if (input.size === '576x1024') size = '1024x1792';

    const image = await openai.images.generate({
        model: 'dall-e-3',
        prompt: input.prompt,
        size,
    });

    const url = image?.data?.[0]?.url;
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
        provider: config.provider,
        model: 'dall-e-3',
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
