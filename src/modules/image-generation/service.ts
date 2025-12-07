import { createClient } from '@/lib/db/server';
import { uploadFromUrl, uploadBase64 } from '@/lib/storage';
import { recordLlmUsage } from '@/modules/llm/usage';
import { generateWithOpenAI } from './providers/openai';
import { generateWithGemini } from './providers/gemini';
import {
    ImageGenerationInput,
    ImageGeneration,
    ImageProvider,
    GenerateImageResult,
    BrandContext,
    ImagePromptSpec,
    AdCopy,
    ImageModel,
} from './types';

const BUCKET_NAME = 'generated-images';

// ============================================
// API KEY MANAGEMENT
// ============================================

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

// ============================================
// BRAND DATA LOADING
// ============================================

/**
 * Load comprehensive brand data from Brand Kit + Analyzer + Memory
 */
async function loadBrandData(orgId: string, brandKitId?: string): Promise<BrandContext | null> {
    const supabase = await createClient();
    
    // Load Brand Kit
    let brandKit = null;
    if (brandKitId) {
        const { data } = await supabase
            .from('brand_kits')
            .select('*')
            .eq('id', brandKitId)
            .single();
        brandKit = data;
    }
    
    // Load Brand Memory (active version)
    const { data: brandMemory } = await supabase
        .from('brand_memories')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();
    
    if (!brandKit && !brandMemory) return null;
    
    // Merge brand data
    const context: BrandContext = {
        // Core identity
        businessName: brandKit?.business_name || brandMemory?.brand_name,
        tagline: brandKit?.description || brandMemory?.tagline,
        logoUrl: brandKit?.logo_url || brandMemory?.logo_url,
        
        // Visual identity - extract colors
        colors: extractColors(brandKit, brandMemory),
        fonts: brandKit?.fonts || brandMemory?.fonts,
        visualStyle: {
            imagery: brandMemory?.style_tokens?.vibe || 'modern',
            mood: brandMemory?.style_tokens?.mood,
            aesthetic: brandMemory?.style_tokens?.aesthetic,
        },
        
        // Messaging
        brandVoice: brandKit?.strategy?.brand_voice || brandMemory?.voice_rules?.tone,
        targetAudience: brandKit?.strategy?.target_audience,
        tone: brandMemory?.voice_rules?.personality,
        
        // Memory rules
        memoryRules: {
            doList: brandMemory?.do_list || [],
            dontList: brandMemory?.dont_list || [],
            forbiddenElements: brandMemory?.dont_list || [],
            complianceRules: brandMemory?.compliance_rules || [],
            fatiguedStyles: brandMemory?.fatigued_styles || [],
        },
        
        // Layout preferences
        logoPlacement: brandMemory?.logo_placement || 'bottom-right',
        safeZone: brandMemory?.text_safe_zones?.default || 'Keep 10% margin from edges',
    };
    
    return context;
}

/**
 * Extract colors from brand kit and memory
 */
function extractColors(brandKit: Record<string, unknown> | null, brandMemory: Record<string, unknown> | null): string[] {
    const colors: string[] = [];
    
    // From brand kit
    if (brandKit?.colors && Array.isArray(brandKit.colors)) {
        for (const color of brandKit.colors as Array<{ value: string; type: string }>) {
            colors.push(color.value);
        }
    }
    
    // From brand memory
    if (brandMemory?.primary_colors && Array.isArray(brandMemory.primary_colors)) {
        for (const color of brandMemory.primary_colors as Array<{ hex: string }>) {
            if (color.hex && !colors.includes(color.hex)) {
                colors.push(color.hex);
            }
        }
    }
    
    return colors;
}

// ============================================
// PROMPT CONSTRUCTION
// ============================================

/**
 * Build structured prompt spec for professional ad generation
 */
function buildPromptSpec(input: ImageGenerationInput): ImagePromptSpec {
    const { adCopy, brandContext, aspectRatio, imageTheme, styleMode } = input;
    
    // Default copy if not provided
    const copy: AdCopy = adCopy || {
        headline: '',
        ctaText: 'Learn More',
    };
    
    // Extract colors as array
    const colors = brandContext?.colors || [];
    
    return {
        copy: {
            headline: copy.headline,
            subheadline: copy.subheadline,
            primary_text: copy.primaryText,
            cta_text: copy.ctaText,
        },
        visual_direction: imageTheme || styleMode || input.style || 'professional marketing image',
        aspect: aspectRatio || '1:1',
        brand: {
            colors,
            fonts: brandContext?.fonts,
            voice: brandContext?.brandVoice,
            target_audience: brandContext?.targetAudience,
            visual_style: brandContext?.visualStyle?.imagery,
        },
        layout: {
            logo: `Place logo as a badge in ${brandContext?.logoPlacement || 'bottom-right'} with padding, no stretching.`,
            logo_placement: brandContext?.logoPlacement,
            hierarchy: 'Headline above body, clear CTA button, generous spacing, mobile-safe margins.',
            text_rules: 'Headline <= 45 characters, body concise, CTA standard (e.g., Learn More, Shop Now).',
            background: 'Avoid noisy/low-contrast areas behind text; keep CTA high-contrast.',
            safe_zone: brandContext?.safeZone,
        },
        accessibility: {
            contrast: 'Meet WCAG AA contrast for text and CTA.',
            legibility: 'Use clean fonts, avoid tiny text, keep padding around text and buttons.',
        },
        restrictions: brandContext?.memoryRules ? {
            forbidden_elements: brandContext.memoryRules.forbiddenElements,
            compliance_rules: brandContext.memoryRules.complianceRules,
        } : undefined,
    };
}

/**
 * Build final prompt string from spec
 */
function buildFinalPrompt(spec: ImagePromptSpec, input: ImageGenerationInput): string {
    const { brandContext } = input;
    
    // If raw prompt provided, enhance it with brand context
    if (input.prompt && !input.adCopy) {
        return buildEnhancedPrompt(input);
    }
    
    // Build structured prompt
    const parts: string[] = [];
    
    // Style and theme
    parts.push(`Create a ${spec.visual_direction} marketing image.`);
    
    // Brand identity
    if (brandContext?.businessName) {
        parts.push(`Brand: ${brandContext.businessName}.`);
    }
    
    // Colors
    const colors = Array.isArray(spec.brand.colors) ? spec.brand.colors : [];
    if (colors.length > 0) {
        parts.push(`Use brand colors: ${colors.join(', ')}.`);
    }
    
    // Font direction
    if (spec.brand.fonts?.heading) {
        parts.push(`Font style: ${spec.brand.fonts.heading} for headings.`);
    }
    
    // Brand tone
    if (spec.brand.voice) {
        parts.push(`Brand tone: ${spec.brand.voice}.`);
    }
    
    // Target audience
    if (spec.brand.target_audience) {
        parts.push(`Target audience: ${spec.brand.target_audience}.`);
    }
    
    // Visual style
    if (spec.brand.visual_style) {
        parts.push(`Visual style: ${spec.brand.visual_style}.`);
    }
    
    // Layout rules
    parts.push(`\nComposition rules:`);
    parts.push(`- ${spec.layout.logo}`);
    parts.push(`- ${spec.layout.hierarchy}`);
    parts.push(`- ${spec.layout.text_rules}`);
    parts.push(`- ${spec.layout.background}`);
    if (spec.layout.safe_zone) {
        parts.push(`- Safe zone: ${spec.layout.safe_zone}`);
    }
    
    // Text overlays
    if (spec.copy.headline) {
        parts.push(`\nAdd clean textual overlays:`);
        parts.push(`HEADLINE (uppercase): '${spec.copy.headline}'`);
        if (spec.copy.subheadline) {
            parts.push(`SUBHEADLINE: '${spec.copy.subheadline}'`);
        }
        if (spec.copy.primary_text) {
            parts.push(`BODY: '${spec.copy.primary_text}'`);
        }
        parts.push(`CTA BUTTON: '${spec.copy.cta_text}'`);
    }
    
    // Restrictions
    if (spec.restrictions?.forbidden_elements?.length) {
        parts.push(`\nDo NOT include: ${spec.restrictions.forbidden_elements.join(', ')}.`);
    }
    
    // Accessibility
    parts.push(`\nAccessibility:`);
    parts.push(`- ${spec.accessibility.contrast}`);
    parts.push(`- ${spec.accessibility.legibility}`);
    
    // Final instructions
    parts.push(`\nEnsure all text is sharp, readable, non-distorted.`);
    parts.push(`No watermarks, no signatures.`);
    parts.push(`Follow the brand's visual consistency.`);
    
    return parts.join('\n');
}

/**
 * Legacy enhanced prompt builder (for backwards compatibility)
 */
function buildEnhancedPrompt(input: ImageGenerationInput): string {
    let prompt = input.prompt || '';
    
    if (input.brandContext) {
        const { businessName, colors, brandVoice, targetAudience } = input.brandContext;
        const parts: string[] = [];
        
        if (businessName) parts.push(`Brand: ${businessName}`);
        if (colors && Array.isArray(colors) && colors.length > 0) {
            parts.push(`Brand colors: ${colors.join(', ')}`);
        }
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
 * Generate prompt variations for "More Options"
 */
function generatePromptVariations(basePrompt: string, spec: ImagePromptSpec): string[] {
    const variations: string[] = [];
    
    // Variation 1: Different layout emphasis
    variations.push(basePrompt.replace(
        'Headline above body',
        'Centered headline with body below'
    ));
    
    // Variation 2: Different visual style
    const altStyles = ['bold and dynamic', 'soft and elegant', 'minimal and clean'];
    const randomStyle = altStyles[Math.floor(Math.random() * altStyles.length)];
    variations.push(basePrompt.replace(
        spec.visual_direction,
        `${randomStyle} ${spec.visual_direction}`
    ));
    
    return variations.slice(0, 2);
}

/**
 * Determine which model to use based on input
 */
function resolveModel(input: ImageGenerationInput): { provider: ImageProvider; model: ImageModel } {
    // If explicitly specified
    if (input.model) {
        const provider: ImageProvider = 
            input.model.startsWith('gpt-') || input.model === 'dall-e-3' 
                ? 'openai' 
                : 'gemini';
        return { provider, model: input.model };
    }
    
    // Default to gpt-image-1 (best quality)
    if (input.provider === 'gemini') {
        return { provider: 'gemini', model: 'imagen-3' };
    }
    
    return { provider: 'openai', model: 'gpt-image-1' };
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

/**
 * Main image generation function supporting multiple providers
 * Uses gpt-image-1 (OpenAI) or imagen-3 (Google) by default
 */
export async function generateImages(input: ImageGenerationInput): Promise<GenerateImageResult> {
    const supabase = await createClient();
    const numberOfImages = Math.min(input.numberOfImages || 1, 4);
    
    try {
        // Load brand data if brand kit specified
        let brandContext = input.brandContext;
        if (input.brandKitId && !brandContext) {
            brandContext = await loadBrandData(input.orgId, input.brandKitId) || undefined;
        }
        
        // Merge brand context into input
        const enrichedInput: ImageGenerationInput = {
            ...input,
            brandContext,
        };
        
        // Resolve model and provider
        const { provider, model } = resolveModel(enrichedInput);
        
        // Get API key
        const apiKey = await getImageApiKey(provider, input.orgId);
        
        // Build prompt
        const promptSpec = buildPromptSpec(enrichedInput);
        const finalPrompt = buildFinalPrompt(promptSpec, enrichedInput);
        const promptVariations = generatePromptVariations(finalPrompt, promptSpec);
        
        const generatedImages: ImageGeneration[] = [];

        if (provider === 'openai') {
            // Generate with OpenAI gpt-image-1 (default) or specified model
            const openaiModel = model as 'gpt-image-1' | 'gpt-image-1-mini' | 'dall-e-3';
            
            const result = await generateWithOpenAI(apiKey, {
                prompt: finalPrompt,
                aspectRatio: input.aspectRatio || '1:1',
                numberOfImages,
                quality: input.quality || 'high',
                model: openaiModel,
            });

            // Handle base64 images (gpt-image-1) or URLs (dall-e-3)
            if (result.base64Images && result.base64Images.length > 0) {
                for (const base64 of result.base64Images) {
                    const fileName = `${input.orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
                    const storageUrl = await uploadBase64(base64, fileName, 'image/png', BUCKET_NAME);

                    const { data, error } = await supabase
                        .from('image_generations')
                        .insert({
                            org_id: input.orgId,
                            campaign_id: input.campaignId || null,
                            brand_kit_id: input.brandKitId || null,
                            provider: 'openai',
                            model: result.model,
                            prompt_used: finalPrompt,
                            style: input.style,
                            aspect_ratio: input.aspectRatio || '1:1',
                            result_url: storageUrl,
                            status: 'completed',
                            metadata: { promptSpec },
                        })
                        .select()
                        .single();

                    if (error) throw new Error(error.message);
                    generatedImages.push(data as ImageGeneration);
                }
            } else {
                // Fallback to URL-based (dall-e-3)
                for (const url of result.urls) {
                    const fileName = `${input.orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
                    const storageUrl = await uploadFromUrl(url, fileName, BUCKET_NAME);

                    const { data, error } = await supabase
                        .from('image_generations')
                        .insert({
                            org_id: input.orgId,
                            campaign_id: input.campaignId || null,
                            brand_kit_id: input.brandKitId || null,
                            provider: 'openai',
                            model: result.model,
                            prompt_used: finalPrompt,
                            style: input.style,
                            aspect_ratio: input.aspectRatio || '1:1',
                            result_url: storageUrl,
                            status: 'completed',
                            metadata: { revisedPrompt: result.revisedPrompt, promptSpec },
                        })
                        .select()
                        .single();

                    if (error) throw new Error(error.message);
                    generatedImages.push(data as ImageGeneration);
                }
            }

            // Record usage
            await recordLlmUsage({
                orgId: input.orgId,
                campaignId: input.campaignId,
                provider: 'openai',
                model: result.model,
                kind: 'image',
                unitCount: generatedImages.length,
            });

        } else if (provider === 'gemini') {
            // Generate with Gemini Imagen 3 (default) or specified model
            const geminiModel = model as 'imagen-3' | 'imagen-3-fast' | 'gemini-2.0-flash';
            
            const result = await generateWithGemini(apiKey, {
                prompt: finalPrompt,
                aspectRatio: input.aspectRatio || '1:1',
                numberOfImages,
                style: input.style,
                model: geminiModel,
                quality: input.quality === 'high' ? 'high' : 'standard',
            });

            for (const image of result.images) {
                const fileName = `${input.orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
                const storageUrl = await uploadBase64(image.base64, fileName, image.mimeType, BUCKET_NAME);

                const { data, error } = await supabase
                    .from('image_generations')
                    .insert({
                        org_id: input.orgId,
                        campaign_id: input.campaignId || null,
                        brand_kit_id: input.brandKitId || null,
                        provider: 'gemini',
                        model: result.model,
                        prompt_used: finalPrompt,
                        style: input.style,
                        aspect_ratio: input.aspectRatio || '1:1',
                        result_url: storageUrl,
                        status: 'completed',
                        metadata: { promptSpec },
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
                model: result.model,
                kind: 'image',
                unitCount: result.images.length,
            });
        }

        return { 
            success: true, 
            images: generatedImages,
            promptUsed: finalPrompt,
            promptVariations,
        };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error during image generation';
        console.error('Image generation error:', message);
        return { success: false, error: message };
    }
}

// ============================================
// EXPORTS FOR EXTERNAL USE
// ============================================

export { loadBrandData, buildPromptSpec, buildFinalPrompt };

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
