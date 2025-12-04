
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Globe, Loader2, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandKit } from '@/modules/brand-kits/types';
import { LlmProfile } from '@/modules/llm/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type BrandMode = 'kit' | 'analyze' | 'none';

interface BrandAnalysisLite {
  business_name?: string;
  description?: string;
  colors?: Array<{ name: string; value: string; type: string }>;
  logo_url?: string;
  strategy?: { brand_voice?: string; target_audience?: string; values?: string[] };
}

export interface AnalyzedBrandProfile {
  id: string;
  url: string;
  name: string;
  analysis: BrandAnalysisLite;
  kitId?: string;
}

interface BrandPickerProps {
  brandKits: BrandKit[];
  analyzedBrands: AnalyzedBrandProfile[];
  llmProfiles?: LlmProfile[];
  selectedBrandKitId: string;
  selectedAnalyzerId: string;
  brandUrl: string;
  isAnalyzing: boolean;
  analysis?: BrandAnalysisLite | BrandKit | null;
  onSelectKit: (id: string) => void;
  onSelectAnalyzer: (id: string) => void;
  onAnalyze: (url: string, model?: string) => void;
  onUrlChange: (url: string) => void;
  onClear: () => void;
  onUploadReference?: (file: File) => void;
}

export function BrandPicker({
  brandKits,
  analyzedBrands,
  llmProfiles = [],
  selectedBrandKitId,
  selectedAnalyzerId,
  brandUrl,
  isAnalyzing,
  analysis,
  onSelectKit,
  onSelectAnalyzer,
  onAnalyze,
  onUrlChange,
  onClear,
  onUploadReference,
}: BrandPickerProps) {
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');

  const handleAnalyze = () => {
    let urlToAnalyze = brandUrl.trim();
    if (urlToAnalyze && !urlToAnalyze.startsWith('http')) {
      urlToAnalyze = `https://${urlToAnalyze}`;
    }
    onAnalyze(urlToAnalyze, selectedModel);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full border border-white/80 bg-white/90 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900"
        >
          <Plus className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[480px] p-0 overflow-hidden rounded-3xl shadow-2xl border-slate-200" align="start">
        <div className="max-h-[85vh] overflow-y-auto p-5 space-y-6 bg-slate-50/50">

          {/* Header */}
          <div className="space-y-1">
            <h4 className="font-semibold text-slate-900">Brand Context</h4>
            <p className="text-xs text-slate-500">Select a brand kit or analyze a website to guide the AI.</p>
          </div>

          {/* Brand Kits Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Your Brand Kits</p>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{brandKits.length} available</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {brandKits.length === 0 ? (
                <div className="px-4 py-6 text-center rounded-2xl border border-dashed border-slate-200 bg-white/50">
                  <p className="text-sm text-slate-500">No brand kits found</p>
                </div>
              ) : (
                brandKits.map((kit) => (
                  <button
                    key={kit.id}
                    onClick={() => onSelectKit(kit.id)}
                    className={cn(
                      'group relative w-full flex items-center gap-4 rounded-2xl border p-3 text-left transition-all duration-200',
                      selectedBrandKitId === kit.id
                        ? 'border-purple-200 bg-white shadow-md shadow-purple-100/50 ring-1 ring-purple-100'
                        : 'border-slate-200 bg-white hover:border-purple-200 hover:shadow-sm'
                    )}
                  >
                    {kit.logo_url ? (
                      <div className="relative size-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm shrink-0">
                        <Image src={kit.logo_url} alt={kit.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="size-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 border border-slate-200 text-slate-400 font-bold text-lg">
                        {kit.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-semibold text-base", selectedBrandKitId === kit.id ? "text-purple-900" : "text-slate-900")}>
                        {kit.name}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">{kit.business_name || 'No business name'}</p>
                    </div>
                    {selectedBrandKitId === kit.id && (
                      <div className="absolute right-3 top-3 bg-purple-100 text-purple-600 rounded-full p-1">
                        <Check className="size-3" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Analyze URL Section (Magic Analyze) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600">
                <Sparkles className="size-4" />
                <span className="text-sm font-semibold">Magic Analyze</span>
              </div>
              {llmProfiles.length > 0 && (
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-7 w-[140px] text-xs border-slate-200 bg-slate-50">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {llmProfiles.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.slug}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter a website URL to automatically extract brand colors, fonts, tone, and strategy using AI.
              </p>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Globe className="size-4" />
                  </div>
                  <Input
                    placeholder="advisorppc.com"
                    value={brandUrl}
                    onChange={(e) => onUrlChange(e.target.value)}
                    className="pl-9 rounded-xl bg-slate-50 border-slate-200 text-slate-800 h-10 text-sm focus-visible:ring-indigo-500"
                  />
                </div>
                <Button
                  onClick={handleAnalyze}
                  className="rounded-xl bg-indigo-600 text-white h-10 px-4 hover:bg-indigo-700 shadow-md shadow-indigo-200"
                  disabled={isAnalyzing || !brandUrl.trim()}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Analyzing
                    </>
                  ) : (
                    'Analyze'
                  )}
                </Button>
              </div>
            </div>

            {/* Analyzed Brands List */}
            {analyzedBrands.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent Analysis</p>
                <div className="space-y-2">
                  {analyzedBrands.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onSelectAnalyzer(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-all duration-200',
                        selectedAnalyzerId === item.id
                          ? 'border-indigo-200 bg-indigo-50/50 ring-1 ring-indigo-100'
                          : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100'
                      )}
                    >
                      <div className="size-8 rounded-lg bg-white overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                        {item.analysis.logo_url ? (
                          <Image src={item.analysis.logo_url} alt={item.name} width={32} height={32} className="object-cover h-full w-full" />
                        ) : (
                          <Globe className="size-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("font-medium truncate", selectedAnalyzerId === item.id ? "text-indigo-900" : "text-slate-700")}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{item.url}</p>
                      </div>
                      {selectedAnalyzerId === item.id && <Check className="size-3.5 text-indigo-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reference Image Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reference Image</p>
            </div>
            <label className="group flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-all hover:shadow-sm">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onUploadReference) {
                    onUploadReference(file);
                  }
                  e.target.value = '';
                }}
              />
              <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                <Plus className="size-4 text-slate-500" />
              </div>
              <span>Upload reference image</span>
            </label>
          </div>

          {/* Active Context Preview */}
          {analysis && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Active Context</p>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{analysis.business_name}</p>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-1">{analysis.description}</p>
                </div>

                {analysis.strategy?.brand_voice && (
                  <div className="flex gap-2 text-[10px]">
                    <span className="font-semibold text-slate-500">Voice:</span>
                    <span className="text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-100">{analysis.strategy.brand_voice}</span>
                  </div>
                )}

                {analysis.colors && analysis.colors.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {analysis.colors.slice(0, 5).map((c, i) => (
                      <div
                        key={i}
                        className="group relative size-6 rounded-full border border-white/20 shadow-sm ring-1 ring-black/5 cursor-help"
                        style={{ background: c.value }}
                      >
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                          {c.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <button
            onClick={onClear}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Clear selection & Reset
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

