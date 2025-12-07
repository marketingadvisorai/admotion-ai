'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpRight, 
  AudioLines, 
  Loader2, 
  AlertCircle, 
  MessageSquare, 
  Wand2, 
  Send,
  Trash2,
  Sparkles,
  CheckCircle2,
  X,
  Video,
  Clock,
  Volume2,
} from 'lucide-react';
import { BrandPicker, BrandMode, AnalyzedBrandProfile } from '@/components/ads/brand-picker';
import { ModelDropdown } from '@/components/ads/model-dropdown';
import { ResultGridVideo } from '@/components/ads/result-grid-video';
import { useVideoChatSession, VideoChatMessage, ProposedVideoCopy, VideoDuration, VideoModel } from './use-video-chat-session';
import { BrandKit } from '@/modules/brand-kits/types';
import { LlmProfile } from '@/modules/llm/types';
import { VideoGeneration } from '@/modules/video-generation/types';
import { VIDEO_MODELS } from '@/modules/video-generation/providers/factory';
import { AspectRatioVideo, GeneratedVideo } from './types';

type CreativeMode = 'chat' | 'make';

interface VideoGeneratorProps {
  displayName: string;
  brandKits: BrandKit[];
  llmProfiles: LlmProfile[];
  orgId: string;
}

interface AvailableApis {
  openai: boolean;
  gemini: boolean;
  anthropic: boolean;
}

interface BrandIdentityLite {
  business_name?: string;
  description?: string;
  logo_url?: string;
  colors?: Array<{ name: string; value: string; type: string }>;
  strategy?: { brand_voice?: string; target_audience?: string; values?: string[] };
}

export function VideoGenerator({ displayName, brandKits, llmProfiles, orgId }: VideoGeneratorProps) {
  // Brand state
  const [brandKitOptions, setBrandKitOptions] = useState<BrandKit[]>(brandKits);
  const [analyzerProfiles, setAnalyzerProfiles] = useState<AnalyzedBrandProfile[]>([]);
  const [selectedBrandKitId, setSelectedBrandKitId] = useState<string>('');
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>('');
  const [brandMode, setBrandMode] = useState<BrandMode>('none');
  const [brandUrl, setBrandUrl] = useState('');
  const [brandAnalysis, setBrandAnalysis] = useState<BrandIdentityLite | null>(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);

  // Prompt & generation state
  const [prompt, setPrompt] = useState('');
  const [selectedAspect, setSelectedAspect] = useState<AspectRatioVideo>('16:9');
  const [duration, setDuration] = useState<VideoDuration>(10);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioStyle, setAudioStyle] = useState<string>('upbeat');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  // Model selection
  const [selectedChatModel, setSelectedChatModel] = useState<string>('gpt-5.1');
  const [selectedVideoModel, setSelectedVideoModel] = useState<VideoModel>('sora-2-pro');
  const [variantVideoModels, setVariantVideoModels] = useState<VideoModel[]>([]);
  const [availableApis, setAvailableApis] = useState<AvailableApis>({
    openai: true,
    gemini: false,
    anthropic: false,
  });

  // Chat state
  const [creativeMode, setCreativeMode] = useState<CreativeMode>('make');
  const [chatMessages, setChatMessages] = useState<VideoChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [proposedCopy, setProposedCopy] = useState<ProposedVideoCopy | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  // Derived state
  const isInChatSession = chatMessages.length > 0;
  const canGenerate = proposedCopy?.confirmed || (creativeMode === 'make' && prompt.trim().length > 0);

  // Chat session persistence
  const { saveSession, createNewSession, isLoading: isSessionLoading } = useVideoChatSession({
    orgId,
    onSessionLoaded: (session) => {
      if (session.messages?.length) {
        setChatMessages(session.messages);
      }
      if (session.proposedCopy) {
        setProposedCopy(session.proposedCopy);
      }
      if (session.brandKitId) {
        setSelectedBrandKitId(session.brandKitId);
      }
      if (session.selectedModels) {
        setSelectedChatModel(session.selectedModels.chatModel);
        setSelectedVideoModel(session.selectedModels.videoModel);
        setVariantVideoModels(session.selectedModels.variantModels);
      }
    },
  });

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Save session when state changes
  useEffect(() => {
    if (isSessionLoading) return;
    saveSession({
      messages: chatMessages,
      proposedCopy,
      brandKitId: selectedBrandKitId || null,
      selectedModels: {
        chatModel: selectedChatModel,
        videoModel: selectedVideoModel,
        variantModels: variantVideoModels,
      },
    });
  }, [chatMessages, proposedCopy, selectedBrandKitId, selectedChatModel, selectedVideoModel, variantVideoModels, saveSession, isSessionLoading]);

  // Check available APIs on mount
  useEffect(() => {
    const checkAvailableApis = async () => {
      try {
        const res = await fetch(`/api/org/available-apis?orgId=${orgId}`);
        const data = await res.json();
        if (data.success) {
          setAvailableApis(data.apis);
          if (data.apis.openai) {
            setSelectedChatModel('gpt-5.1');
            setSelectedVideoModel('sora-2-pro');
          } else if (data.apis.gemini) {
            setSelectedChatModel('gemini-3-pro');
            setSelectedVideoModel('veo-3.1');
          }
        }
      } catch (err) {
        console.error('Failed to check available APIs:', err);
      }
    };
    checkAvailableApis();
  }, [orgId]);

  // Load existing videos on mount
  const loadExistingVideos = useCallback(async () => {
    try {
      setIsLoadingVideos(true);
      const res = await fetch(`/api/videos?orgId=${orgId}`);
      const data = await res.json();
      if (data.success && data.videos) {
        const mapped: GeneratedVideo[] = data.videos.map((vid: VideoGeneration) => ({
          id: vid.id,
          cover: vid.thumbnail_url || vid.result_url || '',
          url: vid.result_url,
          prompt: vid.prompt_used || '',
          provider: vid.model,
          duration: vid.duration,
          aspect: vid.aspect_ratio as AspectRatioVideo,
          createdAt: new Date(vid.created_at),
          status: vid.status,
        }));
        setGeneratedVideos(mapped);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setIsLoadingVideos(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadExistingVideos();
  }, [loadExistingVideos]);

  // Brand helpers
  const selectedBrandKit = useMemo(
    () => brandKitOptions.find((kit) => kit.id === selectedBrandKitId),
    [brandKitOptions, selectedBrandKitId]
  );
  const selectedAnalyzer = useMemo(
    () => analyzerProfiles.find((item) => item.id === selectedAnalyzerId),
    [analyzerProfiles, selectedAnalyzerId]
  );
  const activeBrand = brandMode === 'kit' ? selectedBrandKit : brandMode === 'analyze' ? selectedAnalyzer?.analysis || brandAnalysis : null;

  const getSelectedBrandContext = useCallback(() => {
    if (brandMode === 'kit' && selectedBrandKit) {
      return {
        brandId: selectedBrandKit.id,
        brandName: selectedBrandKit.name,
        businessName: selectedBrandKit.business_name,
        description: selectedBrandKit.description,
        colors: selectedBrandKit.colors?.map((c) => c.value).filter(Boolean),
        brandVoice: selectedBrandKit.strategy?.brand_voice,
        targetAudience: selectedBrandKit.strategy?.target_audience,
      };
    }
    if (brandMode === 'analyze' && activeBrand) {
      return {
        businessName: activeBrand.business_name,
        description: activeBrand.description,
        colors: activeBrand.colors?.map((c) => c.value).filter(Boolean),
        brandVoice: activeBrand.strategy?.brand_voice,
        targetAudience: activeBrand.strategy?.target_audience,
      };
    }
    return undefined;
  }, [brandMode, selectedBrandKit, activeBrand]);

  // Brand analyze handler
  const handleAnalyzeBrand = async (url: string, model?: string) => {
    if (!url.trim()) return;
    setIsAnalyzingBrand(true);
    try {
      const res = await fetch('/api/brand/create-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, orgId, model }),
      });
      const data = await res.json();
      if (data?.success && data?.data?.kit && data?.data?.analysis) {
        const kit = data.data.kit as BrandKit;
        const analysis = data.data.analysis as BrandIdentityLite;
        setBrandKitOptions((prev) => {
          const exists = prev.some((item) => item.id === kit.id);
          return exists ? prev : [kit, ...prev];
        });
        const profile: AnalyzedBrandProfile = {
          id: kit.id,
          url,
          name: analysis.business_name || kit.name || url,
          analysis,
          kitId: kit.id,
        };
        setAnalyzerProfiles((prev) => [profile, ...prev.filter((p) => p.id !== profile.id)]);
        setSelectedAnalyzerId(profile.id);
        setBrandAnalysis(analysis);
        setBrandMode('analyze');
        setSelectedBrandKitId(kit.id);
      }
    } catch (err) {
      console.error('Brand analyze failed', err);
    } finally {
      setIsAnalyzingBrand(false);
    }
  };

  // Chat handler
  const handleChat = async () => {
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
    const currentPrompt = prompt;
    setPrompt('');

    try {
      const brandContext = getSelectedBrandContext();
      let systemPrompt = `You are a creative video advertising expert helping create short video ads (8-12 seconds).

Your job is to:
1. Discuss the user's video ad concept and goals
2. When you have enough information, propose the VIDEO AD elements with this EXACT format:

---PROPOSED VIDEO AD---
HEADLINE: [catchy headline text for end frame overlay]
SUBHEADLINE: [optional subheadline]
CTA: [call-to-action button text]
SCENE_DESCRIPTION: [detailed visual description of the video scene]
VISUAL_THEME: [cinematic/energetic/minimalist/bold/luxurious/playful]
AUDIO_STYLE: [upbeat/cinematic/electronic/ambient/dramatic]
DURATION: [8/10/12 seconds]
---END VIDEO AD---

Focus on:
- SCENE_DESCRIPTION: What happens visually in the video (people, actions, settings, camera movements)
- VISUAL_THEME: The overall look and feel
- AUDIO_STYLE: Background music mood
- Text overlays appear in the final 2 seconds

Be concise and actionable. Ask clarifying questions if needed first.`;
      
      if (brandContext) {
        systemPrompt += `\n\nBrand Context:\n- Brand: ${brandContext.businessName || brandContext.brandName || 'Unknown'}\n`;
        if (brandContext.description) systemPrompt += `- Description: ${brandContext.description}\n`;
        if (brandContext.brandVoice) systemPrompt += `- Brand Voice: ${brandContext.brandVoice}\n`;
        if (brandContext.targetAudience) systemPrompt += `- Target Audience: ${brandContext.targetAudience}\n`;
        if (brandContext.colors?.length) systemPrompt += `- Brand Colors: ${brandContext.colors.join(', ')}\n`;
      }

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

        // Extract proposed video ad from response
        const copyMatch = data.content.match(/---PROPOSED VIDEO AD---([\s\S]*?)---END VIDEO AD---/);
        if (copyMatch) {
          const copyText = copyMatch[1];
          const headline = copyText.match(/HEADLINE:\s*(.+)/)?.[1]?.trim() || '';
          const subheadline = copyText.match(/SUBHEADLINE:\s*(.+)/)?.[1]?.trim();
          const cta = copyText.match(/CTA:\s*(.+)/)?.[1]?.trim() || '';
          const sceneDesc = copyText.match(/SCENE_DESCRIPTION:\s*(.+)/)?.[1]?.trim() || '';
          const visualTheme = copyText.match(/VISUAL_THEME:\s*(.+)/)?.[1]?.trim() || 'cinematic';
          const audioStyleMatch = copyText.match(/AUDIO_STYLE:\s*(.+)/)?.[1]?.trim() || 'upbeat';
          const durationMatch = copyText.match(/DURATION:\s*(\d+)/)?.[1];
          
          if (headline) {
            setProposedCopy({
              headline,
              subheadline,
              ctaText: cta || 'Learn More',
              sceneDescription: sceneDesc,
              visualTheme,
              audioStyle: audioStyleMatch,
              overlayElements: [
                { type: 'headline', text: headline, timing: 'final 2 seconds' },
                { type: 'cta', text: cta || 'Learn More', timing: 'final 2 seconds' },
              ],
              duration: (parseInt(durationMatch || '10') as VideoDuration) || 10,
              confirmed: false,
            });
            if (durationMatch) {
              setDuration(parseInt(durationMatch) as VideoDuration);
            }
            setAudioStyle(audioStyleMatch);
          }
        }
      }
    } catch (err) {
      console.error('Chat failed:', err);
      setError('Failed to get response from AI');
    } finally {
      setIsChatting(false);
    }
  };

  // Generate video handler
  const handleGenerate = async () => {
    if (!proposedCopy?.confirmed && creativeMode === 'chat') {
      setError('Confirm the video ad details before generating.');
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    setGenerationProgress(10);
    
    try {
      const brandContext = getSelectedBrandContext();
      
      const requestBody = {
        orgId,
        brandKitId: selectedBrandKitId || undefined,
        prompt: proposedCopy ? undefined : prompt,
        provider: selectedVideoModel.startsWith('sora') ? 'openai' : 'google',
        model: selectedVideoModel,
        aspectRatio: selectedAspect,
        duration,
        style: proposedCopy?.visualTheme,
        audio: {
          enabled: audioEnabled,
          style: audioStyle,
        },
        adCopy: proposedCopy ? {
          headline: proposedCopy.headline,
          subheadline: proposedCopy.subheadline,
          ctaText: proposedCopy.ctaText,
        } : undefined,
        sceneDescription: proposedCopy ? {
          description: proposedCopy.sceneDescription,
          visualTheme: proposedCopy.visualTheme,
        } : undefined,
        visualTheme: proposedCopy?.visualTheme,
        brandContext,
      };

      setGenerationProgress(30);
      
      const res = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      setGenerationProgress(60);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate video');
      }

      // Add to generated videos list
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
      };

      setGeneratedVideos((prev) => [newVideo, ...prev]);
      setPrompt('');
      
      // Reset proposed copy after successful generation
      if (proposedCopy?.confirmed) {
        setProposedCopy(null);
        setChatMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-feedback`,
            role: 'assistant',
            content: `Video generation started! Job ID: ${data.jobId}. The video is processing and will appear in your gallery when ready. How does the concept look? Share feedback or try a different model for variations.`,
            timestamp: new Date(),
          },
        ]);
      }
      
      setGenerationProgress(100);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate video';
      setError(message);
      console.error('Video generation failed:', err);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 600);
    }
  };

  // Submit handler based on mode
  const handleSubmit = () => {
    if (creativeMode === 'chat') {
      handleChat();
    } else {
      handleGenerate();
    }
  };

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim()) {
        handleSubmit();
      }
    }
  };

  // Clear chat
  const handleClearChat = () => {
    setChatMessages([]);
    setProposedCopy(null);
    setPrompt('');
  };

  // Confirm proposed copy
  const handleConfirmCopy = () => {
    if (proposedCopy) {
      setProposedCopy({ ...proposedCopy, confirmed: true });
      setCreativeMode('make');
    }
  };

  // Update proposed copy field
  const updateProposedCopy = (field: keyof ProposedVideoCopy, value: string | number) => {
    if (proposedCopy) {
      setProposedCopy({ ...proposedCopy, [field]: value, confirmed: false });
    }
  };

  // =============================================
  // RENDER: Initial View (no chat started)
  // =============================================
  if (!isInChatSession) {
    return (
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(128,115,255,0.08),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(82,196,255,0.12),transparent_32%),#f5f6fb] min-h-screen rounded-[32px]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[15%] right-[10%] top-[-220px] h-72 rounded-full bg-gradient-to-r from-[#c6d8ff]/70 via-[#e8d8ff]/60 to-[#c4f1f9]/70 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-16 md:px-10 space-y-10">
          {/* Header */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" className="rounded-full border-white/60 bg-white/80 backdrop-blur-xl text-slate-800 shadow-sm hover:bg-white">
              150 Credit
            </Button>
            <Button size="sm" className="rounded-full bg-slate-900 text-white shadow-md shadow-slate-900/10 hover:bg-slate-800">
              Share
            </Button>
          </div>

          {/* Hero */}
          <div className="text-center space-y-3">
            <p className="text-sm text-slate-500">Good Afternoon, {displayName}</p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
              What <span className="text-purple-600">Video Ads</span> would you like today?
            </h1>
          </div>

          {/* Main Prompt Box */}
          <div className="flex justify-center">
            <div className="w-full max-w-3xl">
              <div className="relative">
                <div className="absolute inset-0 rounded-[28px] bg-gradient-to-r from-[#c8b5ff] via-[#b7d8ff] to-[#6ad9ff] opacity-90" />
                <div className="relative rounded-[26px] bg-white shadow-[0_25px_80px_-60px_rgba(15,23,42,0.55)] border border-white">
                  <textarea
                    ref={promptInputRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={3}
                    placeholder={creativeMode === 'chat' ? "Tell me about your video ad idea..." : "Describe the video ad you want to create..."}
                    className="w-full min-h-[140px] resize-none rounded-[26px] border-0 bg-transparent px-5 pt-5 pb-24 text-base md:text-lg leading-relaxed text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-0"
                  />

                  <div className="flex items-center justify-between px-4 pb-4 -mt-14">
                    <div className="flex items-center gap-2">
                      <BrandPicker
                        brandKits={brandKitOptions}
                        analyzedBrands={analyzerProfiles}
                        llmProfiles={llmProfiles}
                        selectedBrandKitId={selectedBrandKitId}
                        selectedAnalyzerId={selectedAnalyzerId}
                        brandUrl={brandUrl}
                        isAnalyzing={isAnalyzingBrand}
                        analysis={activeBrand}
                        onSelectKit={(id) => {
                          setSelectedBrandKitId(id);
                          setBrandMode('kit');
                          setSelectedAnalyzerId('');
                          setBrandAnalysis(null);
                        }}
                        onSelectAnalyzer={(id) => {
                          const profile = analyzerProfiles.find((item) => item.id === id);
                          if (!profile) return;
                          setSelectedAnalyzerId(id);
                          setBrandMode('analyze');
                          setBrandAnalysis(profile.analysis);
                          if (profile.kitId) setSelectedBrandKitId(profile.kitId);
                        }}
                        onAnalyze={handleAnalyzeBrand}
                        onUrlChange={setBrandUrl}
                        onClear={() => {
                          setBrandMode('none');
                          setSelectedBrandKitId('');
                          setSelectedAnalyzerId('');
                          setBrandAnalysis(null);
                        }}
                        onUploadReference={() => {}}
                      />

                      <ModelDropdown
                        availableApis={availableApis}
                        mode={creativeMode}
                        selectedChatModel={selectedChatModel}
                        selectedImageModel={selectedVideoModel}
                        onChatModelChange={setSelectedChatModel}
                        onImageModelChange={(m) => setSelectedVideoModel(m as VideoModel)}
                        mediaType="video"
                      />

                      {/* Mode Toggle */}
                      <div className="flex items-center gap-1 rounded-full bg-white/80 border border-white/60 p-1">
                        <button
                          type="button"
                          onClick={() => setCreativeMode('chat')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                            creativeMode === 'chat'
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <MessageSquare className="size-3.5" />
                          Chat
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreativeMode('make')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                            creativeMode === 'make'
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Video className="size-3.5" />
                          Make
                        </button>
                      </div>

                      {/* Duration selector */}
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 border border-white/60">
                        <Clock className="size-3.5 text-slate-500" />
                        <select
                          value={duration}
                          onChange={(e) => setDuration(parseInt(e.target.value) as VideoDuration)}
                          className="text-xs bg-transparent border-0 focus:ring-0 text-slate-700"
                        >
                          <option value={6}>6s</option>
                          <option value={8}>8s</option>
                          <option value={10}>10s</option>
                          <option value={12}>12s</option>
                          <option value={15}>15s</option>
                        </select>
                      </div>

                      {/* Audio toggle */}
                      <button
                        type="button"
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          audioEnabled
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Volume2 className="size-3.5" />
                        Audio
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        className="h-12 w-12 rounded-[18px] bg-[#3178ff] text-white shadow-lg shadow-blue-500/20 hover:bg-[#2a6ae0]"
                        onClick={handleSubmit}
                        disabled={!prompt.trim() || isGenerating || isChatting}
                      >
                        {(isGenerating || isChatting) ? <Loader2 className="size-5 animate-spin" /> : <ArrowUpRight className="size-5" />}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-11 w-11 rounded-[16px] border-white/80 bg-white/90 shadow-sm text-slate-700"
                      >
                        <AudioLines className="size-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Helper text */}
                <p className="text-center text-xs text-slate-500 mt-3">
                  {creativeMode === 'chat' 
                    ? 'Chat mode: Discuss your idea, AI will propose video ad details for you to confirm.'
                    : 'Make mode: Directly generate videos from your description.'}
                  <span className="ml-2 text-slate-400">Enter to send • Shift+Enter for newline</span>
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 max-w-3xl mx-auto">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Generated Videos */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Recent generations</h3>
                <p className="text-sm text-slate-500">
                  {isGenerating ? 'Generating your video ad...' : 'Your generated videos appear here.'}
                </p>
              </div>
              <span className="text-sm text-slate-500">{generatedVideos.length} created</span>
            </div>
            <ResultGridVideo videos={generatedVideos} isLoading={isGenerating || isLoadingVideos} />
          </section>
        </div>
      </div>
    );
  }

  // =============================================
  // RENDER: Chat Session View (split panel)
  // =============================================
  return (
    <div className="relative overflow-hidden bg-[#f8f9fc] min-h-screen">
      <div className="flex h-screen">
        {/* Left Panel - Preview & Plan */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Video Preview</h2>
              <p className="text-sm text-slate-500">{generatedVideos.length} videos generated</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-lg" onClick={handleClearChat}>
                <Trash2 className="size-4 mr-1.5" />
                New Chat
              </Button>
            </div>
          </div>

          {/* Progress */}
          {(isGenerating || generationProgress > 0) && (
            <div className="px-6 pt-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Generating video with {selectedVideoModel}...</span>
                <span>{Math.min(100, generationProgress)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, generationProgress)}%` }}
                />
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Proposed Video Ad Card */}
            {proposedCopy && (
              <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-[0_22px_80px_-58px_rgba(15,23,42,0.7)] backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-[#c8b5ff]/35 via-[#b7d8ff]/25 to-[#6ad9ff]/35 opacity-90 pointer-events-none" />
                <div className="relative p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-5 text-purple-600" />
                      <h3 className="font-semibold text-slate-900">Proposed Video Ad</h3>
                    </div>
                    {proposedCopy.confirmed ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="size-3.5" />
                        Confirmed
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                        Review & Edit
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3">
                    {/* Headline */}
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
                        Headline (End Frame)
                      </label>
                      <input
                        value={proposedCopy.headline}
                        onChange={(e) => updateProposedCopy('headline', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    {/* Scene Description */}
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
                        Scene Description
                      </label>
                      <textarea
                        value={proposedCopy.sceneDescription}
                        onChange={(e) => updateProposedCopy('sceneDescription', e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    {/* Settings Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
                          CTA Text
                        </label>
                        <input
                          value={proposedCopy.ctaText}
                          onChange={(e) => updateProposedCopy('ctaText', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
                          Duration
                        </label>
                        <select
                          value={proposedCopy.duration}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) as VideoDuration;
                            updateProposedCopy('duration', val);
                            setDuration(val);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        >
                          <option value={6}>6 seconds</option>
                          <option value={8}>8 seconds</option>
                          <option value={10}>10 seconds</option>
                          <option value={12}>12 seconds</option>
                          <option value={15}>15 seconds</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
                          Aspect Ratio
                        </label>
                        <select
                          value={selectedAspect}
                          onChange={(e) => setSelectedAspect(e.target.value as AspectRatioVideo)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        >
                          <option value="16:9">16:9 Landscape</option>
                          <option value="9:16">9:16 Vertical</option>
                          <option value="1:1">1:1 Square</option>
                        </select>
                      </div>
                    </div>

                    {/* Model Selection */}
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2 block">
                        Video Model
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {VIDEO_MODELS.map((opt) => {
                          const active = selectedVideoModel === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setSelectedVideoModel(opt.value)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                active
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {opt.label}
                              {opt.recommended && <span className="ml-1 text-[10px]">★</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500">
                        Edit the details above, then confirm to generate.
                      </p>
                      {!proposedCopy.confirmed ? (
                        <Button
                          onClick={handleConfirmCopy}
                          className="rounded-full bg-purple-600 text-white hover:bg-purple-700 px-4"
                          size="sm"
                        >
                          <CheckCircle2 className="size-4 mr-1.5" />
                          Confirm & Generate
                        </Button>
                      ) : (
                        <Button
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 px-4"
                          size="sm"
                        >
                          {isGenerating ? (
                            <Loader2 className="size-4 mr-1.5 animate-spin" />
                          ) : (
                            <Video className="size-4 mr-1.5" />
                          )}
                          Generate Video
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Videos Grid */}
            {generatedVideos.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Generated Videos
                </h4>
                <ResultGridVideo videos={generatedVideos.slice(0, 6)} />
              </div>
            )}

            {/* Empty state */}
            {!proposedCopy && generatedVideos.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-center py-20">
                <div className="text-slate-400">
                  <MessageSquare className="size-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Keep chatting to discuss your video ad idea.</p>
                  <p className="text-xs mt-1">AI will propose details when ready.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div className="w-[400px] flex flex-col bg-white">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Video className="size-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Video Creative Assistant</p>
                <p className="text-xs text-slate-500">{chatMessages.length} messages</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-700" onClick={handleClearChat}>
              New Chat
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isChatting && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="size-4 animate-spin text-slate-500" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="size-4" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)}>
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <BrandPicker
                brandKits={brandKitOptions}
                analyzedBrands={analyzerProfiles}
                llmProfiles={llmProfiles}
                selectedBrandKitId={selectedBrandKitId}
                selectedAnalyzerId={selectedAnalyzerId}
                brandUrl={brandUrl}
                isAnalyzing={isAnalyzingBrand}
                analysis={activeBrand}
                onSelectKit={(id) => {
                  setSelectedBrandKitId(id);
                  setBrandMode('kit');
                  setSelectedAnalyzerId('');
                  setBrandAnalysis(null);
                }}
                onSelectAnalyzer={(id) => {
                  const profile = analyzerProfiles.find((item) => item.id === id);
                  if (!profile) return;
                  setSelectedAnalyzerId(id);
                  setBrandMode('analyze');
                  setBrandAnalysis(profile.analysis);
                  if (profile.kitId) setSelectedBrandKitId(profile.kitId);
                }}
                onAnalyze={handleAnalyzeBrand}
                onUrlChange={setBrandUrl}
                onClear={() => {
                  setBrandMode('none');
                  setSelectedBrandKitId('');
                  setSelectedAnalyzerId('');
                  setBrandAnalysis(null);
                }}
                onUploadReference={() => {}}
              />

              <ModelDropdown
                availableApis={availableApis}
                mode={creativeMode}
                selectedChatModel={selectedChatModel}
                selectedImageModel={selectedVideoModel}
                onChatModelChange={setSelectedChatModel}
                onImageModelChange={(m) => setSelectedVideoModel(m as VideoModel)}
              />

              <div className="flex items-center gap-0.5 rounded-full bg-slate-100 border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setCreativeMode('chat')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                    creativeMode === 'chat'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <MessageSquare className="size-3" />
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => setCreativeMode('make')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                    creativeMode === 'make'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Video className="size-3" />
                  Make
                </button>
              </div>
            </div>

            {/* Text Input */}
            <div className="relative">
              <div className="absolute inset-0 rounded-[20px] bg-gradient-to-r from-[#c8b5ff] via-[#b7d8ff] to-[#6ad9ff] opacity-90" />
              <div className="relative rounded-[18px] bg-white shadow-lg border border-white">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder={creativeMode === 'chat' ? "Ask for ideas..." : "Describe your video..."}
                  className="w-full min-h-[60px] resize-none rounded-[18px] border-0 bg-transparent px-4 pt-3 pb-12 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">↵ Enter</span>
                  <Button
                    type="button"
                    size="icon"
                    className="h-8 w-8 rounded-xl bg-purple-600 text-white shadow-md hover:bg-purple-700"
                    onClick={handleSubmit}
                    disabled={!prompt.trim() || isChatting || isGenerating}
                  >
                    {(isChatting || isGenerating) ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
