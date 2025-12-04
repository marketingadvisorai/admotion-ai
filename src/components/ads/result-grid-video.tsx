import Image from 'next/image';
import { GeneratedVideo } from '@/components/video-ads/types';

interface ResultGridVideoProps {
  videos: GeneratedVideo[];
}

export function ResultGridVideo({ videos }: ResultGridVideoProps) {
  if (!videos.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/60 bg-white/50 backdrop-blur-xl p-8 text-center text-slate-500">
        No videos yet. Confirm and generate to see results.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <div key={video.id} className="rounded-2xl border border-white/70 bg-white/80 shadow-sm overflow-hidden">
          <div className="relative aspect-video">
            <Image
              src={video.cover}
              alt={video.prompt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 400px, 100vw"
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              <span>{video.duration}s</span>
              <span className="h-3 w-px bg-white/50" />
              <span>{video.aspect}</span>
              <span className="h-3 w-px bg-white/50" />
              <span className="uppercase">{video.provider}</span>
            </div>
          </div>
          <div className="p-3 space-y-1">
            <p className="text-sm font-semibold text-slate-900 line-clamp-2">{video.prompt}</p>
            <p className="text-xs text-slate-500">
              {video.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
