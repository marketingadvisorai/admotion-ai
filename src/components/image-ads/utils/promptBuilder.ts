/**
 * Prompt Builder Utilities
 * Constructs structured prompts for image generation
 */

import { BrandContext, ProposedCopy, AspectRatio } from '../types';

// ============================================
// SYSTEM PROMPT BUILDER
// ============================================

export function buildChatSystemPrompt(brandContext?: BrandContext): string {
  let systemPrompt = `You are a creative advertising expert helping create image ads.

Your job is to:
1. Discuss the user's ad concept and goals
2. When you have enough information, propose the IMAGE OVERLAY elements with this EXACT format:

---PROPOSED AD COPY---
HEADLINE: [catchy headline text that will appear ON the image]
CTA: [call-to-action button text that will appear ON the image]
IMAGE DIRECTION: [brief visual description for image generation]
OVERLAY_ELEMENTS: [comma-separated list of elements to add: headline, button, logo, badge, tagline]
---END COPY---

IMPORTANT: Focus ONLY on what text/elements will be OVERLAID on the image:
- HEADLINE: The main text displayed prominently on the image
- CTA: The button text (e.g., "Shop Now", "Learn More")
- OVERLAY_ELEMENTS: Which visual elements to include on the image
 - LOGO: Always include the brand logo badge when available (top-right or bottom-right with padding)
 - BADGE/TAGLINE: Only if they improve scannability

Overlay rules:
- Max 45 chars for headline, ultra concise CTA
- High contrast (WCAG AA), safe padding, mobile-safe margins
- Avoid long paragraphs; no body copy
- Keep background clear behind text; avoid busy areas

Do NOT suggest "primary text" or body copy - we only need image overlay elements.
Always propose when you have a clear idea. Ask clarifying questions if needed first.
Be concise, concrete, and layout-aware.`;

  if (brandContext) {
    systemPrompt += `\n\nBrand Context:\n- Brand: ${brandContext.businessName || brandContext.brandName || 'Unknown'}\n`;
    if (brandContext.description) systemPrompt += `- Description: ${brandContext.description}\n`;
    if (brandContext.brandVoice) systemPrompt += `- Brand Voice: ${brandContext.brandVoice}\n`;
    if (brandContext.targetAudience) systemPrompt += `- Target Audience: ${brandContext.targetAudience}\n`;
    if (brandContext.values?.length) systemPrompt += `- Values: ${brandContext.values.join(', ')}\n`;
    if (brandContext.colors?.length) systemPrompt += `- Brand Colors: ${brandContext.colors.join(', ')}\n`;
  }

  return systemPrompt;
}

// ============================================
// GENERATION PROMPT BUILDER
// ============================================

export interface PromptSpec {
  copy: {
    headline: string;
    cta_text: string;
  };
  overlay_elements: Array<{
    type: string;
    text?: string;
    position: string;
  }>;
  visual_direction: string;
  aspect: AspectRatio;
  brand: {
    colors?: string[];
    logo_url?: string;
    voice?: string;
    target_audience?: string;
  };
  layout: {
    logo: string;
    hierarchy: string;
    text_rules: string;
    background: string;
  };
  accessibility: {
    contrast: string;
    legibility: string;
  };
  references?: string[];
}

export function buildGenerationPrompt(
  proposedCopy: ProposedCopy,
  brandContext: BrandContext | undefined,
  aspect: AspectRatio,
  referenceImages: string[] = []
): string {
  const colors = brandContext?.colors?.slice(0, 4);
  const logoUrl = brandContext?.logoUrl;
  const voice = brandContext?.brandVoice || '';
  const targetAudience = brandContext?.targetAudience || '';

  const promptSpec: PromptSpec = {
    copy: {
      headline: proposedCopy.headline,
      cta_text: proposedCopy.ctaText,
    },
    overlay_elements: proposedCopy.overlayElements.map(el => ({
      type: el.type,
      text: el.text,
      position: el.position || 'auto',
    })),
    visual_direction: proposedCopy.imageDirection,
    aspect,
    brand: {
      colors,
      logo_url: logoUrl,
      voice: voice || undefined,
      target_audience: targetAudience || undefined,
    },
    layout: {
      logo: 'If logo_url provided, place logo as a badge top-right or bottom-right with padding, no stretching, preserve aspect.',
      hierarchy: 'Headline above CTA button, generous spacing, mobile-safe margins.',
      text_rules: 'Headline <= 45 characters, no body copy, CTA standard (e.g., Learn More, Shop Now).',
      background: 'Avoid noisy/low-contrast areas behind text; keep CTA high-contrast and readable.',
    },
    accessibility: {
      contrast: 'Meet WCAG AA contrast for text and CTA.',
      legibility: 'Use clean fonts, avoid tiny text, keep padding around text and buttons.',
    },
    references: referenceImages.length ? referenceImages.slice(0, 3) : undefined,
  };

  return `${JSON.stringify(promptSpec, null, 2)}\nGenerate a professional digital ad image following this spec exactly.`;
}
