/**
 * Prompt Builder
 * Builds brand-aware prompts for image generation
 */

import {
    BrandMemory,
    ConfirmedCopy,
    Direction,
    DirectionConfig,
    AspectRatio,
    DIRECTION_CONFIGS,
    PromptContext,
} from '../types';

/**
 * Build the main image generation prompt
 */
export function buildImagePrompt(context: PromptContext): string {
    const {
        brand_memory,
        copy,
        direction,
        direction_config,
        aspect_ratio,
        style_direction,
    } = context;

    const parts: string[] = [];

    // 1. Core instruction
    parts.push(`Create a professional advertising image for "${brand_memory.brand_name || 'the brand'}".`);

    // 2. Direction style
    parts.push(`Style direction: ${direction_config.name} - ${direction_config.description}.`);

    // 3. Headline (must be on image)
    parts.push(`The image MUST include this headline text clearly visible and readable: "${copy.headline}".`);

    // 4. CTA if appropriate
    if (copy.cta_text && copy.cta_text.length < 20) {
        parts.push(`Include a subtle call-to-action button or text: "${copy.cta_text}".`);
    }

    // 5. Aspect ratio guidance
    const ratioGuidance = getAspectRatioGuidance(aspect_ratio);
    parts.push(ratioGuidance);

    // 6. Brand colors
    if (brand_memory.primary_colors?.length > 0) {
        const colors = brand_memory.primary_colors.map(c => c.hex).join(', ');
        parts.push(`Use these brand colors prominently: ${colors}.`);
    }

    // 7. Style tokens
    if (brand_memory.style_tokens?.vibe) {
        parts.push(`Visual vibe: ${brand_memory.style_tokens.vibe}.`);
    }
    if (brand_memory.style_tokens?.mood) {
        parts.push(`Mood: ${brand_memory.style_tokens.mood}.`);
    }

    // 8. Layout style
    parts.push(`Layout style: ${brand_memory.layout_style || 'modern'}.`);

    // 9. Logo placement hint
    if (brand_memory.logo_url) {
        parts.push(`Leave space for logo placement at ${brand_memory.logo_placement || 'bottom-right'}.`);
    }

    // 10. Style direction override if provided
    if (style_direction) {
        parts.push(`Additional style emphasis: ${style_direction}.`);
    }

    // 11. Quality and compliance rules
    parts.push(getQualityRules());

    // 12. Don'ts from brand memory
    if (brand_memory.dont_list?.length > 0) {
        parts.push(`AVOID: ${brand_memory.dont_list.slice(0, 5).join(', ')}.`);
    }

    return parts.join(' ');
}

/**
 * Get aspect ratio specific guidance
 */
function getAspectRatioGuidance(ratio: AspectRatio): string {
    switch (ratio) {
        case '1:1':
            return 'Square format (1:1) - ideal for Instagram feed. Center the main subject, ensure balanced composition.';
        case '4:5':
            return 'Portrait format (4:5) - ideal for Instagram/Facebook feed. Vertical emphasis, good for product focus.';
        case '9:16':
            return 'Story/Reels format (9:16) - full vertical. Design for mobile viewing, text in upper third for thumb-scroll visibility.';
        default:
            return 'Standard square format.';
    }
}

/**
 * Quality rules that must be included in every prompt
 */
function getQualityRules(): string {
    return `
QUALITY REQUIREMENTS:
- Text must be large, clear, and readable on mobile
- Clean composition without clutter
- Professional advertising quality
- No distorted faces or hands
- No warped or stretched elements
- No tiny unreadable text
- Maximum 2 font styles
- High contrast between text and background
- Text-safe areas respected
- Modern, polished aesthetic
`.trim();
}

/**
 * Build negative prompt (things to avoid)
 */
export function buildNegativePrompt(brand_memory: BrandMemory): string {
    const negatives: string[] = [
        'blurry',
        'low quality',
        'distorted',
        'warped text',
        'unreadable text',
        'cluttered',
        'too many elements',
        'cheap looking',
        'oversaturated',
        'multiple fonts',
        'tiny text',
        'distorted faces',
        'distorted hands',
        'stretched logo',
        'pixelated',
        'amateur',
        'stock photo watermark',
    ];

    // Add brand-specific don'ts
    if (brand_memory.dont_list?.length > 0) {
        negatives.push(...brand_memory.dont_list);
    }

    // Add fatigued styles
    if (brand_memory.fatigued_styles?.length > 0) {
        negatives.push(...brand_memory.fatigued_styles);
    }

    return negatives.join(', ');
}

/**
 * Build all 9 prompts for a creative pack
 */
export function buildPackPrompts(
    brand_memory: BrandMemory,
    copy: ConfirmedCopy,
    style_direction?: string
): Array<{
    direction: Direction;
    aspect_ratio: AspectRatio;
    prompt: string;
    negative_prompt: string;
}> {
    const prompts: Array<{
        direction: Direction;
        aspect_ratio: AspectRatio;
        prompt: string;
        negative_prompt: string;
    }> = [];

    const directions: Direction[] = ['A', 'B', 'C'];
    const ratios: AspectRatio[] = ['1:1', '4:5', '9:16'];

    for (const direction of directions) {
        for (const ratio of ratios) {
            const context: PromptContext = {
                brand_memory,
                copy,
                direction,
                direction_config: DIRECTION_CONFIGS[direction],
                aspect_ratio: ratio,
                style_direction,
            };

            prompts.push({
                direction,
                aspect_ratio: ratio,
                prompt: buildImagePrompt(context),
                negative_prompt: buildNegativePrompt(brand_memory),
            });
        }
    }

    return prompts;
}

/**
 * Build prompt for regenerating a single direction
 */
export function buildDirectionPrompts(
    brand_memory: BrandMemory,
    copy: ConfirmedCopy,
    direction: Direction,
    style_direction?: string
): Array<{
    direction: Direction;
    aspect_ratio: AspectRatio;
    prompt: string;
    negative_prompt: string;
}> {
    const ratios: AspectRatio[] = ['1:1', '4:5', '9:16'];
    
    return ratios.map(ratio => {
        const context: PromptContext = {
            brand_memory,
            copy,
            direction,
            direction_config: DIRECTION_CONFIGS[direction],
            aspect_ratio: ratio,
            style_direction,
        };

        return {
            direction,
            aspect_ratio: ratio,
            prompt: buildImagePrompt(context),
            negative_prompt: buildNegativePrompt(brand_memory),
        };
    });
}
