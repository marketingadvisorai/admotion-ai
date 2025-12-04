/**
 * Creative Pack Generator Service
 * Orchestrates the generation of 9 images (3 directions × 3 ratios)
 */

import { createClient } from '@/lib/db/server';
import { uploadFromUrl, uploadBase64 } from '@/lib/storage';
import { recordLlmUsage } from '@/modules/llm/usage';
import { generateWithOpenAI } from '@/modules/image-generation/providers/openai';
import { generateWithGemini } from '@/modules/image-generation/providers/gemini';
import { 
    CreativePack, 
    CreativeAsset, 
    Direction, 
    AspectRatio,
    DIRECTION_CONFIGS,
    ASPECT_RATIOS,
    GeneratePackInput,
    GenerationResult,
    BrandMemory,
    ConfirmedCopy,
} from '../types';
import { buildPackPrompts, buildDirectionPrompts } from './prompt-builder';
import { checkImageQuality, calculatePackScores } from './quality-checker';
import { getActiveBrandMemory } from './brand-memory.service';
import { getBrief, getConfirmedCopy, canGenerateCreatives, updateBriefStatus } from './brief.service';

const BUCKET_NAME = 'generated-images';
const MAX_REGENERATION_ATTEMPTS = 3;

/**
 * Get API key for provider
 */
async function getApiKey(provider: 'openai' | 'gemini', orgId: string): Promise<string> {
    const supabase = await createClient();
    
    const secretName = provider === 'openai' ? 'OPENAI_API_KEY' : 'GOOGLE_GEMINI_VEO_API_KEY';
    
    const { data } = await supabase
        .from('organization_secrets')
        .select('value')
        .eq('org_id', orgId)
        .eq('name', secretName)
        .single();

    if (data?.value) return data.value;

    const envKey = provider === 'openai' 
        ? process.env.OPENAI_API_KEY 
        : process.env.GEMINI_VEO_IMAGE_API_KEY;
    
    if (!envKey) throw new Error(`Missing API key for ${provider}`);
    return envKey;
}

/**
 * Generate a complete creative pack (9 images)
 */
export async function generateCreativePack(input: GeneratePackInput): Promise<GenerationResult> {
    const supabase = await createClient();
    const { brief_id, org_id, model = 'openai' } = input;

    try {
        // 1. Validate brief and copy confirmation (HARD GATE)
        const brief = await getBrief(brief_id);
        if (!brief) throw new Error('Brief not found');

        const { canGenerate, reason } = canGenerateCreatives(brief);
        if (!canGenerate) throw new Error(reason);

        const confirmedCopy = getConfirmedCopy(brief);
        if (!confirmedCopy) throw new Error('Confirmed copy not found');

        // 2. Get brand memory
        const brandMemory = await getActiveBrandMemory(org_id);
        if (!brandMemory) throw new Error('Brand memory not found. Please set up brand identity first.');

        // 3. Update brief status
        await updateBriefStatus(brief_id, 'generating');

        // 4. Create pack record
        const { data: pack, error: packError } = await supabase
            .from('creative_packs')
            .insert({
                org_id,
                brief_id,
                brand_memory_version: brandMemory.version,
                name: `Pack for "${brief.name}"`,
                status: 'generating',
                model_used: model,
                generation_config: {
                    style_direction: brief.style_direction,
                },
            })
            .select()
            .single();

        if (packError) throw new Error(packError.message);

        // 5. Build prompts for all 9 images
        const prompts = buildPackPrompts(brandMemory, confirmedCopy, brief.style_direction);

        // 6. Generate all images
        const apiKey = await getApiKey(model, org_id);
        const assets: CreativeAsset[] = [];

        for (const promptConfig of prompts) {
            const asset = await generateSingleAsset({
                pack_id: pack.id,
                brief_id,
                org_id,
                direction: promptConfig.direction,
                aspect_ratio: promptConfig.aspect_ratio,
                prompt: promptConfig.prompt,
                negative_prompt: promptConfig.negative_prompt,
                model,
                apiKey,
                brandMemory,
                confirmedCopy,
            });
            assets.push(asset);
        }

        // 7. Calculate aggregate scores
        const scores = assets.map(a => ({
            brand_alignment: a.brand_alignment_score || 5,
            readability: a.readability_score || 5,
            platform_fit: a.platform_fit_score || 5,
            compliance_risk: a.compliance_risk,
        }));
        const aggregateScores = calculatePackScores(scores);

        // 8. Update pack with final scores
        await supabase
            .from('creative_packs')
            .update({
                status: 'completed',
                ...aggregateScores,
                updated_at: new Date().toISOString(),
            })
            .eq('id', pack.id);

        // 9. Update brief status
        await updateBriefStatus(brief_id, 'completed');

        // 10. Record usage
        await recordLlmUsage({
            orgId: org_id,
            provider: model,
            model: model === 'openai' ? 'dall-e-3' : 'imagen-3',
            kind: 'image',
            unitCount: assets.length,
        });

        return {
            success: true,
            pack: { ...pack, assets } as CreativePack,
            assets,
        };

    } catch (error) {
        console.error('Pack generation error:', error);
        await updateBriefStatus(brief_id, 'failed');
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Regenerate a single direction (3 images)
 */
export async function regenerateDirection(
    packId: string,
    direction: Direction
): Promise<GenerationResult> {
    const supabase = await createClient();

    // Get pack details
    const { data: pack, error: packError } = await supabase
        .from('creative_packs')
        .select('*')
        .eq('id', packId)
        .single();

    if (packError || !pack) throw new Error('Pack not found');

    // Get brief and brand memory
    const brief = await getBrief(pack.brief_id);
    if (!brief) throw new Error('Brief not found');

    const confirmedCopy = getConfirmedCopy(brief);
    if (!confirmedCopy) throw new Error('Confirmed copy not found');

    const brandMemory = await getActiveBrandMemory(pack.org_id);
    if (!brandMemory) throw new Error('Brand memory not found');

    // Delete existing assets for this direction
    await supabase
        .from('creative_assets')
        .delete()
        .eq('pack_id', packId)
        .eq('direction', direction);

    // Generate new assets for direction
    const prompts = buildDirectionPrompts(
        brandMemory,
        confirmedCopy,
        direction,
        brief.style_direction
    );

    const apiKey = await getApiKey(pack.model_used, pack.org_id);
    const assets: CreativeAsset[] = [];

    for (const promptConfig of prompts) {
        const asset = await generateSingleAsset({
            pack_id: packId,
            brief_id: pack.brief_id,
            org_id: pack.org_id,
            direction: promptConfig.direction,
            aspect_ratio: promptConfig.aspect_ratio,
            prompt: promptConfig.prompt,
            negative_prompt: promptConfig.negative_prompt,
            model: pack.model_used,
            apiKey,
            brandMemory,
            confirmedCopy,
        });
        assets.push(asset);
    }

    // Recalculate pack scores
    const { data: allAssets } = await supabase
        .from('creative_assets')
        .select('*')
        .eq('pack_id', packId);

    if (allAssets) {
        const scores = allAssets.map(a => ({
            brand_alignment: a.brand_alignment_score || 5,
            readability: a.readability_score || 5,
            platform_fit: a.platform_fit_score || 5,
            compliance_risk: a.compliance_risk,
        }));
        const aggregateScores = calculatePackScores(scores);

        await supabase
            .from('creative_packs')
            .update({
                ...aggregateScores,
                updated_at: new Date().toISOString(),
            })
            .eq('id', packId);
    }

    return { success: true, assets };
}

/**
 * Generate a single asset
 */
async function generateSingleAsset(input: {
    pack_id: string;
    brief_id: string;
    org_id: string;
    direction: Direction;
    aspect_ratio: AspectRatio;
    prompt: string;
    negative_prompt: string;
    model: 'openai' | 'gemini';
    apiKey: string;
    brandMemory: BrandMemory;
    confirmedCopy: ConfirmedCopy;
}): Promise<CreativeAsset> {
    const supabase = await createClient();
    const { pack_id, brief_id, org_id, direction, aspect_ratio, prompt, model, apiKey, brandMemory, confirmedCopy } = input;

    // Create asset record
    const { data: asset, error: assetError } = await supabase
        .from('creative_assets')
        .insert({
            org_id,
            pack_id,
            brief_id,
            direction,
            direction_name: DIRECTION_CONFIGS[direction].name,
            aspect_ratio,
            prompt_used: prompt,
            model_used: model,
            headline_text: confirmedCopy.headline,
            cta_text: confirmedCopy.cta_text,
            status: 'generating',
            generation_attempts: 1,
        })
        .select()
        .single();

    if (assetError) throw new Error(assetError.message);

    try {
        // Generate image
        let imageUrl: string;

        if (model === 'openai') {
            const result = await generateWithOpenAI(apiKey, {
                prompt,
                aspectRatio: aspect_ratio,
                numberOfImages: 1,
                quality: 'hd',
                style: 'vivid',
            });
            if (!result.urls.length) throw new Error('No image generated');
            
            // Upload to storage
            const fileName = `${org_id}/${pack_id}/${direction}-${aspect_ratio.replace(':', 'x')}-${Date.now()}.png`;
            imageUrl = await uploadFromUrl(result.urls[0], fileName, BUCKET_NAME);
        } else {
            const result = await generateWithGemini(apiKey, {
                prompt,
                aspectRatio: aspect_ratio,
                numberOfImages: 1,
            });
            if (!result.images.length) throw new Error('No image generated');
            
            const fileName = `${org_id}/${pack_id}/${direction}-${aspect_ratio.replace(':', 'x')}-${Date.now()}.png`;
            imageUrl = await uploadBase64(result.images[0].base64, fileName, result.images[0].mimeType, BUCKET_NAME);
        }

        // Run quality check
        const qualityResult = await checkImageQuality(
            imageUrl,
            brandMemory,
            confirmedCopy,
            aspect_ratio,
            apiKey
        );

        // Update asset with results
        const { data: updatedAsset, error: updateError } = await supabase
            .from('creative_assets')
            .update({
                result_url: imageUrl,
                status: qualityResult.passesQuality ? 'completed' : 'flagged',
                brand_alignment_score: qualityResult.scores.brand_alignment,
                readability_score: qualityResult.scores.readability,
                platform_fit_score: qualityResult.scores.platform_fit,
                compliance_risk: qualityResult.scores.compliance_risk,
                quality_issues: qualityResult.issues,
                updated_at: new Date().toISOString(),
            })
            .eq('id', asset.id)
            .select()
            .single();

        if (updateError) throw new Error(updateError.message);
        return updatedAsset as CreativeAsset;

    } catch (error) {
        // Mark as failed
        await supabase
            .from('creative_assets')
            .update({
                status: 'failed',
                quality_issues: [error instanceof Error ? error.message : 'Generation failed'],
                updated_at: new Date().toISOString(),
            })
            .eq('id', asset.id);

        throw error;
    }
}

/**
 * Get pack with all assets
 */
export async function getPackWithAssets(packId: string): Promise<CreativePack | null> {
    const supabase = await createClient();

    const { data: pack, error: packError } = await supabase
        .from('creative_packs')
        .select('*')
        .eq('id', packId)
        .single();

    if (packError || !pack) return null;

    const { data: assets } = await supabase
        .from('creative_assets')
        .select('*')
        .eq('pack_id', packId)
        .order('direction')
        .order('aspect_ratio');

    return {
        ...pack,
        assets: assets || [],
    } as CreativePack;
}

/**
 * Get all packs for a brief
 */
export async function getPacksForBrief(briefId: string): Promise<CreativePack[]> {
    const supabase = await createClient();

    const { data: packs, error } = await supabase
        .from('creative_packs')
        .select('*')
        .eq('brief_id', briefId)
        .order('created_at', { ascending: false });

    if (error || !packs) return [];

    // Get assets for each pack
    const packsWithAssets = await Promise.all(
        packs.map(async (pack) => {
            const { data: assets } = await supabase
                .from('creative_assets')
                .select('*')
                .eq('pack_id', pack.id)
                .order('direction')
                .order('aspect_ratio');

            return {
                ...pack,
                assets: assets || [],
            } as CreativePack;
        })
    );

    return packsWithAssets;
}
