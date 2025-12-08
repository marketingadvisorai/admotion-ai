// Import and re-export from shared ad platform types
import type { AdPlatform as SharedAdPlatform, AdSize, AdMediaType } from '@/components/ads/ad-platform-types';
export type { AdSize, AdMediaType } from '@/components/ads/ad-platform-types';
export { PLATFORM_CONFIGS, AD_SIZES, getPlatformSizes, getRecommendedSizes } from '@/components/ads/ad-platform-types';

// Local AdPlatform type (subset for video ads)
export type AdPlatform = 'google_ads' | 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'youtube' | 'pinterest' | 'twitter' | 'snapchat' | 'other';

export type AspectRatioVideo = '16:9' | '1:1' | '9:16' | '4:5';

export interface GeneratedVideo {
  id: string;
  cover: string;
  url?: string;
  prompt: string;
  provider: string;
  duration: number;
  aspect: AspectRatioVideo;
  createdAt: Date;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  platform?: AdPlatform;
}

// Note: Use PLATFORM_CONFIGS from '@/components/ads/ad-platform-types' for platform presets
// Legacy PlatformPreset interface kept for backwards compatibility
export interface PlatformPreset {
  platform: AdPlatform;
  displayName: string;
  recommendedAspectRatios: AspectRatioVideo[];
  maxDuration: number;
  minDuration: number;
  recommendedDuration: number;
  bestPractices: {
    hookTime: string;
    soundDefault: string;
    captionRequired: boolean;
    ctaPlacement: string;
    [key: string]: string | boolean | number;
  };
  creativeGuidelines: string;
}

// Alias for backwards compatibility - use PLATFORM_CONFIGS instead
export { PLATFORM_CONFIGS as PLATFORM_PRESETS } from '@/components/ads/ad-platform-types';

// Ad example for training
export interface AdExample {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  platform: AdPlatform;
  mediaType: 'image' | 'video';
  adFormat?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  aspectRatio: AspectRatioVideo;
  durationSeconds?: number;
  headline?: string;
  ctaText?: string;
  performanceNotes?: string;
  performanceScore?: number;
  tags: string[];
  styleKeywords: string[];
  aiAnalysis?: Record<string, unknown>;
  isActive: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}
