'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, MessageSquare } from 'lucide-react';
import { ResultGridVideo } from '@/components/ads/result-grid-video';
import { ProposedVideoCard, VideoChatPanel, GenerationProgress } from '../components';
import { VideoModel } from '../use-video-chat-session';
import { AspectRatioVideo, GeneratedVideo } from '../types';
import { ProposedVideoCopy, VideoDuration } from '@/modules/video-generation/types';
import { AdPlatform, AdSize } from '@/components/ads/ad-platform-types';

type CreativeMode = 'chat' | 'make';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSessionViewProps {
  generatedVideos: GeneratedVideo[];
  proposedCopy: ProposedVideoCopy | null;
  setProposedCopy: React.Dispatch<React.SetStateAction<ProposedVideoCopy | null>>;
  selectedVideoModel: VideoModel;
  setSelectedVideoModel: (model: VideoModel) => void;
  isGenerating: boolean;
  generationProgress: number;
  chatMessages: ChatMessage[];
  prompt: string;
  setPrompt: (value: string) => void;
  isChatting: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  creativeMode: CreativeMode;
  setCreativeMode: (mode: CreativeMode) => void;
  onClearChat: () => void;
  onConfirmCopy: () => void;
  onGenerate: () => void;
  selectedPlatforms: AdPlatform[];
  selectedSizes: AdSize[];
  duration: VideoDuration;
  setDuration: (duration: VideoDuration) => void;
}

/**
 * ChatSessionView - Split panel view with preview and chat
 * ~130 lines
 */
export function ChatSessionView({
  generatedVideos,
  proposedCopy,
  setProposedCopy,
  selectedVideoModel,
  setSelectedVideoModel,
  isGenerating,
  generationProgress,
  chatMessages,
  prompt,
  setPrompt,
  isChatting,
  error,
  setError,
  creativeMode,
  setCreativeMode,
  onClearChat,
  onConfirmCopy,
  onGenerate,
  selectedPlatforms,
  selectedSizes,
  duration,
  setDuration,
}: ChatSessionViewProps) {
  const [selectedAspect, setSelectedAspect] = React.useState<AspectRatioVideo>(
    selectedSizes[0]?.aspectRatio as AspectRatioVideo || '16:9'
  );

  const updateProposedCopy = (field: keyof ProposedVideoCopy, value: string | number) => {
    if (proposedCopy) {
      setProposedCopy({ ...proposedCopy, [field]: value, confirmed: false });
      if (field === 'duration') {
        setDuration(value as VideoDuration);
      }
    }
  };

  const handleSubmit = () => {
    if (creativeMode === 'chat') {
      // Chat logic handled in parent
    } else {
      onGenerate();
    }
  };

  return (
    <div className="relative overflow-hidden bg-[#f8f9fc] min-h-screen">
      <div className="flex h-screen">
        {/* Left Panel - Preview & Plan */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Video Preview</h2>
              <p className="text-sm text-slate-500">
                {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''} · {selectedSizes.length} size{selectedSizes.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={onClearChat}>
              <Trash2 className="size-4 mr-1.5" />
              New Chat
            </Button>
          </div>

          <GenerationProgress
            isVisible={isGenerating || generationProgress > 0}
            progress={generationProgress}
            modelName={selectedVideoModel}
          />

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {proposedCopy && (
              <ProposedVideoCard
                proposedCopy={proposedCopy}
                selectedAspect={selectedAspect}
                selectedVideoModel={selectedVideoModel}
                isGenerating={isGenerating}
                onUpdate={updateProposedCopy}
                onAspectChange={setSelectedAspect}
                onModelChange={setSelectedVideoModel}
                onConfirm={onConfirmCopy}
                onGenerate={onGenerate}
              />
            )}

            {generatedVideos.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Generated Videos</h4>
                <ResultGridVideo videos={generatedVideos.slice(0, 6)} />
              </div>
            )}

            {!proposedCopy && generatedVideos.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-center py-20">
                <div className="text-slate-400">
                  <MessageSquare className="size-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Keep chatting to discuss your video ad idea.</p>
                  <p className="text-xs mt-1">AI will propose details when ready.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat */}
        <VideoChatPanel
          messages={chatMessages}
          prompt={prompt}
          setPrompt={setPrompt}
          isChatting={isChatting}
          isGenerating={isGenerating}
          error={error}
          onClearError={() => setError(null)}
          onSubmit={handleSubmit}
          onNewChat={onClearChat}
          creativeMode={creativeMode}
          setCreativeMode={setCreativeMode}
        />
      </div>
    </div>
  );
}

export default ChatSessionView;
