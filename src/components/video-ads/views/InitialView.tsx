'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, AudioLines, Loader2, AlertCircle, MessageSquare, Video, Clock, Volume2, X } from 'lucide-react';
import { BrandPicker, BrandMode, AnalyzedBrandProfile } from '@/components/ads/brand-picker';
import { ModelDropdown } from '@/components/ads/model-dropdown';
import { PlatformSizeSelector } from '@/components/ads/platform-size-selector';
import { AdPlatform, AdSize } from '@/components/ads/ad-platform-types';
import { ResultGridVideo } from '@/components/ads/result-grid-video';
import { VideoModel } from '../use-video-chat-session';
import { GeneratedVideo } from '../types';
import { VideoDuration } from '@/modules/video-generation/types';
import { BrandKit } from '@/modules/brand-kits/types';
import { LlmProfile } from '@/modules/llm/types';

type CreativeMode = 'chat' | 'make';

interface BrandIdentityLite {
  business_name?: string;
  description?: string;
  logo_url?: string;
  colors?: Array<{ name: string; value: string; type: string }>;
  strategy?: { brand_voice?: string; target_audience?: string; values?: string[] };
}

interface InitialViewProps {
  displayName: string;
  prompt: string;
  setPrompt: (value: string) => void;
  creativeMode: CreativeMode;
  setCreativeMode: (mode: CreativeMode) => void;
  selectedPlatforms: AdPlatform[];
  setSelectedPlatforms: (platforms: AdPlatform[]) => void;
  selectedSizes: AdSize[];
  setSelectedSizes: (sizes: AdSize[]) => void;
  brandKits: BrandKit[];
  analyzerProfiles: AnalyzedBrandProfile[];
  llmProfiles: LlmProfile[];
  selectedBrandKitId: string;
  setSelectedBrandKitId: (id: string) => void;
  selectedAnalyzerId: string;
  setSelectedAnalyzerId: (id: string) => void;
  brandUrl: string;
  setBrandUrl: (url: string) => void;
  isAnalyzingBrand: boolean;
  selectedChatModel: string;
  setSelectedChatModel: (model: string) => void;
  selectedVideoModel: VideoModel;
  setSelectedVideoModel: (model: VideoModel) => void;
  duration: VideoDuration;
  setDuration: (duration: VideoDuration) => void;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  isChatting: boolean;
  isGenerating: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  generatedVideos: GeneratedVideo[];
  isLoadingVideos: boolean;
  onSubmit: () => void;
  orgId: string;
  setBrandMode: (mode: BrandMode) => void;
  setBrandKitOptions: React.Dispatch<React.SetStateAction<BrandKit[]>>;
  setAnalyzerProfiles: React.Dispatch<React.SetStateAction<AnalyzedBrandProfile[]>>;
  setIsAnalyzingBrand: (analyzing: boolean) => void;
}

/**
 * InitialView - Landing state before chat starts
 * ~140 lines (UI only)
 */
export function InitialView(props: InitialViewProps) {
  const {
    displayName, prompt, setPrompt, creativeMode, setCreativeMode,
    selectedPlatforms, setSelectedPlatforms, selectedSizes, setSelectedSizes,
    brandKits, analyzerProfiles, llmProfiles, selectedBrandKitId, setSelectedBrandKitId,
    selectedAnalyzerId, setSelectedAnalyzerId, brandUrl, setBrandUrl, isAnalyzingBrand,
    selectedChatModel, setSelectedChatModel, selectedVideoModel, setSelectedVideoModel,
    duration, setDuration, audioEnabled, setAudioEnabled,
    isChatting, isGenerating, error, setError, generatedVideos, isLoadingVideos, onSubmit,
    orgId, setBrandMode, setBrandKitOptions, setAnalyzerProfiles, setIsAnalyzingBrand,
  } = props;

  const selectedBrandKit = brandKits.find((k) => k.id === selectedBrandKitId);
  const selectedAnalyzer = analyzerProfiles.find((p) => p.id === selectedAnalyzerId);
  const activeBrand = selectedBrandKit || selectedAnalyzer?.analysis || null;

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
      if (data?.success && data?.data?.kit) {
        const kit = data.data.kit as BrandKit;
        const analysis = data.data.analysis as BrandIdentityLite;
        setBrandKitOptions((prev) => prev.some((k) => k.id === kit.id) ? prev : [kit, ...prev]);
        const profile: AnalyzedBrandProfile = {
          id: kit.id, url, name: analysis?.business_name || kit.name || url, analysis, kitId: kit.id,
        };
        setAnalyzerProfiles((prev) => [profile, ...prev.filter((p) => p.id !== profile.id)]);
        setSelectedAnalyzerId(profile.id);
        setBrandMode('analyze');
        setSelectedBrandKitId(kit.id);
      }
    } finally {
      setIsAnalyzingBrand(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (prompt.trim()) onSubmit(); }
  };

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(128,115,255,0.08),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(82,196,255,0.12),transparent_32%),#f5f6fb] min-h-screen rounded-[32px]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[15%] right-[10%] top-[-220px] h-72 rounded-full bg-gradient-to-r from-[#c6d8ff]/70 via-[#e8d8ff]/60 to-[#c4f1f9]/70 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-16 md:px-10 space-y-10">
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" className="rounded-full border-white/60 bg-white/80 backdrop-blur-xl text-slate-800 shadow-sm hover:bg-white">150 Credit</Button>
          <Button size="sm" className="rounded-full bg-slate-900 text-white shadow-md shadow-slate-900/10 hover:bg-slate-800">Share</Button>
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
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  placeholder={creativeMode === 'chat' ? 'Tell me about your video ad idea...' : 'Describe the video ad...'}
                  className="w-full min-h-[140px] resize-none rounded-[26px] border-0 bg-transparent px-5 pt-5 pb-24 text-base md:text-lg leading-relaxed text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-0"
                />

                <div className="flex items-center justify-between px-4 pb-4 -mt-14 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <PlatformSizeSelector
                      mediaType="video"
                      selectedPlatforms={selectedPlatforms}
                      selectedSizes={selectedSizes}
                      onPlatformsChange={setSelectedPlatforms}
                      onSizesChange={setSelectedSizes}
                    />
                    <BrandPicker brandKits={brandKits} analyzedBrands={analyzerProfiles} llmProfiles={llmProfiles} selectedBrandKitId={selectedBrandKitId} selectedAnalyzerId={selectedAnalyzerId} brandUrl={brandUrl} isAnalyzing={isAnalyzingBrand} analysis={activeBrand} onSelectKit={(id) => { setSelectedBrandKitId(id); setBrandMode('kit'); }} onSelectAnalyzer={(id) => setSelectedAnalyzerId(id)} onAnalyze={handleAnalyzeBrand} onUrlChange={setBrandUrl} onClear={() => { setBrandMode('none'); setSelectedBrandKitId(''); }} onUploadReference={() => {}} />
                    <ModelDropdown availableApis={{ openai: true, gemini: false, anthropic: false }} mode={creativeMode} selectedChatModel={selectedChatModel} selectedImageModel={selectedVideoModel} onChatModelChange={setSelectedChatModel} onImageModelChange={(m) => setSelectedVideoModel(m as VideoModel)} mediaType="video" />
                    <div className="flex items-center gap-1 rounded-full bg-white/80 border border-white/60 p-1">
                      <button onClick={() => setCreativeMode('chat')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${creativeMode === 'chat' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><MessageSquare className="size-3.5" />Chat</button>
                      <button onClick={() => setCreativeMode('make')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${creativeMode === 'make' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Video className="size-3.5" />Make</button>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 border border-white/60">
                      <Clock className="size-3.5 text-slate-500" />
                      <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value) as VideoDuration)} className="text-xs bg-transparent border-0 focus:ring-0 text-slate-700">
                        <option value={6}>6s</option><option value={8}>8s</option><option value={10}>10s</option><option value={15}>15s</option>
                      </select>
                    </div>
                    <button onClick={() => setAudioEnabled(!audioEnabled)} className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-colors ${audioEnabled ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}><Volume2 className="size-3.5" />Audio</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" className="h-12 w-12 rounded-[18px] bg-[#3178ff] text-white shadow-lg shadow-blue-500/20 hover:bg-[#2a6ae0]" onClick={onSubmit} disabled={!prompt.trim() || isGenerating || isChatting}>{(isGenerating || isChatting) ? <Loader2 className="size-5 animate-spin" /> : <ArrowUpRight className="size-5" />}</Button>
                    <Button size="icon" variant="outline" className="h-11 w-11 rounded-[16px] border-white/80 bg-white/90 shadow-sm text-slate-700"><AudioLines className="size-5" /></Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 max-w-3xl mx-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /><div className="flex-1"><p className="font-medium">Error</p><p className="text-sm text-red-600">{error}</p></div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X className="size-4" /></button>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div><h3 className="text-lg font-semibold text-slate-900">Recent generations</h3><p className="text-sm text-slate-500">Your generated videos appear here.</p></div>
            <span className="text-sm text-slate-500">{generatedVideos.length} created</span>
          </div>
          <ResultGridVideo videos={generatedVideos} isLoading={isGenerating || isLoadingVideos} />
        </section>
      </div>
    </div>
  );
}

export default InitialView;
