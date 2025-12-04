import { createClient } from '@/lib/db/server';
import { uploadFromUrl, uploadBase64 } from '@/lib/storage';
import { recordLlmUsage } from '@/modules/llm/usage';
import { generateWithOpenAI } from './providers/openai';
import { generateWithGemini, generateWithImagen } from './providers/gemini';
import {
    ImageGenerationInput,
    ImageGeneration,
    ImageProvider,
    ImageAspectRatio,
    GenerateImageResult,
} from './types';

const BUCKET_NAME = 'generated-images';

/**
 * Get API key for image generation provider
 */
async function getImageApiKey(provider: ImageProvider, orgId: string): Promise<string> {
    const supabase = await createClient();
    
    const secretName = provider === 'openai' ? 'OPENAI_API_KEY' : 'GOOGLE_GEMINI_VEO_API_KEY';
    
    // First try org secrets
    const { data } = await supabase
        .from('organization_secrets')
        .select('value')
        .eq('org_id', orgId)
        .eq('name', secretName)
        .single();

    if (data?.value) return data.value;

    // Fallback to env
    const envKey = provider === 'openai' 
        ? process.env.OPENAI_API_KEY 
        : process.env.GEMINI_VEO_IMAGE_API_KEY;
    
    if (!envKey) {
        throw new Error(`Missing API key for ${provider}. Please configure ${secretName} in organization secrets.`);
    }
    
    return envKey;
}

/**
 * Build enhanced prompt with brand context
 */
function buildEnhancedPrompt(input: ImageGenerationInput): string {
    let prompt = input.prompt;
    
    if (input.brandContext) {
        const { businessName, colors, brandVoice, targetAudience } = input.brandContext;
        const parts: string[] = [];
        
        if (businessName) parts.push(`Brand: ${businessName}`);
        if (colors?.length) parts.push(`Brand colors: ${colors.join(', ')}`);
        if (brandVoice) parts.push(`Tone: ${brandVoice}`);
        if (targetAudience) parts.push(`Target audience: ${targetAudience}`);
        
        if (parts.length > 0) {
            prompt = `${prompt}\n\nBrand context: ${parts.join('. ')}.`;
        }
    }

    if (input.style) {
        prompt = `${prompt}\n\nStyle: ${input.style}`;
    }

    return prompt;
}

/**
 * Main image generation function supporting multiple providers
 */
export async function generateImages(input: ImageGenerationInput): Promise<GenerateImageResult> {
    const supabase = await createClient();
    const provider = input.provider || 'openai';
    const numberOfImages = Math.min(input.numberOfImages || 1, 4);
    
    try {
        const apiKey = await getImageApiKey(provider, input.orgId);
        const enhancedPrompt = buildEnhancedPrompt(input);
        
        const generatedImages: ImageGeneration[] = [];

        if (provider === 'openai') {
            // Generate with OpenAI DALL-E 3
            const result = await generateWithOpenAI(apiKey, {
                prompt: enhancedPrompt,
                aspectRatio: input.aspectRatio || '1:1',
                numberOfImages,
                quality: 'hd',
                style: 'vivid',
            });

            for (const url of result.urls) {
                // Upload to Supabase Storage
                const fileName = `${input.orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
                const storageUrl = await uploadFromUrl(url, fileName, BUCKET_NAME);

                // Save to database
                const { data, error } = await supabase
                    .from('image_generations')
                    .insert({
                        org_id: input.orgId,
                        campaign_id: input.campaignId || null,
                        provider: 'openai',
                        model: 'dall-e-3',
                        prompt_used: enhancedPrompt,
                        style: input.style,
                        aspect_ratio: input.aspectRatio || '1:1',
                        result_url: storageUrl,
                        status: 'completed',
                        metadata: { revisedPrompt: result.revisedPrompt },
                    })
                    .select()
                    .single();

                if (error) throw new Error(error.message);
                generatedImages.push(data as ImageGeneration);
            }

            // Record usage
            await recordLlmUsage({
                orgId: input.orgId,
                campaignId: input.campaignId,
                provider: 'openai',
                model: 'dall-e-3',
                kind: 'image',
                unitCount: result.urls.length,
            });

        } else if (provider === 'gemini') {
            // Try Imagen 3 first, fallback to Gemini 2.0
            let result;
            let modelUsed = 'imagen-3';
            
            try {
                result = await generateWithImagen(apiKey, {
                    prompt: enhancedPrompt,
                    aspectRatio: input.aspectRatio || '1:1',
                    numberOfImages,
                    style: input.style,
                });
            } catch {
                // Fallback to Gemini 2.0 Flash
                result = await generateWithGemini(apiKey, {
                    prompt: enhancedPrompt,
                    aspectRatio: input.aspectRatio || '1:1',
                    numberOfImages,
                    style: input.style,
                });
                modelUsed = 'gemini-2.0-flash';
            }

            for (const image of result.images) {
                // Upload base64 to Supabase Storage
                const fileName = `${input.orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
                const storageUrl = await uploadBase64(image.base64, fileName, image.mimeType, BUCKET_NAME);

                // Save to database
                const { data, error } = await supabase
                    .from('image_generations')
                    .insert({
                        org_id: input.orgId,
                        campaign_id: input.campaignId || null,
                        provider: 'gemini',
                        model: modelUsed,
                        prompt_used: enhancedPrompt,
                        style: input.style,
                        aspect_ratio: input.aspectRatio || '1:1',
                        result_url: storageUrl,
                        status: 'completed',
                        metadata: {},
                    })
                    .select()
                    .single();

                if (error) throw new Error(error.message);
                generatedImages.push(data as ImageGeneration);
            }

            // Record usage
            await recordLlmUsage({
                orgId: input.orgId,
                campaignId: input.campaignId,
                provider: 'gemini',
                model: modelUsed,
                kind: 'image',
                unitCount: result.images.length,
            });
        }

        return { success: true, images: generatedImages };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error during image generation';
        console.error('Image generation error:', message);
        return { success: false, error: message };
    }
}

/**
 * Get image generations for an organization
 */
export async function getImageGenerations(orgId: string, campaignId?: string) {
    const supabase = await createClient();
    
    let query = supabase
        .from('image_generations')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

    if (campaignId) {
        query = query.eq('campaign_id', campaignId);
    }

    const { data, error } = await query.limit(50);

    if (error) return [];
    return data as ImageGeneration[];
}

/**
 * Get a single image generation by ID
 */
export async function getImageGeneration(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('image_generations')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data as ImageGeneration;
}

/**
 * Delete an image generation
 */
export async function deleteImageGeneration(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('image_generations')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
}
