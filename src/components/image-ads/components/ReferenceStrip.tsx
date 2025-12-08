'use client';

/**
 * ReferenceStrip Component
 * Displays uploaded reference images with remove functionality
 */

import Image from 'next/image';
import { X } from 'lucide-react';
import { ReferenceStripProps } from '../types';

export function ReferenceStrip({ images, onRemove, onClear }: ReferenceStripProps) {
  if (images.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wide">
          Reference images
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] text-slate-500 hover:text-slate-700"
        >
          Clear
        </button>
      </div>

      {/* Image Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((ref, idx) => (
          <div 
            key={ref} 
            className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200"
          >
            <Image 
              src={ref} 
              alt={`Reference ${idx + 1}`} 
              fill 
              className="object-cover" 
            />
            <button
              type="button"
              onClick={() => onRemove(ref)}
              className="absolute top-0 right-0 m-0.5 rounded-full bg-white/80 text-slate-700 hover:bg-white shadow-sm"
              aria-label="Remove reference"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Help Text */}
      <p className="text-[10px] text-slate-500">
        These images are included in the prompt to guide the model&apos;s layout and style.
      </p>
    </div>
  );
}

export default ReferenceStrip;
