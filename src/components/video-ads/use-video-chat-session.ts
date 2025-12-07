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

interface SessionModels {
    chatModel: string;
    videoModel: VideoModel;
    variantModels: VideoModel[];
}

interface VideoChatSessionData {
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

/**
 * Hook for managing video chat session persistence to Supabase
 * Sessions auto-expire after 10 days of inactivity
 */
export function useVideoChatSession({ orgId, onSessionLoaded }: UseVideoChatSessionOptions) {
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
                    
                    // Convert stored messages to proper format
                    const messages = (existing.messages || []).map((m: Record<string, unknown>) => ({
                        ...m,
                        timestamp: new Date(m.timestamp as string),
                    }));
                    
                    onSessionLoaded?.({
                        id: existing.id,
                        messages: messages as VideoChatMessage[],
                        proposedCopy: existing.proposed_copy as ProposedVideoCopy | null,
                        brandKitId: existing.brand_kit_id,
                        selectedModels: existing.selected_models as SessionModels | null,
                    });
                } else {
                    // Create new session
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
                    }
                }
            } catch (err) {
                console.error('Failed to load video chat session:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadSession();
    }, [orgId, supabase, onSessionLoaded]);

    // Debounced save function
    const saveSession = useCallback(
        async (data: {
            messages?: VideoChatMessage[];
            proposedCopy?: ProposedVideoCopy | null;
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
                    console.error('Failed to save video chat session:', err);
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
                return newSession.id;
            }
            return null;
        } catch (err) {
            console.error('Failed to create new video session:', err);
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
