'use server';

import { revalidatePath } from 'next/cache';
import { createGenerationJob } from './service';

export async function generateVideoAction(formData: FormData) {
    const orgId = formData.get('orgId') as string;
    const campaignId = formData.get('campaignId') as string;
    const prompt = formData.get('prompt') as string;
    const providerId = formData.get('providerId') as string;
    const aspectRatio = formData.get('aspectRatio') as '16:9' | '9:16' | '1:1';
    const duration = parseInt(formData.get('duration') as string || '5');

    try {
        await createGenerationJob({
            orgId,
            campaignId,
            providerId,
            prompt,
            aspectRatio,
            duration,
        });

        revalidatePath(`/dashboard/${orgId}/campaigns/${campaignId}`);
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
