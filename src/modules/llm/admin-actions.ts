'use server';

import { createClient } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';
// Types imported when needed

export interface UpsertLlmProfileInput {
    id?: string;
    slug: string;
    provider: string;
    model: string;
    system_prompt: string;
    user_template?: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: string;
    is_active?: boolean;
}

export async function upsertLlmProfileAction(input: UpsertLlmProfileInput) {
    try {
        const supabase = await createClient();

        const payload = {
            slug: input.slug,
            provider: input.provider,
            model: input.model,
            system_prompt: input.system_prompt,
            user_template: input.user_template ?? null,
            temperature: input.temperature ?? 0.2,
            max_tokens: input.max_tokens ?? 512,
            response_format: input.response_format ?? null,
            is_active: input.is_active ?? true,
            updated_at: new Date().toISOString(),
        };

        const query = supabase.from('llm_profiles');
        if (input.id) {
            const { error } = await query.update(payload).eq('id', input.id);
            if (error) throw error;
        } else {
            const { error } = await query.insert(payload);
            if (error) throw error;
        }

        revalidatePath('/admin/llm');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save LLM profile';
        return { success: false, error: message };
    }
}

export async function deleteLlmProfileAction(id: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('llm_profiles')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/llm');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete LLM profile';
        return { success: false, error: message };
    }
}
