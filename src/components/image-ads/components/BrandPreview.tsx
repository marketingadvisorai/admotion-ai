'use client';

/**
 * BrandPreview Component
 * Displays brand logo and color palette in the Proposed Copy card
 */

import Image from 'next/image';
import { BrandPreviewProps } from '../types';

export function BrandPreview({ brand }: BrandPreviewProps) {
  if (!brand) return null;

  const logoUrl = 'logo_url' in brand ? brand.logo_url : undefined;
  const businessName = brand.business_name || 'Brand';
  const colors = brand.colors || [];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white/70 px-3 py-2">
      {/* Logo */}
      {logoUrl ? (
        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <Image 
            src={logoUrl} 
            alt="Brand logo" 
            fill 
            className="object-contain p-1" 
          />
        </div>
      ) : (
        <div className="h-10 w-10 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
          Logo
        </div>
      )}

      {/* Brand Info */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900 line-clamp-1">
          {businessName}
        </p>
        
        {/* Color Swatches */}
        <div className="flex items-center gap-1.5 mt-1">
          {colors.slice(0, 4).map((c, idx) => (
            <span
              key={idx}
              className="h-4 w-4 rounded-full border border-slate-200"
              style={{ backgroundColor: c.value }}
              title={c.value}
            />
          ))}
        </div>
      </div>

      {/* Status Badge */}
      <span className="text-[11px] text-slate-500">On-brand overlays enforced</span>
    </div>
  );
}

export default BrandPreview;
