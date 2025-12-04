'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpRight, AudioLines, Loader2 } from 'lucide-react';
import { AspectDropdown, AspectOption } from '@/components/ads/aspect-dropdown';
import { AnalyzedBrandProfile, BrandPicker } from '@/components/ads/brand-picker';
import { ModelDropdown } from '@/components/ads/model-dropdown';
import { QuickPrompts } from '@/components/ads/quick-prompts';
import { ResultGridVideo } from '@/components/ads/result-grid-video';
import { BrandKit } from '@/modules/brand-kits/types';
import { LlmProfile } from '@/modules/llm/types';
import { AspectRatioVideo, GeneratedVideo } from './types';

interface VideoGeneratorProps {
  displayName: string;
  brandKits: BrandKit[];
  llmProfiles: LlmProfile[];
  orgId: string;
}

interface BrandIdentityLite {
  business_name?: string;
  description?: string;
  logo_url?: string;
  colors?: Array<{ name: string; value: string; type: string }>;
  strategy?: { brand_voice?: string; target_audience?: string; values?: string[] };
}

const aspectOptions: AspectOption<AspectRatioVideo>[] = [
  { value: '16:9', label: '16:9', hint: 'Wide', visualWidth: 'w-10' },
  { value: '1:1', label: '1:1', hint: 'Square', visualWidth: 'w-7' },
  { value: '9:16', label: '9:16', hint: 'Vertical', visualWidth: 'w-5' },
];

const promptExamples = [
  {
    id: 'launch',
    title: 'Product Launch',
    prompt: 'Create a 10s launch video with upbeat pacing, fast cuts, and overlay text for a new smart bottle.',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80',
    aspect: '9:16' as AspectRatioVideo,
    duration: 10,
  },
  {
    id: 'food',
    title: 'Food Delivery',
    prompt: 'A cozy 8s food delivery ad with warm lighting, plated dishes, and a friendly CTA overlay.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    aspect: '16:9' as AspectRatioVideo,
    duration: 8,
  },
  {
    id: 'fitness',
    title: 'Fitness Teaser',
    prompt: 'Energetic 12s fitness promo with dynamic transitions, on-screen timers, and motivational copy.',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
    aspect: '9:16' as AspectRatioVideo,
    duration: 12,
  },
  {
    id: 'luxury',
    title: 'Luxury Stay',
    prompt: 'A 12s luxury hotel reel at golden hour, slow pans, elegant typography, subtle shimmer accents.',
    image: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=600&q=80',
    aspect: '16:9' as AspectRatioVideo,
    duration: 12,
  },
  {
    id: 'retail',
    title: 'Retail Sale',
    prompt: 'Snappy 6s retail sale teaser with bold pricing frames, animated stickers, and a loud CTA.',
    image: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=600&q=80',
    aspect: '1:1' as AspectRatioVideo,
    duration: 6,
  },
];

export function VideoGenerator({ displayName, brandKits, llmProfiles, orgId }: VideoGeneratorProps) {
  const [brandKitOptions, setBrandKitOptions] = useState<BrandKit[]>(brandKits);
  const [analyzerProfiles, setAnalyzerProfiles] = useState<AnalyzedBrandProfile[]>([]);
  const [prompt, setPrompt] = useState(
    'Create a 10s product promo with upbeat pacing, clear headline, CTA overlay, and brand-safe color grading.'
  );
  const [selectedAspect, setSelectedAspect] = useState<AspectRatioVideo>('16:9');
  const [duration, setDuration] = useState<number>(10);
  const initialModel = llmProfiles.find((p) => ['gpt-5.1', 'nano-banana'].includes(p.slug))?.slug || 'gpt-5.1';
  const [selectedLlmProfile, setSelectedLlmProfile] = useState<string>(initialModel);
  const [selectedBrandKitId, setSelectedBrandKitId] = useState<string>(brandKitOptions[0]?.id || '');
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>('');
  const [brandAnalysis, setBrandAnalysis] = useState<BrandIdentityLite | null>(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [brandUrl, setBrandUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const selectedBrandKit = useMemo(
    () => brandKitOptions.find((kit) => kit.id === selectedBrandKitId),
    [brandKitOptions, selectedBrandKitId]
  );
  const selectedAnalyzer = useMemo(
    () => analyzerProfiles.find((item) => item.id === selectedAnalyzerId),
    [analyzerProfiles, selectedAnalyzerId]
  );
  const activeBrand = selectedAnalyzer?.analysis || selectedBrandKit || brandAnalysis || null;

  const buildPrompt = () => {
    const colors = activeBrand?.colors?.map((c) => c.value).filter(Boolean).slice(0, 3).join(', ');
    const voice =
      activeBrand?.strategy?.brand_voice ||
      activeBrand?.strategy?.target_audience ||
      activeBrand?.strategy?.values?.join(', ');
    const brandLine = activeBrand ? `Brand tone: ${voice || 'clean'}. Colors: ${colors || 'balanced'}.` : '';
    return [`Video ${duration}s ${selectedAspect}.`, brandLine, prompt].filter(Boolean).join(' ');
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
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const newVideos: GeneratedVideo[] = Array.from({ length: 2 }).map((_, i) => {
      const sample = promptExamples[(i + generatedVideos.length) % promptExamples.length];
      return {
        id: `${Date.now()}-${i}`,
        cover: sample.image,
        prompt: nextPrompt,
        provider: selectedLlmProfile,
        duration,
        aspect: selectedAspect,
        createdAt: new Date(),
      };
    });
    setGeneratedVideos((prev) => [...newVideos, ...prev]);
    setIsGenerating(false);
  };

  const handleUseExample = (id: string) => {
    const example = promptExamples.find((item) => item.id === id);
    if (!example) return;
    setPrompt(example.prompt);
    setSelectedAspect(example.aspect);
    setDuration(example.duration);
  };

  const quickPromptCards = promptExamples.map((item) => ({
    id: item.id,
    title: item.title,
    prompt: item.prompt,
    image: item.image,
    meta: `${item.aspect} · ${item.duration}s`,
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
            What <span className="text-purple-600">Video Ads</span> would you like today?
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
                  placeholder="Ask for a video ad..."
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
                        setSelectedAnalyzerId('');
                        setBrandAnalysis(null);
                      }}
                      onSelectAnalyzer={(id) => {
                        const profile = analyzerProfiles.find((item) => item.id === id);
                        if (!profile) return;
                        setSelectedAnalyzerId(id);
                        setBrandAnalysis(profile.analysis);
                        if (profile.kitId) setSelectedBrandKitId(profile.kitId);
                      }}
                      onAnalyze={handleAnalyzeBrand}
                      onUrlChange={setBrandUrl}
                      onClear={() => {
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
                    <ModelDropdown profiles={llmProfiles} value={selectedLlmProfile} onChange={setSelectedLlmProfile} />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      className="h-12 w-12 rounded-[18px] bg-[#3178ff] text-white shadow-lg shadow-blue-500/20 hover:bg-[#2a6ae0]"
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      aria-label="Generate video"
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
            <span className="text-sm text-slate-500">{generatedVideos.length} created</span>
          </div>
          <ResultGridVideo videos={generatedVideos} />
        </section>
      </div>
    </div>
  );
}
