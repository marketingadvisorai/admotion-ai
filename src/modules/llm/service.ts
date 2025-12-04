import { createClient } from '@/lib/db/server';
import { cache } from 'react';
import { LlmProfile } from './types';

export const getLlmProfile = cache(async (slug: string): Promise<LlmProfile | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('llm_profiles')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !data) {
        return null;
    }

    return data as LlmProfile;
});

