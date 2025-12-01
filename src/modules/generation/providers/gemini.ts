import { VideoGenerationProvider, GenerationOptions, GenerationStatus } from '../types';

export class GeminiProvider implements VideoGenerationProvider {
    id = 'gemini';
    name = 'Gemini Veo';

    async generateVideo(options: GenerationOptions): Promise<string> {
        console.log('Gemini generating video with options:', options);
        // TODO: Call Gemini API
        return 'mock-gemini-job-id-' + Date.now();
    }

    async checkStatus(jobId: string): Promise<GenerationStatus> {
        console.log('Checking Gemini status for:', jobId);
        // TODO: Call Gemini API
        return { status: 'completed', resultUrl: 'https://example.com/video.mp4' };
    }
}
