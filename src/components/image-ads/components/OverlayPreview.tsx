'use client';

/**
 * OverlayPreview Component
 * Shows a visual preview of overlay elements that will be added to the image
 */

import { OverlayElement } from '../types';

interface OverlayPreviewProps {
  elements: OverlayElement[];
}

const ELEMENT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  headline: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'H' },
  button: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'B' },
  logo: { bg: 'bg-green-100', text: 'text-green-700', label: 'L' },
  badge: { bg: 'bg-amber-100', text: 'text-amber-700', label: '★' },
  tagline: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'T' },
};

export function OverlayPreview({ elements }: OverlayPreviewProps) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2 block">
        Image Overlay Preview
      </label>
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 space-y-2">
        {elements.length > 0 ? (
          elements.map((element, idx) => {
            const style = ELEMENT_STYLES[element.type] || ELEMENT_STYLES.headline;
            return (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-medium ${style.bg} ${style.text}`}
                >
                  {style.label}
                </span>
                <span className="text-sm text-slate-700 capitalize">{element.type}</span>
                {element.text && (
                  <span className="text-sm text-slate-500 truncate flex-1">
                    &quot;{element.text}&quot;
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-sm text-slate-400 text-center py-2">
            No overlay elements defined yet
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5">
        These elements will be overlaid on your generated image
      </p>
    </div>
  );
}

export default OverlayPreview;
