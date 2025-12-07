'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/db/client';

// ============================================
// TYPES
// ============================================

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

export interface ChatSessionData {
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

// ============================================
// LOCALSTORAGE HELPERS
// ============================================

const STORAGE_KEY_PREFIX = 'admotion_chat_';

function getStorageKey(orgId: string): string {
  return `${STORAGE_KEY_PREFIX}${orgId}`;
}

function saveToLocalStorage(orgId: string, data: Partial<ChatSessionData>): void {
  try {
    const key = getStorageKey(orgId);
    const existing = localStorage.getItem(key);
    const parsed = existing ? JSON.parse(existing) : {};
    const merged = { ...parsed, ...data, updatedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(merged));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

function loadFromLocalStorage(orgId: string): Partial<ChatSessionData> | null {
  try {
    const key = getStorageKey(orgId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    // Convert timestamps back to Date objects
    if (parsed.messages) {
      parsed.messages = parsed.messages.map((m: Record<string, unknown>) => ({
        ...m,
        timestamp: new Date(m.timestamp as string),
      }));
    }
    return parsed;
  } catch (err) {
    console.warn('Failed to load from localStorage:', err);
    return null;
  }
}

function clearLocalStorage(orgId: string): void {
  try {
    localStorage.removeItem(getStorageKey(orgId));
  } catch (err) {
    console.warn('Failed to clear localStorage:', err);
  }
}

// ============================================
// HOOK
// ============================================

/**
 * Hook for managing chat session persistence to Supabase + localStorage
 * - localStorage provides immediate backup (prevents message loss)
 * - Supabase provides long-term persistence (10-day retention)
 * - Uses stable refs to prevent callback-induced re-renders
 */
export function useChatSession({ orgId, onSessionLoaded }: UseChatSessionOptions) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Use refs for stable callbacks
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onSessionLoadedRef = useRef(onSessionLoaded);
  const hasLoadedRef = useRef(false);
  const supabaseRef = useRef(createClient());
  
  // Keep callback ref updated
  useEffect(() => {
    onSessionLoadedRef.current = onSessionLoaded;
  }, [onSessionLoaded]);

  // Load or create session on mount (runs only once per orgId)
  useEffect(() => {
    // Prevent duplicate loads
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadSession = async () => {
      const supabase = supabaseRef.current;
      
      try {
        // First, try to restore from localStorage for immediate display
        const localData = loadFromLocalStorage(orgId);
        if (localData?.messages?.length) {
          // Immediately show cached messages while we load from DB
          onSessionLoadedRef.current?.({
            id: localData.id || '',
            messages: localData.messages || [],
            proposedCopy: localData.proposedCopy || null,
            brandKitId: localData.brandKitId || null,
            selectedModels: localData.selectedModels || null,
          });
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Try to get existing active session from Supabase
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
          const messages = (existing.messages || []).map((m: Record<string, unknown>) => ({
            ...m,
            timestamp: new Date(m.timestamp as string),
          }));
          
          // Only update if DB has newer/more data than localStorage
          const dbData: ChatSessionData = {
            id: existing.id,
            messages,
            proposedCopy: existing.proposed_copy,
            brandKitId: existing.brand_kit_id,
            selectedModels: existing.selected_models,
          };
          
          // Merge: prefer DB data if it has more messages, otherwise keep local
          const shouldUseDbData = !localData?.messages?.length || 
            messages.length >= (localData.messages?.length || 0);
          
          if (shouldUseDbData) {
            onSessionLoadedRef.current?.(dbData);
            // Update localStorage with DB data
            saveToLocalStorage(orgId, dbData);
          }
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
            // Clear any stale localStorage data for new session
            clearLocalStorage(orgId);
          }
        }
      } catch (err) {
        console.error('Failed to load chat session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [orgId]); // Only depend on orgId, not on callbacks

  // Debounced save function - also saves to localStorage immediately
  const saveSession = useCallback(
    async (data: {
      messages?: ChatMessage[];
      proposedCopy?: ProposedCopy | null;
      brandKitId?: string | null;
      selectedModels?: SessionModels | null;
    }) => {
      // Always save to localStorage immediately (prevents data loss)
      saveToLocalStorage(orgId, {
        id: sessionId || undefined,
        messages: data.messages,
        proposedCopy: data.proposedCopy,
        brandKitId: data.brandKitId,
        selectedModels: data.selectedModels,
      });

      if (!sessionId) return;

      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce Supabase saves to avoid too many DB calls
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        const supabase = supabaseRef.current;
        
        try {
          const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          
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
    [sessionId, orgId]
  );

  // Create new session (for "New Chat" button)
  const createNewSession = useCallback(async () => {
    const supabase = supabaseRef.current;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Clear localStorage for fresh start
      clearLocalStorage(orgId);

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
        hasLoadedRef.current = true; // Mark as loaded to prevent re-fetch
        return newSession.id;
      }
      return null;
    } catch (err) {
      console.error('Failed to create new session:', err);
      return null;
    }
  }, [orgId]);

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
    const supabase = supabaseRef.current;
    
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
        
        const sessionData: ChatSessionData = {
          id: session.id,
          messages,
          proposedCopy: session.proposed_copy,
          brandKitId: session.brand_kit_id,
          selectedModels: session.selected_models,
        };
        
        // Update localStorage with loaded session
        saveToLocalStorage(orgId, sessionData);
        
        // Call the callback with loaded data
        onSessionLoadedRef.current?.(sessionData);
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to load session by ID:', err);
      return false;
    }
  }, [orgId]);

  return {
    sessionId,
    isLoading,
    isSaving,
    saveSession,
    createNewSession,
    loadSessionById,
  };
}
