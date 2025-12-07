/**
 * Image Generation Module Types
 * Comprehensive brand-aware image generation system
 */

// ============================================
// PROVIDER & MODEL TYPES
// ============================================

export type ImageProvider = 'openai' | 'gemini';

export type OpenAIImageModel = 'gpt-image-1' | 'gpt-image-1-mini' | 'dall-e-3';
export type GeminiImageModel = 'imagen-3' | 'imagen-3-fast' | 'gemini-2.0-flash';
export type ImageModel = OpenAIImageModel | GeminiImageModel;

export type ImageAspectRatio = '1:1' | '4:5' | '3:2' | '2:3' | '16:9' | '9:16';
export type ImageQuality = 'low' | 'medium' | 'high' | 'auto';
export type ImageStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================
// BRAND DATA TYPES (for prompt construction)
// ============================================

export interface BrandColors {
    primary: string[];
    secondary: string[];
    accent?: string[];
}

export interface BrandFonts {
    heading?: string;
    body?: string;
    style?: 'all-caps' | 'mixed-case' | 'sentence-case';
}

export interface BrandVisualStyle {
    imagery?: 'cinematic' | 'flat' | 'neon' | 'gritty' | 'playful' | 'premium' | 'dark' | 'clean' | 'modern';
    mood?: string;
    aesthetic?: string;
}

export interface BrandMemoryRules {
    doList: string[];
    dontList: string[];
    forbiddenElements: string[];
    complianceRules: string[];
    fatiguedStyles: string[];
}

export interface BrandContext {
    // Core identity
    businessName?: string;
    tagline?: string;
    logoUrl?: string;
    
    // Visual identity
    colors?: BrandColors | string[];  // Support both formats
    fonts?: BrandFonts;
    visualStyle?: BrandVisualStyle;
    
    // Messaging
    brandVoice?: string;
    targetAudience?: string;
    tone?: string;
    
    // Memory rules
    memoryRules?: BrandMemoryRules;
    
    // Layout preferences
    logoPlacement?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    safeZone?: string;
}

// ============================================
// AD COPY TYPES
// ============================================

export interface AdCopy {
    headline: string;
    subheadline?: string;
    primaryText?: string;
    ctaText: string;
}

// ============================================
// INPUT TYPES
// ============================================

export interface ImageGenerationInput {
    orgId: string;
    campaignId?: string;
    brandKitId?: string;
    
    // Prompt (can be raw or structured)
    prompt?: string;
    
    // Structured ad inputs (preferred)
    adCopy?: AdCopy;
    imageTheme?: string;
    styleMode?: string;
    objectFocus?: string;
    sceneDetails?: string;
    
    // Provider & model
    provider?: ImageProvider;
    model?: ImageModel;
    
    // Image settings
    aspectRatio?: ImageAspectRatio;
    quality?: ImageQuality;
    numberOfImages?: number;
    
    // Brand context (loaded from Brand Kit + Analyzer + Memory)
    brandContext?: BrandContext;
    
    // Legacy support
    style?: string;
}

// ============================================
// OUTPUT TYPES
// ============================================

export interface ImageGeneration {
    id: string;
    org_id: string;
    campaign_id?: string;
    brand_kit_id?: string;
    provider: ImageProvider;
    model: string;
    prompt_used: string;
    style?: string;
    aspect_ratio: ImageAspectRatio;
    result_url?: string;
    thumbnail_url?: string;
    status: ImageStatus;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface GenerateImageResult {
    success: boolean;
    images?: ImageGeneration[];
    promptUsed?: string;
    promptVariations?: string[];
    brandConsistencyScore?: number;
    error?: string;
}

// ============================================
// PROMPT SPEC (for structured prompting)
// ============================================

export interface ImagePromptSpec {
    copy: {
        headline: string;
        subheadline?: string;
        primary_text?: string;
        cta_text: string;
    };
    visual_direction: string;
    aspect: ImageAspectRatio;
    brand: {
        colors: BrandColors | string[];
        fonts?: BrandFonts;
        voice?: string;
        target_audience?: string;
        visual_style?: string;
    };
    layout: {
        logo: string;
        logo_placement?: string;
        hierarchy: string;
        text_rules: string;
        background: string;
        safe_zone?: string;
    };
    accessibility: {
        contrast: string;
        legibility: string;
    };
    restrictions?: {
        forbidden_elements: string[];
        compliance_rules: string[];
    };
}

// ============================================
// LEGACY TYPES (for backwards compatibility)
// ============================================

export type DalleSizeMap = {
    '1:1': '1024x1024';
    '3:2': '1792x1024';
    '2:3': '1024x1792';
    '16:9': '1792x1024';
    '9:16': '1024x1792';
};

export interface GeminiImageResponse {
    predictions?: Array<{
        bytesBase64Encoded: string;
        mimeType: string;
    }>;
}
