/**
 * OpenAI Image Generation Provider
 * Uses gpt-image-1 (latest) for high-quality marketing images
 * Fallback to gpt-image-1-mini for cost-saving mode
 */

import OpenAI from 'openai';
import { ImageAspectRatio } from '../types';

// gpt-image-1 supports these sizes
type GPTImageSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto';

const ASPECT_TO_SIZE: Record<ImageAspectRatio, GPTImageSize> = {
    '1:1': '1024x1024',
    '4:5': '1024x1536',  // Portrait
    '3:2': '1536x1024',  // Landscape
    '2:3': '1024x1536',  // Portrait
    '16:9': '1536x1024', // Landscape (closest match)
    '9:16': '1024x1536', // Portrait
};

export type OpenAIImageModel = 'gpt-image-1' | 'gpt-image-1-mini' | 'dall-e-3';

export interface OpenAIGenerateOptions {
    prompt: string;
    aspectRatio?: ImageAspectRatio;
    numberOfImages?: number;
    quality?: 'low' | 'medium' | 'high' | 'auto';
    model?: OpenAIImageModel;
    // Legacy DALL-E options (for backwards compatibility)
    style?: 'vivid' | 'natural';
}

export interface OpenAIGenerateResult {
    urls: string[];
    base64Images?: string[];
    revisedPrompt?: string;
    model: string;
}

/**
 * Generate images using OpenAI's gpt-image-1 model
 * This is the latest and most capable image generation model
 */
export async function generateWithOpenAI(
    apiKey: string,
    options: OpenAIGenerateOptions
): Promise<OpenAIGenerateResult> {
    const openai = new OpenAI({ apiKey });
    const model = options.model || 'gpt-image-1';
    const numberOfImages = Math.min(options.numberOfImages || 1, 4);

    // Use gpt-image-1 for best quality
    if (model === 'gpt-image-1' || model === 'gpt-image-1-mini') {
        return generateWithGPTImage(openai, options, model, numberOfImages);
    }

    // Fallback to DALL-E 3 for legacy support
    return generateWithDallE3(openai, options, numberOfImages);
}

/**
 * Generate with gpt-image-1 (latest model)
 */
async function generateWithGPTImage(
    openai: OpenAI,
    options: OpenAIGenerateOptions,
    model: 'gpt-image-1' | 'gpt-image-1-mini',
    numberOfImages: number
): Promise<OpenAIGenerateResult> {
    const size = ASPECT_TO_SIZE[options.aspectRatio || '1:1'];
    
    // Map quality levels
    const qualityMap: Record<string, 'low' | 'medium' | 'high' | 'auto'> = {
        'standard': 'medium',
        'hd': 'high',
        'low': 'low',
        'medium': 'medium',
        'high': 'high',
        'auto': 'auto',
    };
    const quality = qualityMap[options.quality || 'high'] || 'high';

    const results: string[] = [];
    const base64Results: string[] = [];

    // gpt-image-1 can generate multiple images per request
    const response = await openai.images.generate({
        model,
        prompt: options.prompt,
        size,
        quality,
        n: numberOfImages,
        response_format: 'b64_json', // Get base64 for reliable storage
    });

    // Handle response - check if it has data property (non-streaming response)
    if ('data' in response && Array.isArray(response.data)) {
        for (const item of response.data) {
            if (item.b64_json) {
                base64Results.push(item.b64_json);
            }
            if (item.url) {
                results.push(item.url);
            }
        }
    }

    return {
        urls: results,
        base64Images: base64Results,
        model,
    };
}

/**
 * Legacy DALL-E 3 generation (for backwards compatibility)
 */
async function generateWithDallE3(
    openai: OpenAI,
    options: OpenAIGenerateOptions,
    numberOfImages: number
): Promise<OpenAIGenerateResult> {
    type DalleSize = '1024x1024' | '1792x1024' | '1024x1792';
    const DALLE_ASPECT_TO_SIZE: Record<ImageAspectRatio, DalleSize> = {
        '1:1': '1024x1024',
        '4:5': '1024x1792',
        '3:2': '1792x1024',
        '2:3': '1024x1792',
        '16:9': '1792x1024',
        '9:16': '1024x1792',
    };

    const size = DALLE_ASPECT_TO_SIZE[options.aspectRatio || '1:1'];
    const results: string[] = [];
    let revisedPrompt: string | undefined;

    // DALL-E 3 only generates one image at a time
    for (let i = 0; i < numberOfImages; i++) {
        const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt: options.prompt,
            size,
            quality: options.quality === 'high' ? 'hd' : 'standard',
            style: options.style || 'vivid',
            n: 1,
        });

        if (response.data?.[0]?.url) {
            results.push(response.data[0].url);
            if (!revisedPrompt && response.data[0].revised_prompt) {
                revisedPrompt = response.data[0].revised_prompt;
            }
        }
    }

    return {
        urls: results,
        revisedPrompt,
        model: 'dall-e-3',
    };
}
