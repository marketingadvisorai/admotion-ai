'use client';

import { useState, useCallback } from 'react';
import { VideoChatMessage, ProposedVideoCopy, VideoDuration } from '@/modules/video-generation/types';
import { PLATFORM_CONFIGS, PlatformPreset } from '@/components/ads/ad-platform-types';
import type { AdPlatform } from '../types';

interface UseVideoChatOptions {
  orgId: string;
  selectedChatModel: string;
  selectedPlatform: AdPlatform;
  brandContext?: BrandContextLite;
}

interface BrandContextLite {
  brandId?: string;
  brandName?: string;
  businessName?: string;
  description?: string;
  colors?: string[];
  brandVoice?: string;
  targetAudience?: string;
}

interface UseVideoChatReturn {
  chatMessages: VideoChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<VideoChatMessage[]>>;
  isChatting: boolean;
  proposedCopy: ProposedVideoCopy | null;
  setProposedCopy: React.Dispatch<React.SetStateAction<ProposedVideoCopy | null>>;
  handleChat: (prompt: string) => Promise<void>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * Hook for managing video ad chat interactions
 * Handles AI chat, parsing proposed video ad copy from responses
 */
export function useVideoChat({
  orgId,
  selectedChatModel,
  selectedPlatform,
  brandContext,
}: UseVideoChatOptions): UseVideoChatReturn {
  const [chatMessages, setChatMessages] = useState<VideoChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [proposedCopy, setProposedCopy] = useState<ProposedVideoCopy | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChat = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;

    setIsChatting(true);
    setError(null);

    const userMessage: VideoChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const preset = PLATFORM_CONFIGS[selectedPlatform];
      const systemPrompt = buildSystemPrompt(preset, brandContext);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          systemPrompt,
          model: selectedChatModel,
          orgId,
        }),
      });

      const data = await res.json();
      if (data.content) {
        const assistantMessage: VideoChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);

        // Parse proposed video ad from response
        const parsed = parseProposedCopy(data.content);
        if (parsed) {
          setProposedCopy(parsed);
        }
      }
    } catch (err) {
      console.error('Chat failed:', err);
      setError('Failed to get response from AI');
    } finally {
      setIsChatting(false);
    }
  }, [chatMessages, selectedChatModel, selectedPlatform, brandContext, orgId]);

  return {
    chatMessages,
    setChatMessages,
    isChatting,
    proposedCopy,
    setProposedCopy,
    handleChat,
    error,
    setError,
  };
}

function buildSystemPrompt(
  preset: typeof PLATFORM_CONFIGS[AdPlatform],
  brandContext?: BrandContextLite
): string {
  let systemPrompt = `You are a professional video advertising expert for ${preset.displayName}.

## ROLE
Create high-converting video ads for PAID DIGITAL ADVERTISING.

## PLATFORM: ${preset.displayName}
- Hook Time: ${preset.bestPractices.hookTime || '3 seconds'}
- Sound: ${preset.bestPractices.soundDefault || 'variable'}
- Captions: ${preset.bestPractices.captionRequired ? 'Required' : 'Optional'}
- Duration: ${preset.recommendedDuration || 15}s (max ${preset.maxDuration || 60}s)
- Best Ratios: ${preset.recommendedAspectRatios?.join(', ') || preset.videoSizes.map(s => s.aspectRatio).join(', ')}

## OUTPUT FORMAT (when ready):
---PROPOSED VIDEO AD---
HEADLINE: [max 5 words, end frame]
SUBHEADLINE: [max 10 words]
CTA: [Shop Now, Learn More, etc.]
SCENE_DESCRIPTION: [shot-by-shot description]
VISUAL_THEME: [cinematic/energetic/minimalist/bold/luxurious]
AUDIO_STYLE: [upbeat/cinematic/electronic/ambient]
DURATION: [${preset.minDuration || 6}-${preset.recommendedDuration || 15} seconds]
HOOK: [first ${preset.bestPractices.hookTime} action]
---END VIDEO AD---

Be strategic. Ask clarifying questions if needed.`;

  if (brandContext) {
    systemPrompt += `\n\nBrand: ${brandContext.businessName || brandContext.brandName || 'Unknown'}`;
    if (brandContext.description) systemPrompt += `\nDescription: ${brandContext.description}`;
    if (brandContext.brandVoice) systemPrompt += `\nVoice: ${brandContext.brandVoice}`;
    if (brandContext.colors?.length) systemPrompt += `\nColors: ${brandContext.colors.join(', ')}`;
  }

  return systemPrompt;
}

function parseProposedCopy(content: string): ProposedVideoCopy | null {
  const copyMatch = content.match(/---PROPOSED VIDEO AD---([\s\S]*?)---END VIDEO AD---/);
  if (!copyMatch) return null;

  const copyText = copyMatch[1];
  const headline = copyText.match(/HEADLINE:\s*(.+)/)?.[1]?.trim() || '';
  const subheadline = copyText.match(/SUBHEADLINE:\s*(.+)/)?.[1]?.trim();
  const cta = copyText.match(/CTA:\s*(.+)/)?.[1]?.trim() || '';
  const sceneDesc = copyText.match(/SCENE_DESCRIPTION:\s*(.+)/)?.[1]?.trim() || '';
  const visualTheme = copyText.match(/VISUAL_THEME:\s*(.+)/)?.[1]?.trim() || 'cinematic';
  const audioStyle = copyText.match(/AUDIO_STYLE:\s*(.+)/)?.[1]?.trim() || 'upbeat';
  const durationMatch = copyText.match(/DURATION:\s*(\d+)/)?.[1];

  if (!headline) return null;

  return {
    headline,
    subheadline,
    ctaText: cta || 'Learn More',
    sceneDescription: sceneDesc,
    visualTheme,
    audioStyle,
    overlayElements: [
      { type: 'headline', text: headline, timing: 'final 2 seconds' },
      { type: 'cta', text: cta || 'Learn More', timing: 'final 2 seconds' },
    ],
    duration: (parseInt(durationMatch || '10') as VideoDuration) || 10,
    confirmed: false,
  };
}

export default useVideoChat;
