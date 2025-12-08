'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  Plus, 
  Upload, 
  Star, 
  Trash2, 
  Filter,
  Image as ImageIcon,
  Video,
  Globe,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdExample, AdPlatform, PLATFORM_PRESETS, AspectRatioVideo } from '@/components/video-ads/types';
import Image from 'next/image';

type MediaType = 'all' | 'image' | 'video';

export default function AdLibraryPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [examples, setExamples] = useState<AdExample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [filterPlatform, setFilterPlatform] = useState<AdPlatform | 'all'>('all');
  const [filterMediaType, setFilterMediaType] = useState<MediaType>('all');
  
  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    platform: 'google_ads' as AdPlatform,
    mediaType: 'video' as 'image' | 'video',
    mediaUrl: '',
    aspectRatio: '16:9' as AspectRatioVideo,
    durationSeconds: 15,
    headline: '',
    ctaText: '',
    performanceNotes: '',
    performanceScore: 7,
    tags: '',
    styleKeywords: '',
  });

  // Load examples
  const loadExamples = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/ad-examples?orgId=${orgId}`);
      const data = await res.json();
      
      if (data.success) {
        setExamples(data.examples.map((ex: Record<string, unknown>) => ({
          ...ex,
          createdAt: new Date(ex.created_at as string),
          updatedAt: new Date(ex.updated_at as string),
        })));
      } else {
        setError(data.error || 'Failed to load examples');
      }
    } catch (err) {
      console.error('Failed to load examples:', err);
      setError('Failed to load ad examples');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadExamples();
  }, [loadExamples]);

  // Handle upload
  const handleUpload = async () => {
    if (!uploadForm.name || !uploadForm.mediaUrl) {
      setError('Name and media URL are required');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const res = await fetch('/api/ad-examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          ...uploadForm,
          tags: uploadForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
          styleKeywords: uploadForm.styleKeywords.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Ad example added successfully!');
        setShowUploadModal(false);
        setUploadForm({
          name: '',
          description: '',
          platform: 'google_ads',
          mediaType: 'video',
          mediaUrl: '',
          aspectRatio: '16:9',
          durationSeconds: 15,
          headline: '',
          ctaText: '',
          performanceNotes: '',
          performanceScore: 7,
          tags: '',
          styleKeywords: '',
        });
        loadExamples();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to add example');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload ad example');
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/ad-examples/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentStatus }),
      });
      loadExamples();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Delete example
  const deleteExample = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad example?')) return;
    
    try {
      await fetch(`/api/ad-examples/${id}`, { method: 'DELETE' });
      loadExamples();
      setSuccess('Ad example deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to delete:', err);
      setError('Failed to delete example');
    }
  };

  // Filter examples
  const filteredExamples = examples.filter((ex) => {
    if (filterPlatform !== 'all' && ex.platform !== filterPlatform) return false;
    if (filterMediaType !== 'all' && ex.mediaType !== filterMediaType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ad Library</h1>
            <p className="text-slate-500 mt-1">
              Train AI with your best-performing ads. Upload examples to improve generation quality.
            </p>
          </div>
          <Button 
            onClick={() => setShowUploadModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full"
          >
            <Plus className="size-4 mr-2" />
            Add Example
          </Button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
            <CheckCircle2 className="size-5" />
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle className="size-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Filter className="size-4 text-slate-400" />
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Platform:</span>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value as AdPlatform | 'all')}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">All Platforms</option>
              {Object.values(PLATFORM_PRESETS).map((p) => (
                <option key={p.platform} value={p.platform}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Type:</span>
            <select
              value={filterMediaType}
              onChange={(e) => setFilterMediaType(e.target.value as MediaType)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-slate-400">
            {filteredExamples.length} example{filteredExamples.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Examples Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-purple-500" />
          </div>
        ) : filteredExamples.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <Sparkles className="size-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No ad examples yet</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Upload your best-performing ads to help the AI learn your style and create better creatives.
            </p>
            <Button 
              onClick={() => setShowUploadModal(true)}
              variant="outline"
              className="rounded-full"
            >
              <Upload className="size-4 mr-2" />
              Upload Your First Example
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredExamples.map((example) => (
              <div
                key={example.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                {/* Media Preview */}
                <div className="relative aspect-video bg-slate-100">
                  {example.mediaUrl ? (
                    example.mediaType === 'video' ? (
                      <video
                        src={example.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                    ) : (
                      <Image
                        src={example.mediaUrl}
                        alt={example.name}
                        fill
                        className="object-cover"
                      />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {example.mediaType === 'video' ? (
                        <Video className="size-10 text-slate-300" />
                      ) : (
                        <ImageIcon className="size-10 text-slate-300" />
                      )}
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-black/60 text-white rounded-full backdrop-blur">
                      {PLATFORM_PRESETS[example.platform]?.displayName || example.platform}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-black/60 text-white rounded-full backdrop-blur uppercase">
                      {example.mediaType}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleFavorite(example.id, example.isFavorite)}
                      className={`p-1.5 rounded-full backdrop-blur ${
                        example.isFavorite 
                          ? 'bg-yellow-400 text-yellow-900' 
                          : 'bg-black/40 text-white hover:bg-black/60'
                      }`}
                    >
                      <Star className="size-3.5" fill={example.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => deleteExample(example.id)}
                      className="p-1.5 rounded-full bg-black/40 text-white hover:bg-red-500 backdrop-blur"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  {/* Performance Score */}
                  {example.performanceScore && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 text-xs font-bold bg-black/60 text-white rounded-full backdrop-blur">
                      {example.performanceScore}/10
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{example.name}</h3>
                  {example.description && (
                    <p className="text-sm text-slate-500 line-clamp-2">{example.description}</p>
                  )}
                  
                  {/* Tags */}
                  {example.styleKeywords && example.styleKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {example.styleKeywords.slice(0, 3).map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[10px] bg-purple-50 text-purple-600 rounded-full"
                        >
                          {kw}
                        </span>
                      ))}
                      {example.styleKeywords.length > 3 && (
                        <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-500 rounded-full">
                          +{example.styleKeywords.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Add Ad Example</h2>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X className="size-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    placeholder="e.g., Summer Sale Video Ad"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Platform
                  </label>
                  <select
                    value={uploadForm.platform}
                    onChange={(e) => setUploadForm({ ...uploadForm, platform: e.target.value as AdPlatform })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    {Object.values(PLATFORM_PRESETS).map((p) => (
                      <option key={p.platform} value={p.platform}>
                        {p.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Media Type
                  </label>
                  <select
                    value={uploadForm.mediaType}
                    onChange={(e) => setUploadForm({ ...uploadForm, mediaType: e.target.value as 'image' | 'video' })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                  </select>
                </div>
              </div>

              {/* Media URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Media URL *
                </label>
                <input
                  type="url"
                  value={uploadForm.mediaUrl}
                  onChange={(e) => setUploadForm({ ...uploadForm, mediaUrl: e.target.value })}
                  placeholder="https://example.com/your-ad-video.mp4"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Direct link to your video or image file
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="What makes this ad effective? Describe the creative approach..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                />
              </div>

              {/* Ad Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={uploadForm.headline}
                    onChange={(e) => setUploadForm({ ...uploadForm, headline: e.target.value })}
                    placeholder="Ad headline text"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    CTA Text
                  </label>
                  <input
                    type="text"
                    value={uploadForm.ctaText}
                    onChange={(e) => setUploadForm({ ...uploadForm, ctaText: e.target.value })}
                    placeholder="e.g., Shop Now"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Aspect Ratio
                  </label>
                  <select
                    value={uploadForm.aspectRatio}
                    onChange={(e) => setUploadForm({ ...uploadForm, aspectRatio: e.target.value as AspectRatioVideo })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Vertical</option>
                    <option value="1:1">1:1 Square</option>
                    <option value="4:5">4:5 Portrait</option>
                  </select>
                </div>

                {uploadForm.mediaType === 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={uploadForm.durationSeconds}
                      onChange={(e) => setUploadForm({ ...uploadForm, durationSeconds: parseInt(e.target.value) || 15 })}
                      min={1}
                      max={120}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                )}
              </div>

              {/* Performance */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Performance Score (1-10)
                  </label>
                  <input
                    type="number"
                    value={uploadForm.performanceScore}
                    onChange={(e) => setUploadForm({ ...uploadForm, performanceScore: Math.min(10, Math.max(1, parseInt(e.target.value) || 5)) })}
                    min={1}
                    max={10}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Style Keywords
                  </label>
                  <input
                    type="text"
                    value={uploadForm.styleKeywords}
                    onChange={(e) => setUploadForm({ ...uploadForm, styleKeywords: e.target.value })}
                    placeholder="minimalist, bold, animated"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  <p className="text-xs text-slate-400 mt-1">Comma-separated</p>
                </div>
              </div>

              {/* Performance Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Performance Notes
                </label>
                <textarea
                  value={uploadForm.performanceNotes}
                  onChange={(e) => setUploadForm({ ...uploadForm, performanceNotes: e.target.value })}
                  placeholder="Why did this ad perform well? What metrics did it achieve?"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || !uploadForm.name || !uploadForm.mediaUrl}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="size-4 mr-2" />
                    Add Example
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
