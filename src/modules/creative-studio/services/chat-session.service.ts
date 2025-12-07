/**
 * Chat Session Service
 * Handles persistence of creative chat sessions to Supabase
 * Sessions auto-expire after 10 days of inactivity
 */

import { createClient } from '@/lib/db/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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

export interface ChatSession {
  id: string;
  org_id: string;
  user_id: string;
  session_name: string;
  messages: ChatMessage[];
  proposed_copy: ProposedCopy | null;
  brand_kit_id: string | null;
  selected_models: {
    chatModel: string;
    imageModel: string;
    variantModels: string[];
  } | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get or create a chat session for the current user/org
 */
export async function getOrCreateSession(
  orgId: string,
  sessionId?: string
): Promise<ChatSession | null> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // If sessionId provided, try to fetch it
  if (sessionId) {
    const { data, error } = await supabase
      .from('creative_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('org_id', orgId)
      .single();
    
    if (!error && data) {
      return data as ChatSession;
    }
  }

  // Get most recent active session for this org/user
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
    return existing as ChatSession;
  }

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

  if (error) {
    console.error('Failed to create chat session:', error);
    return null;
  }

  return newSession as ChatSession;
}

/**
 * Update chat session with new messages and/or proposed copy
 */
export async function updateSession(
  sessionId: string,
  updates: {
    messages?: ChatMessage[];
    proposed_copy?: ProposedCopy | null;
    brand_kit_id?: string | null;
    selected_models?: {
      chatModel: string;
      imageModel: string;
      variantModels: string[];
    } | null;
    session_name?: string;
  }
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('creative_chat_sessions')
    .update(updates)
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to update chat session:', error);
    return false;
  }

  return true;
}

/**
 * List all active sessions for an org
 */
export async function listSessions(orgId: string): Promise<ChatSession[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('creative_chat_sessions')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to list chat sessions:', error);
    return [];
  }

  return (data || []) as ChatSession[];
}

/**
 * Delete a chat session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('creative_chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to delete chat session:', error);
    return false;
  }

  return true;
}

/**
 * Create a new session (for "New Chat" button)
 */
export async function createNewSession(orgId: string): Promise<ChatSession | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
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

  if (error) {
    console.error('Failed to create new chat session:', error);
    return null;
  }

  return data as ChatSession;
}
