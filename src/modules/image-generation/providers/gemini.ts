/**
 * Google Gemini Image Generation Provider
 * Uses Imagen 3 (latest) for high-quality marketing images
 * Fallback to Gemini 2.0 Flash for multimodal generation
 */

import { ImageAspectRatio } from '../types';

// Nano Banana Pro = Gemini 3 Pro Image (highest quality)
// Nano Banana = Gemini 2.5 Flash (fast drafts)
export type GeminiImageModel = 'nano-banana-pro' | 'nano-banana' | 'imagen-3' | 'imagen-3-fast' | 'gemini-2.0-flash';

export interface GeminiGenerateOptions {
    prompt: string;
    aspectRatio?: ImageAspectRatio;
    numberOfImages?: number;
    style?: string;
    model?: GeminiImageModel;
    quality?: 'standard' | 'high';
}

export interface GeminiGenerateResult {
    images: Array<{
        base64: string;
        mimeType: string;
    }>;
    model: string;
}

// Imagen 3 aspect ratio mapping
const IMAGEN_ASPECT_RATIOS: Record<ImageAspectRatio, string> = {
    '1:1': '1:1',
    '4:5': '3:4',   // Closest supported ratio
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
    
    // Nano Banana Pro = Gemini 3 Pro Image (highest quality)
    if (model === 'nano-banana-pro') {
        return generateWithGemini3Pro(apiKey, options);
    }
    
    // Nano Banana = Gemini 2.5 Flash (fast drafts)
    if (model === 'nano-banana' || model === 'gemini-2.0-flash') {
        return generateWithGeminiFlash(apiKey, options);
    }
    
    // Legacy Imagen 3 support
    if (model === 'imagen-3' || model === 'imagen-3-fast') {
        return generateWithImagen3(apiKey, options);
    }
    
    // Default to Gemini 3 Pro
    return generateWithGemini3Pro(apiKey, options);
}

/**
 * Generate with Imagen 3 (latest, highest quality)
 * Model: imagen-3.0-generate-002 (latest version)
 */
async function generateWithImagen3(
    apiKey: string,
    options: GeminiGenerateOptions
): Promise<GeminiGenerateResult> {
    const numberOfImages = Math.min(options.numberOfImages || 1, 4);
    const aspectRatio = IMAGEN_ASPECT_RATIOS[options.aspectRatio || '1:1'];
    
    // Use the latest Imagen 3 model
    const modelVersion = options.model === 'imagen-3-fast' 
        ? 'imagen-3.0-fast-generate-001' 
        : 'imagen-3.0-generate-002';
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:predict?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            instances: [
                {
                    prompt: options.prompt,
                },
            ],
            parameters: {
                sampleCount: numberOfImages,
                aspectRatio,
                personGeneration: 'allow_adult',
                safetyFilterLevel: 'block_only_high',
                addWatermark: false,
                // High quality mode
                ...(options.quality === 'high' && {
                    mode: 'quality',
                }),
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Imagen 3 API error:', errorText);
        // Fallback to Gemini 2.0 Flash if Imagen fails
        console.log('Falling back to Gemini 2.0 Flash...');
        return generateWithGeminiFlash(apiKey, options);
    }

    const data = await response.json();
    const images: Array<{ base64: string; mimeType: string }> = [];
    
    if (data.predictions) {
        for (const prediction of data.predictions) {
            if (prediction.bytesBase64Encoded) {
                images.push({
                    base64: prediction.bytesBase64Encoded,
                    mimeType: prediction.mimeType || 'image/png',
                });
            }
        }
    }

    return { 
        images,
        model: modelVersion,
    };
}

/**
 * Generate with Gemini 3 Pro Image (Nano Banana Pro)
 * Highest quality image generation
 */
async function generateWithGemini3Pro(
    apiKey: string,
    options: GeminiGenerateOptions
): Promise<GeminiGenerateResult> {
    const aspectRatio = options.aspectRatio || '1:1';
    
    // Gemini 3 Pro with native image generation (highest quality)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-pro-image-generation:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: options.prompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                responseModalities: ['IMAGE', 'TEXT'],
                imageSizeHint: aspectRatio,
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini 3 Pro API error:', errorText);
        // Fallback to Gemini 2.5 Flash if Gemini 3 Pro fails
        console.log('Falling back to Gemini 2.5 Flash (Nano Banana)...');
        return generateWithGeminiFlash(apiKey, options);
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
        model: 'nano-banana-pro',
    };
}

/**
 * Generate with Gemini 2.5 Flash (Nano Banana)
 * Fast drafts and quick variations
 */
async function generateWithGeminiFlash(
    apiKey: string,
    options: GeminiGenerateOptions
): Promise<GeminiGenerateResult> {
    const aspectRatio = options.aspectRatio || '1:1';
    
    // Gemini 2.5 Flash with native image generation
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-image-generation:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: options.prompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                responseModalities: ['IMAGE', 'TEXT'],
                imageSizeHint: aspectRatio,
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini Flash API error:', errorText);
        throw new Error(`Gemini Flash API error: ${response.status} - ${errorText}`);
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
        model: 'nano-banana',
    };
}

/**
 * Legacy export for backwards compatibility
 */
export async function generateWithImagen(
    apiKey: string,
    options: GeminiGenerateOptions
): Promise<GeminiGenerateResult> {
    return generateWithImagen3(apiKey, options);
}
