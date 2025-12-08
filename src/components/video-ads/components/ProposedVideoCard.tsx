'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, Video, Loader2 } from 'lucide-react';
import { ProposedVideoCopy, VideoDuration, VideoModel } from '@/modules/video-generation/types';
import { VIDEO_MODELS } from '@/modules/video-generation/providers/factory';
import { AspectRatioVideo } from '../types';

interface ProposedVideoCardProps {
  proposedCopy: ProposedVideoCopy;
  selectedAspect: AspectRatioVideo;
  selectedVideoModel: VideoModel;
  isGenerating: boolean;
  onUpdate: (field: keyof ProposedVideoCopy, value: string | number) => void;
  onAspectChange: (aspect: AspectRatioVideo) => void;
  onModelChange: (model: VideoModel) => void;
  onConfirm: () => void;
  onGenerate: () => void;
}

/**
 * Proposed Video Ad Card - displays and allows editing of AI-proposed video ad
 * ~120 lines
 */
export function ProposedVideoCard({
  proposedCopy,
  selectedAspect,
  selectedVideoModel,
  isGenerating,
  onUpdate,
  onAspectChange,
  onModelChange,
  onConfirm,
  onGenerate,
}: ProposedVideoCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-[0_22px_80px_-58px_rgba(15,23,42,0.7)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-[#c8b5ff]/35 via-[#b7d8ff]/25 to-[#6ad9ff]/35 opacity-90 pointer-events-none" />
      <div className="relative p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">Proposed Video Ad</h3>
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
          {/* Headline */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
              Headline (End Frame)
            </label>
            <input
              value={proposedCopy.headline}
              onChange={(e) => onUpdate('headline', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Scene Description */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">
              Scene Description
            </label>
            <textarea
              value={proposedCopy.sceneDescription}
              onChange={(e) => onUpdate('sceneDescription', e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Settings Row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">CTA</label>
              <input
                value={proposedCopy.ctaText}
                onChange={(e) => onUpdate('ctaText', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">Duration</label>
              <select
                value={proposedCopy.duration}
                onChange={(e) => onUpdate('duration', parseInt(e.target.value) as VideoDuration)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value={6}>6s</option>
                <option value={8}>8s</option>
                <option value={10}>10s</option>
                <option value={12}>12s</option>
                <option value={15}>15s</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 block">Aspect</label>
              <select
                value={selectedAspect}
                onChange={(e) => onAspectChange(e.target.value as AspectRatioVideo)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="1:1">1:1</option>
              </select>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2 block">Model</label>
            <div className="flex flex-wrap gap-2">
              {VIDEO_MODELS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onModelChange(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedVideoModel === opt.value
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                  {opt.recommended && <span className="ml-1 text-[10px]">★</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Edit details, then confirm to generate.</p>
            {!proposedCopy.confirmed ? (
              <Button onClick={onConfirm} className="rounded-full bg-purple-600 hover:bg-purple-700 px-4" size="sm">
                <CheckCircle2 className="size-4 mr-1.5" />
                Confirm
              </Button>
            ) : (
              <Button
                onClick={onGenerate}
                disabled={isGenerating}
                className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-4"
                size="sm"
              >
                {isGenerating ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Video className="size-4 mr-1.5" />}
                Generate
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProposedVideoCard;
