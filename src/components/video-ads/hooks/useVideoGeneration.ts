'use client';

import { useState, useCallback } from 'react';
import { ProposedVideoCopy, VideoModel, VideoDuration } from '@/modules/video-generation/types';
import { AspectRatioVideo, GeneratedVideo, AdPlatform } from '../types';
import { AdSize } from '@/components/ads/ad-platform-types';

interface BrandContextLite {
  brandId?: string;
  brandName?: string;
  businessName?: string;
  description?: string;
  colors?: string[];
  brandVoice?: string;
  targetAudience?: string;
}

interface UseVideoGenerationOptions {
  orgId: string;
  selectedBrandKitId?: string;
  brandContext?: BrandContextLite;
}

interface GenerateVideoParams {
  proposedCopy: ProposedVideoCopy;
  selectedVideoModel: VideoModel;
  selectedPlatforms: AdPlatform[];
  selectedSizes: AdSize[];
  duration: VideoDuration;
  audioEnabled: boolean;
  audioStyle: string;
}

interface UseVideoGenerationReturn {
  isGenerating: boolean;
  generationProgress: number;
  generatedVideos: GeneratedVideo[];
  setGeneratedVideos: React.Dispatch<React.SetStateAction<GeneratedVideo[]>>;
  handleGenerate: (params: GenerateVideoParams) => Promise<void>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  loadExistingVideos: () => Promise<void>;
  isLoadingVideos: boolean;
}

/**
 * Hook for managing video generation
 * Supports multi-platform and multi-size generation
 */
export function useVideoGeneration({
  orgId,
  selectedBrandKitId,
  brandContext,
}: UseVideoGenerationOptions): UseVideoGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  const loadExistingVideos = useCallback(async () => {
    try {
      setIsLoadingVideos(true);
      const res = await fetch(`/api/videos?orgId=${orgId}`);
      const data = await res.json();
      if (data.success && data.videos) {
        const mapped: GeneratedVideo[] = data.videos.map((vid: Record<string, unknown>) => ({
          id: vid.id as string,
          cover: (vid.thumbnail_url || vid.result_url || '') as string,
          url: vid.result_url as string | undefined,
          prompt: (vid.prompt_used || '') as string,
          provider: vid.model as string,
          duration: vid.duration as number,
          aspect: vid.aspect_ratio as AspectRatioVideo,
          createdAt: new Date(vid.created_at as string),
          status: vid.status as GeneratedVideo['status'],
          platform: vid.platform as AdPlatform | undefined,
        }));
        setGeneratedVideos(mapped);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setIsLoadingVideos(false);
    }
  }, [orgId]);

  const handleGenerate = useCallback(async ({
    proposedCopy,
    selectedVideoModel,
    selectedPlatforms,
    selectedSizes,
    duration,
    audioEnabled,
    audioStyle,
  }: GenerateVideoParams) => {
    if (!proposedCopy.confirmed) {
      setError('Confirm the video ad details before generating.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setGenerationProgress(10);

    try {
      const totalJobs = selectedPlatforms.length * selectedSizes.length;
      let completedJobs = 0;
      const newVideos: GeneratedVideo[] = [];

      // Generate for each platform + size combination
      for (const platform of selectedPlatforms) {
        for (const size of selectedSizes) {
          setGenerationProgress(10 + (completedJobs / totalJobs) * 80);

          const requestBody = {
            orgId,
            brandKitId: selectedBrandKitId || undefined,
            provider: selectedVideoModel.startsWith('sora') ? 'openai' : 'google',
            model: selectedVideoModel,
            aspectRatio: size.aspectRatio,
            duration,
            platform,
            style: proposedCopy.visualTheme,
            audio: {
              enabled: audioEnabled,
              style: audioStyle,
            },
            adCopy: {
              headline: proposedCopy.headline,
              subheadline: proposedCopy.subheadline,
              ctaText: proposedCopy.ctaText,
            },
            sceneDescription: {
              description: proposedCopy.sceneDescription,
              visualTheme: proposedCopy.visualTheme,
            },
            brandContext,
          };

          const res = await fetch('/api/videos/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          const data = await res.json();
          if (!data.success) {
            console.error(`Failed for ${platform}/${size.id}:`, data.error);
            continue;
          }

          const newVideo: GeneratedVideo = {
            id: data.video.id,
            cover: data.video.thumbnail_url || '',
            url: data.video.result_url,
            prompt: data.promptUsed,
            provider: data.video.model,
            duration: data.video.duration,
            aspect: data.video.aspect_ratio as AspectRatioVideo,
            createdAt: new Date(data.video.created_at),
            status: data.video.status,
            platform,
          };

          newVideos.push(newVideo);
          completedJobs++;
        }
      }

      setGeneratedVideos((prev) => [...newVideos, ...prev]);
      setGenerationProgress(100);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate video';
      setError(message);
      console.error('Video generation failed:', err);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 600);
    }
  }, [orgId, selectedBrandKitId, brandContext]);

  return {
    isGenerating,
    generationProgress,
    generatedVideos,
    setGeneratedVideos,
    handleGenerate,
    error,
    setError,
    loadExistingVideos,
    isLoadingVideos,
  };
}

export default useVideoGeneration;
