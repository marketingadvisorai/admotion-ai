import { VideoGenerationProvider } from '../types';
import { KlingProvider } from './kling';
import { RunwayProvider } from './runway';
import { GeminiProvider } from './gemini';
import { SoraProvider } from './sora';

const providers: Record<string, VideoGenerationProvider> = {
    kling: new KlingProvider(),
    runway: new RunwayProvider(),
    gemini: new GeminiProvider(),
    sora: new SoraProvider(),
};

export function getProvider(id: string): VideoGenerationProvider {
    const provider = providers[id];
    if (!provider) {
        throw new Error(`Provider ${id} not found`);
    }
    return provider;
}

export function getAllProviders(): VideoGenerationProvider[] {
    return Object.values(providers);
}
