export interface GenerationOptions {
    aspectRatio: '16:9' | '9:16' | '1:1';
    duration: number; // in seconds
    prompt: string;
    negativePrompt?: string;
}

export interface GenerationStatus {
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress?: number; // 0-100
    resultUrl?: string;
    error?: string;
}

export interface VideoGenerationProvider {
    id: string;
    name: string;
    generateVideo(options: GenerationOptions): Promise<string>; // Returns external Job ID
    checkStatus(jobId: string): Promise<GenerationStatus>;
}
