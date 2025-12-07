'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/db/client';
import { 
    VideoChatMessage, 
    VideoOverlayElement, 
    ProposedVideoCopy,
    VideoDuration,
    VideoModel,
} from '@/modules/video-generation/types';

// ============================================
// TYPES
// ============================================

interface SessionModels {
    chatModel: string;
    videoModel: VideoModel;
    variantModels: VideoModel[];
}

export interface VideoChatSessionData {
    id: string;
    messages: VideoChatMessage[];
    proposedCopy: ProposedVideoCopy | null;
    brandKitId: string | null;
    selectedModels: SessionModels | null;
}

interface UseVideoChatSessionOptions {
    orgId: string;
    onSessionLoaded?: (session: VideoChatSessionData) => void;
}

// ============================================
// LOCALSTORAGE HELPERS
// ============================================

const STORAGE_KEY_PREFIX = 'admotion_video_chat_';

function getStorageKey(orgId: string): string {
    return `${STORAGE_KEY_PREFIX}${orgId}`;
}

function saveToLocalStorage(orgId: string, data: Partial<VideoChatSessionData>): void {
    try {
        const key = getStorageKey(orgId);
        const existing = localStorage.getItem(key);
        const parsed = existing ? JSON.parse(existing) : {};
        const merged = { ...parsed, ...data, updatedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(merged));
    } catch (err) {
        console.warn('Failed to save video chat to localStorage:', err);
    }
}

function loadFromLocalStorage(orgId: string): Partial<VideoChatSessionData> | null {
    try {
        const key = getStorageKey(orgId);
        const stored = localStorage.getItem(key);
        if (!stored) return null;
        
        const parsed = JSON.parse(stored);
        if (parsed.messages) {
            parsed.messages = parsed.messages.map((m: Record<string, unknown>) => ({
                ...m,
                timestamp: new Date(m.timestamp as string),
            }));
        }
        return parsed;
    } catch (err) {
        console.warn('Failed to load video chat from localStorage:', err);
        return null;
    }
}

function clearLocalStorage(orgId: string): void {
    try {
        localStorage.removeItem(getStorageKey(orgId));
    } catch (err) {
        console.warn('Failed to clear video chat localStorage:', err);
    }
}

// ============================================
// HOOK
// ============================================

/**
 * Hook for managing video chat session persistence to Supabase + localStorage
 * - localStorage provides immediate backup (prevents message loss)
 * - Supabase provides long-term persistence (10-day retention)
 * - Uses stable refs to prevent callback-induced re-renders
 */
export function useVideoChatSession({ orgId, onSessionLoaded }: UseVideoChatSessionOptions) {
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
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;

        const loadSession = async () => {
            const supabase = supabaseRef.current;
            
            try {
                // First, try to restore from localStorage for immediate display
                const localData = loadFromLocalStorage(orgId);
                if (localData?.messages?.length) {
                    onSessionLoadedRef.current?.({
                        id: localData.id || '',
                        messages: localData.messages as VideoChatMessage[] || [],
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

                // Try to get existing active session for video
                const { data: existing } = await supabase
                    .from('creative_chat_sessions')
                    .select('*')
                    .eq('org_id', orgId)
                    .eq('user_id', user.id)
                    .eq('session_type', 'video')
                    .gt('expires_at', new Date().toISOString())
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single();

                if (existing) {
                    setSessionId(existing.id);
                    
                    const messages = (existing.messages || []).map((m: Record<string, unknown>) => ({
                        ...m,
                        timestamp: new Date(m.timestamp as string),
                    }));
                    
                    const dbData: VideoChatSessionData = {
                        id: existing.id,
                        messages: messages as VideoChatMessage[],
                        proposedCopy: existing.proposed_copy as ProposedVideoCopy | null,
                        brandKitId: existing.brand_kit_id,
                        selectedModels: existing.selected_models as SessionModels | null,
                    };
                    
                    const shouldUseDbData = !localData?.messages?.length || 
                        messages.length >= (localData.messages?.length || 0);
                    
                    if (shouldUseDbData) {
                        onSessionLoadedRef.current?.(dbData);
                        saveToLocalStorage(orgId, dbData);
                    }
                } else {
                    const { data: newSession, error } = await supabase
                        .from('creative_chat_sessions')
                        .insert({
                            org_id: orgId,
                            user_id: user.id,
                            session_type: 'video',
                            session_name: 'New Video Ad Session',
                            messages: [],
                            proposed_copy: null,
                            selected_models: null,
                        })
                        .select()
                        .single();

                    if (!error && newSession) {
                        setSessionId(newSession.id);
                        clearLocalStorage(orgId);
                    }
                }
            } catch (err) {
                console.error('Failed to load video chat session:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadSession();
    }, [orgId]);

    // Debounced save function - also saves to localStorage immediately
    const saveSession = useCallback(
        async (data: {
            messages?: VideoChatMessage[];
            proposedCopy?: ProposedVideoCopy | null;
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
                    console.error('Failed to save video chat session:', err);
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
                    session_type: 'video',
                    session_name: 'New Video Ad Session',
                    messages: [],
                    proposed_copy: null,
                    selected_models: null,
                })
                .select()
                .single();

            if (!error && newSession) {
                setSessionId(newSession.id);
                hasLoadedRef.current = true;
                return newSession.id;
            }
            return null;
        } catch (err) {
            console.error('Failed to create new video session:', err);
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

    return {
        sessionId,
        isLoading,
        isSaving,
        saveSession,
        createNewSession,
    };
}

// Re-export types for convenience
export type { 
    VideoChatMessage, 
    VideoOverlayElement, 
    ProposedVideoCopy,
    VideoDuration,
    VideoModel,
};
