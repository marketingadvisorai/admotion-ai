'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpRight, AudioLines, Loader2, AlertCircle } from 'lucide-react';
import { BrandPicker, BrandMode, AnalyzedBrandProfile } from '@/components/ads/brand-picker';
import { ModelDropdown } from '@/components/ads/model-dropdown';
import { QuickPrompts } from '@/components/ads/quick-prompts';
import { GeneratedGrid, GeneratedImage } from './generated-grid';
import { BrandKit } from '@/modules/brand-kits/types';
import { LlmProfile } from '@/modules/llm/types';
import { ImageGeneration, ImageProvider, ImageAspectRatio } from '@/modules/image-generation/types';

type AspectRatio = '3:2' | '1:1' | '2:3';

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

const promptExamples = [
  {
    id: 'sneaker',
    title: 'Timeless Classics',
    prompt: 'Create a vibrant sneaker ad featuring a confident model and a modern gradient backdrop highlighting comfort and movement.',
    image: 'https://images.unsplash.com/photo-1542293787938-4d273c1130f6?auto=format&fit=crop&w=600&q=80',
    aspect: '1:1' as AspectRatio,
  },
  {
    id: 'food',
    title: 'Weekend Deals',
    prompt: 'Design a cozy food delivery ad with warm lighting, rustic props, and a hero bowl of ramen beside fresh ingredients.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    aspect: '3:2' as AspectRatio,
  },
  {
    id: 'grocery',
    title: 'Fresh Greens',
    prompt: 'Craft a grocery delivery ad with crisp veggies, soft gradients, and overlayed pricing badges that feel approachable.',
    image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=600&q=80',
    aspect: '2:3' as AspectRatio,
  },
  {
    id: 'hotel',
    title: 'Escape Campaign',
    prompt: 'Generate a luxury travel ad featuring a serene resort pool at golden hour, with refined typography and subtle glow.',
    image: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=600&q=80',
    aspect: '3:2' as AspectRatio,
  },
  {
    id: 'poster',
    title: 'Playful Poster',
    prompt: 'Design a playful poster with pastel gradients, rounded shapes, and a friendly mascot waving beside the CTA.',
    image: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=600&q=80',
    aspect: '1:1' as AspectRatio,
  },
];

export function ImageGenerator({ displayName, brandKits, llmProfiles, orgId }: ImageGeneratorProps) {
  const [brandKitOptions, setBrandKitOptions] = useState<BrandKit[]>(brandKits);
  const [analyzerProfiles, setAnalyzerProfiles] = useState<AnalyzedBrandProfile[]>([]);
  const [prompt, setPrompt] = useState(
    'Generate a creative, eye-catching ad concept for a random product or service. Include a catchy headline, a short tagline, and a brief description that grabs attention.'
  );
  const [selectedAspect, setSelectedAspect] = useState<AspectRatio>('1:1');
  const initialModel = llmProfiles.find((p) => ['gpt-5.1', 'nano-banana'].includes(p.slug))?.slug || 'gpt-5.1';
  const [selectedLlmProfile, setSelectedLlmProfile] = useState<string>(initialModel);
  const [selectedBrandKitId, setSelectedBrandKitId] = useState<string>(brandKitOptions[0]?.id || '');
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>('');
  const [brandMode, setBrandMode] = useState<BrandMode>(brandKitOptions.length ? 'kit' : 'none');
  const [brandUrl, setBrandUrl] = useState('');
  const [brandAnalysis, setBrandAnalysis] = useState<BrandIdentityLite | null>(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ImageProvider>('openai');
  const [isLoadingImages, setIsLoadingImages] = useState(true);

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

  const handleGenerate = async () => {
    const nextPrompt = buildPrompt();
    if (!nextPrompt.trim()) return;
    
    setError(null);
    setIsGenerating(true);
    
    try {
      // Build brand context from active brand
      const brandContext = activeBrand ? {
        businessName: activeBrand.business_name,
        colors: activeBrand.colors?.map((c) => c.value).filter(Boolean),
        brandVoice: activeBrand.strategy?.brand_voice,
        targetAudience: activeBrand.strategy?.target_audience,
      } : undefined;

      // Map aspect ratio format
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
          prompt: nextPrompt,
          provider: selectedProvider,
          aspectRatio: aspectRatioMap[selectedAspect],
          numberOfImages: 1,
          brandContext,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      // Map the response to GeneratedImage format
      const newImages: GeneratedImage[] = data.images.map((img: ImageGeneration) => ({
        id: img.id,
        url: img.result_url || '',
        prompt: img.prompt_used || nextPrompt,
        style: img.style,
        createdAt: new Date(img.created_at),
      }));

      setGeneratedImages((prev) => [...newImages, ...prev]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate image';
      setError(message);
      console.error('Image generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseExample = (id: string) => {
    const example = promptExamples.find((item) => item.id === id);
    if (!example) return;
    setPrompt(example.prompt);
    setSelectedAspect(example.aspect);
  };

  const quickPromptCards = promptExamples.map((item) => ({
    id: item.id,
    title: item.title,
    prompt: item.prompt,
    image: item.image,
    meta: '',
  }));

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
            <div className="relative">
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-r from-[#c8b5ff] via-[#b7d8ff] to-[#6ad9ff] opacity-90" />
              <div className="relative rounded-[26px] bg-white shadow-[0_25px_80px_-60px_rgba(15,23,42,0.55)] border border-white">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="Ask for an ad..."
                  className="min-h-[140px] resize-none rounded-[26px] border-0 bg-transparent px-5 pt-5 pb-24 text-base md:text-lg leading-relaxed text-slate-900 placeholder:text-slate-500 focus-visible:border-0 focus-visible:ring-0"
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

                    <ModelDropdown profiles={llmProfiles} value={selectedLlmProfile} onChange={setSelectedLlmProfile} />

                    {/* Provider Selector */}
                    <div className="flex items-center gap-1 rounded-full bg-white/80 border border-white/60 p-1">
                      <button
                        onClick={() => setSelectedProvider('openai')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                          selectedProvider === 'openai'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        DALL-E 3
                      </button>
                      <button
                        onClick={() => setSelectedProvider('gemini')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                          selectedProvider === 'gemini'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Gemini
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      className="h-12 w-12 rounded-[18px] bg-[#3178ff] text-white shadow-lg shadow-blue-500/20 hover:bg-[#2a6ae0]"
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      aria-label="Generate ad"
                    >
                      {isGenerating ? <Loader2 className="size-5 animate-spin" /> : <ArrowUpRight className="size-5" />}
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
          </div>
        </div>

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 text-center md:text-left">
            Create a starting prompt with the examples below
          </p>
          <QuickPrompts items={quickPromptCards} onSelect={handleUseExample} />
        </section>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Generation Failed</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent generations</h3>
              <p className="text-sm text-slate-500">Draft results appear here after you generate.</p>
            </div>
            <span className="text-sm text-slate-500">{generatedImages.length} created</span>
          </div>
          <GeneratedGrid images={generatedImages} isLoading={isGenerating || isLoadingImages} />
        </section>
      </div>
    </div>
  );
}
