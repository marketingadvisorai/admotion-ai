import { createClient } from '@/lib/db/server';
import { CreateInvitationInput, Invitation } from './types';
import { cache } from 'react';

export const getInvitations = cache(async (orgId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) return [];
    return data as Invitation[];
});

export async function createInvitation(input: CreateInvitationInput) {
    const supabase = await createClient();

    // Generate a simple token
    const token = crypto.randomUUID();

    const { data, error } = await supabase
        .from('invitations')
        .insert({
            org_id: input.orgId,
            email: input.email,
            role: input.role,
            token: token,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as Invitation;
}

export async function deleteInvitation(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
}

export async function getInvitationByToken(token: string) {
    const supabase = await createClient();
    // Use RPC to bypass RLS for public access (checking token)
    const { data, error } = await supabase
        .rpc('get_invitation_by_token', { lookup_token: token });

    if (error || !data || data.length === 0) return null;

    // The RPC returns a flat object with org_name.
    const inv = data[0];
    return {
        ...inv,
        organization: { name: inv.org_name }
    };
}

export async function acceptInvitation(token: string, userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .rpc('accept_invitation', {
            lookup_token: token,
            target_user_id: userId
        });

    if (error) throw new Error(error.message);

    return data; // returns org_id
}
