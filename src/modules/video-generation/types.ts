/**
 * Video Generation Module Types
 * Comprehensive brand-aware video ad generation system
 * Supports Sora (OpenAI) and Veo 3.1 (Google) models
 */

// ============================================
// PROVIDER & MODEL TYPES
// ============================================

export type VideoProvider = 'openai' | 'google';

// OpenAI Sora models
export type SoraModel = 'sora-2-pro' | 'sora-2';

// Google Veo models
export type VeoModel = 'veo-3.1' | 'veo-2';

export type VideoModel = SoraModel | VeoModel;

export type VideoAspectRatio = '16:9' | '9:16' | '1:1';
export type VideoQuality = 'standard' | 'high' | 'ultra';
export type VideoStatus = 'queued' | 'processing' | 'completed' | 'failed';

// Duration in seconds (8-12 seconds for short ads)
export type VideoDuration = 6 | 8 | 10 | 12 | 15;

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
    imagery?: 'cinematic' | 'minimalist' | 'energetic' | 'bold' | 'luxurious' | 'playful' | 'dark' | 'neon' | 'futuristic';
    mood?: string;
    aesthetic?: string;
}

export interface BrandMemoryRules {
    doList: string[];
    dontList: string[];
    forbiddenElements: string[];
    complianceRules: string[];
    fatiguedStyles: string[];
    previousSuccessfulCreatives?: string[];
}

export interface VideoBrandContext {
    // Core identity
    businessName?: string;
    tagline?: string;
    logoUrl?: string;
    
    // Visual identity
    colors?: BrandColors | string[];
    fonts?: BrandFonts;
    visualStyle?: BrandVisualStyle;
    
    // Messaging
    brandVoice?: string;
    targetAudience?: string;
    tone?: 'exciting' | 'mysterious' | 'energetic' | 'luxurious' | 'playful' | 'professional' | 'warm';
    
    // Memory rules
    memoryRules?: BrandMemoryRules;
    
    // Layout preferences
    logoPlacement?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    safeZone?: string;
    textSafeZones?: {
        default: string;
        headline: string;
        cta: string;
    };
}

// ============================================
// VIDEO AD COPY TYPES
// ============================================

export interface VideoAdCopy {
    headline: string;
    subheadline?: string;
    ctaText: string;
    scriptStyle?: string;
}

// ============================================
// AUDIO TYPES
// ============================================

export interface AudioConfig {
    enabled: boolean;
    style?: 'upbeat' | 'cinematic' | 'electronic' | 'ambient' | 'dramatic' | 'cheerful';
    instructions?: string;
    includeVoiceover?: boolean;
    voiceoverScript?: string;
}

// ============================================
// SCENE TYPES
// ============================================

export interface SceneDescription {
    description: string;
    visualTheme?: string;
    mandatoryElements?: string[];
    forbiddenElements?: string[];
    cameraStyle?: 'smooth' | 'dynamic' | 'static' | 'handheld' | 'cinematic';
    transitions?: 'clean' | 'modern' | 'fade' | 'cut' | 'dissolve';
}

// ============================================
// INPUT TYPES
// ============================================

export interface VideoGenerationInput {
    orgId: string;
    campaignId?: string;
    brandKitId?: string;
    
    // Prompt (can be raw or structured)
    prompt?: string;
    
    // Structured ad inputs (preferred)
    adCopy?: VideoAdCopy;
    sceneDescription?: SceneDescription;
    visualTheme?: string;
    
    // Provider & model
    provider?: VideoProvider;
    model?: VideoModel;
    
    // Video settings
    aspectRatio?: VideoAspectRatio;
    duration?: VideoDuration;
    quality?: VideoQuality;
    
    // Audio settings
    audio?: AudioConfig;
    
    // Brand context (loaded from Brand Kit + Analyzer + Memory)
    brandContext?: VideoBrandContext;
    
    // Safe zones for text overlays
    safeZones?: {
        headline?: string;
        cta?: string;
        logo?: string;
    };
    
    // Legacy support
    style?: string;
}

// ============================================
// OUTPUT TYPES
// ============================================

export interface VideoGeneration {
    id: string;
    org_id: string;
    campaign_id?: string;
    brand_kit_id?: string;
    provider: VideoProvider;
    model: string;
    prompt_used: string;
    style?: string;
    aspect_ratio: VideoAspectRatio;
    duration: number;
    result_url?: string;
    thumbnail_url?: string;
    status: VideoStatus;
    external_job_id?: string;
    retry_count: number;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface GenerateVideoResult {
    success: boolean;
    video?: VideoGeneration;
    jobId?: string;
    promptUsed?: string;
    promptVariations?: string[];
    brandConsistencyScore?: number;
    error?: string;
}

// ============================================
// PROMPT SPEC (for structured prompting)
// ============================================

export interface VideoPromptSpec {
    copy: {
        headline: string;
        subheadline?: string;
        cta_text: string;
    };
    visual_direction: string;
    aspect: VideoAspectRatio;
    duration: VideoDuration;
    brand: {
        name?: string;
        colors: BrandColors | string[];
        fonts?: BrandFonts;
        voice?: string;
        target_audience?: string;
        visual_style?: string;
        mood?: string;
    };
    scene: {
        description: string;
        mandatory_elements?: string[];
        forbidden_elements?: string[];
        camera_style: string;
        transitions: string;
    };
    layout: {
        logo: string;
        logo_placement?: string;
        hierarchy: string;
        text_rules: string;
        safe_zones: string;
    };
    audio: {
        enabled: boolean;
        style?: string;
        instructions?: string;
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
// PROVIDER INTERFACE
// ============================================

export interface VideoGenerationProviderConfig {
    id: string;
    name: string;
    models: VideoModel[];
    defaultModel: VideoModel;
    maxDuration: number;
    supportedAspectRatios: VideoAspectRatio[];
    supportsAudio: boolean;
}

export interface VideoGenerationProviderInterface {
    id: string;
    name: string;
    config: VideoGenerationProviderConfig;
    generateVideo(options: VideoGenerationInput, apiKey: string): Promise<string>; // Returns external Job ID
    checkStatus(jobId: string, apiKey: string): Promise<VideoGenerationStatus>;
}

export interface VideoGenerationStatus {
    status: VideoStatus;
    progress?: number; // 0-100
    resultUrl?: string;
    thumbnailUrl?: string;
    error?: string;
}

// ============================================
// CHAT SESSION TYPES (for video workflow)
// ============================================

export interface VideoChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface VideoOverlayElement {
    type: 'headline' | 'subheadline' | 'cta' | 'logo' | 'badge' | 'timer';
    text?: string;
    position?: string;
    timing?: string; // e.g., "final 2 seconds"
    style?: string;
}

export interface ProposedVideoCopy {
    headline: string;
    subheadline?: string;
    ctaText: string;
    sceneDescription: string;
    visualTheme: string;
    audioStyle?: string;
    overlayElements: VideoOverlayElement[];
    duration: VideoDuration;
    confirmed: boolean;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface SoraApiRequest {
    model: SoraModel;
    prompt: string;
    duration: number;
    aspect_ratio: VideoAspectRatio;
    audio: boolean;
}

export interface VeoApiRequest {
    model: VeoModel;
    prompt: string;
    aspect_ratio: VideoAspectRatio;
    duration_seconds: number;
    audio: boolean;
}

export interface VideoApiResponse {
    jobId: string;
    status: VideoStatus;
    estimatedTime?: number;
}
