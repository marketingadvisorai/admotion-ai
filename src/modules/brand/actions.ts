'use server';

import { createClient } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';
import { BrandColors, BrandFonts } from './types';

export async function updateBrandKit(orgId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const logoUrl = formData.get('logoUrl') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const secondaryColor = formData.get('secondaryColor') as string;
    const headingFont = formData.get('headingFont') as string;
    const bodyFont = formData.get('bodyFont') as string;

    const colors: BrandColors = {
        primary: primaryColor,
        secondary: secondaryColor,
    };

    const fonts: BrandFonts = {
        heading: headingFont,
        body: bodyFont,
    };

    const supabase = await createClient();

    // Check if exists
    const { data: existing } = await supabase
        .from('brand_kits')
        .select('id')
        .eq('org_id', orgId)
        .single();

    let error;

    if (existing) {
        const { error: updateError } = await supabase
            .from('brand_kits')
            .update({
                name,
                logo_url: logoUrl,
                colors,
                fonts,
            })
            .eq('id', existing.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('brand_kits')
            .insert({
                org_id: orgId,
                name,
                logo_url: logoUrl,
                colors,
                fonts,
            });
        error = insertError;
    }

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/dashboard/${orgId}/brand`);
    return { success: true };
}
