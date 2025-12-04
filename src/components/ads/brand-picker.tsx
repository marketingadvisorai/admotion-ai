import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandKit } from '@/modules/brand-kits/types';

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
  selectedBrandKitId: string;
  selectedAnalyzerId: string;
  brandUrl: string;
  isAnalyzing: boolean;
  analysis?: BrandAnalysisLite | BrandKit | null;
  onSelectKit: (id: string) => void;
  onSelectAnalyzer: (id: string) => void;
  onAnalyze: (url: string) => void;
  onUrlChange: (url: string) => void;
  onClear: () => void;
  onUploadReference?: (file: File) => void;
}

export function BrandPicker({
  brandKits,
  analyzedBrands,
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
      <PopoverContent className="w-80 p-0 overflow-hidden rounded-2xl shadow-xl border-slate-200" align="start">
        <div className="max-h-[80vh] overflow-y-auto p-3 space-y-4">

          {/* Brand Kits Section */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 px-1">Brand Kit</p>
            <div className="space-y-1">
              {brandKits.length === 0 ? (
                <div className="px-3 py-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                  <p className="text-xs text-slate-500">No brand kits found</p>
                </div>
              ) : (
                brandKits.map((kit) => (
                  <button
                    key={kit.id}
                    onClick={() => onSelectKit(kit.id)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-200',
                      selectedBrandKitId === kit.id
                        ? 'border-purple-200 bg-purple-50/60 shadow-sm ring-1 ring-purple-100'
                        : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                    )}
                  >
                    {kit.logo_url ? (
                      <div className="relative size-9 rounded-lg overflow-hidden border border-slate-100 bg-white shadow-sm shrink-0">
                        <Image src={kit.logo_url} alt={kit.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="size-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 border border-slate-200">
                        <span className="text-xs font-bold text-slate-500">{kit.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-semibold line-clamp-1", selectedBrandKitId === kit.id ? "text-purple-900" : "text-slate-900")}>
                        {kit.name}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">{kit.business_name || 'No business name'}</p>
                    </div>
                    {selectedBrandKitId === kit.id && <Check className="size-4 text-purple-600 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Analyzed Brands Section */}
          {analyzedBrands.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 px-1">Analyzed brands</p>
              <div className="space-y-1">
                {analyzedBrands.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectAnalyzer(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-200',
                      selectedAnalyzerId === item.id
                        ? 'border-blue-200 bg-blue-50/60 shadow-sm ring-1 ring-blue-100'
                        : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                    )}
                  >
                    <div className="size-9 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      {item.analysis.logo_url ? (
                        <Image src={item.analysis.logo_url} alt={item.name} width={36} height={36} className="object-cover h-full w-full" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-slate-50">
                          <span className="text-xs text-slate-400">URL</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-semibold line-clamp-1", selectedAnalyzerId === item.id ? "text-blue-900" : "text-slate-900")}>
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">{item.url}</p>
                    </div>
                    {selectedAnalyzerId === item.id && <Check className="size-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reference Image Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 px-1">Reference image</p>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors">
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
              <Plus className="size-4" />
              Upload image
            </label>
          </div>

          {/* Analyze URL Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 px-1">Analyze URL</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://brand.com"
                value={brandUrl}
                onChange={(e) => onUrlChange(e.target.value)}
                className="rounded-xl bg-white border-slate-200 text-slate-800 h-10"
              />
              <Button
                onClick={() => onAnalyze(brandUrl)}
                className="rounded-xl bg-slate-900 text-white h-10 px-4 hover:bg-slate-800"
                disabled={isAnalyzing || !brandUrl.trim()}
              >
                {isAnalyzing ? <Loader2 className="size-4 animate-spin" /> : 'Go'}
              </Button>
            </div>
          </div>

          {/* Active Context Preview */}
          {analysis && (
            <div className="pt-2 border-t border-slate-100">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-indigo-500 animate-pulse" />
                  <p className="text-xs font-semibold text-indigo-900">Active Context</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-900">{analysis.business_name}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{analysis.description}</p>
                </div>
                {analysis.colors && analysis.colors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {analysis.colors.slice(0, 5).map((c, i) => (
                      <div
                        key={i}
                        className="size-4 rounded-full border border-white/20 shadow-sm ring-1 ring-black/5"
                        style={{ background: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-2 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClear}
            className="w-full rounded-lg border border-transparent px-2 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Clear selection
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
