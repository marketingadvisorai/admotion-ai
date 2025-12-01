'use server';

import { createClient } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { VideoPlatform } from './types';

export async function createCampaign(orgId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const brief = formData.get('brief') as string;
    const platform = formData.get('platform') as VideoPlatform;

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('campaigns')
        .insert({
            org_id: orgId,
            name,
            brief,
            platform,
            status: 'draft',
        })
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/dashboard/${orgId}`);
    redirect(`/dashboard/${orgId}/campaigns/${data.id}`);
}
