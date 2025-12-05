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
  RefreshCw,
  Trash2,
  Maximize2,
  Copy,
  Check
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

// Available API configurations for models
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

export function ImageGenerator({ displayName, brandKits, llmProfiles, orgId }: ImageGeneratorProps) {
  const [brandKitOptions, setBrandKitOptions] = useState<BrandKit[]>(brandKits);
  const [analyzerProfiles, setAnalyzerProfiles] = useState<AnalyzedBrandProfile[]>([]);
  const [prompt, setPrompt] = useState('');
  const [selectedAspect, setSelectedAspect] = useState<AspectRatio>('1:1');
  
  // Separate model selection for chat and image generation
  const [selectedChatModel, setSelectedChatModel] = useState<string>('gpt-4o');
  const [selectedImageModel, setSelectedImageModel] = useState<string>('dall-e-3');
  
  // Track available APIs based on org secrets
  const [availableApis, setAvailableApis] = useState<AvailableApis>({
    openai: true, // Default to true, will be verified
    gemini: false,
    anthropic: false,
  });
  const [selectedBrandKitId, setSelectedBrandKitId] = useState<string>('');
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>('');
  const [brandMode, setBrandMode] = useState<BrandMode>('none');
  const [brandUrl, setBrandUrl] = useState('');
  const [brandAnalysis, setBrandAnalysis] = useState<BrandIdentityLite | null>(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [creativeMode, setCreativeMode] = useState<CreativeMode>('make');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Check available APIs on mount
  useEffect(() => {
    const checkAvailableApis = async () => {
      try {
        const res = await fetch(`/api/org/available-apis?orgId=${orgId}`);
        const data = await res.json();
        if (data.success) {
          setAvailableApis(data.apis);
          // Set default models based on availability
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

  // Check if we're in active chat mode (has messages)
  const isInChatSession = chatMessages.length > 0;

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

  const selectedBrandKit = useMemo(
    () => brandKitOptions.find((kit) => kit.id === selectedBrandKitId),
    [brandKitOptions, selectedBrandKitId]
  );
  const selectedAnalyzer = useMemo(
    () => analyzerProfiles.find((item) => item.id === selectedAnalyzerId),
    [analyzerProfiles, selectedAnalyzerId]
  );
  const activeBrand = brandMode === 'kit' ? selectedBrandKit : brandMode === 'analyze' ? selectedAnalyzer?.analysis || brandAnalysis : null;

  const buildPrompt = () => {
    const colors = activeBrand?.colors?.map((c) => c.value).filter(Boolean).slice(0, 3).join(', ');
    const voice =
      activeBrand?.strategy?.brand_voice ||
      activeBrand?.strategy?.target_audience ||
      activeBrand?.strategy?.values?.join(', ');
    const brandLine = activeBrand ? `Brand tone: ${voice || 'clean'}. Colors: ${colors || 'balanced'}.` : '';
    return [`Aspect: ${selectedAspect}.`, brandLine, prompt].filter(Boolean).join(' ');
  };

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

  // Get the image provider based on selected image model
  const getImageProvider = (): ImageProvider => {
    if (selectedImageModel.includes('dall-e')) return 'openai';
    if (selectedImageModel.includes('imagen') || selectedImageModel.includes('gemini')) return 'gemini';
    return 'openai'; // default
  };

  // Get the actual model name for the API
  const getImageModelName = (): string => {
    switch (selectedImageModel) {
      case 'dall-e-3': return 'dall-e-3';
      case 'imagen-3': return 'imagen-3';
      case 'gemini-imagen': return 'gemini-2.0-flash';
      default: return 'dall-e-3';
    }
  };

  // Get chat model for API
  const getChatModelName = (): string => {
    switch (selectedChatModel) {
      case 'gpt-4o': return 'gpt-4o';
      case 'gpt-4o-mini': return 'gpt-4o-mini';
      case 'claude-3.5': return 'claude-3-5-sonnet-20241022';
      case 'gemini-pro': return 'gemini-1.5-pro';
      default: return 'gpt-4o-mini';
    }
  };

  // Get the selected brand kit with full data
  const getSelectedBrandContext = () => {
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
        keyDifferentiators: selectedBrandKit.strategy?.key_differentiators,
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
  };

  // Handle Chat mode - get AI ideas without generating images (text only)
  const handleChat = async () => {
    if (!prompt.trim() || creativeMode !== 'chat') return;
    
    setIsChatting(true);
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
      // Build brand context for chat
      const brandContext = getSelectedBrandContext();
      let systemPrompt = `You are a creative advertising expert. Help the user brainstorm ad concepts, headlines, taglines, and visual ideas. Be specific and actionable. When you have a solid concept, suggest they switch to "Make" mode to generate the images.`;
      
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

  // Handle Make mode - generate images using selected image model with brand context
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setError(null);
    setIsGenerating(true);
    
    try {
      // Get full brand context for image generation
      const brandContext = getSelectedBrandContext();
      const enhancedPrompt = buildPrompt();

      const aspectRatioMap: Record<AspectRatio, ImageAspectRatio> = {
        '1:1': '1:1',
        '3:2': '3:2',
        '2:3': '2:3',
      };

      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          prompt: enhancedPrompt,
          provider: getImageProvider(),
          model: getImageModelName(),
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
        id: img.id,
        url: img.result_url || '',
        prompt: img.prompt_used || enhancedPrompt,
        style: img.style,
        createdAt: new Date(img.created_at),
      }));

      setGeneratedImages((prev) => [...newImages, ...prev]);
      
      // Clear prompt after successful generation
      setPrompt('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate image';
      setError(message);
      console.error('Image generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle submit based on mode
  const handleSubmit = () => {
    if (creativeMode === 'chat') {
      handleChat();
    } else {
      handleGenerate();
    }
  };

  // Copy prompt to clipboard
  const handleCopyPrompt = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear chat and start fresh
  const handleClearChat = () => {
    setChatMessages([]);
    setPrompt('');
  };

  // Original prompt box design (exactly as shown in screenshot)
  const OriginalPromptBox = () => (
    <div className="relative">
      <div className="absolute inset-0 rounded-[28px] bg-gradient-to-r from-[#c8b5ff] via-[#b7d8ff] to-[#6ad9ff] opacity-90" />
      <div className="relative rounded-[26px] bg-white shadow-[0_25px_80px_-60px_rgba(15,23,42,0.55)] border border-white">
        <textarea
          value={prompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Ask for an ad..."
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

            {/* Chat / Make Mode Toggle */}
            <div className="flex items-center gap-1 rounded-full bg-white/80 border border-white/60 p-1">
              <button
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
              size="icon"
              className="h-12 w-12 rounded-[18px] bg-[#3178ff] text-white shadow-lg shadow-blue-500/20 hover:bg-[#2a6ae0]"
              onClick={handleSubmit}
              disabled={!prompt.trim() || isGenerating || isChatting}
              aria-label={creativeMode === 'chat' ? 'Send message' : 'Generate ad'}
            >
              {(isGenerating || isChatting) ? <Loader2 className="size-5 animate-spin" /> : <ArrowUpRight className="size-5" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11 rounded-[16px] border-white/80 bg-white/90 shadow-sm text-slate-700"
              aria-label="Voice input"
            >
              <AudioLines className="size-5" />
            </Button>
          </div>
        </div>
      </div>
      {referenceImages.length > 0 && (
        <div className="px-5 pb-3 text-xs text-slate-500">
          {referenceImages.length} reference image{referenceImages.length > 1 ? 's' : ''} attached
        </div>
      )}
    </div>
  );

  // Compact prompt box for sidebar (smaller version of original design)
  const CompactPromptBox = () => (
    <div className="relative">
      <div className="absolute inset-0 rounded-[20px] bg-gradient-to-r from-[#c8b5ff] via-[#b7d8ff] to-[#6ad9ff] opacity-90" />
      <div className="relative rounded-[18px] bg-white shadow-lg border border-white">
        <textarea
          value={prompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          rows={2}
          placeholder={creativeMode === 'chat' ? "Ask for ideas..." : "Describe your ad..."}
          className="w-full min-h-[70px] resize-none rounded-[18px] border-0 bg-transparent px-4 pt-3 pb-14 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
        />

        <div className="flex items-center justify-between px-3 pb-3 -mt-12">
          <div className="flex items-center gap-1.5">
            <ModelDropdown
              availableApis={availableApis}
              mode={creativeMode}
              selectedChatModel={selectedChatModel}
              selectedImageModel={selectedImageModel}
              onChatModelChange={setSelectedChatModel}
              onImageModelChange={setSelectedImageModel}
              compact
            />
            <div className="flex items-center gap-0.5 rounded-full bg-slate-100 p-0.5">
              <button
                onClick={() => setCreativeMode('chat')}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                  creativeMode === 'chat' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <MessageSquare className="size-3" />
              </button>
              <button
                onClick={() => setCreativeMode('make')}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                  creativeMode === 'make' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Wand2 className="size-3" />
              </button>
            </div>
          </div>
          <Button
            size="icon"
            className="h-9 w-9 rounded-xl bg-[#3178ff] text-white shadow-md hover:bg-[#2a6ae0]"
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating || isChatting}
          >
            {(isGenerating || isChatting) ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  // Initial view (no chat started) - ORIGINAL DESIGN
  if (!isInChatSession) {
    return (
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(128,115,255,0.08),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(82,196,255,0.12),transparent_32%),#f5f6fb] min-h-screen rounded-[32px]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[15%] right-[10%] top-[-220px] h-72 rounded-full bg-gradient-to-r from-[#c6d8ff]/70 via-[#e8d8ff]/60 to-[#c4f1f9]/70 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-16 md:px-10 space-y-10">
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" className="rounded-full border-white/60 bg-white/80 backdrop-blur-xl text-slate-800 shadow-sm hover:bg-white">
              150 Credit
            </Button>
            <Button size="sm" className="rounded-full bg-slate-900 text-white shadow-md shadow-slate-900/10 hover:bg-slate-800">
              Share
            </Button>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-slate-500">Good Afternoon, {displayName}</p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
              What <span className="text-purple-600">Ads</span> would you like today?
            </h1>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-3xl">
              <OriginalPromptBox />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Generation Failed</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
            </div>
          )}

          {/* Generated Images Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Recent generations</h3>
                <p className="text-sm text-slate-500">
                  {isGenerating ? 'Generating your ad...' : 'Draft results appear here after you generate.'}
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

  // Split-panel view (chat started) - like Windsurf IDE
  return (
    <div className="relative overflow-hidden bg-[#f8f9fc] min-h-screen">
      <div className="flex h-screen">
        {/* Left Panel - Preview & Images */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Image Preview</h2>
              <p className="text-sm text-slate-500">{generatedImages.length} images generated</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-lg">
                <Download className="size-4 mr-1.5" />
                Export All
              </Button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 overflow-auto p-6">
            {selectedImage ? (
              <div className="space-y-4">
                {/* Selected Image Large Preview */}
                <div className="relative aspect-square max-w-lg mx-auto rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
                  <Image
                    src={selectedImage.url}
                    alt={selectedImage.prompt || 'Generated image'}
                    fill
                    className="object-cover"
                  />
                  {/* Image Actions */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                      <Download className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                      <RefreshCw className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                      <Maximize2 className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-red-500 hover:text-red-600">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {/* Prompt Used */}
                <div className="max-w-lg mx-auto p-4 bg-white rounded-xl border border-slate-200">
                  <p className="text-xs font-medium text-slate-500 mb-1">Prompt used</p>
                  <p className="text-sm text-slate-700">{selectedImage.prompt}</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <Wand2 className="size-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select an image to preview</p>
                  <p className="text-xs mt-1">or generate new ones using the chat</p>
                </div>
              </div>
            )}

            {/* Image Thumbnails Grid */}
            {generatedImages.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">All Generations</p>
                <div className="grid grid-cols-4 gap-3">
                  {generatedImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage?.id === img.id
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <Image src={img.url} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div className="w-[380px] flex flex-col bg-white">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <MessageSquare className="size-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Creative Assistant</p>
                <p className="text-xs text-slate-500">{chatMessages.length} messages</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClearChat}>
              <Trash2 className="size-4 text-slate-400" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleCopyPrompt(msg.content, msg.id)}
                      className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="size-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          Copy
                        </>
                      )}
                    </button>
                  )}
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

          {/* Error Display */}
          {error && (
            <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4" />
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-auto">✕</button>
              </div>
            </div>
          )}

          {/* Compact Prompt Box */}
          <div className="p-4 border-t border-slate-200">
            <CompactPromptBox />
          </div>
        </div>
      </div>
    </div>
  );
}
