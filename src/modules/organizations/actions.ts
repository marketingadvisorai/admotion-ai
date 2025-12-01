'use server';

import { createClient } from '@/lib/db/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createOrganization(formData: FormData) {
    const name = formData.get('name') as string;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    // 1. Create Organization
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
            name,
            slug,
            billing_plan: 'free',
            credits_balance: 100, // Free credits
        })
        .select()
        .single();

    if (orgError) {
        if (orgError.code === '23505') { // Unique violation for slug
            return { error: 'Organization with this name already exists. Please try another.' };
        }
        return { error: orgError.message };
    }

    // 2. Create Membership (Owner)
    const { error: memberError } = await supabase
        .from('organization_memberships')
        .insert({
            org_id: org.id,
            user_id: user.id,
            role: 'owner',
        });

    if (memberError) {
        // Cleanup org if membership fails (optional, but good practice)
        await supabase.from('organizations').delete().eq('id', org.id);
        return { error: memberError.message };
    }

    revalidatePath('/dashboard');
    redirect(`/dashboard/${org.id}`);
}
