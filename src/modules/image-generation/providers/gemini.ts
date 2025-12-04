/**
 * Google Gemini Imagen Image Generation Provider
 * Uses Imagen 3 via Vertex AI / Gemini API
 */

import { ImageAspectRatio } from '../types';

export interface GeminiGenerateOptions {
    prompt: string;
    aspectRatio?: ImageAspectRatio;
    numberOfImages?: number;
    style?: string;
}

export interface GeminiGenerateResult {
    images: Array<{
        base64: string;
        mimeType: string;
    }>;
}

/**
 * Generate images using Google Gemini Imagen API
 * Note: Gemini's image generation uses the generativelanguage API
 */
export async function generateWithGemini(
    apiKey: string,
    options: GeminiGenerateOptions
): Promise<GeminiGenerateResult> {
    const numberOfImages = Math.min(options.numberOfImages || 1, 4);
    
    // Gemini uses different aspect ratio format
    const aspectRatioMap: Record<ImageAspectRatio, string> = {
        '1:1': '1:1',
        '3:2': '3:2',
        '2:3': '2:3',
        '16:9': '16:9',
        '9:16': '9:16',
    };

    // Use Gemini 2.0 Flash with image generation capabilities
    // or Imagen 3 through the generativelanguage API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

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
                            text: `Generate a high-quality advertising image with the following description: ${options.prompt}. 
                            Style: ${options.style || 'professional advertising photography'}.
                            Aspect ratio: ${aspectRatioMap[options.aspectRatio || '1:1']}.
                            Make it visually stunning, suitable for digital advertising.`,
                        },
                    ],
                },
            ],
            generationConfig: {
                responseModalities: ['TEXT', 'IMAGE'],
                responseMimeType: 'text/plain',
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Parse response for images
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

    return { images };
}

/**
 * Alternative: Use Imagen 3 directly for better image quality
 * This requires the Vertex AI endpoint or the specific Imagen API
 */
export async function generateWithImagen(
    apiKey: string,
    options: GeminiGenerateOptions
): Promise<GeminiGenerateResult> {
    const numberOfImages = Math.min(options.numberOfImages || 1, 4);
    
    // Imagen 3 endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

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
                aspectRatio: options.aspectRatio || '1:1',
                personGeneration: 'allow_adult',
                safetyFilterLevel: 'block_some',
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Imagen API error:', errorText);
        // Fallback to Gemini 2.0 if Imagen fails
        return generateWithGemini(apiKey, options);
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

    return { images };
}
