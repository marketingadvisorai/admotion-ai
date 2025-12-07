/**
 * Video Generation Service
 * Comprehensive brand-aware video ad generation
 * 
 * Features:
 * - Brand Kit + Analyzer + Memory integration
 * - Structured prompt construction
 * - Multi-provider support (Sora, Veo)
 * - Job status tracking
 */

import { createClient } from '@/lib/db/server';
import { uploadFromUrl } from '@/lib/storage';
import { recordLlmUsage } from '@/modules/llm/usage';
import { resolveVideoProvider } from './providers/factory';
import {
    VideoGenerationInput,
    VideoGeneration,
    VideoProvider,
    GenerateVideoResult,
    VideoBrandContext,
    VideoPromptSpec,
    VideoAdCopy,
    VideoModel,
    VideoDuration,
} from './types';

const BUCKET_NAME = 'generated-videos';

// ============================================
// API KEY MANAGEMENT
// ============================================

/**
 * Get API key for video generation provider
 */
async function getVideoApiKey(provider: VideoProvider, orgId: string): Promise<string> {
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
        : process.env.GOOGLE_GEMINI_VEO_API_KEY;
    
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
async function loadBrandData(orgId: string, brandKitId?: string): Promise<VideoBrandContext | null> {
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
    const context: VideoBrandContext = {
        // Core identity
        businessName: brandKit?.business_name || brandMemory?.brand_name,
        tagline: brandKit?.description || brandMemory?.tagline,
        logoUrl: brandKit?.logo_url || brandMemory?.logo_url,
        
        // Visual identity - extract colors
        colors: extractColors(brandKit, brandMemory),
        fonts: brandKit?.fonts || brandMemory?.fonts,
        visualStyle: {
            imagery: brandMemory?.style_tokens?.vibe || 'cinematic',
            mood: brandMemory?.style_tokens?.mood,
            aesthetic: brandMemory?.style_tokens?.aesthetic,
        },
        
        // Messaging
        brandVoice: brandKit?.strategy?.brand_voice || brandMemory?.voice_rules?.tone,
        targetAudience: brandKit?.strategy?.target_audience,
        tone: brandMemory?.voice_rules?.personality || 'professional',
        
        // Memory rules
        memoryRules: {
            doList: brandMemory?.do_list || [],
            dontList: brandMemory?.dont_list || [],
            forbiddenElements: brandMemory?.dont_list || [],
            complianceRules: brandMemory?.compliance_rules || [],
            fatiguedStyles: brandMemory?.fatigued_styles || [],
            previousSuccessfulCreatives: brandMemory?.successful_creatives || [],
        },
        
        // Layout preferences
        logoPlacement: brandMemory?.logo_placement || 'bottom-right',
        safeZone: brandMemory?.text_safe_zones?.default || 'Keep 10% margin from edges',
        textSafeZones: brandMemory?.text_safe_zones || {
            default: 'Keep 10% margin from edges',
            headline: 'Top 30% of frame',
            cta: 'Bottom 20% of frame',
        },
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
 * Build structured prompt spec for professional video ad generation
 */
function buildPromptSpec(input: VideoGenerationInput): VideoPromptSpec {
    const { adCopy, brandContext, aspectRatio, sceneDescription, visualTheme } = input;
    const duration = (input.duration || 10) as VideoDuration;
    
    // Default copy if not provided
    const copy: VideoAdCopy = adCopy || {
        headline: '',
        ctaText: 'Learn More',
    };
    
    // Extract colors as array
    const colors = brandContext?.colors || [];
    
    return {
        copy: {
            headline: copy.headline,
            subheadline: copy.subheadline,
            cta_text: copy.ctaText,
        },
        visual_direction: visualTheme || sceneDescription?.visualTheme || input.style || 'cinematic marketing video',
        aspect: aspectRatio || '16:9',
        duration,
        brand: {
            name: brandContext?.businessName,
            colors,
            fonts: brandContext?.fonts,
            voice: brandContext?.brandVoice,
            target_audience: brandContext?.targetAudience,
            visual_style: brandContext?.visualStyle?.imagery,
            mood: brandContext?.visualStyle?.mood,
        },
        scene: {
            description: sceneDescription?.description || 'Professional marketing video scene',
            mandatory_elements: sceneDescription?.mandatoryElements,
            forbidden_elements: sceneDescription?.forbiddenElements,
            camera_style: sceneDescription?.cameraStyle || 'smooth',
            transitions: sceneDescription?.transitions || 'clean',
        },
        layout: {
            logo: `Place logo as a badge in ${brandContext?.logoPlacement || 'bottom-right'} with padding, no stretching.`,
            logo_placement: brandContext?.logoPlacement,
            hierarchy: 'Headline above body, clear CTA button, generous spacing.',
            text_rules: 'Headline <= 45 characters, CTA standard (e.g., Learn More, Shop Now). Add overlay text in final 2 seconds.',
            safe_zones: brandContext?.safeZone || 'Keep 10% margin from edges; leave bottom 20% for text overlays.',
        },
        audio: {
            enabled: input.audio?.enabled ?? true,
            style: input.audio?.style || 'upbeat',
            instructions: input.audio?.instructions,
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
function buildFinalPrompt(spec: VideoPromptSpec, input: VideoGenerationInput): string {
    const { brandContext } = input;
    
    // If raw prompt provided, enhance it with brand context
    if (input.prompt && !input.adCopy) {
        return buildEnhancedPrompt(input);
    }
    
    // Build structured prompt following the agent guide
    const parts: string[] = [];
    
    // Opening with duration and style
    parts.push(`Create a ${spec.duration}s ${spec.visual_direction} video ad in ${spec.aspect} aspect ratio.`);
    
    // Brand identity
    if (spec.brand.name) {
        parts.push(`\nBrand: ${spec.brand.name}.`);
    }
    
    // Visual theme and scene
    parts.push(`\nVisual theme: ${spec.visual_direction}`);
    parts.push(`Scene description: ${spec.scene.description}`);
    
    // Target audience
    if (spec.brand.target_audience) {
        parts.push(`Target audience: ${spec.brand.target_audience}`);
    }
    
    // Colors
    const colors = Array.isArray(spec.brand.colors) ? spec.brand.colors : [];
    if (colors.length > 0) {
        parts.push(`\nUse brand colors: ${colors.join(', ')}.`);
    }
    
    // Brand mood and lighting
    if (spec.brand.mood) {
        parts.push(`Use brand lighting/mood: ${spec.brand.mood}.`);
    }
    
    // Camera and transitions
    parts.push(`\nCamera style: ${spec.scene.camera_style} (smooth, cinematic, stable).`);
    parts.push(`Transitions: ${spec.scene.transitions} and modern.`);
    
    // Safe zones
    parts.push(`Safe zones: Follow ${spec.layout.safe_zones}`);
    
    // Mandatory elements
    if (spec.scene.mandatory_elements?.length) {
        parts.push(`\nMust include: ${spec.scene.mandatory_elements.join(', ')}.`);
    }
    
    // Restrictions
    if (spec.restrictions?.forbidden_elements?.length) {
        parts.push(`\nDo NOT include: ${spec.restrictions.forbidden_elements.join(', ')}.`);
    }
    if (spec.scene.forbidden_elements?.length) {
        parts.push(`Also avoid: ${spec.scene.forbidden_elements.join(', ')}.`);
    }
    
    // Text overlays in final frames
    if (spec.copy.headline) {
        parts.push(`\nAdd overlay text in the final 2 seconds:`);
        parts.push(`HEADLINE (uppercase): '${spec.copy.headline}'`);
        if (spec.copy.subheadline) {
            parts.push(`SUBHEADLINE: '${spec.copy.subheadline}'`);
        }
        parts.push(`CTA BUTTON: '${spec.copy.cta_text}'`);
        parts.push(`Ensure overlay text is legible, crisp, brand-color compatible, no distortion or warping.`);
    }
    
    // Audio instructions
    if (spec.audio.enabled) {
        parts.push(`\nAudio: ${spec.audio.style || 'upbeat'} music with synchronized sound design.`);
        if (spec.audio.instructions) {
            parts.push(`Audio details: ${spec.audio.instructions}`);
        }
        parts.push(`No vocals unless user provides script.`);
    }
    
    // Brand tone
    if (spec.brand.voice) {
        parts.push(`\nThe video should feel premium, cohesive, emotionally aligned with brand tone: ${spec.brand.voice}.`);
    }
    
    // Final quality instructions
    parts.push(`\nProduce a short video of ${spec.duration} seconds, with smooth camera movement, realistic lighting, consistent characters, and high production quality.`);
    parts.push(`No watermarks, no signatures.`);
    
    return parts.join('\n');
}

/**
 * Legacy enhanced prompt builder (for backwards compatibility)
 */
function buildEnhancedPrompt(input: VideoGenerationInput): string {
    let prompt = input.prompt || '';
    const duration = input.duration || 10;
    const aspectRatio = input.aspectRatio || '16:9';
    
    // Add duration and aspect ratio context
    prompt = `Create a ${duration}s video ad in ${aspectRatio} aspect ratio. ${prompt}`;
    
    if (input.brandContext) {
        const { businessName, colors, brandVoice, targetAudience, tone } = input.brandContext;
        const parts: string[] = [];
        
        if (businessName) parts.push(`Brand: ${businessName}`);
        if (colors && Array.isArray(colors) && colors.length > 0) {
            parts.push(`Brand colors: ${colors.join(', ')}`);
        }
        if (brandVoice) parts.push(`Tone: ${brandVoice}`);
        if (targetAudience) parts.push(`Target audience: ${targetAudience}`);
        if (tone) parts.push(`Mood: ${tone}`);
        
        if (parts.length > 0) {
            prompt = `${prompt}\n\nBrand context: ${parts.join('. ')}.`;
        }
    }

    if (input.style) {
        prompt = `${prompt}\n\nVisual style: ${input.style}`;
    }
    
    // Add audio instructions
    if (input.audio?.enabled) {
        prompt = `${prompt}\n\nAudio: ${input.audio.style || 'upbeat'} music. ${input.audio.instructions || ''}`;
    }

    return prompt;
}

/**
 * Generate prompt variations for "More Options"
 */
function generatePromptVariations(basePrompt: string, spec: VideoPromptSpec): string[] {
    const variations: string[] = [];
    
    // Variation 1: Different camera style
    variations.push(basePrompt.replace(
        spec.scene.camera_style,
        spec.scene.camera_style === 'smooth' ? 'dynamic' : 'smooth'
    ));
    
    // Variation 2: Different visual style
    const altStyles = ['bold and dynamic', 'soft and elegant', 'minimal and clean', 'energetic and vibrant'];
    const randomStyle = altStyles[Math.floor(Math.random() * altStyles.length)];
    variations.push(basePrompt.replace(
        spec.visual_direction,
        `${randomStyle} ${spec.visual_direction}`
    ));
    
    return variations.slice(0, 2);
}

/**
 * Calculate brand consistency score
 */
function calculateBrandConsistencyScore(spec: VideoPromptSpec, brandContext?: VideoBrandContext): number {
    if (!brandContext) return 50;
    
    let score = 50; // Base score
    
    // Add points for brand elements used
    if (brandContext.businessName) score += 10;
    if (brandContext.colors && (Array.isArray(brandContext.colors) ? brandContext.colors.length > 0 : true)) score += 15;
    if (brandContext.brandVoice) score += 10;
    if (brandContext.targetAudience) score += 5;
    if (brandContext.memoryRules?.doList?.length) score += 5;
    if (brandContext.logoPlacement) score += 5;
    
    return Math.min(100, score);
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

/**
 * Main video generation function supporting multiple providers
 * Uses Sora (OpenAI) or Veo (Google) based on selection
 */
export async function generateVideo(input: VideoGenerationInput): Promise<GenerateVideoResult> {
    const supabase = await createClient();
    
    try {
        // Load brand data if brand kit specified
        let brandContext = input.brandContext;
        if (input.brandKitId && !brandContext) {
            brandContext = await loadBrandData(input.orgId, input.brandKitId) || undefined;
        }
        
        // Merge brand context into input
        const enrichedInput: VideoGenerationInput = {
            ...input,
            brandContext,
        };
        
        // Resolve provider and model
        const { provider, model } = resolveVideoProvider(
            input.model as VideoModel,
            input.provider
        );
        
        // Get API key
        const providerType: VideoProvider = model.startsWith('sora') ? 'openai' : 'google';
        const apiKey = await getVideoApiKey(providerType, input.orgId);
        
        // Build prompt
        const promptSpec = buildPromptSpec(enrichedInput);
        const finalPrompt = buildFinalPrompt(promptSpec, enrichedInput);
        const promptVariations = generatePromptVariations(finalPrompt, promptSpec);
        const brandConsistencyScore = calculateBrandConsistencyScore(promptSpec, brandContext);
        
        // Create DB record first
        const { data: job, error: dbError } = await supabase
            .from('video_generations')
            .insert({
                org_id: input.orgId,
                campaign_id: input.campaignId || null,
                brand_kit_id: input.brandKitId || null,
                provider: providerType,
                model,
                prompt_used: finalPrompt,
                style: input.style,
                aspect_ratio: input.aspectRatio || '16:9',
                duration: input.duration || 10,
                status: 'queued',
                metadata: { 
                    promptSpec,
                    brandConsistencyScore,
                    audioEnabled: input.audio?.enabled ?? true,
                },
            })
            .select()
            .single();

        if (dbError) throw new Error(dbError.message);

        // Call provider to start generation
        try {
            const externalJobId = await provider.generateVideo(
                { ...enrichedInput, prompt: finalPrompt },
                apiKey
            );

            // Update DB with external job ID
            await supabase
                .from('video_generations')
                .update({
                    external_job_id: externalJobId,
                    status: 'processing',
                })
                .eq('id', job.id);

            // Record usage
            await recordLlmUsage({
                orgId: input.orgId,
                campaignId: input.campaignId,
                provider: providerType,
                model,
                kind: 'video',
                unitCount: 1,
            });

            return {
                success: true,
                video: job as VideoGeneration,
                jobId: job.id,
                promptUsed: finalPrompt,
                promptVariations,
                brandConsistencyScore,
            };
        } catch (providerError: unknown) {
            // Mark as failed if provider call fails
            await supabase
                .from('video_generations')
                .update({ status: 'failed' })
                .eq('id', job.id);
            throw providerError;
        }

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error during video generation';
        console.error('Video generation error:', message);
        return { success: false, error: message };
    }
}

/**
 * Check and update job status
 */
export async function checkVideoJobStatus(jobId: string): Promise<VideoGeneration | null> {
    const supabase = await createClient();

    // Get job details
    const { data: job } = await supabase
        .from('video_generations')
        .select('*')
        .eq('id', jobId)
        .single();

    if (!job || !job.external_job_id || job.status === 'completed' || job.status === 'failed') {
        return job as VideoGeneration | null;
    }

    try {
        // Get provider and API key
        const providerType: VideoProvider = job.provider;
        const { provider } = resolveVideoProvider(job.model as VideoModel, providerType);
        const apiKey = await getVideoApiKey(providerType, job.org_id);
        
        const status = await provider.checkStatus(job.external_job_id, apiKey);

        if (status.status === 'completed' && status.resultUrl) {
            try {
                // Upload to Supabase Storage to persist the asset
                const fileName = `${job.campaign_id || job.org_id}/${job.id}-${Date.now()}.mp4`;
                const storageUrl = await uploadFromUrl(status.resultUrl, fileName, BUCKET_NAME);

                const { data: updated } = await supabase
                    .from('video_generations')
                    .update({
                        status: 'completed',
                        result_url: storageUrl,
                        thumbnail_url: status.thumbnailUrl,
                        retry_count: 0,
                    })
                    .eq('id', jobId)
                    .select()
                    .single();
                    
                return updated as VideoGeneration;
            } catch (uploadError) {
                console.error('Failed to upload video to storage:', uploadError);
                // Fallback to provider URL
                const { data: updated } = await supabase
                    .from('video_generations')
                    .update({
                        status: 'completed',
                        result_url: status.resultUrl,
                        thumbnail_url: status.thumbnailUrl,
                        retry_count: 0,
                    })
                    .eq('id', jobId)
                    .select()
                    .single();
                    
                return updated as VideoGeneration;
            }
        } else if (status.status === 'failed') {
            await supabase
                .from('video_generations')
                .update({ status: 'failed' })
                .eq('id', jobId);
        }
        
        return job as VideoGeneration;
    } catch (error) {
        console.error(`Error checking video job ${jobId}:`, error);
        
        // Increment retry count
        const MAX_RETRIES = 5;
        const currentRetries = job.retry_count || 0;

        if (currentRetries < MAX_RETRIES) {
            await supabase
                .from('video_generations')
                .update({ retry_count: currentRetries + 1 })
                .eq('id', jobId);
        } else {
            await supabase
                .from('video_generations')
                .update({ status: 'failed' })
                .eq('id', jobId);
        }
        
        return job as VideoGeneration;
    }
}

// ============================================
// QUERY FUNCTIONS
// ============================================

/**
 * Get video generations for an organization
 */
export async function getVideoGenerations(orgId: string, campaignId?: string) {
    const supabase = await createClient();
    
    let query = supabase
        .from('video_generations')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

    if (campaignId) {
        query = query.eq('campaign_id', campaignId);
    }

    const { data, error } = await query.limit(50);

    if (error) return [];
    return data as VideoGeneration[];
}

/**
 * Get a single video generation by ID
 */
export async function getVideoGeneration(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('video_generations')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data as VideoGeneration;
}

/**
 * Delete a video generation
 */
export async function deleteVideoGeneration(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('video_generations')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
}

// ============================================
// EXPORTS
// ============================================

export { loadBrandData, buildPromptSpec, buildFinalPrompt };
