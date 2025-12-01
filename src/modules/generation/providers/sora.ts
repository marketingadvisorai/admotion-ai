import { VideoGenerationProvider, GenerationOptions, GenerationStatus } from '../types';

export class SoraProvider implements VideoGenerationProvider {
    id = 'sora';
    name = 'Sora';

    async generateVideo(options: GenerationOptions): Promise<string> {
        console.log('Sora generating video with options:', options);
        // TODO: Call Sora API
        return 'mock-sora-job-id-' + Date.now();
    }

    async checkStatus(jobId: string): Promise<GenerationStatus> {
        console.log('Checking Sora status for:', jobId);
        // TODO: Call Sora API
        return { status: 'completed', resultUrl: 'https://example.com/video.mp4' };
    }
}
