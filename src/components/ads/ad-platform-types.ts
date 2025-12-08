/**
 * Shared Ad Platform Types
 * Used by both image and video ad generators
 * Supports multi-platform and multi-size selection
 */

// ============================================
// PLATFORM TYPES
// ============================================

export type AdPlatform = 
  | 'google_ads' 
  | 'facebook' 
  | 'instagram' 
  | 'tiktok' 
  | 'linkedin' 
  | 'pinterest'
  | 'twitter'
  | 'snapchat'
  | 'youtube'
  | 'other';

export type AdMediaType = 'image' | 'video';

// ============================================
// SIZE / ASPECT RATIO TYPES
// ============================================

export type ImageAspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | '1.91:1' | '2:3' | '3:2';
export type VideoAspectRatio = '1:1' | '4:5' | '9:16' | '16:9';

export interface AdSize {
  id: string;
  name: string;
  aspectRatio: ImageAspectRatio | VideoAspectRatio;
  width: number;
  height: number;
  description: string;
  platforms: AdPlatform[];
}

// ============================================
// PLATFORM PRESETS
// ============================================

export interface PlatformPreset {
  platform: AdPlatform;
  displayName: string;
  icon: string;
  mediaTypes: AdMediaType[];
  imageSizes: AdSize[];
  videoSizes: AdSize[];
  // Video-specific settings
  maxDuration?: number;
  minDuration?: number;
  recommendedDuration?: number;
  recommendedAspectRatios?: (ImageAspectRatio | VideoAspectRatio)[];
  bestPractices: {
    hookTime?: string;
    soundDefault?: 'on' | 'off' | 'variable' | string;
    captionRequired?: boolean;
    ctaPlacement?: string;
    textLimit?: string;
    safeZone?: string;
    [key: string]: string | boolean | undefined;
  };
  creativeGuidelines: string;
}

// ============================================
// MULTI-SELECT STATE
// ============================================

export interface SelectedAdConfig {
  platforms: AdPlatform[];
  sizes: AdSize[];
}

// ============================================
// STANDARD AD SIZES BY PLATFORM
// ============================================

export const AD_SIZES: Record<string, AdSize> = {
  // Square - Universal
  square: {
    id: 'square',
    name: 'Square',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    description: 'Universal square format',
    platforms: ['facebook', 'instagram', 'linkedin', 'pinterest', 'twitter'],
  },
  // Vertical - Stories/Reels
  vertical_9x16: {
    id: 'vertical_9x16',
    name: 'Stories/Reels',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    description: 'Full-screen vertical',
    platforms: ['instagram', 'facebook', 'tiktok', 'snapchat', 'youtube'],
  },
  // Portrait - Feed
  portrait_4x5: {
    id: 'portrait_4x5',
    name: 'Portrait Feed',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    description: 'Optimal for mobile feed',
    platforms: ['facebook', 'instagram'],
  },
  // Landscape - YouTube/Display
  landscape_16x9: {
    id: 'landscape_16x9',
    name: 'Landscape',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    description: 'YouTube & Display ads',
    platforms: ['google_ads', 'youtube', 'linkedin', 'twitter'],
  },
  // Google Display
  display_1_91x1: {
    id: 'display_1_91x1',
    name: 'Display Banner',
    aspectRatio: '1.91:1',
    width: 1200,
    height: 628,
    description: 'Google Display Network',
    platforms: ['google_ads', 'facebook', 'linkedin'],
  },
  // Pinterest
  pinterest_2x3: {
    id: 'pinterest_2x3',
    name: 'Pinterest Pin',
    aspectRatio: '2:3',
    width: 1000,
    height: 1500,
    description: 'Optimal for Pinterest',
    platforms: ['pinterest'],
  },
};

// ============================================
// PLATFORM CONFIGURATION
// ============================================

export const PLATFORM_CONFIGS: Record<AdPlatform, PlatformPreset> = {
  google_ads: {
    platform: 'google_ads',
    displayName: 'Google Ads',
    icon: '🔍',
    mediaTypes: ['image', 'video'],
    imageSizes: [AD_SIZES.landscape_16x9, AD_SIZES.square, AD_SIZES.display_1_91x1],
    videoSizes: [AD_SIZES.landscape_16x9, AD_SIZES.square, AD_SIZES.vertical_9x16],
    bestPractices: {
      hookTime: '5 seconds',
      soundDefault: 'on',
      captionRequired: false,
      ctaPlacement: 'end',
      textLimit: '20% of image',
    },
    creativeGuidelines: 'Hook in first 5s (before skip). Clear branding. Strong CTA.',
  },
  facebook: {
    platform: 'facebook',
    displayName: 'Facebook',
    icon: '📘',
    mediaTypes: ['image', 'video'],
    imageSizes: [AD_SIZES.square, AD_SIZES.portrait_4x5, AD_SIZES.display_1_91x1],
    videoSizes: [AD_SIZES.square, AD_SIZES.portrait_4x5, AD_SIZES.vertical_9x16],
    bestPractices: {
      hookTime: '3 seconds',
      soundDefault: 'off',
      captionRequired: true,
      ctaPlacement: 'throughout',
      textLimit: '20% of image',
    },
    creativeGuidelines: 'Sound-off design. Captions essential. Mobile-first.',
  },
  instagram: {
    platform: 'instagram',
    displayName: 'Instagram',
    icon: '📸',
    mediaTypes: ['image', 'video'],
    imageSizes: [AD_SIZES.square, AD_SIZES.portrait_4x5, AD_SIZES.vertical_9x16],
    videoSizes: [AD_SIZES.vertical_9x16, AD_SIZES.square, AD_SIZES.portrait_4x5],
    bestPractices: {
      hookTime: '2 seconds',
      soundDefault: 'off',
      captionRequired: true,
      ctaPlacement: 'end',
      safeZone: '14% from edges',
    },
    creativeGuidelines: 'Native aesthetic. 9:16 for Reels. Captions required.',
  },
  tiktok: {
    platform: 'tiktok',
    displayName: 'TikTok',
    icon: '🎵',
    mediaTypes: ['video'],
    imageSizes: [],
    videoSizes: [AD_SIZES.vertical_9x16],
    bestPractices: {
      hookTime: '1-2 seconds',
      soundDefault: 'on',
      captionRequired: false,
      ctaPlacement: 'end',
    },
    creativeGuidelines: 'Authentic feel. Trending sounds. Fast-paced. Hook immediately.',
  },
  linkedin: {
    platform: 'linkedin',
    displayName: 'LinkedIn',
    icon: '💼',
    mediaTypes: ['image', 'video'],
    imageSizes: [AD_SIZES.square, AD_SIZES.landscape_16x9, AD_SIZES.display_1_91x1],
    videoSizes: [AD_SIZES.landscape_16x9, AD_SIZES.square],
    bestPractices: {
      hookTime: '3 seconds',
      soundDefault: 'off',
      captionRequired: true,
      ctaPlacement: 'end',
    },
    creativeGuidelines: 'Professional tone. B2B focus. Captions essential.',
  },
  pinterest: {
    platform: 'pinterest',
    displayName: 'Pinterest',
    icon: '📌',
    mediaTypes: ['image', 'video'],
    imageSizes: [AD_SIZES.pinterest_2x3, AD_SIZES.square],
    videoSizes: [AD_SIZES.vertical_9x16, AD_SIZES.square],
    bestPractices: {
      ctaPlacement: 'bottom',
      textLimit: 'Minimal text overlay',
    },
    creativeGuidelines: 'Aspirational imagery. 2:3 vertical pins perform best.',
  },
  twitter: {
    platform: 'twitter',
    displayName: 'X (Twitter)',
    icon: '𝕏',
    mediaTypes: ['image', 'video'],
    imageSizes: [AD_SIZES.landscape_16x9, AD_SIZES.square],
    videoSizes: [AD_SIZES.landscape_16x9, AD_SIZES.square],
    bestPractices: {
      hookTime: '3 seconds',
      soundDefault: 'off',
      captionRequired: true,
    },
    creativeGuidelines: 'Concise messaging. Bold visuals. Clear CTA.',
  },
  snapchat: {
    platform: 'snapchat',
    displayName: 'Snapchat',
    icon: '👻',
    mediaTypes: ['image', 'video'],
    imageSizes: [AD_SIZES.vertical_9x16],
    videoSizes: [AD_SIZES.vertical_9x16],
    bestPractices: {
      hookTime: '1-2 seconds',
      soundDefault: 'on',
      ctaPlacement: 'swipe-up',
      safeZone: 'Top 15% for UI',
    },
    creativeGuidelines: 'Full-screen vertical. Fun, authentic style. Swipe-up CTA.',
  },
  youtube: {
    platform: 'youtube',
    displayName: 'YouTube',
    icon: '▶️',
    mediaTypes: ['video'],
    imageSizes: [],
    videoSizes: [AD_SIZES.landscape_16x9, AD_SIZES.vertical_9x16, AD_SIZES.square],
    bestPractices: {
      hookTime: '5 seconds (skip)',
      soundDefault: 'on',
      captionRequired: false,
      ctaPlacement: 'end',
    },
    creativeGuidelines: 'Hook before 5s skip. Clear value prop. Strong end-screen CTA.',
  },
  other: {
    platform: 'other',
    displayName: 'Other / General',
    icon: '🎯',
    mediaTypes: ['image', 'video'],
    imageSizes: [AD_SIZES.square, AD_SIZES.landscape_16x9, AD_SIZES.vertical_9x16],
    videoSizes: [AD_SIZES.landscape_16x9, AD_SIZES.square, AD_SIZES.vertical_9x16],
    bestPractices: {
      hookTime: '3 seconds',
      soundDefault: 'variable',
      captionRequired: false,
      ctaPlacement: 'end',
    },
    creativeGuidelines: 'General ad best practices. Strong hook, clear message, compelling CTA.',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getPlatformSizes(
  platform: AdPlatform, 
  mediaType: AdMediaType
): AdSize[] {
  const config = PLATFORM_CONFIGS[platform];
  return mediaType === 'image' ? config.imageSizes : config.videoSizes;
}

export function getRecommendedSizes(
  platforms: AdPlatform[], 
  mediaType: AdMediaType
): AdSize[] {
  const sizeMap = new Map<string, AdSize>();
  
  for (const platform of platforms) {
    const sizes = getPlatformSizes(platform, mediaType);
    for (const size of sizes) {
      if (!sizeMap.has(size.id)) {
        sizeMap.set(size.id, size);
      }
    }
  }
  
  return Array.from(sizeMap.values());
}

export function formatSizeName(size: AdSize): string {
  return `${size.name} (${size.aspectRatio})`;
}
