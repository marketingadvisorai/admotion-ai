'use client';

/**
 * ProposedCopyCard Component
 * Displays and allows editing of AI-proposed ad copy before generation
 */

import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, Loader2, Wand2 } from 'lucide-react';
import { ProposedCopyCardProps, IMAGE_VARIANTS, AspectRatio } from '../types';
import { BrandPreview } from './BrandPreview';
import { OverlayPreview } from './OverlayPreview';

export function ProposedCopyCard({
  proposedCopy,
  activeBrand,
  selectedAspect,
  variantImageModels,
  isGenerating,
  onUpdateCopy,
  onConfirm,
  onGenerate,
  onAspectChange,
  onVariantModelsChange,
}: ProposedCopyCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-[0_22px_80px_-58px_rgba(15,23,42,0.7)] backdrop-blur-xl">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#c8b5ff]/35 via-[#b7d8ff]/25 to-[#6ad9ff]/35 opacity-90 pointer-events-none" />
      
      <div className="relative p-5 space-y-4">
        {/* Header */}
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

        {/* Brand Preview */}
        {activeBrand && <BrandPreview brand={activeBrand} />}

        {/* Form Fields */}
        <div className="grid gap-3">
          {/* Headline */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
              Headline
            </label>
            <input
              value={proposedCopy.headline}
              onChange={(e) => onUpdateCopy('headline', e.target.value)}
              placeholder="Main headline for this ad"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
            />
          </div>

          {/* Overlay Preview */}
          <OverlayPreview elements={proposedCopy.overlayElements} />

          {/* CTA and Aspect Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
                Button Text
              </label>
              <input
                value={proposedCopy.ctaText}
                onChange={(e) => onUpdateCopy('ctaText', e.target.value)}
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
                onChange={(e) => onAspectChange(e.target.value as AspectRatio)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
              >
                <option value="1:1">1:1 Square</option>
                <option value="3:2">3:2 Landscape</option>
                <option value="2:3">2:3 Portrait</option>
              </select>
            </div>
          </div>

          {/* Model Variants */}
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
                      onVariantModelsChange(
                        active
                          ? variantImageModels.filter((v) => v !== opt.value)
                          : [...variantImageModels, opt.value]
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

          {/* Image Direction */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
              Image Direction
            </label>
            <textarea
              value={proposedCopy.imageDirection}
              onChange={(e) => onUpdateCopy('imageDirection', e.target.value)}
              rows={2}
              placeholder="Visual style and elements for the image"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Edit the copy above, then confirm to enable generation.
            </p>
            {!proposedCopy.confirmed ? (
              <Button
                onClick={onConfirm}
                className="rounded-full bg-purple-600 text-white hover:bg-purple-700 px-4"
                size="sm"
              >
                <CheckCircle2 className="size-4 mr-1.5" />
                Confirm & Make
              </Button>
            ) : (
              <Button
                onClick={onGenerate}
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
  );
}

export default ProposedCopyCard;
