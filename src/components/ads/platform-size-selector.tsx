'use client';

import React from 'react';
import { Check, Globe, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AdPlatform,
  AdSize,
  AdMediaType,
  PLATFORM_CONFIGS,
  getRecommendedSizes,
  formatSizeName,
} from './ad-platform-types';

interface PlatformSizeSelectorProps {
  mediaType: AdMediaType;
  selectedPlatforms: AdPlatform[];
  selectedSizes: AdSize[];
  onPlatformsChange: (platforms: AdPlatform[]) => void;
  onSizesChange: (sizes: AdSize[]) => void;
  disabled?: boolean;
}

/**
 * Multi-platform and multi-size selector for ad creation
 * Allows users to select multiple platforms and sizes at once
 */
export function PlatformSizeSelector({
  mediaType,
  selectedPlatforms,
  selectedSizes,
  onPlatformsChange,
  onSizesChange,
  disabled = false,
}: PlatformSizeSelectorProps) {
  // Filter platforms that support this media type
  const availablePlatforms = Object.values(PLATFORM_CONFIGS).filter((p) =>
    p.mediaTypes.includes(mediaType)
  );

  // Get all recommended sizes based on selected platforms
  const availableSizes = getRecommendedSizes(
    selectedPlatforms.length > 0 ? selectedPlatforms : ['google_ads', 'facebook'],
    mediaType
  );

  const togglePlatform = (platform: AdPlatform) => {
    const isSelected = selectedPlatforms.includes(platform);
    let newPlatforms: AdPlatform[];
    
    if (isSelected) {
      newPlatforms = selectedPlatforms.filter((p) => p !== platform);
    } else {
      newPlatforms = [...selectedPlatforms, platform];
    }
    
    onPlatformsChange(newPlatforms);
    
    // Auto-update sizes when platforms change
    const newSizes = getRecommendedSizes(newPlatforms, mediaType);
    const validSizes = selectedSizes.filter((s) => 
      newSizes.some((ns) => ns.id === s.id)
    );
    if (validSizes.length === 0 && newSizes.length > 0) {
      onSizesChange([newSizes[0]]);
    } else {
      onSizesChange(validSizes);
    }
  };

  const toggleSize = (size: AdSize) => {
    const isSelected = selectedSizes.some((s) => s.id === size.id);
    if (isSelected) {
      onSizesChange(selectedSizes.filter((s) => s.id !== size.id));
    } else {
      onSizesChange([...selectedSizes, size]);
    }
  };

  const selectAllSizes = () => {
    onSizesChange(availableSizes);
  };

  const platformLabel = selectedPlatforms.length === 0
    ? 'Select Platforms'
    : selectedPlatforms.length === 1
      ? PLATFORM_CONFIGS[selectedPlatforms[0]].displayName
      : `${selectedPlatforms.length} Platforms`;

  const sizeLabel = selectedSizes.length === 0
    ? 'Select Sizes'
    : selectedSizes.length === 1
      ? formatSizeName(selectedSizes[0])
      : `${selectedSizes.length} Sizes`;

  return (
    <div className="flex items-center gap-2">
      {/* Platform Selector */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-9 rounded-full border-white/60 bg-white/80 text-slate-700 gap-1.5"
          >
            <Globe className="size-3.5 text-purple-500" />
            <span className="text-xs font-medium">{platformLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="text-xs font-medium text-slate-500 px-2 py-1 mb-1">
            Select platforms (multi-select)
          </div>
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {availablePlatforms.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.platform);
              return (
                <button
                  key={platform.platform}
                  onClick={() => togglePlatform(platform.platform)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-purple-50 text-purple-700'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-base">{platform.icon}</span>
                  <span className="flex-1 text-sm">{platform.displayName}</span>
                  {isSelected && <Check className="size-4 text-purple-600" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Size Selector */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || selectedPlatforms.length === 0}
            className="h-9 rounded-full border-white/60 bg-white/80 text-slate-700 gap-1.5"
          >
            <Layers className="size-3.5 text-blue-500" />
            <span className="text-xs font-medium">{sizeLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-xs font-medium text-slate-500">
              Select sizes (multi-select)
            </span>
            <button
              onClick={selectAllSizes}
              className="text-xs text-purple-600 hover:text-purple-700"
            >
              Select All
            </button>
          </div>
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {availableSizes.map((size) => {
              const isSelected = selectedSizes.some((s) => s.id === size.id);
              return (
                <button
                  key={size.id}
                  onClick={() => toggleSize(size)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center bg-slate-50">
                    <SizePreview aspectRatio={size.aspectRatio} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{size.name}</div>
                    <div className="text-xs text-slate-500">
                      {size.aspectRatio} · {size.width}×{size.height}
                    </div>
                  </div>
                  {isSelected && <Check className="size-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Mini preview of aspect ratio */
function SizePreview({ aspectRatio }: { aspectRatio: string }) {
  const [w, h] = aspectRatio.split(':').map(Number);
  const ratio = w / h;
  const maxSize = 20;
  
  let width: number, height: number;
  if (ratio >= 1) {
    width = maxSize;
    height = maxSize / ratio;
  } else {
    height = maxSize;
    width = maxSize * ratio;
  }

  return (
    <div
      className="bg-slate-300 rounded-sm"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}

export default PlatformSizeSelector;
