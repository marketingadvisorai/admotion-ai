'use server';

import { revalidatePath } from 'next/cache';
import { createImageGeneration } from './service';

export async function generateImageAction(formData: FormData) {
    const orgId = formData.get('orgId') as string;
    const campaignId = formData.get('campaignId') as string;
    const prompt = formData.get('prompt') as string;
    const size = (formData.get('size') as string | null) || '1024x1024';
    const modelSlug = (formData.get('modelSlug') as string | null) || 'gpt-5.1';

    try {
        await createImageGeneration({
            orgId,
            campaignId,
            prompt,
            size: size as any,
            modelSlug,
        });

        revalidatePath(`/dashboard/${orgId}/campaigns/${campaignId}`);
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
