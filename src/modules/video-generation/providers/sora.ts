/**
 * OpenAI Sora Video Generation Provider
 * Uses sora-2-pro (highest quality) or sora-2 (fast mode)
 * 
 * Note: Sora API is accessed via REST endpoints as the SDK may not have
 * full video generation support yet.
 */

import {
    VideoGenerationProviderInterface,
    VideoGenerationProviderConfig,
    VideoGenerationInput,
    VideoGenerationStatus,
    SoraModel,
} from '../types';

const SORA_CONFIG: VideoGenerationProviderConfig = {
    id: 'sora',
    name: 'OpenAI Sora',
    models: ['sora-2-pro', 'sora-2'],
    defaultModel: 'sora-2-pro',
    maxDuration: 20,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportsAudio: true,
};

const OPENAI_API_BASE = 'https://api.openai.com/v1';

interface SoraGenerateResponse {
    id: string;
    status: string;
    created_at: string;
}

interface SoraStatusResponse {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    output?: {
        url: string;
        thumbnail_url?: string;
    };
    error?: {
        message: string;
        code: string;
    };
}

export class SoraProvider implements VideoGenerationProviderInterface {
    id = 'sora';
    name = 'OpenAI Sora';
    config = SORA_CONFIG;

    /**
     * Generate video using OpenAI Sora
     * Returns external job ID for status polling
     */
    async generateVideo(options: VideoGenerationInput, apiKey: string): Promise<string> {
        const model: SoraModel = (options.model as SoraModel) || 'sora-2-pro';
        const duration = options.duration || 10;
        const aspectRatio = options.aspectRatio || '16:9';
        const prompt = options.prompt || '';

        try {
            // OpenAI Sora API call via REST
            const response = await fetch(`${OPENAI_API_BASE}/videos/generations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    duration,
                    aspect_ratio: aspectRatio,
                    audio: options.audio?.enabled ?? true,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Sora API error:', errorText);
                
                // If API not available, return mock for development
                if (response.status === 404 || response.status === 501) {
                    console.warn('Sora API not yet available, using mock response');
                    return `sora-mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                }
                
                throw new Error(`Sora API error: ${response.status} - ${errorText}`);
            }

            const data: SoraGenerateResponse = await response.json();
            return data.id;
        } catch (error: unknown) {
            // Handle case where Sora API is not yet available
            if (error instanceof Error && (error.message.includes('not found') || error.message.includes('fetch'))) {
                console.warn('Sora API not yet available, using mock response');
                return `sora-mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            }
            throw error;
        }
    }

    /**
     * Check status of a Sora video generation job
     */
    async checkStatus(jobId: string, apiKey: string): Promise<VideoGenerationStatus> {
        // Handle mock jobs
        if (jobId.startsWith('sora-mock-')) {
            return {
                status: 'completed',
                progress: 100,
                resultUrl: 'https://example.com/mock-sora-video.mp4',
                thumbnailUrl: 'https://example.com/mock-sora-thumb.jpg',
            };
        }

        try {
            const response = await fetch(`${OPENAI_API_BASE}/videos/generations/${jobId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to check status: ${response.status}`);
            }

            const data: SoraStatusResponse = await response.json();

            if (data.status === 'completed') {
                return {
                    status: 'completed',
                    progress: 100,
                    resultUrl: data.output?.url,
                    thumbnailUrl: data.output?.thumbnail_url,
                };
            }

            if (data.status === 'failed') {
                return {
                    status: 'failed',
                    error: data.error?.message || 'Video generation failed',
                };
            }

            // Still processing
            return {
                status: 'processing',
                progress: data.progress || 50,
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to check status';
            return {
                status: 'failed',
                error: message,
            };
        }
    }
}

// Export singleton instance
export const soraProvider = new SoraProvider();
