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
          className="rounded-full border border-white/80 bg-white/90 text-slate-600 shadow-sm"
        >
          <Plus className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Brand Kit</p>
        <div className="space-y-2">
          {brandKits.map((kit) => (
            <button
              key={kit.id}
              onClick={() => onSelectKit(kit.id)}
              className={cn(
                'w-full flex items-center gap-2 rounded-xl border px-2 py-2 text-left text-sm transition',
                selectedBrandKitId === kit.id ? 'border-blue-200 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
              )}
            >
              {kit.logo_url ? (
                <Image src={kit.logo_url} alt={kit.name} width={28} height={28} className="rounded-md object-cover" />
              ) : (
                <div className="size-7 rounded-md bg-slate-200" />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 line-clamp-1">{kit.name}</p>
                <p className="text-xs text-slate-500 line-clamp-1">{kit.business_name || 'No business name'}</p>
              </div>
              {selectedBrandKitId === kit.id && <Check className="ml-auto size-4 text-blue-600" />}
            </button>
          ))}

          {analyzedBrands.length > 0 && (
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Analyzed brands</p>
              {analyzedBrands.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectAnalyzer(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-xl border px-2 py-2 text-left text-sm transition',
                    selectedAnalyzerId === item.id ? 'border-blue-200 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <div className="size-7 rounded-md bg-slate-200 overflow-hidden">
                    {item.analysis.logo_url && (
                      <Image src={item.analysis.logo_url} alt={item.name} width={28} height={28} className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.url}</p>
                  </div>
                  {selectedAnalyzerId === item.id && <Check className="ml-auto size-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 space-y-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Reference image</p>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
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
              Upload image
            </label>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Analyze URL</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://brand.com"
                value={brandUrl}
                onChange={(e) => onUrlChange(e.target.value)}
                className="rounded-lg bg-white border-slate-200 text-slate-800"
              />
              <Button
                onClick={() => onAnalyze(brandUrl)}
                className="rounded-lg bg-slate-900 text-white"
                disabled={isAnalyzing || !brandUrl.trim()}
                size="sm"
              >
                {isAnalyzing ? <Loader2 className="size-4 animate-spin" /> : 'Go'}
              </Button>
            </div>
            {analysis && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">{analysis.business_name}</p>
                <p className="line-clamp-2">{analysis.description}</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.colors?.slice(0, 3).map((c) => (
                    <span key={c.name + c.value} className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/70 px-2 py-[2px] text-[10px] font-semibold text-slate-700">
                      <span className="size-3 rounded-full border" style={{ background: c.value }} />
                      {c.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClear}
            className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            No brand
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
