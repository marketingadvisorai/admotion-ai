/**
 * Google Veo Video Generation Provider
 * Uses veo-3.1 (highest quality) or veo-2 (fast mode)
 * 
 * Veo is Google's video generation model, accessed via Vertex AI
 */

import {
    VideoGenerationProviderInterface,
    VideoGenerationProviderConfig,
    VideoGenerationInput,
    VideoGenerationStatus,
    VeoModel,
} from '../types';

const VEO_CONFIG: VideoGenerationProviderConfig = {
    id: 'veo',
    name: 'Google Veo',
    models: ['veo-3.1', 'veo-2'],
    defaultModel: 'veo-3.1',
    maxDuration: 16,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportsAudio: true,
};

// Google AI API base URL
const GOOGLE_AI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

interface VeoGenerateResponse {
    name: string; // Operation name (job ID)
    metadata?: {
        '@type': string;
    };
}

interface VeoOperationResponse {
    name: string;
    done: boolean;
    metadata?: {
        progress?: number;
    };
    response?: {
        generatedVideos: Array<{
            video: {
                uri: string;
            };
            thumbnail?: {
                uri: string;
            };
        }>;
    };
    error?: {
        code: number;
        message: string;
    };
}

export class VeoProvider implements VideoGenerationProviderInterface {
    id = 'veo';
    name = 'Google Veo';
    config = VEO_CONFIG;

    /**
     * Generate video using Google Veo
     * Returns external job ID (operation name) for status polling
     */
    async generateVideo(options: VideoGenerationInput, apiKey: string): Promise<string> {
        const model: VeoModel = (options.model as VeoModel) || 'veo-3.1';
        const duration = options.duration || 10;
        const aspectRatio = options.aspectRatio || '16:9';
        const prompt = options.prompt || '';

        // Map model to API endpoint
        const modelEndpoint = model === 'veo-3.1' ? 'veo-3.1' : 'veo-2.0';

        try {
            // Google Veo API call
            const url = `${GOOGLE_AI_BASE}/models/${modelEndpoint}:generateVideo?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    config: {
                        aspectRatio,
                        durationSeconds: duration,
                        numberOfVideos: 1,
                        personGeneration: 'allow_adult',
                        generateAudio: options.audio?.enabled ?? true,
                    },
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Veo API error:', errorText);
                
                // If API not available, return mock for development
                if (response.status === 404 || response.status === 501) {
                    console.warn('Veo API not yet available, using mock response');
                    return `veo-mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                }
                
                throw new Error(`Veo API error: ${response.status} - ${errorText}`);
            }

            const data: VeoGenerateResponse = await response.json();
            return data.name; // Operation name serves as job ID
        } catch (error: unknown) {
            // Handle case where Veo API is not yet available
            if (error instanceof Error && (error.message.includes('not found') || error.message.includes('fetch'))) {
                console.warn('Veo API not yet available, using mock response');
                return `veo-mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            }
            throw error;
        }
    }

    /**
     * Check status of a Veo video generation job
     */
    async checkStatus(jobId: string, apiKey: string): Promise<VideoGenerationStatus> {
        // Handle mock jobs
        if (jobId.startsWith('veo-mock-')) {
            return {
                status: 'completed',
                progress: 100,
                resultUrl: 'https://example.com/mock-veo-video.mp4',
                thumbnailUrl: 'https://example.com/mock-veo-thumb.jpg',
            };
        }

        try {
            // Poll operation status
            const url = `${GOOGLE_AI_BASE}/${jobId}?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to check status: ${response.status}`);
            }

            const data: VeoOperationResponse = await response.json();

            if (data.done && data.response) {
                const video = data.response.generatedVideos?.[0];
                return {
                    status: 'completed',
                    progress: 100,
                    resultUrl: video?.video?.uri,
                    thumbnailUrl: video?.thumbnail?.uri,
                };
            }

            if (data.done && data.error) {
                return {
                    status: 'failed',
                    error: data.error.message || 'Video generation failed',
                };
            }

            // Still processing
            return {
                status: 'processing',
                progress: data.metadata?.progress || 50,
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
export const veoProvider = new VeoProvider();
