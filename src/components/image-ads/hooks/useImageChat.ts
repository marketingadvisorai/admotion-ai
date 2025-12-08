'use client';

/**
 * useImageChat Hook
 * Manages chat state and AI conversation for image ads
 */

import { useState, useCallback } from 'react';
import { ChatMessage, ProposedCopy, BrandContext } from '../types';
import { buildChatSystemPrompt } from '../utils/promptBuilder';
import { extractProposedCopy } from '../utils/copyParser';

interface UseImageChatOptions {
  orgId: string;
  getChatModelName: () => string;
  getBrandContext: () => BrandContext | undefined;
}

export function useImageChat({ orgId, getChatModelName, getBrandContext }: UseImageChatOptions) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [proposedCopy, setProposedCopy] = useState<ProposedCopy | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Send chat message
  const sendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    
    setIsChatting(true);
    setError(null);
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const brandContext = getBrandContext();
      const systemPrompt = buildChatSystemPrompt(brandContext);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage].map((m) => ({ 
            role: m.role, 
            content: m.content 
          })),
          systemPrompt,
          model: getChatModelName(),
          orgId,
        }),
      });

      const data = await res.json();

      if (data.content) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);

        // Try to extract proposed copy
        const hasBrandLogo = Boolean(brandContext?.logoUrl);
        const extracted = extractProposedCopy(data.content, hasBrandLogo);
        if (extracted) {
          setProposedCopy(extracted);
        }
      }

      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Chat failed:', err);
      setError('Failed to get response from AI');
    } finally {
      setIsChatting(false);
    }
  }, [chatMessages, orgId, getChatModelName, getBrandContext]);

  // Clear chat
  const clearChat = useCallback(() => {
    setChatMessages([]);
    setProposedCopy(null);
    setError(null);
  }, []);

  // Update proposed copy field
  const updateProposedCopy = useCallback((field: keyof ProposedCopy, value: string) => {
    if (proposedCopy) {
      setProposedCopy({ ...proposedCopy, [field]: value, confirmed: false });
    }
  }, [proposedCopy]);

  // Confirm proposed copy
  const confirmCopy = useCallback(() => {
    if (proposedCopy) {
      setProposedCopy({ ...proposedCopy, confirmed: true });
    }
  }, [proposedCopy]);

  // Add feedback message after generation
  const addFeedbackMessage = useCallback((content: string) => {
    const feedbackMessage: ChatMessage = {
      id: `${Date.now()}-feedback`,
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, feedbackMessage]);
  }, []);

  return {
    chatMessages,
    setChatMessages,
    isChatting,
    proposedCopy,
    setProposedCopy,
    error,
    setError,
    sendMessage,
    clearChat,
    updateProposedCopy,
    confirmCopy,
    addFeedbackMessage,
  };
}
