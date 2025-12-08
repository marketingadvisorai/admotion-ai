export type AspectRatioVideo = '16:9' | '1:1' | '9:16' | '4:5';

export type AdPlatform = 'google_ads' | 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'other';

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

// Platform-specific presets
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

// Platform presets with best practices
export const PLATFORM_PRESETS: Record<AdPlatform, PlatformPreset> = {
  google_ads: {
    platform: 'google_ads',
    displayName: 'Google Ads / YouTube',
    recommendedAspectRatios: ['16:9', '9:16', '1:1'],
    maxDuration: 60,
    minDuration: 6,
    recommendedDuration: 15,
    bestPractices: {
      hookTime: '5 seconds',
      soundDefault: 'on',
      captionRequired: false,
      ctaPlacement: 'end',
      skipButtonAt: '5 seconds',
    },
    creativeGuidelines: 'Hook viewers in the first 5 seconds before skip button appears. Lead with your value proposition. Use clear branding throughout. End with strong CTA overlay.',
  },
  facebook: {
    platform: 'facebook',
    displayName: 'Facebook Ads',
    recommendedAspectRatios: ['1:1', '4:5', '16:9'],
    maxDuration: 240,
    minDuration: 1,
    recommendedDuration: 15,
    bestPractices: {
      hookTime: '3 seconds',
      soundDefault: 'off',
      captionRequired: true,
      ctaPlacement: 'throughout',
      textOverlayLimit: '20%',
    },
    creativeGuidelines: 'Design for sound-off viewing with captions. Square (1:1) or vertical (4:5) performs best on mobile. Grab attention in first 3 seconds.',
  },
  instagram: {
    platform: 'instagram',
    displayName: 'Instagram',
    recommendedAspectRatios: ['9:16', '1:1', '4:5'],
    maxDuration: 60,
    minDuration: 1,
    recommendedDuration: 15,
    bestPractices: {
      hookTime: '2 seconds',
      soundDefault: 'off (feed) / on (reels)',
      captionRequired: true,
      ctaPlacement: 'end',
      nativeFeel: true,
    },
    creativeGuidelines: 'Reels: 9:16 vertical, native feel, trending audio. Feed: 1:1 or 4:5, sound-off design. Stories: use interactive elements.',
  },
  tiktok: {
    platform: 'tiktok',
    displayName: 'TikTok',
    recommendedAspectRatios: ['9:16'],
    maxDuration: 60,
    minDuration: 5,
    recommendedDuration: 15,
    bestPractices: {
      hookTime: '1-2 seconds',
      soundDefault: 'on',
      captionRequired: false,
      ctaPlacement: 'end',
      nativeFeel: true,
      trendingAware: true,
    },
    creativeGuidelines: 'Make it feel native to TikTok. Hook immediately. Use trending sounds/styles. Authentic > polished. Fast-paced edits.',
  },
  linkedin: {
    platform: 'linkedin',
    displayName: 'LinkedIn',
    recommendedAspectRatios: ['16:9', '1:1', '9:16'],
    maxDuration: 600,
    minDuration: 3,
    recommendedDuration: 30,
    bestPractices: {
      hookTime: '3 seconds',
      soundDefault: 'off',
      captionRequired: true,
      ctaPlacement: 'end',
      professionalTone: true,
    },
    creativeGuidelines: 'Professional tone. Educational or thought-leadership content performs well. Captions essential. Clear value proposition for B2B audience.',
  },
  other: {
    platform: 'other',
    displayName: 'Other / General',
    recommendedAspectRatios: ['16:9', '1:1', '9:16'],
    maxDuration: 120,
    minDuration: 6,
    recommendedDuration: 15,
    bestPractices: {
      hookTime: '3 seconds',
      soundDefault: 'variable',
      captionRequired: false,
      ctaPlacement: 'end',
    },
    creativeGuidelines: 'General video ad best practices. Strong opening hook, clear message, compelling CTA.',
  },
};

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
