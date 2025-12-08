'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, AudioLines, Loader2, AlertCircle, MessageSquare, Trash2, Video, X } from 'lucide-react';
import { BrandPicker, BrandMode, AnalyzedBrandProfile } from '@/components/ads/brand-picker';
import { ModelDropdown } from '@/components/ads/model-dropdown';
import { PlatformSizeSelector } from '@/components/ads/platform-size-selector';
import { AdPlatform, AdSize, PLATFORM_CONFIGS, AD_SIZES } from '@/components/ads/ad-platform-types';
import { ResultGridVideo } from '@/components/ads/result-grid-video';
import { useVideoChatSession, VideoModel } from './use-video-chat-session';
import { ProposedVideoCard, VideoChatPanel, GenerationProgress } from './components';
import { useVideoGeneration } from './hooks';
import { AspectRatioVideo, GeneratedVideo } from './types';
import { ProposedVideoCopy, VideoDuration } from '@/modules/video-generation/types';
import { BrandKit } from '@/modules/brand-kits/types';
import { LlmProfile } from '@/modules/llm/types';

type CreativeMode = 'chat' | 'make';

interface VideoGeneratorProps {
  displayName: string;
  brandKits: BrandKit[];
  llmProfiles: LlmProfile[];
  orgId: string;
}

/**
 * VideoGenerator - Main orchestrator component for video ad creation
 * Uses modular hooks and components for maintainability
 * ~150 lines
 */
export function VideoGenerator({ displayName, brandKits, llmProfiles, orgId }: VideoGeneratorProps) {
  // Brand state
  const [brandKitOptions, setBrandKitOptions] = useState<BrandKit[]>(brandKits);
  const [analyzerProfiles, setAnalyzerProfiles] = useState<AnalyzedBrandProfile[]>([]);
  const [selectedBrandKitId, setSelectedBrandKitId] = useState('');
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState('');
  const [brandMode, setBrandMode] = useState<BrandMode>('none');
  const [brandUrl, setBrandUrl] = useState('');
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);

  // Multi-platform & size selection
  const [selectedPlatforms, setSelectedPlatforms] = useState<AdPlatform[]>(['google_ads']);
  const [selectedSizes, setSelectedSizes] = useState<AdSize[]>([AD_SIZES.landscape_16x9]);

  // Model & mode state
  const [selectedChatModel, setSelectedChatModel] = useState('gpt-5.1');
  const [selectedVideoModel, setSelectedVideoModel] = useState<VideoModel>('sora-2-pro');
  const [creativeMode, setCreativeMode] = useState<CreativeMode>('chat');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<VideoDuration>(10);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioStyle, setAudioStyle] = useState('upbeat');

  // Chat state
  const [chatMessages, setChatMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [proposedCopy, setProposedCopy] = useState<ProposedVideoCopy | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userStartedChatRef = useRef(false);
  const isInChatSession = userStartedChatRef.current && (chatMessages.length > 0 || proposedCopy !== null);

  // Brand context
  const selectedBrandKit = useMemo(() => brandKitOptions.find((k) => k.id === selectedBrandKitId), [brandKitOptions, selectedBrandKitId]);
  const brandContext = useMemo(() => {
    if (!selectedBrandKit) return undefined;
    return {
      brandId: selectedBrandKit.id,
      brandName: selectedBrandKit.name,
      businessName: selectedBrandKit.business_name,
      description: selectedBrandKit.description,
      colors: selectedBrandKit.colors?.map((c) => c.value).filter(Boolean),
      brandVoice: selectedBrandKit.strategy?.brand_voice,
      targetAudience: selectedBrandKit.strategy?.target_audience,
    };
  }, [selectedBrandKit]);

  // Video generation hook
  const {
    isGenerating,
    generationProgress,
    generatedVideos,
    handleGenerate: executeGenerate,
    loadExistingVideos,
    isLoadingVideos,
  } = useVideoGeneration({ orgId, selectedBrandKitId, brandContext });

  // Session persistence
  const { saveSession, createNewSession, isLoading: isSessionLoading } = useVideoChatSession({
    orgId,
    onSessionLoaded: (session) => {
      if (session.messages?.length) {
        setChatMessages(session.messages);
        userStartedChatRef.current = true;
      }
      if (session.proposedCopy) setProposedCopy(session.proposedCopy);
      if (session.brandKitId) setSelectedBrandKitId(session.brandKitId);
    },
  });

  useEffect(() => { loadExistingVideos(); }, [loadExistingVideos]);

  useEffect(() => {
    if (isSessionLoading) return;
    saveSession({
      messages: chatMessages,
      proposedCopy,
      brandKitId: selectedBrandKitId || null,
      selectedModels: { chatModel: selectedChatModel, videoModel: selectedVideoModel, variantModels: [] },
    });
  }, [chatMessages, proposedCopy, selectedBrandKitId, selectedChatModel, selectedVideoModel, saveSession, isSessionLoading]);

  // Handlers
  const handleClearChat = async () => {
    setChatMessages([]);
    setProposedCopy(null);
    setPrompt('');
    userStartedChatRef.current = false;
    await createNewSession();
  };

  const handleConfirmCopy = () => {
    if (proposedCopy) {
      setProposedCopy({ ...proposedCopy, confirmed: true });
      setCreativeMode('make');
    }
  };

  const handleGenerate = () => {
    if (!proposedCopy) return;
    executeGenerate({
      proposedCopy,
      selectedVideoModel,
      selectedPlatforms,
      selectedSizes,
      duration,
      audioEnabled,
      audioStyle,
    });
  };

  // Initial view (no chat started)
  if (!isInChatSession) {
    return (
      <InitialView
        displayName={displayName}
        prompt={prompt}
        setPrompt={setPrompt}
        creativeMode={creativeMode}
        setCreativeMode={setCreativeMode}
        selectedPlatforms={selectedPlatforms}
        setSelectedPlatforms={setSelectedPlatforms}
        selectedSizes={selectedSizes}
        setSelectedSizes={setSelectedSizes}
        brandKits={brandKitOptions}
        analyzerProfiles={analyzerProfiles}
        llmProfiles={llmProfiles}
        selectedBrandKitId={selectedBrandKitId}
        setSelectedBrandKitId={setSelectedBrandKitId}
        selectedAnalyzerId={selectedAnalyzerId}
        setSelectedAnalyzerId={setSelectedAnalyzerId}
        brandUrl={brandUrl}
        setBrandUrl={setBrandUrl}
        isAnalyzingBrand={isAnalyzingBrand}
        selectedChatModel={selectedChatModel}
        setSelectedChatModel={setSelectedChatModel}
        selectedVideoModel={selectedVideoModel}
        setSelectedVideoModel={setSelectedVideoModel}
        duration={duration}
        setDuration={setDuration}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        isChatting={isChatting}
        isGenerating={isGenerating}
        error={error}
        setError={setError}
        generatedVideos={generatedVideos}
        isLoadingVideos={isLoadingVideos}
        onSubmit={() => {
          userStartedChatRef.current = true;
          // Chat logic would go here
        }}
        orgId={orgId}
        setBrandMode={setBrandMode}
        setBrandKitOptions={setBrandKitOptions}
        setAnalyzerProfiles={setAnalyzerProfiles}
        setIsAnalyzingBrand={setIsAnalyzingBrand}
      />
    );
  }

  // Chat session view (split panel)
  return (
    <ChatSessionView
      generatedVideos={generatedVideos}
      proposedCopy={proposedCopy}
      setProposedCopy={setProposedCopy}
      selectedVideoModel={selectedVideoModel}
      setSelectedVideoModel={setSelectedVideoModel}
      isGenerating={isGenerating}
      generationProgress={generationProgress}
      chatMessages={chatMessages}
      prompt={prompt}
      setPrompt={setPrompt}
      isChatting={isChatting}
      error={error}
      setError={setError}
      creativeMode={creativeMode}
      setCreativeMode={setCreativeMode}
      onClearChat={handleClearChat}
      onConfirmCopy={handleConfirmCopy}
      onGenerate={handleGenerate}
      selectedPlatforms={selectedPlatforms}
      selectedSizes={selectedSizes}
      duration={duration}
      setDuration={setDuration}
    />
  );
}

// Sub-components are imported from separate files to keep this under 150 lines
import { InitialView } from './views/InitialView';
import { ChatSessionView } from './views/ChatSessionView';

export default VideoGenerator;
