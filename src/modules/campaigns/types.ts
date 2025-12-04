export type CampaignStatus = 'draft' | 'draft_chat' | 'strategy_review' | 'generating' | 'completed';
export type VideoPlatform = 'tiktok' | 'youtube_shorts' | 'instagram_reels' | 'linkedin' | 'twitter';
export type VideoAspectRatio = '9:16' | '16:9' | '1:1';
export type VideoDuration = '15' | '30' | '60';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface CampaignStrategy {
    hooks: string[];
    script: {
        scene: number;
        description: string;
        visual_cue: string;
        voiceover: string;
    }[];
    visual_style: string;
    target_audience: string;
    tone: string;
}

export interface CampaignAssets {
    images: string[];
    logo?: string;
    music?: string;
    voice_id?: string;
}

export interface Campaign {
    id: string;
    org_id: string;
    name: string;
    brief: string | null;
    platform: VideoPlatform | null;
    aspect_ratio: VideoAspectRatio | null;
    duration: VideoDuration | null;
    status: CampaignStatus;
    chat_history: ChatMessage[];
    strategy: CampaignStrategy | null;
    assets: CampaignAssets | null;
    agent_status: string;
    created_at: string;
    updated_at: string;
}

export interface CreateCampaignInput {
    name: string;
    brief?: string;
    platform?: VideoPlatform;
}
