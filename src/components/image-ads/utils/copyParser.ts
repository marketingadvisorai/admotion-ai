/**
 * Copy Parser Utilities
 * Parses AI responses to extract proposed ad copy
 */

import { OverlayElement, ProposedCopy } from '../types';

// ============================================
// COPY EXTRACTION
// ============================================

export interface ParsedCopy {
  headline: string;
  cta: string;
  imageDirection: string;
  overlayElements: OverlayElement[];
}

/**
 * Extract proposed copy from AI response text
 * Looks for the ---PROPOSED AD COPY--- block
 */
export function extractProposedCopy(
  content: string,
  hasBrandLogo: boolean
): ProposedCopy | null {
  const copyMatch = content.match(/---PROPOSED AD COPY---([\s\S]*?)---END COPY---/);
  
  if (!copyMatch) {
    return null;
  }

  const copyText = copyMatch[1];
  const headline = copyText.match(/HEADLINE:\s*(.+)/)?.[1]?.trim() || '';
  const cta = copyText.match(/CTA:\s*(.+)/)?.[1]?.trim() || '';
  const imageDir = copyText.match(/IMAGE DIRECTION:\s*(.+)/)?.[1]?.trim() || '';
  const overlayStr = copyText.match(/OVERLAY_ELEMENTS:\s*(.+)/)?.[1]?.trim() || 'headline, button';

  if (!headline) {
    return null;
  }

  const overlayElements = parseOverlayElements(overlayStr, headline, cta, hasBrandLogo);

  return {
    headline,
    ctaText: cta || 'Learn More',
    imageDirection: imageDir || 'Professional ad image matching the copy',
    overlayElements,
    confirmed: false,
  };
}

/**
 * Parse overlay elements from comma-separated string
 */
function parseOverlayElements(
  overlayStr: string,
  headline: string,
  cta: string,
  hasBrandLogo: boolean
): OverlayElement[] {
  const overlayTypes = overlayStr.split(',').map((s) => s.trim().toLowerCase());
  
  const overlayElements: OverlayElement[] = overlayTypes.map((type) => {
    if (type === 'headline') return { type: 'headline' as const, text: headline };
    if (type === 'button' || type === 'cta') return { type: 'button' as const, text: cta };
    if (type === 'logo') return { type: 'logo' as const };
    if (type === 'badge') return { type: 'badge' as const };
    if (type === 'tagline') return { type: 'tagline' as const };
    return { type: 'headline' as const, text: type };
  });

  // Always add logo if brand has one and it's not already included
  const hasLogoOverlay = overlayElements.some((el) => el.type === 'logo');
  if (hasBrandLogo && !hasLogoOverlay) {
    overlayElements.push({ type: 'logo' });
  }

  return overlayElements;
}

/**
 * Validate headline length (max 45 chars recommended)
 */
export function validateHeadline(headline: string): { valid: boolean; message?: string } {
  if (headline.length > 45) {
    return { valid: false, message: 'Headline exceeds 45 characters. Consider shortening.' };
  }
  if (headline.length === 0) {
    return { valid: false, message: 'Headline is required.' };
  }
  return { valid: true };
}

/**
 * Validate CTA text (should be concise)
 */
export function validateCta(cta: string): { valid: boolean; message?: string } {
  if (cta.length > 20) {
    return { valid: false, message: 'CTA should be shorter (max ~20 chars).' };
  }
  if (cta.length === 0) {
    return { valid: false, message: 'CTA is required.' };
  }
  return { valid: true };
}
