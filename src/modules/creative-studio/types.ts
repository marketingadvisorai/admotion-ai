/**
 * Creative Studio Types
 * Brand-aware image ads generation system
 */

// ============================================
// BRAND MEMORY TYPES
// ============================================

export interface BrandColor {
    hex: string;
    name: string;
    usage?: 'primary' | 'secondary' | 'accent' | 'background';
}

export interface BrandFonts {
    heading?: string;
    body?: string;
    accent?: string;
}

export interface StyleTokens {
    vibe?: string;  // professional, playful, bold, elegant
    mood?: string;  // energetic, calm, luxurious, friendly
    aesthetic?: string;  // minimal, maximalist, modern, vintage
}

export interface VoiceRules {
    tone?: string;
    personality?: string;
    style?: string;
}

export interface BrandMemory {
    id: string;
    org_id: string;
    version: number;
    is_active: boolean;
    
    // Core Identity
    brand_name?: string;
    tagline?: string;
    logo_url?: string;
    
    // Visual Identity
    primary_colors: BrandColor[];
    secondary_colors: BrandColor[];
    fonts: BrandFonts;
    style_tokens: StyleTokens;
    
    // Layout
    layout_style: 'modern' | 'minimal' | 'bold' | 'ugc' | 'premium';
    logo_placement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    text_safe_zones: Record<string, unknown>;
    
    // Messaging Rules
    voice_rules: VoiceRules;
    do_list: string[];
    dont_list: string[];
    compliance_rules: string[];
    
    // Performance
    performance_data: Record<string, unknown>;
    fatigued_styles: string[];
    
    created_at: string;
    updated_at: string;
    created_by?: string;
}

export type BrandMemoryInput = Omit<BrandMemory, 'id' | 'version' | 'created_at' | 'updated_at'>;

// ============================================
// CREATIVE BRIEF TYPES
// ============================================

export type BriefStatus = 'intake' | 'copy_pending' | 'copy_confirmed' | 'generating' | 'completed' | 'failed';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}

export interface ConfirmedCopy {
    headline: string;
    primary_text: string;
    cta_text: string;
}

export interface CreativeBrief {
    id: string;
    org_id: string;
    brand_memory_id?: string;
    campaign_id?: string;
    
    // Brief Info
    name: string;
    objective?: 'awareness' | 'conversion' | 'engagement';
    target_audience?: string;
    product_service?: string;
    key_message?: string;
    
    // Chat
    chat_history: ChatMessage[];
    
    // Confirmed Copy (HARD GATE)
    headline?: string;
    primary_text?: string;
    cta_text?: string;
    copy_confirmed: boolean;
    copy_confirmed_at?: string;
    
    // Style
    style_direction?: 'premium' | 'playful' | 'cinematic' | 'ugc' | 'modern';
    reference_images: string[];
    
    // Status
    status: BriefStatus;
    
    created_at: string;
    updated_at: string;
    created_by?: string;
}

export interface CreateBriefInput {
    org_id: string;
    name: string;
    brand_memory_id?: string;
    campaign_id?: string;
    objective?: 'awareness' | 'conversion' | 'engagement';
    target_audience?: string;
    product_service?: string;
}

// ============================================
// CREATIVE PACK TYPES
// ============================================

export type PackStatus = 'pending' | 'generating' | 'completed' | 'failed';
export type Direction = 'A' | 'B' | 'C';
export type AspectRatio = '1:1' | '4:5' | '9:16';
export type ComplianceRisk = 'low' | 'medium' | 'high';
export type AssetStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'flagged';

export interface DirectionConfig {
    name: string;
    description: string;
    style_modifiers: string[];
}

export const DIRECTION_CONFIGS: Record<Direction, DirectionConfig> = {
    A: {
        name: 'Bold & Modern',
        description: 'High contrast, dynamic composition, strong visual impact',
        style_modifiers: ['bold', 'high-contrast', 'dynamic', 'modern'],
    },
    B: {
        name: 'Soft & Elegant',
        description: 'Subtle gradients, refined typography, premium feel',
        style_modifiers: ['soft', 'elegant', 'premium', 'refined'],
    },
    C: {
        name: 'Fresh & Authentic',
        description: 'Natural lighting, relatable imagery, UGC-inspired',
        style_modifiers: ['fresh', 'authentic', 'natural', 'relatable'],
    },
};

export const ASPECT_RATIOS: AspectRatio[] = ['1:1', '4:5', '9:16'];

export interface QualityScores {
    brand_alignment: number;  // 0-10
    readability: number;  // 0-10
    platform_fit: number;  // 0-10
    compliance_risk: ComplianceRisk;
}

export interface CreativePack {
    id: string;
    org_id: string;
    brief_id: string;
    brand_memory_version: number;
    
    name?: string;
    status: PackStatus;
    
    model_used: 'openai' | 'gemini';
    generation_config: Record<string, unknown>;
    
    // Aggregate Scores
    avg_brand_alignment?: number;
    avg_readability?: number;
    avg_platform_fit?: number;
    compliance_status: 'pending' | 'passed' | 'flagged';
    
    created_at: string;
    updated_at: string;
    
    // Joined data
    assets?: CreativeAsset[];
}

export interface CreativeAsset {
    id: string;
    org_id: string;
    pack_id: string;
    brief_id: string;
    
    direction: Direction;
    direction_name?: string;
    aspect_ratio: AspectRatio;
    
    prompt_used?: string;
    seed?: string;
    model_used: 'openai' | 'gemini';
    
    headline_text?: string;
    cta_text?: string;
    
    result_url?: string;
    thumbnail_url?: string;
    
    // Quality Scores
    brand_alignment_score?: number;
    readability_score?: number;
    platform_fit_score?: number;
    compliance_risk: ComplianceRisk;
    quality_issues: string[];
    
    status: AssetStatus;
    generation_attempts: number;
    
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

// ============================================
// GENERATION TYPES
// ============================================

export interface GeneratePackInput {
    brief_id: string;
    org_id: string;
    model?: 'openai' | 'gemini';
    directions_to_generate?: Direction[];  // For regenerating specific directions
}

export interface GenerateAssetInput {
    pack_id: string;
    brief_id: string;
    org_id: string;
    direction: Direction;
    aspect_ratio: AspectRatio;
    brand_memory: BrandMemory;
    confirmed_copy: ConfirmedCopy;
    model: 'openai' | 'gemini';
}

export interface GenerationResult {
    success: boolean;
    pack?: CreativePack;
    assets?: CreativeAsset[];
    error?: string;
}

// ============================================
// PROMPT BUILDING TYPES
// ============================================

export interface PromptContext {
    brand_memory: BrandMemory;
    copy: ConfirmedCopy;
    direction: Direction;
    direction_config: DirectionConfig;
    aspect_ratio: AspectRatio;
    style_direction?: string;
}
