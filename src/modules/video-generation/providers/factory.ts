/**
 * Video Generation Provider Factory
 * Routes to appropriate provider based on model selection
 */

import { VideoGenerationProviderInterface, VideoModel, VideoProvider } from '../types';
import { SoraProvider } from './sora';
import { VeoProvider } from './veo';

// Provider instances
const soraProvider = new SoraProvider();
const veoProvider = new VeoProvider();

// Provider registry
const providers: Record<string, VideoGenerationProviderInterface> = {
    sora: soraProvider,
    openai: soraProvider, // Alias
    veo: veoProvider,
    google: veoProvider, // Alias
};

// Model to provider mapping
const modelToProvider: Record<VideoModel, VideoGenerationProviderInterface> = {
    'sora-2-pro': soraProvider,
    'sora-2': soraProvider,
    'veo-3.1': veoProvider,
    'veo-2': veoProvider,
};

/**
 * Get provider by ID
 */
export function getVideoProvider(id: string): VideoGenerationProviderInterface {
    const provider = providers[id.toLowerCase()];
    if (!provider) {
        throw new Error(`Video provider "${id}" not found. Available: ${Object.keys(providers).join(', ')}`);
    }
    return provider;
}

/**
 * Get provider by model name
 */
export function getProviderByModel(model: VideoModel): VideoGenerationProviderInterface {
    const provider = modelToProvider[model];
    if (!provider) {
        throw new Error(`No provider found for model "${model}"`);
    }
    return provider;
}

/**
 * Get all available providers
 */
export function getAllVideoProviders(): VideoGenerationProviderInterface[] {
    return [soraProvider, veoProvider];
}

/**
 * Resolve provider from input (model takes precedence over provider)
 */
export function resolveVideoProvider(
    model?: VideoModel,
    provider?: VideoProvider
): { provider: VideoGenerationProviderInterface; model: VideoModel } {
    // If model is specified, use its provider
    if (model) {
        return {
            provider: getProviderByModel(model),
            model,
        };
    }

    // Default based on provider preference
    if (provider === 'google') {
        return {
            provider: veoProvider,
            model: 'veo-3.1',
        };
    }

    // Default to Sora (OpenAI)
    return {
        provider: soraProvider,
        model: 'sora-2-pro',
    };
}

/**
 * Get available models for a provider
 */
export function getModelsForProvider(providerId: VideoProvider): VideoModel[] {
    if (providerId === 'openai') {
        return ['sora-2-pro', 'sora-2'];
    }
    if (providerId === 'google') {
        return ['veo-3.1', 'veo-2'];
    }
    return [];
}

/**
 * Video model metadata for UI display
 */
export const VIDEO_MODELS = [
    {
        value: 'sora-2-pro' as VideoModel,
        label: 'Sora 2 Pro (OpenAI)',
        provider: 'openai' as VideoProvider,
        recommended: true,
        description: 'Highest quality, best for final production',
    },
    {
        value: 'sora-2' as VideoModel,
        label: 'Sora 2 (OpenAI)',
        provider: 'openai' as VideoProvider,
        recommended: false,
        description: 'Fast mode, good for drafts',
    },
    {
        value: 'veo-3.1' as VideoModel,
        label: 'Veo 3.1 (Google)',
        provider: 'google' as VideoProvider,
        recommended: true,
        description: 'Native audio, cinematic quality',
    },
    {
        value: 'veo-2' as VideoModel,
        label: 'Veo 2 (Google)',
        provider: 'google' as VideoProvider,
        recommended: false,
        description: 'Fast mode, good for iterations',
    },
];
