'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/db/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface OverlayElement {
  type: 'headline' | 'button' | 'logo' | 'badge' | 'tagline';
  text?: string;
  position?: string;
  style?: string;
}

export interface ProposedCopy {
  headline: string;
  ctaText: string;
  imageDirection: string;
  overlayElements: OverlayElement[];
  confirmed: boolean;
}

interface SessionModels {
  chatModel: string;
  imageModel: string;
  variantModels: string[];
}

interface ChatSessionData {
  id: string;
  messages: ChatMessage[];
  proposedCopy: ProposedCopy | null;
  brandKitId: string | null;
  selectedModels: SessionModels | null;
}

interface UseChatSessionOptions {
  orgId: string;
  onSessionLoaded?: (session: ChatSessionData) => void;
}

/**
 * Hook for managing chat session persistence to Supabase
 * Sessions auto-expire after 10 days of inactivity
 */
export function useChatSession({ orgId, onSessionLoaded }: UseChatSessionOptions) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Load or create session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Try to get existing active session
        const { data: existing } = await supabase
          .from('creative_chat_sessions')
          .select('*')
          .eq('org_id', orgId)
          .eq('user_id', user.id)
          .gt('expires_at', new Date().toISOString())
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (existing) {
          setSessionId(existing.id);
          
          // Convert stored messages to proper format
          const messages = (existing.messages || []).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          
          onSessionLoaded?.({
            id: existing.id,
            messages,
            proposedCopy: existing.proposed_copy,
            brandKitId: existing.brand_kit_id,
            selectedModels: existing.selected_models,
          });
        } else {
          // Create new session
          const { data: newSession, error } = await supabase
            .from('creative_chat_sessions')
            .insert({
              org_id: orgId,
              user_id: user.id,
              session_name: 'New Ad Session',
              messages: [],
              proposed_copy: null,
              selected_models: null,
            })
            .select()
            .single();

          if (!error && newSession) {
            setSessionId(newSession.id);
          }
        }
      } catch (err) {
        console.error('Failed to load chat session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [orgId, supabase, onSessionLoaded]);

  // Debounced save function
  const saveSession = useCallback(
    async (data: {
      messages?: ChatMessage[];
      proposedCopy?: ProposedCopy | null;
      brandKitId?: string | null;
      selectedModels?: SessionModels | null;
    }) => {
      if (!sessionId) return;

      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce saves to avoid too many DB calls
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          const updates: Record<string, unknown> = {};
          
          if (data.messages !== undefined) {
            // Convert Date objects to ISO strings for storage
            updates.messages = data.messages.map(m => ({
              ...m,
              timestamp: m.timestamp.toISOString(),
            }));
          }
          if (data.proposedCopy !== undefined) {
            updates.proposed_copy = data.proposedCopy;
          }
          if (data.brandKitId !== undefined) {
            updates.brand_kit_id = data.brandKitId;
          }
          if (data.selectedModels !== undefined) {
            updates.selected_models = data.selectedModels;
          }

          await supabase
            .from('creative_chat_sessions')
            .update(updates)
            .eq('id', sessionId);
        } catch (err) {
          console.error('Failed to save chat session:', err);
        } finally {
          setIsSaving(false);
        }
      }, 500);
    },
    [sessionId, supabase]
  );

  // Create new session (for "New Chat" button)
  const createNewSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: newSession, error } = await supabase
        .from('creative_chat_sessions')
        .insert({
          org_id: orgId,
          user_id: user.id,
          session_name: 'New Ad Session',
          messages: [],
          proposed_copy: null,
          selected_models: null,
        })
        .select()
        .single();

      if (!error && newSession) {
        setSessionId(newSession.id);
        return newSession.id;
      }
      return null;
    } catch (err) {
      console.error('Failed to create new session:', err);
      return null;
    }
  }, [orgId, supabase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Load a specific session by ID (for viewing chat history of a generated image)
  const loadSessionById = useCallback(async (targetSessionId: string) => {
    try {
      const { data: session } = await supabase
        .from('creative_chat_sessions')
        .select('*')
        .eq('id', targetSessionId)
        .single();

      if (session) {
        setSessionId(session.id);
        
        // Convert stored messages to proper format
        const messages = (session.messages || []).map((m: Record<string, unknown>) => ({
          ...m,
          timestamp: new Date(m.timestamp as string),
        }));
        
        onSessionLoaded?.({
          id: session.id,
          messages,
          proposedCopy: session.proposed_copy,
          brandKitId: session.brand_kit_id,
          selectedModels: session.selected_models,
        });
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to load session by ID:', err);
      return false;
    }
  }, [supabase, onSessionLoaded]);

  return {
    sessionId,
    isLoading,
    isSaving,
    saveSession,
    createNewSession,
    loadSessionById,
  };
}
