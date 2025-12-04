'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
    Send, 
    Loader2, 
    CheckCircle2, 
    Edit3, 
    Lock,
    Unlock,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import { ChatMessage, ConfirmedCopy, CreativeBrief } from '@/modules/creative-studio/types';

interface CreativeChatProps {
    briefId: string;
    brief: CreativeBrief;
    onBriefUpdate: (brief: CreativeBrief) => void;
    onCopyConfirmed: () => void;
}

export function CreativeChat({ briefId, brief, onBriefUpdate, onCopyConfirmed }: CreativeChatProps) {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Initialize chat on mount
    useEffect(() => {
        if (brief.chat_history.length === 0) {
            initializeChat();
        }
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [brief.chat_history]);

    const initializeChat = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/creative-studio/briefs/${briefId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isInitial: true }),
            });
            const data = await res.json();
            if (data.success) {
                onBriefUpdate(data.brief);
            }
        } catch (err) {
            console.error('Failed to initialize chat:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!message.trim() || isLoading) return;

        const userMessage = message;
        setMessage('');
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch(`/api/creative-studio/briefs/${briefId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage }),
            });
            const data = await res.json();
            
            if (data.success) {
                onBriefUpdate(data.brief);
            } else {
                setError(data.error || 'Failed to send message');
            }
        } catch (err) {
            setError('Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
            textareaRef.current?.focus();
        }
    };

    const handleConfirmCopy = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/creative-studio/briefs/${briefId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'confirm_copy' }),
            });
            const data = await res.json();
            
            if (data.success) {
                onBriefUpdate(data.brief);
                onCopyConfirmed();
            } else {
                setError(data.error || 'Failed to confirm copy');
            }
        } catch (err) {
            setError('Failed to confirm copy. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {brief.chat_history.map((msg, i) => (
                    <ChatBubble key={msg.id || i} message={msg} />
                ))}
                
                {isLoading && (
                    <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                    </div>
                )}
                
                <div ref={chatEndRef} />
            </div>

            {/* Proposed Copy Card */}
            {brief.headline && brief.primary_text && brief.cta_text && !brief.copy_confirmed && (
                <div className="mx-4 mb-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            Proposed Copy
                        </h4>
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                            Pending Confirmation
                        </Badge>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Headline</label>
                            <p className="text-lg font-bold text-gray-900">{brief.headline}</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Primary Text</label>
                            <p className="text-gray-700">{brief.primary_text}</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">CTA</label>
                            <p className="text-indigo-600 font-medium">{brief.cta_text}</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button
                            onClick={handleConfirmCopy}
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Confirm & Generate
                        </Button>
                        <Button variant="outline" disabled={isLoading}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Request Changes
                        </Button>
                    </div>
                </div>
            )}

            {/* Confirmed Copy Card */}
            {brief.copy_confirmed && (
                <div className="mx-4 mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-green-600" />
                            Confirmed Copy
                        </h4>
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Locked
                        </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                        <p><strong>Headline:</strong> {brief.headline}</p>
                        <p><strong>Primary:</strong> {brief.primary_text}</p>
                        <p><strong>CTA:</strong> {brief.cta_text}</p>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 bg-white/50">
                <div className="flex gap-2">
                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={brief.copy_confirmed ? "Copy is confirmed. Ready to generate!" : "Tell me about your campaign..."}
                        className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                        disabled={isLoading || brief.copy_confirmed}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!message.trim() || isLoading || brief.copy_confirmed}
                        className="h-11 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ChatBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';
    
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    isUser
                        ? 'bg-indigo-500 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}
            >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
}
