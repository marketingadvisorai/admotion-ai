export type CampaignStatus = 'draft' | 'generating' | 'completed';
export type VideoPlatform = 'tiktok' | 'youtube_shorts' | 'instagram_reels' | 'linkedin' | 'twitter';
export type VideoAspectRatio = '9:16' | '16:9' | '1:1';

export interface Campaign {
    id: string;
    org_id: string;
    name: string;
    brief: string | null;
    platform: VideoPlatform | null;
    status: CampaignStatus;
    created_at: string;
    updated_at: string;
}

export interface CreateCampaignInput {
    name: string;
    brief: string;
    platform: VideoPlatform;
}
