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
  Download,
  Trash2,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { BrandPicker, BrandMode, AnalyzedBrandProfile } from '@/components/ads/brand-picker';
import { ModelDropdown } from '@/components/ads/model-dropdown';
import { GeneratedGrid, GeneratedImage } from './generated-grid';
import { BrandKit } from '@/modules/brand-kits/types';
import { LlmProfile } from '@/modules/llm/types';
import { ImageGeneration, ImageAspectRatio } from '@/modules/image-generation/types';
import { ImageProvider } from '@/modules/image-generation/types';
import Image from 'next/image';

type AspectRatio = '3:2' | '1:1' | '2:3';
type CreativeMode = 'chat' | 'make';

const IMAGE_VARIANTS = [
  { value: 'dall-e-3', label: 'DALL·E 3 (OpenAI)' },
  { value: 'imagen-3', label: 'Imagen 3 (Google)' },
];

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

interface ImageGeneratorProps {
  displayName: string;
  brandKits: BrandKit[];
  llmProfiles: LlmProfile[];
  orgId: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Proposed ad copy from chat - user confirms before generating
interface ProposedCopy {
  headline: string;
  primaryText: string;
  ctaText: string;
  imageDirection: string;
  confirmed: boolean;
}

export function ImageGenerator({ displayName, brandKits, llmProfiles, orgId }: ImageGeneratorProps) {
  const STORAGE_KEY = `image-chat-${orgId}`;

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
  const [selectedAspect, setSelectedAspect] = useState<AspectRatio>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  // Model selection
  const [selectedChatModel, setSelectedChatModel] = useState<string>('gpt-4o');
  const [selectedImageModel, setSelectedImageModel] = useState<string>('dall-e-3');
  const [variantImageModels, setVariantImageModels] = useState<string[]>([]);
  const [availableApis, setAvailableApis] = useState<AvailableApis>({
    openai: true,
    gemini: false,
    anthropic: false,
  });

  // Chat state
  const [creativeMode, setCreativeMode] = useState<CreativeMode>('make');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [proposedCopy, setProposedCopy] = useState<ProposedCopy | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  
  // Preview state
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  // Derived state
  const isInChatSession = chatMessages.length > 0;
  const canGenerate = proposedCopy?.confirmed || (creativeMode === 'make' && prompt.trim().length > 0);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Persist chat + copy so users can continue later
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.chatMessages) {
        const restored = (parsed.chatMessages as any[]).map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setChatMessages(restored);
      }
      if (parsed.proposedCopy) setProposedCopy(parsed.proposedCopy);
      if (parsed.selectedBrandKitId) setSelectedBrandKitId(parsed.selectedBrandKitId);
      if (parsed.selectedImageModel) setSelectedImageModel(parsed.selectedImageModel);
      if (parsed.selectedChatModel) setSelectedChatModel(parsed.selectedChatModel);
    } catch (err) {
      console.warn('Failed to restore chat history', err);
    }
  }, [STORAGE_KEY]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = {
      chatMessages,
      proposedCopy,
      selectedBrandKitId,
      selectedImageModel,
      selectedChatModel,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [STORAGE_KEY, chatMessages, proposedCopy, selectedBrandKitId, selectedImageModel, selectedChatModel]);

  // Check available APIs on mount
  useEffect(() => {
    const checkAvailableApis = async () => {
      try {
        const res = await fetch(`/api/org/available-apis?orgId=${orgId}`);
        const data = await res.json();
        if (data.success) {
          setAvailableApis(data.apis);
          if (data.apis.openai) {
            setSelectedChatModel('gpt-4o');
            setSelectedImageModel('dall-e-3');
          } else if (data.apis.gemini) {
            setSelectedChatModel('gemini-pro');
            setSelectedImageModel('imagen-3');
          }
        }
      } catch (err) {
        console.error('Failed to check available APIs:', err);
      }
    };
    checkAvailableApis();
  }, [orgId]);

  // Load existing images on mount
  const loadExistingImages = useCallback(async () => {
    try {
      setIsLoadingImages(true);
      const res = await fetch(`/api/images?orgId=${orgId}`);
      const data = await res.json();
      if (data.success && data.images) {
        const mapped: GeneratedImage[] = data.images.map((img: ImageGeneration) => ({
          id: img.id,
          url: img.result_url || '',
          prompt: img.prompt_used || '',
          style: img.style,
          createdAt: new Date(img.created_at),
        }));
        setGeneratedImages(mapped);
      }
    } catch (err) {
      console.error('Failed to load images:', err);
    } finally {
      setIsLoadingImages(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadExistingImages();
  }, [loadExistingImages]);

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
        values: selectedBrandKit.strategy?.values,
      };
    }
    if (brandMode === 'analyze' && activeBrand) {
      return {
        businessName: activeBrand.business_name,
        description: activeBrand.description,
        colors: activeBrand.colors?.map((c) => c.value).filter(Boolean),
        brandVoice: activeBrand.strategy?.brand_voice,
        targetAudience: activeBrand.strategy?.target_audience,
        values: activeBrand.strategy?.values,
      };
    }
    return undefined;
  }, [brandMode, selectedBrandKit, activeBrand]);

  // Model helpers
  const getImageProvider = (): ImageProvider => {
    if (selectedImageModel.includes('dall-e')) return 'openai';
    if (selectedImageModel.includes('imagen') || selectedImageModel.includes('gemini')) return 'gemini';
    return 'openai';
  };

  const getImageModelName = (): string => {
    switch (selectedImageModel) {
      case 'dall-e-3': return 'dall-e-3';
      case 'imagen-3': return 'imagen-3';
      case 'gemini-imagen': return 'gemini-2.0-flash';
      default: return 'dall-e-3';
    }
  };

  const getChatModelName = (): string => {
    switch (selectedChatModel) {
      case 'gpt-4o': return 'gpt-4o';
      case 'gpt-4o-mini': return 'gpt-4o-mini';
      case 'claude-3.5': return 'claude-3-5-sonnet-20241022';
      case 'gemini-pro': return 'gemini-1.5-pro';
      default: return 'gpt-4o-mini';
    }
  };

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
    } catch (error) {
      console.error('Brand analyze failed', error);
    } finally {
      setIsAnalyzingBrand(false);
    }
  };

  // Chat handler - discuss ideas, propose copy
  const handleChat = async () => {
    if (!prompt.trim()) return;
    
    setIsChatting(true);
    setError(null);
    
    const userMessage: ChatMessage = {
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
      let systemPrompt = `You are a creative advertising expert helping create image ads. 

Your job is to:
1. Discuss the user's ad concept and goals
2. When you have enough information, propose specific ad copy with this EXACT format:

---PROPOSED AD COPY---
HEADLINE: [catchy headline text]
PRIMARY TEXT: [supporting body copy]
CTA: [call-to-action button text]
IMAGE DIRECTION: [brief visual description for image generation]
---END COPY---

Always propose copy when you have a clear idea. Ask clarifying questions if needed first.
Be concise and actionable.`;
      
      if (brandContext) {
        systemPrompt += `\n\nBrand Context:\n- Brand: ${brandContext.businessName || brandContext.brandName || 'Unknown'}\n`;
        if (brandContext.description) systemPrompt += `- Description: ${brandContext.description}\n`;
        if (brandContext.brandVoice) systemPrompt += `- Brand Voice: ${brandContext.brandVoice}\n`;
        if (brandContext.targetAudience) systemPrompt += `- Target Audience: ${brandContext.targetAudience}\n`;
        if (brandContext.values?.length) systemPrompt += `- Values: ${brandContext.values.join(', ')}\n`;
        if (brandContext.colors?.length) systemPrompt += `- Brand Colors: ${brandContext.colors.join(', ')}\n`;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          systemPrompt,
          model: getChatModelName(),
          orgId,
        }),
      });

      const data = await res.json();
      if (data.content) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);

        // Try to extract proposed copy from the response
        const copyMatch = data.content.match(/---PROPOSED AD COPY---([\s\S]*?)---END COPY---/);
        if (copyMatch) {
          const copyText = copyMatch[1];
          const headline = copyText.match(/HEADLINE:\s*(.+)/)?.[1]?.trim() || '';
          const primaryText = copyText.match(/PRIMARY TEXT:\s*(.+)/)?.[1]?.trim() || '';
          const cta = copyText.match(/CTA:\s*(.+)/)?.[1]?.trim() || '';
          const imageDir = copyText.match(/IMAGE DIRECTION:\s*(.+)/)?.[1]?.trim() || '';
          
          if (headline || primaryText) {
            setProposedCopy({
              headline,
              primaryText,
              ctaText: cta || 'Learn More',
              imageDirection: imageDir || 'Professional ad image matching the copy',
              confirmed: false,
            });
          }
        }
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Chat failed:', err);
      setError('Failed to get response from AI');
    } finally {
      setIsChatting(false);
    }
  };

  // Generate image handler
  const handleGenerate = async () => {
    if (!proposedCopy?.confirmed) {
      setError('Confirm headline, primary text, CTA, and image direction before generating.');
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    setGenerationProgress(8);
    
    try {
      const brandContext = getSelectedBrandContext();
      
      // Structured JSON prompt for better layout fidelity
      const colors = activeBrand?.colors?.map((c) => c.value).filter(Boolean).slice(0, 4);
      const voice = activeBrand?.strategy?.brand_voice || '';
      const targetAudience = activeBrand?.strategy?.target_audience || '';
      const promptSpec = {
        copy: {
          headline: proposedCopy.headline,
          primary_text: proposedCopy.primaryText,
          cta_text: proposedCopy.ctaText,
        },
        visual_direction: proposedCopy.imageDirection,
        aspect: selectedAspect,
        brand: {
          colors,
          voice: voice || undefined,
          target_audience: targetAudience || undefined,
        },
        layout: {
          logo: 'Place logo as a badge in top-right or bottom-right with padding, no stretching.',
          hierarchy: 'Headline above body, clear CTA button, generous spacing, mobile-safe margins.',
          text_rules: 'Headline <= 45 characters, body concise, CTA standard (e.g., Learn More, Shop Now).',
          background: 'Avoid noisy/low-contrast areas behind text; keep CTA high-contrast.',
        },
        accessibility: {
          contrast: 'Meet WCAG AA contrast for text and CTA.',
          legibility: 'Use clean fonts, avoid tiny text, keep padding around text and buttons.',
        },
      };
      const enhancedPrompt = `${JSON.stringify(promptSpec, null, 2)}\nGenerate a professional digital ad image following this spec exactly.`;

      const aspectRatioMap: Record<AspectRatio, ImageAspectRatio> = {
        '1:1': '1:1',
        '3:2': '3:2',
        '2:3': '2:3',
      };

      const modelsToUse = variantImageModels.length ? Array.from(new Set(variantImageModels)) : [selectedImageModel];
      const batchedImages: GeneratedImage[] = [];

      for (let i = 0; i < modelsToUse.length; i++) {
        const model = modelsToUse[i];
        setGenerationProgress(Math.min(20 + i * 40, 90));
        const res = await fetch('/api/images/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId,
            prompt: enhancedPrompt,
            provider: model.includes('dall-e') ? 'openai' : model.includes('imagen') || model.includes('gemini') ? 'gemini' : getImageProvider(),
            model,
            aspectRatio: aspectRatioMap[selectedAspect],
            numberOfImages: 1,
            brandContext,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to generate image');
        }

        const newImages: GeneratedImage[] = data.images.map((img: ImageGeneration) => ({
          id: `${img.id}-${model}`,
          url: img.result_url || '',
          prompt: img.prompt_used || enhancedPrompt,
          style: `${img.style || ''} (${model})`,
          createdAt: new Date(img.created_at),
        }));
        batchedImages.push(...newImages);
      }

      setGeneratedImages((prev) => [...batchedImages, ...prev]);
      setPrompt('');
      
      // Reset proposed copy after successful generation
      if (proposedCopy?.confirmed) {
        setProposedCopy(null);
        setChatMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-feedback`,
            role: 'assistant',
            content: 'Images ready. How do these look? Share feedback or switch models for another variant.',
            timestamp: new Date(),
          },
        ]);
      }
      setGenerationProgress(100);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate image';
      setError(message);
      console.error('Image generation failed:', err);
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

  // Handle keyboard submit - Enter to send, Shift+Enter for newline
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
  const updateProposedCopy = (field: keyof ProposedCopy, value: string) => {
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
              What <span className="text-purple-600">Ads</span> would you like today?
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
                    placeholder={creativeMode === 'chat' ? "Tell me about your ad idea..." : "Describe the ad you want to create..."}
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
                        onUploadReference={(file) => {
                          const url = URL.createObjectURL(file);
                          setReferenceImages((prev) => [url, ...prev].slice(0, 4));
                        }}
                      />

                      <ModelDropdown
                        availableApis={availableApis}
                        mode={creativeMode}
                        selectedChatModel={selectedChatModel}
                        selectedImageModel={selectedImageModel}
                        onChatModelChange={setSelectedChatModel}
                        onImageModelChange={setSelectedImageModel}
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
                          <Wand2 className="size-3.5" />
                          Make
                        </button>
                      </div>
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
                    ? 'Chat mode: Discuss your idea, AI will propose copy for you to confirm before generating.'
                    : 'Make mode: Directly generate images from your description.'}
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

          {/* Generated Images */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Recent generations</h3>
                <p className="text-sm text-slate-500">
                  {isGenerating ? 'Generating your ad...' : 'Your generated images appear here.'}
                </p>
              </div>
              <span className="text-sm text-slate-500">{generatedImages.length} created</span>
            </div>
            <GeneratedGrid images={generatedImages} isLoading={isGenerating || isLoadingImages} />
          </section>
        </div>
      </div>
    );
  }

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
            What <span className="text-purple-600">Ads</span> would you like today?
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
                  placeholder={creativeMode === 'chat' ? "Tell me about your ad idea..." : "Describe the ad you want to create..."}
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
                      onUploadReference={(file) => {
                        const url = URL.createObjectURL(file);
                        setReferenceImages((prev) => [url, ...prev].slice(0, 4));
                      }}
                    />

                    <ModelDropdown
                      availableApis={availableApis}
                      mode={creativeMode}
                      selectedChatModel={selectedChatModel}
                      selectedImageModel={selectedImageModel}
                      onChatModelChange={setSelectedChatModel}
                      onImageModelChange={setSelectedImageModel}
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
                        <Wand2 className="size-3.5" />
                        Make
                      </button>
                    </div>
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
                  ? 'Chat mode: Discuss your idea, AI will propose copy for you to confirm before generating.'
                  : 'Make mode: Directly generate images from your description.'}
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

        {/* Generated Images */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent generations</h3>
              <p className="text-sm text-slate-500">
                {isGenerating ? 'Generating your ad...' : 'Your generated images appear here.'}
              </p>
            </div>
            <span className="text-sm text-slate-500">{generatedImages.length} created</span>
          </div>
          <GeneratedGrid images={generatedImages} isLoading={isGenerating || isLoadingImages} />
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
            <h2 className="text-lg font-semibold text-slate-900">Image Preview</h2>
            <p className="text-sm text-slate-500">{generatedImages.length} images generated</p>
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
              <span>Building ad layout with safe logo + CTA placement</span>
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
          {/* Proposed Copy Card */}
          {proposedCopy && (
            <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-[0_22px_80px_-58px_rgba(15,23,42,0.7)] backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-[#c8b5ff]/35 via-[#b7d8ff]/25 to-[#6ad9ff]/35 opacity-90 pointer-events-none" />
              <div className="relative p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-purple-600" />
                    <h3 className="font-semibold text-slate-900">Proposed Ad Copy</h3>
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
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
                      Headline
                    </label>
                    <input
                      value={proposedCopy.headline}
                      onChange={(e) => updateProposedCopy('headline', e.target.value)}
                      placeholder="Main headline for this ad"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
                      Primary Text
                    </label>
                    <textarea
                      value={proposedCopy.primaryText}
                      onChange={(e) => updateProposedCopy('primaryText', e.target.value)}
                      rows={2}
                      placeholder="Supporting body copy"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
                        Button Text
                      </label>
                      <input
                        value={proposedCopy.ctaText}
                        onChange={(e) => updateProposedCopy('ctaText', e.target.value)}
                        placeholder="e.g. Shop Now"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
                        Image Aspect
                      </label>
                      <select
                        value={selectedAspect}
                        onChange={(e) => setSelectedAspect(e.target.value as AspectRatio)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                      >
                        <option value="1:1">1:1 Square</option>
                        <option value="3:2">3:2 Landscape</option>
                        <option value="2:3">2:3 Portrait</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
                      Generate Variants (multiple models)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {IMAGE_VARIANTS.map((opt) => {
                        const active = variantImageModels.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setVariantImageModels((prev) =>
                                active ? prev.filter((v) => v !== opt.value) : [...prev, opt.value]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              active
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                      <span className="text-[11px] text-slate-500">Pick 1-2 to get multi-model renditions.</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
                      Image Direction
                    </label>
                    <textarea
                      value={proposedCopy.imageDirection}
                      onChange={(e) => updateProposedCopy('imageDirection', e.target.value)}
                      rows={2}
                      placeholder="Visual style and elements for the image"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      Edit the copy above, then confirm to enable generation.
                    </p>
                    {!proposedCopy.confirmed ? (
                      <Button
                        onClick={handleConfirmCopy}
                        className="rounded-full bg-purple-600 text-white hover:bg-purple-700 px-4"
                        size="sm"
                      >
                        <CheckCircle2 className="size-4 mr-1.5" />
                        Confirm & Make
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
                          <Wand2 className="size-4 mr-1.5" />
                        )}
                        Generate Image
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Images Grid */}
          {generatedImages.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Generated Images
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {generatedImages.slice(0, 6).map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer hover:ring-2 hover:ring-purple-500/50 transition-all"
                    onClick={() => setSelectedImage(img)}
                  >
                    <Image src={img.url} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
              {/* Feedback card after generation */}
              <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">How do these look?</p>
                    <p className="text-xs text-slate-500">Share feedback or switch models for another take.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCreativeMode('chat');
                        setPrompt('Looks good. Create a small variation with the same layout.');
                      }}
                    >
                      Looks good — iterate
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setCreativeMode('chat');
                        setPrompt('Adjust the layout: move logo to bottom-right badge and try a different CTA color.');
                      }}
                    >
                      Needs changes
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Tip: toggle another model above (e.g., Imagen 3) for a second version.</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!proposedCopy && generatedImages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-center py-20">
              <div className="text-slate-400">
                <MessageSquare className="size-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Keep chatting to discuss your ad idea.</p>
                <p className="text-xs mt-1">AI will propose copy when ready.</p>
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
                <MessageSquare className="size-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Creative Assistant</p>
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
            {/* Controls Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Brand Picker */}
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
                onUploadReference={(file) => {
                  const url = URL.createObjectURL(file);
                  setReferenceImages((prev) => [url, ...prev].slice(0, 4));
                }}
              />

              {/* Model Dropdown */}
              <ModelDropdown
                availableApis={availableApis}
                mode={creativeMode}
                selectedChatModel={selectedChatModel}
                selectedImageModel={selectedImageModel}
                onChatModelChange={setSelectedChatModel}
                onImageModelChange={setSelectedImageModel}
              />

              {/* Chat / Make Mode Toggle */}
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
                  <Wand2 className="size-3" />
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
                  placeholder={creativeMode === 'chat' ? "Ask for ideas..." : "Describe your ad..."}
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
