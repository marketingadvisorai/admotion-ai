/**
 * OpenAI Image Generation Provider
 * Uses DALL-E 3 for high-quality marketing images
 * Supports DALL-E 2 for cost-saving with base64 support
 */

import OpenAI from 'openai';
import { ImageAspectRatio } from '../types';

// DALL-E 3 supported sizes
type DallE3Size = '1024x1024' | '1792x1024' | '1024x1792';
// DALL-E 2 supported sizes
type DallE2Size = '256x256' | '512x512' | '1024x1024';

const DALLE3_ASPECT_TO_SIZE: Record<ImageAspectRatio, DallE3Size> = {
    '1:1': '1024x1024',
    '4:5': '1024x1792',   // Portrait
    '3:2': '1792x1024',   // Landscape
    '2:3': '1024x1792',   // Portrait
    '16:9': '1792x1024',  // Landscape
    '9:16': '1024x1792',  // Portrait
};

export type OpenAIImageModel = 'dall-e-3' | 'dall-e-2' | 'gpt-image-1' | 'gpt-image-1-mini';

export interface OpenAIGenerateOptions {
    prompt: string;
    aspectRatio?: ImageAspectRatio;
    numberOfImages?: number;
    quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high' | 'auto';
    model?: OpenAIImageModel;
    style?: 'vivid' | 'natural';
}

export interface OpenAIGenerateResult {
    urls: string[];
    base64Images?: string[];
    revisedPrompt?: string;
    model: string;
}

/**
 * Generate images using OpenAI's image models
 * DALL-E 3: Best quality, single image per request
 * DALL-E 2: Supports base64 output, multiple images
 */
export async function generateWithOpenAI(
    apiKey: string,
    options: OpenAIGenerateOptions
): Promise<OpenAIGenerateResult> {
    const openai = new OpenAI({ apiKey });
    // Map legacy model names to actual OpenAI models
    let model = options.model || 'dall-e-3';
    if (model === 'gpt-image-1' || model === 'gpt-image-1-mini') {
        model = 'dall-e-3'; // Use DALL-E 3 as the actual model
    }
    const numberOfImages = Math.min(options.numberOfImages || 1, model === 'dall-e-3' ? 1 : 4);

    if (model === 'dall-e-2') {
        return generateWithDallE2(openai, options, numberOfImages);
    }

    // Default to DALL-E 3 for best quality
    return generateWithDallE3(openai, options, numberOfImages);
}

/**
 * Generate with DALL-E 2 (supports base64 output)
 */
async function generateWithDallE2(
    openai: OpenAI,
    options: OpenAIGenerateOptions,
    numberOfImages: number
): Promise<OpenAIGenerateResult> {
    const results: string[] = [];
    const base64Results: string[] = [];

    const response = await openai.images.generate({
        model: 'dall-e-2',
        prompt: options.prompt,
        size: '1024x1024',
        n: numberOfImages,
        response_format: 'b64_json',
    });

    if (response.data) {
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
        model: 'dall-e-2',
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

    // Map quality options to DALL-E 3 quality (only 'standard' or 'hd')
    const qualityValue = ['high', 'hd'].includes(options.quality || '') ? 'hd' : 'standard';

    // DALL-E 3 only generates one image at a time
    for (let i = 0; i < numberOfImages; i++) {
        const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt: options.prompt,
            size,
            quality: qualityValue,
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
