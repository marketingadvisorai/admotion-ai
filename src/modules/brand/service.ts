import { createClient } from '@/lib/db/server';
import { BrandKit } from './types';
import { cache } from 'react';

export const getBrandKit = cache(async (orgId: string): Promise<BrandKit | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('org_id', orgId)
        .single();

    if (error) return null;
    return data as unknown as BrandKit;
});
