import Image from 'next/image';
import { Loader2, Play, Clock, AlertCircle } from 'lucide-react';
import { GeneratedVideo } from '@/components/video-ads/types';

interface ResultGridVideoProps {
  videos: GeneratedVideo[];
  isLoading?: boolean;
}

export function ResultGridVideo({ videos, isLoading }: ResultGridVideoProps) {
  if (isLoading && !videos.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/60 bg-white/50 backdrop-blur-xl p-8 text-center text-slate-500">
        <Loader2 className="size-6 animate-spin mx-auto mb-2 text-purple-500" />
        <p>Generating your video...</p>
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/60 bg-white/50 backdrop-blur-xl p-8 text-center text-slate-500">
        No videos yet. Confirm and generate to see results.
      </div>
    );
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'processing':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-white">
              <Loader2 className="size-8 animate-spin" />
              <span className="text-xs font-medium">Processing...</span>
            </div>
          </div>
        );
      case 'failed':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/40 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-white">
              <AlertCircle className="size-8" />
              <span className="text-xs font-medium">Failed</span>
            </div>
          </div>
        );
      case 'queued':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-white">
              <Clock className="size-8" />
              <span className="text-xs font-medium">Queued</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
            <Play className="size-12 text-white drop-shadow-lg" />
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <div key={video.id} className="rounded-2xl border border-white/70 bg-white/80 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
          <div className="relative aspect-video">
            {video.cover ? (
              <Image
                src={video.cover}
                alt={video.prompt}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 400px, 100vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <Play className="size-10 text-purple-400" />
              </div>
            )}
            {getStatusBadge(video.status)}
            <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              <span>{video.duration}s</span>
              <span className="h-3 w-px bg-white/50" />
              <span>{video.aspect}</span>
              <span className="h-3 w-px bg-white/50" />
              <span className="uppercase text-[10px]">{video.provider}</span>
            </div>
          </div>
          <div className="p-3 space-y-1">
            <p className="text-sm font-semibold text-slate-900 line-clamp-2">{video.prompt}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {video.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              {video.status === 'completed' && video.url && (
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
