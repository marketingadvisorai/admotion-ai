'use server';

import { createClient } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';

export interface OrgSecret {
    id: string;
    name: string;
    value: string; // In a real app, don't return this fully
    created_at: string;
}

export async function getOrgSecretsAction(orgId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('organization_secrets')
            .select('*')
            .eq('org_id', orgId);

        if (error) throw error;

        // Mask values for security when sending to client
        const maskedSecrets = data.map(secret => ({
            ...secret,
            value: secret.value ? `${secret.value.substring(0, 3)}...${secret.value.substring(secret.value.length - 4)}` : ''
        }));

        return { success: true, data: maskedSecrets };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get secrets';
        return { success: false, error: message };
    }
}

export async function saveOrgSecretAction(orgId: string, name: string, value: string) {
    try {
        const supabase = await createClient();

        // Check permissions (RLS handles this, but good to be explicit if needed)

        const { error } = await supabase
            .from('organization_secrets')
            .upsert({
                org_id: orgId,
                name,
                value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'org_id, name' });

        if (error) throw error;

        revalidatePath(`/dashboard/${orgId}/settings`);
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save secret';
        return { success: false, error: message };
    }
}

export async function deleteOrgSecretAction(orgId: string, name: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('organization_secrets')
            .delete()
            .eq('org_id', orgId)
            .eq('name', name);

        if (error) throw error;

        revalidatePath(`/dashboard/${orgId}/settings`);
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete secret';
        return { success: false, error: message };
    }
}


import { redirect } from 'next/navigation';
import { Organization } from '@/modules/auth/types';

export async function createOrganization(formData: FormData) {
    const name = formData.get('name') as string;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    // 1. Create Organization & Membership via RPC (Security Definer)
    // This avoids RLS issues where the user can't see the org they just created
    // because the membership hasn't been committed/visible yet.
    const { data: org, error: orgError } = await supabase.rpc('create_organization_with_owner', {
        _name: name,
        _slug: slug
    }).single();

    if (orgError) {
        if (orgError.message?.includes('unique constraint') || orgError.code === '23505') {
            return { error: 'Organization with this name already exists. Please try another.' };
        }
        return { error: orgError.message };
    }

    if (!org) {
        return { error: 'Failed to create organization' };
    }

    // 2. Membership is created automatically by the RPC function.

    revalidatePath('/dashboard');
    redirect(`/dashboard/${(org as Organization).id}`);
}
