'use server';

import { revalidatePath } from 'next/cache';
import { createBrandKit, deleteBrandKit, updateBrandKit } from './service';

export async function createBrandKitAction(formData: FormData) {
    const orgId = formData.get('orgId') as string;
    const name = formData.get('name') as string;
    const logo_url = formData.get('logo_url') as string;

    const colors = {
        primary: formData.get('color_primary') as string,
        secondary: formData.get('color_secondary') as string,
        accent: formData.get('color_accent') as string,
        background: formData.get('color_background') as string,
    };

    const fonts = {
        heading: formData.get('font_heading') as string,
        body: formData.get('font_body') as string,
    };

    try {
        await createBrandKit({ orgId, name, logo_url, colors, fonts });
        revalidatePath(`/dashboard/${orgId}/brand-kits`);
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateBrandKitAction(formData: FormData) {
    const id = formData.get('id') as string;
    const orgId = formData.get('orgId') as string;
    const name = formData.get('name') as string;
    const logo_url = formData.get('logo_url') as string;

    const colors = {
        primary: formData.get('color_primary') as string,
        secondary: formData.get('color_secondary') as string,
        accent: formData.get('color_accent') as string,
        background: formData.get('color_background') as string,
    };

    const fonts = {
        heading: formData.get('font_heading') as string,
        body: formData.get('font_body') as string,
    };

    try {
        await updateBrandKit({ id, orgId, name, logo_url, colors, fonts });
        revalidatePath(`/dashboard/${orgId}/brand-kits`);
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteBrandKitAction(formData: FormData) {
    const id = formData.get('id') as string;
    const orgId = formData.get('orgId') as string;

    try {
        await deleteBrandKit(id);
        revalidatePath(`/dashboard/${orgId}/brand-kits`);
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
