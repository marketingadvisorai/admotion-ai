/**
 * Brand Memory Service
 * Manages versioned brand memories per organization
 */

import { createClient } from '@/lib/db/server';
import { cache } from 'react';
import { BrandMemory, BrandMemoryInput } from '../types';

/**
 * Get the active brand memory for an organization
 */
export const getActiveBrandMemory = cache(async (orgId: string): Promise<BrandMemory | null> => {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('brand_memories')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) return null;
    return data as BrandMemory;
});

/**
 * Get a specific version of brand memory
 */
export const getBrandMemoryVersion = cache(async (orgId: string, version: number): Promise<BrandMemory | null> => {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('brand_memories')
        .select('*')
        .eq('org_id', orgId)
        .eq('version', version)
        .single();

    if (error || !data) return null;
    return data as BrandMemory;
});

/**
 * Get all brand memory versions for an organization
 */
export const getAllBrandMemoryVersions = cache(async (orgId: string): Promise<BrandMemory[]> => {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('brand_memories')
        .select('*')
        .eq('org_id', orgId)
        .order('version', { ascending: false });

    if (error || !data) return [];
    return data as BrandMemory[];
});

/**
 * Create initial brand memory for an organization
 */
export async function createBrandMemory(input: BrandMemoryInput): Promise<BrandMemory> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('brand_memories')
        .insert({
            ...input,
            version: 1,
            is_active: true,
            created_by: user?.id,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as BrandMemory;
}

/**
 * Update brand memory - creates a NEW VERSION (never overwrites)
 * This ensures old campaigns retain their original brand context
 */
export async function updateBrandMemory(
    orgId: string, 
    updates: Partial<BrandMemoryInput>
): Promise<BrandMemory> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get current version
    const currentMemory = await getActiveBrandMemory(orgId);
    const newVersion = (currentMemory?.version || 0) + 1;

    // Deactivate all previous versions
    await supabase
        .from('brand_memories')
        .update({ is_active: false })
        .eq('org_id', orgId);

    // Create new version with merged data
    const newMemoryData = {
        org_id: orgId,
        version: newVersion,
        is_active: true,
        brand_name: updates.brand_name ?? currentMemory?.brand_name,
        tagline: updates.tagline ?? currentMemory?.tagline,
        logo_url: updates.logo_url ?? currentMemory?.logo_url,
        primary_colors: updates.primary_colors ?? currentMemory?.primary_colors ?? [],
        secondary_colors: updates.secondary_colors ?? currentMemory?.secondary_colors ?? [],
        fonts: updates.fonts ?? currentMemory?.fonts ?? {},
        style_tokens: updates.style_tokens ?? currentMemory?.style_tokens ?? {},
        layout_style: updates.layout_style ?? currentMemory?.layout_style ?? 'modern',
        logo_placement: updates.logo_placement ?? currentMemory?.logo_placement ?? 'bottom-right',
        text_safe_zones: updates.text_safe_zones ?? currentMemory?.text_safe_zones ?? {},
        voice_rules: updates.voice_rules ?? currentMemory?.voice_rules ?? {},
        do_list: updates.do_list ?? currentMemory?.do_list ?? [],
        dont_list: updates.dont_list ?? currentMemory?.dont_list ?? [],
        compliance_rules: updates.compliance_rules ?? currentMemory?.compliance_rules ?? [],
        performance_data: updates.performance_data ?? currentMemory?.performance_data ?? {},
        fatigued_styles: updates.fatigued_styles ?? currentMemory?.fatigued_styles ?? [],
        created_by: user?.id,
    };

    const { data, error } = await supabase
        .from('brand_memories')
        .insert(newMemoryData)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as BrandMemory;
}

/**
 * Initialize brand memory from existing brand kit
 */
export async function initBrandMemoryFromKit(orgId: string, brandKitId: string): Promise<BrandMemory> {
    const supabase = await createClient();
    
    // Get brand kit
    const { data: kit, error: kitError } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('id', brandKitId)
        .single();

    if (kitError || !kit) throw new Error('Brand kit not found');

    // Check if brand memory already exists
    const existing = await getActiveBrandMemory(orgId);
    if (existing) {
        return updateBrandMemory(orgId, {
            brand_name: kit.business_name || kit.name,
            logo_url: kit.logo_url,
            primary_colors: kit.colors?.filter((c: { type: string }) => c.type === 'primary') || [],
            secondary_colors: kit.colors?.filter((c: { type: string }) => c.type !== 'primary') || [],
            fonts: kit.fonts || {},
            style_tokens: {
                vibe: kit.strategy?.brand_voice,
                mood: kit.strategy?.target_audience,
            },
            voice_rules: {
                tone: kit.strategy?.brand_voice,
            },
        });
    }

    return createBrandMemory({
        org_id: orgId,
        is_active: true,
        brand_name: kit.business_name || kit.name,
        tagline: kit.description,
        logo_url: kit.logo_url,
        primary_colors: kit.colors?.filter((c: { type: string }) => c.type === 'primary') || [],
        secondary_colors: kit.colors?.filter((c: { type: string }) => c.type !== 'primary') || [],
        fonts: kit.fonts || {},
        style_tokens: {
            vibe: kit.strategy?.brand_voice,
            mood: kit.strategy?.target_audience,
        },
        layout_style: 'modern',
        logo_placement: 'bottom-right',
        text_safe_zones: {},
        voice_rules: {
            tone: kit.strategy?.brand_voice,
        },
        do_list: [],
        dont_list: [],
        compliance_rules: [],
        performance_data: {},
        fatigued_styles: [],
    });
}
