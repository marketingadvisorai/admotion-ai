'use server';

import { revalidatePath } from 'next/cache';
import { generateImages } from './service';
import { ImageAspectRatio, ImageProvider } from './types';

export async function generateImageAction(formData: FormData) {
    const orgId = formData.get('orgId') as string;
    const campaignId = formData.get('campaignId') as string | null;
    const prompt = formData.get('prompt') as string;
    const aspectRatio = (formData.get('aspectRatio') as ImageAspectRatio | null) || '1:1';
    const provider = (formData.get('provider') as ImageProvider | null) || 'openai';
    const numberOfImages = parseInt(formData.get('numberOfImages') as string) || 1;

    try {
        const result = await generateImages({
            orgId,
            campaignId: campaignId || undefined,
            prompt,
            aspectRatio,
            provider,
            numberOfImages,
        });

        if (!result.success) {
            return { error: result.error };
        }

        if (campaignId) {
            revalidatePath(`/dashboard/${orgId}/campaigns/${campaignId}`);
        }
        revalidatePath(`/dashboard/${orgId}/image-ads`);
        
        return { success: true, images: result.images };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to generate image';
        return { error: message };
    }
}
