/**
 * Creative Brief Service
 * Manages brief intake, chat, and copy confirmation workflow
 */

import { createClient } from '@/lib/db/server';
import { cache } from 'react';
import { 
    CreativeBrief, 
    CreateBriefInput, 
    ChatMessage, 
    ConfirmedCopy,
    BriefStatus 
} from '../types';

/**
 * Create a new creative brief
 */
export async function createBrief(input: CreateBriefInput): Promise<CreativeBrief> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('creative_briefs')
        .insert({
            ...input,
            status: 'intake',
            chat_history: [],
            copy_confirmed: false,
            reference_images: [],
            created_by: user?.id,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as CreativeBrief;
}

/**
 * Get a brief by ID
 */
export const getBrief = cache(async (briefId: string): Promise<CreativeBrief | null> => {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('creative_briefs')
        .select('*')
        .eq('id', briefId)
        .single();

    if (error || !data) return null;
    return data as CreativeBrief;
});

/**
 * Get all briefs for an organization
 */
export const getBriefs = cache(async (orgId: string): Promise<CreativeBrief[]> => {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('creative_briefs')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as CreativeBrief[];
});

/**
 * Add a chat message to the brief
 */
export async function addChatMessage(
    briefId: string, 
    message: Omit<ChatMessage, 'id' | 'timestamp'>
): Promise<CreativeBrief> {
    const supabase = await createClient();

    // Get current brief
    const brief = await getBrief(briefId);
    if (!brief) throw new Error('Brief not found');

    const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        ...message,
        timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...(brief.chat_history || []), newMessage];

    const { data, error } = await supabase
        .from('creative_briefs')
        .update({
            chat_history: updatedHistory,
            status: brief.copy_confirmed ? brief.status : 'intake',
            updated_at: new Date().toISOString(),
        })
        .eq('id', briefId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as CreativeBrief;
}

/**
 * Propose copy for confirmation
 */
export async function proposeCopy(
    briefId: string,
    copy: ConfirmedCopy
): Promise<CreativeBrief> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('creative_briefs')
        .update({
            headline: copy.headline,
            primary_text: copy.primary_text,
            cta_text: copy.cta_text,
            status: 'copy_pending',
            updated_at: new Date().toISOString(),
        })
        .eq('id', briefId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as CreativeBrief;
}

/**
 * Confirm copy - THIS IS THE HARD GATE
 * Only after this can image generation begin
 */
export async function confirmCopy(briefId: string): Promise<CreativeBrief> {
    const supabase = await createClient();

    // Verify copy exists
    const brief = await getBrief(briefId);
    if (!brief) throw new Error('Brief not found');
    if (!brief.headline || !brief.primary_text || !brief.cta_text) {
        throw new Error('Cannot confirm: headline, primary text, and CTA are required');
    }

    const { data, error } = await supabase
        .from('creative_briefs')
        .update({
            copy_confirmed: true,
            copy_confirmed_at: new Date().toISOString(),
            status: 'copy_confirmed',
            updated_at: new Date().toISOString(),
        })
        .eq('id', briefId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as CreativeBrief;
}

/**
 * Update brief copy (before confirmation)
 */
export async function updateCopy(
    briefId: string,
    copy: Partial<ConfirmedCopy>
): Promise<CreativeBrief> {
    const supabase = await createClient();

    const brief = await getBrief(briefId);
    if (!brief) throw new Error('Brief not found');
    
    // Can't update after confirmation
    if (brief.copy_confirmed) {
        throw new Error('Cannot update copy after confirmation. Create a new brief or unlock first.');
    }

    const { data, error } = await supabase
        .from('creative_briefs')
        .update({
            headline: copy.headline ?? brief.headline,
            primary_text: copy.primary_text ?? brief.primary_text,
            cta_text: copy.cta_text ?? brief.cta_text,
            updated_at: new Date().toISOString(),
        })
        .eq('id', briefId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as CreativeBrief;
}

/**
 * Update brief status
 */
export async function updateBriefStatus(
    briefId: string,
    status: BriefStatus
): Promise<CreativeBrief> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('creative_briefs')
        .update({
            status,
            updated_at: new Date().toISOString(),
        })
        .eq('id', briefId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as CreativeBrief;
}

/**
 * Update brief style direction
 */
export async function updateStyleDirection(
    briefId: string,
    styleDirection: string
): Promise<CreativeBrief> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('creative_briefs')
        .update({
            style_direction: styleDirection,
            updated_at: new Date().toISOString(),
        })
        .eq('id', briefId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as CreativeBrief;
}

/**
 * Check if brief is ready for generation
 */
export function canGenerateCreatives(brief: CreativeBrief): { canGenerate: boolean; reason?: string } {
    if (!brief.copy_confirmed) {
        return { canGenerate: false, reason: 'Copy must be confirmed before generating creatives' };
    }
    if (!brief.headline) {
        return { canGenerate: false, reason: 'Headline is required' };
    }
    if (!brief.primary_text) {
        return { canGenerate: false, reason: 'Primary text is required' };
    }
    if (!brief.cta_text) {
        return { canGenerate: false, reason: 'CTA text is required' };
    }
    if (brief.status === 'generating') {
        return { canGenerate: false, reason: 'Generation already in progress' };
    }
    return { canGenerate: true };
}

/**
 * Get confirmed copy from brief
 */
export function getConfirmedCopy(brief: CreativeBrief): ConfirmedCopy | null {
    if (!brief.copy_confirmed) return null;
    if (!brief.headline || !brief.primary_text || !brief.cta_text) return null;
    
    return {
        headline: brief.headline,
        primary_text: brief.primary_text,
        cta_text: brief.cta_text,
    };
}
