'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpRight, AudioLines, Loader2 } from 'lucide-react';
import { AspectDropdown, AspectOption } from '@/components/ads/aspect-dropdown';
import { BrandPicker, BrandMode, AnalyzedBrandProfile } from '@/components/ads/brand-picker';
import { ModelDropdown } from '@/components/ads/model-dropdown';
import { StyleDropdown } from '@/components/ads/style-dropdown';
import { QuickPrompts } from '@/components/ads/quick-prompts';
import { GeneratedGrid, GeneratedImage } from './generated-grid';
import { ImageStyle } from './style-selector';
import { BrandKit } from '@/modules/brand-kits/types';
import { LlmProfile } from '@/modules/llm/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface ImageRecipe {
  id: string;
  name: string;
  model: string;
  aspect: AspectRatio;
  style: ImageStyle;
  prompt: string;
}

const aspectOptions: AspectOption<AspectRatio>[] = [
  { value: '3:2', label: '3:2', hint: 'Landscape', visualWidth: 'w-9' },
  { value: '1:1', label: '1:1', hint: 'Square', visualWidth: 'w-7' },
  { value: '2:3', label: '2:3', hint: 'Portrait', visualWidth: 'w-6' },
];

const styleOptions: { id: ImageStyle; label: string; description: string }[] = [
  { id: 'auto', label: 'Auto', description: 'Let the model pick the vibe' },
  { id: 'clean_modern', label: 'Clean & Modern', description: 'Minimal shapes, crisp gradients' },
  { id: 'bold', label: 'Bold', description: 'High contrast, loud colors' },
  { id: 'minimalist', label: 'Minimalist', description: 'Soft neutrals, calm spacing' },
  { id: 'luxury', label: 'Luxury', description: 'Deep tones with sheen' },
  { id: 'playful', label: 'Playful', description: 'Rounded, colorful, energetic' },
  { id: 'natural', label: 'Natural', description: 'Organic textures, greens' },
];

const promptExamples = [
  {
    id: 'sneaker',
    title: 'Timeless Classics',
    prompt: 'Create a vibrant sneaker ad featuring a confident model and a modern gradient backdrop highlighting comfort and movement.',
    image: 'https://images.unsplash.com/photo-1542293787938-4d273c1130f6?auto=format&fit=crop&w=600&q=80',
    aspect: '1:1' as AspectRatio,
    style: 'bold' as ImageStyle,
  },
  {
    id: 'food',
    title: 'Weekend Deals',
    prompt: 'Design a cozy food delivery ad with warm lighting, rustic props, and a hero bowl of ramen beside fresh ingredients.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    aspect: '3:2' as AspectRatio,
    style: 'clean_modern' as ImageStyle,
  },
  {
    id: 'grocery',
    title: 'Fresh Greens',
    prompt: 'Craft a grocery delivery ad with crisp veggies, soft gradients, and overlayed pricing badges that feel approachable.',
    image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=600&q=80',
    aspect: '2:3' as AspectRatio,
    style: 'natural' as ImageStyle,
  },
  {
    id: 'hotel',
    title: 'Escape Campaign',
    prompt: 'Generate a luxury travel ad featuring a serene resort pool at golden hour, with refined typography and subtle glow.',
    image: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=600&q=80',
    aspect: '3:2' as AspectRatio,
    style: 'luxury' as ImageStyle,
  },
  {
    id: 'poster',
    title: 'Playful Poster',
    prompt: 'Design a playful poster with pastel gradients, rounded shapes, and a friendly mascot waving beside the CTA.',
    image: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=600&q=80',
    aspect: '1:1' as AspectRatio,
    style: 'playful' as ImageStyle,
  },
];

export function ImageGenerator({ displayName, brandKits, llmProfiles, orgId }: ImageGeneratorProps) {
  const [brandKitOptions, setBrandKitOptions] = useState<BrandKit[]>(brandKits);
  const [analyzerProfiles, setAnalyzerProfiles] = useState<AnalyzedBrandProfile[]>([]);
  const [prompt, setPrompt] = useState(
    'Generate a creative, eye-catching ad concept for a random product or service. Include a catchy headline, a short tagline, and a brief description that grabs attention.'
  );
  const [selectedAspect, setSelectedAspect] = useState<AspectRatio>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('clean_modern');
  const [selectedLlmProfile, setSelectedLlmProfile] = useState<string>(() => llmProfiles[0]?.slug || 'gpt-5.1');
  const [selectedBrandKitId, setSelectedBrandKitId] = useState<string>(brandKitOptions[0]?.id || '');
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>('');
  const [brandMode, setBrandMode] = useState<BrandMode>(brandKitOptions.length ? 'kit' : 'none');
  const [brandUrl, setBrandUrl] = useState('');
  const [brandAnalysis, setBrandAnalysis] = useState<BrandIdentityLite | null>(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<ImageRecipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('none');

  const imagePresets: Array<{ id: string; label: string; aspect: AspectRatio; style: ImageStyle; prompt: string; badge?: string }> = [
    {
      id: 'fb-feed',
      label: 'FB Feed',
      aspect: '1:1',
      style: 'clean_modern',
      prompt: 'Facebook feed ad: bold headline, 2 benefits, CTA button copy, keep it punchy.',
      badge: 'Square',
    },
    {
      id: 'ig-story',
      label: 'IG Story',
      aspect: '2:3',
      style: 'bold',
      prompt: 'Instagram story ad: vertical framing, safe zones, quick hook, swipe-up CTA.',
      badge: 'Vertical',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      aspect: '3:2',
      style: 'minimalist',
      prompt: 'LinkedIn ad: professional tone, ROI stat, CTA to download/demo, clear logo lockup.',
      badge: 'Landscape',
    },
  ];

  const applyImagePreset = (presetId: string) => {
    const preset = imagePresets.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedAspect(preset.aspect);
    setSelectedStyle(preset.style);
    setPrompt(preset.prompt);
  };

  const saveRecipe = () => {
    const name = window.prompt('Name this recipe');
    if (!name) return;
    const recipe: ImageRecipe = {
      id: crypto.randomUUID(),
      name,
      model: selectedLlmProfile,
      aspect: selectedAspect,
      style: selectedStyle,
      prompt,
    };
    setRecipes((prev) => [recipe, ...prev]);
    setSelectedRecipeId(recipe.id);
  };

  const applyRecipe = (id: string) => {
    if (id === 'none') {
      setSelectedRecipeId('none');
      return;
    }
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) return;
    setSelectedLlmProfile(recipe.model);
    setSelectedAspect(recipe.aspect);
    setSelectedStyle(recipe.style);
    setPrompt(recipe.prompt);
    setSelectedRecipeId(recipe.id);
  };

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
    return [`Aspect: ${selectedAspect}. Style: ${selectedStyle.replace('_', ' ')}.`, brandLine, prompt].filter(Boolean).join(' ');
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
    setPrompt(nextPrompt);
    if (!nextPrompt.trim()) return;
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    const newImages: GeneratedImage[] = Array.from({ length: 3 }).map((_, i) => {
      const fallback = promptExamples[(i + generatedImages.length) % promptExamples.length];
      return {
        id: `${Date.now()}-${i}`,
        url: fallback.image,
        prompt: nextPrompt,
        style: selectedStyle,
        createdAt: new Date(),
      };
    });
    setGeneratedImages((prev) => [...newImages, ...prev]);
    setIsGenerating(false);
  };

  const handleUseExample = (id: string) => {
    const example = promptExamples.find((item) => item.id === id);
    if (!example) return;
    setPrompt(example.prompt);
    setSelectedAspect(example.aspect);
    setSelectedStyle(example.style);
  };

  const quickPromptCards = promptExamples.map((item) => ({
    id: item.id,
    title: item.title,
    prompt: item.prompt,
    image: item.image,
    meta: `${item.aspect} · ${item.style.replace('_', ' ')}`,
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

        <div className="flex flex-wrap items-center justify-center gap-3">
          {imagePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyImagePreset(preset.id)}
              className="rounded-xl border border-white/70 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:shadow"
            >
              <span className="mr-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                {preset.badge}
              </span>
              {preset.label}
            </button>
          ))}
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

                    <AspectDropdown value={selectedAspect} options={aspectOptions} onChange={setSelectedAspect} />
                    <StyleDropdown value={selectedStyle} options={styleOptions} onChange={setSelectedStyle} />
                    <ModelDropdown profiles={llmProfiles} value={selectedLlmProfile} onChange={setSelectedLlmProfile} />
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="rounded-full" onClick={saveRecipe}>
                        Save recipe
                      </Button>
                      <Select value={selectedRecipeId} onValueChange={applyRecipe}>
                        <SelectTrigger size="sm" className="rounded-full bg-white/80 text-slate-800">
                          <SelectValue placeholder="Apply recipe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {recipes.map((recipe) => (
                            <SelectItem key={recipe.id} value={recipe.id}>
                              {recipe.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent generations</h3>
              <p className="text-sm text-slate-500">Draft results appear here after you generate.</p>
            </div>
            <span className="text-sm text-slate-500">{generatedImages.length} created</span>
          </div>
          <GeneratedGrid images={generatedImages} isLoading={isGenerating} />
        </section>
      </div>
    </div>
  );
}
