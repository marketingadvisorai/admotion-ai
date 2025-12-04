/**
 * Image Generation Module Types
 */

export type ImageProvider = 'openai' | 'gemini';

export type ImageAspectRatio = '1:1' | '4:5' | '3:2' | '2:3' | '16:9' | '9:16';

export type ImageStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImageGenerationInput {
    orgId: string;
    campaignId?: string;
    prompt: string;
    provider?: ImageProvider;
    aspectRatio?: ImageAspectRatio;
    style?: string;
    numberOfImages?: number;
    brandContext?: BrandContext;
}

export interface BrandContext {
    businessName?: string;
    colors?: string[];
    brandVoice?: string;
    targetAudience?: string;
}

export interface ImageGeneration {
    id: string;
    org_id: string;
    campaign_id?: string;
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
    error?: string;
}

// OpenAI DALL-E specific
export type DalleSizeMap = {
    '1:1': '1024x1024';
    '3:2': '1792x1024';
    '2:3': '1024x1792';
    '16:9': '1792x1024';
    '9:16': '1024x1792';
};

// Gemini Imagen specific
export interface GeminiImageResponse {
    predictions?: Array<{
        bytesBase64Encoded: string;
        mimeType: string;
    }>;
}
