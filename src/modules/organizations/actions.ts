'use server';

import { createClient } from '@/lib/db/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
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
