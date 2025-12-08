'use client';

import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, MessageSquare, Send, Loader2, AlertCircle, X } from 'lucide-react';
import { VideoChatMessage } from '@/modules/video-generation/types';

interface VideoChatPanelProps {
  messages: VideoChatMessage[];
  prompt: string;
  setPrompt: (value: string) => void;
  isChatting: boolean;
  isGenerating: boolean;
  error: string | null;
  onClearError: () => void;
  onSubmit: () => void;
  onNewChat: () => void;
  creativeMode: 'chat' | 'make';
  setCreativeMode: (mode: 'chat' | 'make') => void;
  children?: React.ReactNode; // For brand picker and model dropdown
}

/**
 * Video Chat Panel - right sidebar for chat interaction
 * ~130 lines
 */
export function VideoChatPanel({
  messages,
  prompt,
  setPrompt,
  isChatting,
  isGenerating,
  error,
  onClearError,
  onSubmit,
  onNewChat,
  creativeMode,
  setCreativeMode,
  children,
}: VideoChatPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim()) onSubmit();
    }
  };

  return (
    <div className="w-[400px] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Video className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Video Ad Assistant</p>
            <p className="text-xs text-slate-500">{messages.length} messages</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-slate-500" onClick={onNewChat}>
          New Chat
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-md'
                  : 'bg-slate-100 text-slate-800 rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isChatting && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="size-4 animate-spin text-slate-500" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="size-4" />
          <span className="flex-1">{error}</span>
          <button onClick={onClearError}>
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {children}

          {/* Mode Toggle */}
          <div className="flex items-center gap-0.5 rounded-full bg-slate-100 border border-slate-200 p-0.5">
            <button
              onClick={() => setCreativeMode('chat')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                creativeMode === 'chat' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MessageSquare className="size-3" />
              Chat
            </button>
            <button
              onClick={() => setCreativeMode('make')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                creativeMode === 'make' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Video className="size-3" />
              Make
            </button>
          </div>
        </div>

        {/* Text Input */}
        <div className="relative">
          <div className="absolute inset-0 rounded-[20px] bg-gradient-to-r from-[#c8b5ff] via-[#b7d8ff] to-[#6ad9ff] opacity-90" />
          <div className="relative rounded-[18px] bg-white shadow-lg border border-white">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder={creativeMode === 'chat' ? 'Ask for ideas...' : 'Describe your video...'}
              className="w-full min-h-[60px] resize-none rounded-[18px] border-0 bg-transparent px-4 pt-3 pb-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <span className="text-[10px] text-slate-400">↵ Enter</span>
              <Button
                size="icon"
                className="h-8 w-8 rounded-xl bg-purple-600 text-white shadow-md hover:bg-purple-700"
                onClick={onSubmit}
                disabled={!prompt.trim() || isChatting || isGenerating}
              >
                {isChatting || isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoChatPanel;
