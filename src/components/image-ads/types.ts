/**
 * Image Ads Module Types
 * All shared types for the image ads feature
 */

import { BrandKit } from '@/modules/brand-kits/types';
import { LlmProfile } from '@/modules/llm/types';

// ============================================
// ASPECT & MODE TYPES
// ============================================

export type AspectRatio = '3:2' | '1:1' | '2:3';
export type CreativeMode = 'chat' | 'make';

// ============================================
// BRAND TYPES
// ============================================

export interface BrandIdentityLite {
  business_name?: string;
  description?: string;
  logo_url?: string;
  colors?: Array<{ name: string; value: string; type: string }>;
  strategy?: { brand_voice?: string; target_audience?: string; values?: string[] };
}

export interface BrandContext {
  brandId?: string;
  brandName?: string;
  businessName?: string;
  description?: string;
  logoUrl?: string;
  colors?: string[];
  brandVoice?: string;
  targetAudience?: string;
  values?: string[];
}

export interface AvailableApis {
  openai: boolean;
  gemini: boolean;
  anthropic: boolean;
}

// ============================================
// CHAT TYPES
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ============================================
// OVERLAY & COPY TYPES
// ============================================

export interface OverlayElement {
  type: 'headline' | 'button' | 'logo' | 'badge' | 'tagline';
  text?: string;
  position?: string;
  style?: string;
}

export interface ProposedCopy {
  headline: string;
  ctaText: string;
  imageDirection: string;
  overlayElements: OverlayElement[];
  confirmed: boolean;
}

// ============================================
// IMAGE GENERATION TYPES
// ============================================

export interface GeneratedImageData {
  id: string;
  url: string;
  prompt: string;
  style?: string;
  createdAt: Date;
  sessionId?: string;
}

// ============================================
// MODEL VARIANT TYPES
// ============================================

export interface ImageModelVariant {
  value: string;
  label: string;
  provider: 'openai' | 'gemini';
  recommended: boolean;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface ImageGeneratorProps {
  displayName: string;
  brandKits: BrandKit[];
  llmProfiles: LlmProfile[];
  orgId: string;
}

export interface ProposedCopyCardProps {
  proposedCopy: ProposedCopy;
  activeBrand: BrandIdentityLite | BrandKit | null;
  selectedAspect: AspectRatio;
  variantImageModels: string[];
  isGenerating: boolean;
  onUpdateCopy: (field: keyof ProposedCopy, value: string) => void;
  onConfirm: () => void;
  onGenerate: () => void;
  onAspectChange: (aspect: AspectRatio) => void;
  onVariantModelsChange: (models: string[]) => void;
}

export interface ChatPanelProps {
  messages: ChatMessage[];
  isChatting: boolean;
  prompt: string;
  creativeMode: CreativeMode;
  error: string | null;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onClearChat: () => void;
  onModeChange: (mode: CreativeMode) => void;
  onClearError: () => void;
}

export interface BrandPreviewProps {
  brand: BrandIdentityLite | BrandKit | null;
}

export interface ReferenceStripProps {
  images: string[];
  onRemove: (url: string) => void;
  onClear: () => void;
}

// ============================================
// CONSTANTS
// ============================================

export const IMAGE_VARIANTS: ImageModelVariant[] = [
  { value: 'dall-e-3', label: 'DALL-E 3 (Best Quality)', provider: 'openai', recommended: true },
  { value: 'dall-e-2', label: 'DALL-E 2 (Cost-Saving)', provider: 'openai', recommended: false },
  { value: 'nano-banana-pro', label: 'Imagen 3 (Google)', provider: 'gemini', recommended: true },
  { value: 'nano-banana', label: 'Imagen 2 (Fast)', provider: 'gemini', recommended: false },
];
