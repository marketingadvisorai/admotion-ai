'use client';

/**
 * GenerationProgress Component
 * Shows progress bar during image generation
 */

interface GenerationProgressProps {
  progress: number;
  isGenerating: boolean;
}

export function GenerationProgress({ progress, isGenerating }: GenerationProgressProps) {
  if (!isGenerating && progress === 0) return null;

  return (
    <div className="px-6 pt-3">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
        <span>Building ad layout with safe logo + CTA placement</span>
        <span>{Math.min(100, progress)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 transition-all duration-300"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}

export default GenerationProgress;
