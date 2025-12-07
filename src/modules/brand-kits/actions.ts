'use server';

import { createClient } from '@/lib/db/server';
import { BrandAnalyzer, BrandIdentity } from './brand-analyzer';
import { revalidatePath } from 'next/cache';
import { initBrandMemoryFromKit } from '../creative-studio/services/brand-memory.service';

export async function analyzeBrandAction(url: string, orgId?: string, model?: string) {
    try {
        let apiKey: string | undefined;

        if (orgId) {
            const supabase = await createClient();
            const { data } = await supabase
                .from('organization_secrets')
                .select('value')
                .eq('org_id', orgId)
                .eq('name', 'OPENAI_API_KEY')
                .single();

            if (data?.value) {
                apiKey = data.value;
            }
        }

        const brandIdentity = await BrandAnalyzer.analyze(url, apiKey, orgId, model);
        return { success: true, data: brandIdentity };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Analyze a URL, create a brand kit, and initialize brand memory from that kit.
 */
export async function createBrandKitAndMemoryFromUrlAction(url: string, orgId: string, model?: string) {
    const baseResult = await createBrandKitFromUrlAction(url, orgId, model);
    if (!baseResult.success || !baseResult.data?.kit) {
        return baseResult;
    }

    try {
        const memory = await initBrandMemoryFromKit(orgId, baseResult.data.kit.id);
        return { success: true, data: { ...baseResult.data, brandMemory: memory } };
    } catch (error: any) {
        console.error('initBrandMemoryFromKit failed:', error);
        return { success: false, error: error.message || 'Failed to create brand memory' };
    }
}

/**
 * Re-analyze an existing kit, update it, and refresh brand memory.
 */
export async function updateBrandKitAndMemoryFromUrlAction(kitId: string, url: string, orgId: string, model?: string) {
    try {
        const analysisResult = await analyzeBrandAction(url, orgId, model);
        if (!analysisResult.success || !analysisResult.data) {
            return { success: false, error: analysisResult.error || 'Analysis failed' };
        }
        const identity = analysisResult.data as BrandIdentity;

        // Update kit with latest analysis
        const supabase = await createClient();
        const { data: kit, error } = await supabase
            .from('brand_kits')
            .update({
                website_url: url,
                business_name: identity.business_name,
                description: identity.description,
                locations: identity.locations || [],
                colors: identity.colors || [],
                fonts: identity.fonts || { heading: 'Inter', body: 'Inter' },
                social_links: identity.social_links || {},
                offerings: identity.offerings || [],
                strategy: identity.strategy || {},
                logo_url: identity.logo_url,
            })
            .eq('id', kitId)
            .select()
            .single();

        if (error || !kit) {
            return { success: false, error: error?.message || 'Failed to update brand kit' };
        }

        // Refresh brand memory from updated kit
        const memory = await initBrandMemoryFromKit(orgId, kitId);

        revalidatePath(`/dashboard/${orgId}/brand-kits`);
        return { success: true, data: { kit, analysis: identity, brandMemory: memory } };
    } catch (error: any) {
        console.error('updateBrandKitAndMemoryFromUrlAction failed:', error);
        return { success: false, error: error.message || 'Failed to update brand kit and memory' };
    }
}

export async function createBrandKitFromUrlAction(url: string, orgId: string, model?: string) {
    if (!url || !orgId) {
        return { success: false, error: 'Missing url or orgId' };
    }

    try {
        const analysisResult = await analyzeBrandAction(url, orgId, model);
        if (!analysisResult.success || !analysisResult.data) {
            return { success: false, error: analysisResult.error || 'Failed to analyze brand' };
        }

        const identity = analysisResult.data as BrandIdentity;
        const supabase = await createClient();

        const logo_url = await uploadLogoToStorage(identity.logo_url || '', orgId);
        const fallbackName = identity.business_name || (() => {
            try {
                return new URL(url).hostname;
            } catch {
                return url;
            }
        })();

        const { data: brandKit, error } = await supabase
            .from('brand_kits')
            .insert({
                org_id: orgId,
                name: fallbackName,
                website_url: url,
                business_name: identity.business_name || fallbackName,
                description: identity.description || '',
                locations: identity.locations || [],
                colors: identity.colors || [],
                fonts: identity.fonts || { heading: 'Inter', body: 'Inter' },
                social_links: identity.social_links || {},
                logo_url,
                offerings: identity.offerings || [],
                strategy: identity.strategy || {},
            })
            .select()
            .single();

        if (error) {
            console.error('Database error creating brand kit from URL:', error);
            throw error;
        }

        revalidatePath(`/dashboard/${orgId}/brand-kits`);
        return { success: true, data: { kit: brandKit, analysis: identity } };
    } catch (error: any) {
        console.error('createBrandKitFromUrlAction failed:', error);
        return { success: false, error: error.message || 'Unable to create brand kit from URL' };
    }
}

async function uploadLogoToStorage(logoUrl: string, orgId: string): Promise<string> {
    if (!logoUrl) return '';

    try {
        // If it's already an internal Supabase URL, skip
        if (logoUrl.includes('supabase.co')) return logoUrl;

        const supabase = await createClient();
        let buffer: Buffer | ArrayBuffer;
        let contentType: string;
        let fileExt: string;

        if (logoUrl.startsWith('data:')) {
            // Handle data URI
            const matches = logoUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                return logoUrl; // Invalid data URI, return as is
            }
            contentType = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
            fileExt = contentType.split('/')[1] || 'png';
        } else {
            // Handle remote URL
            const response = await fetch(logoUrl);
            if (!response.ok) throw new Error('Failed to fetch logo');

            const blob = await response.blob();
            buffer = await blob.arrayBuffer();
            contentType = blob.type || 'image/png';
            fileExt = logoUrl.split('.').pop()?.split('?')[0] || 'png';
        }

        const fileName = `${orgId}/${Date.now()}-logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('brand-assets')
            .upload(fileName, buffer, {
                contentType,
                upsert: true
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return logoUrl; // Fallback to original URL
        }

        const { data: { publicUrl } } = supabase.storage
            .from('brand-assets')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Failed to process logo:', error);
        return logoUrl; // Fallback to original URL
    }
}

async function deleteLogoFromStorage(logoUrl: string) {
    if (!logoUrl || !logoUrl.includes('brand-assets')) return;
    try {
        const supabase = await createClient();
        // Extract path from URL. Usually: .../storage/v1/object/public/brand-assets/orgId/filename
        const path = logoUrl.split('/brand-assets/')[1];
        if (path) {
            await supabase.storage.from('brand-assets').remove([path]);
        }
    } catch (error) {
        console.error('Error deleting logo from storage:', error);
    }
}

export async function createBrandKitAction(data: any) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Action User ID:', user?.id);
        console.log('Action Org ID:', data.org_id);

        const { data: brandKit, error } = await supabase
            .from('brand_kits')
            .insert({
                org_id: data.org_id,
                name: data.name,
                website_url: data.website_url,
                business_name: data.business_name,
                description: data.description,
                locations: data.locations,
                colors: data.colors,
                fonts: data.fonts,
                social_links: data.social_links,
                logo_url: await uploadLogoToStorage(data.logo_url, data.org_id),
                offerings: data.offerings,
                strategy: data.strategy
            })
            .select()
            .single();

        if (error) {
            console.error('Database error creating brand kit:', error);
            throw error;
        }

        console.log('Brand kit created successfully:', brandKit);

        revalidatePath(`/dashboard/${data.org_id}/brand-kits`);
        return { success: true, data: brandKit };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateBrandKitAction(id: string, data: any) {
    try {
        const supabase = await createClient();

        // 1. Fetch current brand kit to get the old logo URL
        const { data: currentKit } = await supabase
            .from('brand_kits')
            .select('logo_url')
            .eq('id', id)
            .single();

        const newLogoUrl = await uploadLogoToStorage(data.logo_url, data.org_id);

        // 2. Update the brand kit
        const { error } = await supabase
            .from('brand_kits')
            .update({
                name: data.name,
                website_url: data.website_url,
                business_name: data.business_name,
                description: data.description,
                locations: data.locations,
                colors: data.colors,
                fonts: data.fonts,
                social_links: data.social_links,
                logo_url: newLogoUrl,
                offerings: data.offerings,
                strategy: data.strategy,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

        // 3. Cleanup old logo if it changed and exists in storage
        if (currentKit?.logo_url && currentKit.logo_url !== newLogoUrl) {
            await deleteLogoFromStorage(currentKit.logo_url);
        }

        revalidatePath('/dashboard/[orgId]/brand-kits');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteBrandKitAction(id: string) {
    try {
        const supabase = await createClient();

        // 1. Fetch the brand kit to get the logo URL before deleting
        const { data: brandKit } = await supabase
            .from('brand_kits')
            .select('logo_url')
            .eq('id', id)
            .single();

        // 2. Delete the record
        const { error } = await supabase
            .from('brand_kits')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // 3. Cleanup logo from storage
        if (brandKit?.logo_url) {
            await deleteLogoFromStorage(brandKit.logo_url);
        }

        revalidatePath('/dashboard/[orgId]/brand-kits');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getBrandKits(orgId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('brand_kits')
            .select('*')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
