/**
 * Google Gemini Image Generation Provider
 * 
 * Models (per Google AI docs):
 * - gemini-3-pro-image-preview (Nano Banana Pro) - Professional quality, 4K, Thinking process
 * - gemini-2.5-flash-image (Nano Banana) - Fast generation, 1024px
 * 
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */

import { ImageAspectRatio } from '../types';

// Model aliases matching Google's naming
export type GeminiImageModel = 
    | 'nano-banana-pro'      // Maps to gemini-3-pro-image-preview
    | 'nano-banana'          // Maps to gemini-2.5-flash-image
    | 'gemini-3-pro-image-preview'
    | 'gemini-2.5-flash-image'
    | 'imagen-3'             // Legacy
    | 'imagen-3-fast';       // Legacy

export interface GeminiGenerateOptions {
    prompt: string;
    aspectRatio?: ImageAspectRatio;
    numberOfImages?: number;
    style?: string;
    model?: GeminiImageModel;
    quality?: 'standard' | 'high';
    imageSize?: '1K' | '2K' | '4K';  // Only for gemini-3-pro-image-preview
}

export interface GeminiGenerateResult {
    images: Array<{
        base64: string;
        mimeType: string;
    }>;
    model: string;
}

// Gemini supported aspect ratios
const GEMINI_ASPECT_RATIOS: Record<ImageAspectRatio, string> = {
    '1:1': '1:1',
    '4:5': '4:5',
    '3:2': '3:2',
    '2:3': '2:3',
    '16:9': '16:9',
    '9:16': '9:16',
};

/**
 * Main entry point - routes to appropriate model
 */
export async function generateWithGemini(
    apiKey: string,
    options: GeminiGenerateOptions
): Promise<GeminiGenerateResult> {
    const model = options.model || 'nano-banana-pro';
    
    // Nano Banana Pro = Gemini 3 Pro Image Preview (highest quality, 4K)
    if (model === 'nano-banana-pro' || model === 'gemini-3-pro-image-preview') {
        return generateWithGemini3ProImage(apiKey, options);
    }
    
    // Nano Banana = Gemini 2.5 Flash Image (fast drafts, 1024px)
    if (model === 'nano-banana' || model === 'gemini-2.5-flash-image') {
        return generateWithGemini25FlashImage(apiKey, options);
    }
    
    // Legacy Imagen 3 support (fallback to Gemini 2.5 Flash)
    if (model === 'imagen-3' || model === 'imagen-3-fast') {
        return generateWithGemini25FlashImage(apiKey, options);
    }
    
    // Default to Gemini 3 Pro Image
    return generateWithGemini3ProImage(apiKey, options);
}

/**
 * Generate with Gemini 3 Pro Image Preview (Nano Banana Pro)
 * Highest quality - supports 4K resolution, Thinking process, Google Search grounding
 * Model: gemini-3-pro-image-preview
 */
async function generateWithGemini3ProImage(
    apiKey: string,
    options: GeminiGenerateOptions
): Promise<GeminiGenerateResult> {
    const aspectRatio = GEMINI_ASPECT_RATIOS[options.aspectRatio || '1:1'];
    
    // gemini-3-pro-image-preview - Professional quality with 4K support
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: options.prompt }],
                },
            ],
            generationConfig: {
                responseModalities: ['IMAGE'],
                // Image configuration for aspect ratio and size
                imageConfig: {
                    aspectRatio,
                    ...(options.imageSize && { imageSize: options.imageSize }),
                },
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini 3 Pro Image API error:', errorText);
        // Fallback to Gemini 2.5 Flash Image
        console.log('Falling back to Gemini 2.5 Flash Image (Nano Banana)...');
        return generateWithGemini25FlashImage(apiKey, options);
    }

    const data = await response.json();
    const images: Array<{ base64: string; mimeType: string }> = [];
    
    if (data.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
            if (part.inlineData?.data) {
                images.push({
                    base64: part.inlineData.data,
                    mimeType: part.inlineData.mimeType || 'image/png',
                });
            }
        }
    }

    return { 
        images,
        model: 'gemini-3-pro-image-preview',
    };
}

/**
 * Generate with Gemini 2.5 Flash Image (Nano Banana)
 * Fast generation - optimized for speed, 1024px resolution
 * Model: gemini-2.5-flash-image
 */
async function generateWithGemini25FlashImage(
    apiKey: string,
    options: GeminiGenerateOptions
): Promise<GeminiGenerateResult> {
    const aspectRatio = GEMINI_ASPECT_RATIOS[options.aspectRatio || '1:1'];
    
    // gemini-2.5-flash-image - Fast generation
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: options.prompt }],
                },
            ],
            generationConfig: {
                responseModalities: ['IMAGE'],
                imageConfig: {
                    aspectRatio,
                },
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini 2.5 Flash Image API error:', errorText);
        throw new Error(`Gemini image generation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const images: Array<{ base64: string; mimeType: string }> = [];
    
    if (data.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
            if (part.inlineData?.data) {
                images.push({
                    base64: part.inlineData.data,
                    mimeType: part.inlineData.mimeType || 'image/png',
                });
            }
        }
    }

    return { 
        images,
        model: 'gemini-2.5-flash-image',
    };
}

/**
 * Legacy export for backwards compatibility
 */
export async function generateWithImagen(
    apiKey: string,
    options: GeminiGenerateOptions
): Promise<GeminiGenerateResult> {
    return generateWithGemini25FlashImage(apiKey, options);
}
