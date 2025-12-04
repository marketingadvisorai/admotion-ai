/**
 * OpenAI DALL-E Image Generation Provider
 */

import OpenAI from 'openai';
import { ImageAspectRatio } from '../types';

type DalleSize = '1024x1024' | '1792x1024' | '1024x1792';

const ASPECT_TO_SIZE: Record<ImageAspectRatio, DalleSize> = {
    '1:1': '1024x1024',
    '4:5': '1024x1792',  // Portrait, close to 4:5
    '3:2': '1792x1024',
    '2:3': '1024x1792',
    '16:9': '1792x1024',
    '9:16': '1024x1792',
};

export interface OpenAIGenerateOptions {
    prompt: string;
    aspectRatio?: ImageAspectRatio;
    numberOfImages?: number;
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
}

export interface OpenAIGenerateResult {
    urls: string[];
    revisedPrompt?: string;
}

export async function generateWithOpenAI(
    apiKey: string,
    options: OpenAIGenerateOptions
): Promise<OpenAIGenerateResult> {
    const openai = new OpenAI({ apiKey });

    const size = ASPECT_TO_SIZE[options.aspectRatio || '1:1'];
    const n = Math.min(options.numberOfImages || 1, 1); // DALL-E 3 only supports n=1

    const results: string[] = [];
    let revisedPrompt: string | undefined;

    // DALL-E 3 only generates one image at a time
    for (let i = 0; i < (options.numberOfImages || 1); i++) {
        const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt: options.prompt,
            size,
            quality: options.quality || 'hd',
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
    };
}
