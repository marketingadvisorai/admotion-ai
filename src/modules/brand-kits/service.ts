import { createClient } from '@/lib/db/server';
import { BrandKit, CreateBrandKitInput, UpdateBrandKitInput } from './types';
import { cache } from 'react';

export const getBrandKits = cache(async (orgId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data as BrandKit[];
});

export const getBrandKit = cache(async (id: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data as BrandKit;
});

export async function createBrandKit(input: CreateBrandKitInput) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('brand_kits')
        .insert({
            org_id: input.orgId,
            name: input.name,
            logo_url: input.logo_url,
            colors: input.colors,
            fonts: input.fonts,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as BrandKit;
}

export async function updateBrandKit(input: UpdateBrandKitInput) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('brand_kits')
        .update({
            name: input.name,
            logo_url: input.logo_url,
            colors: input.colors,
            fonts: input.fonts,
        })
        .eq('id', input.id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as BrandKit;
}

export async function deleteBrandKit(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('brand_kits')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
}
