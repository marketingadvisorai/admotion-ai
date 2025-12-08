'use server';

import { revalidatePath } from 'next/cache';
import { createInvitation, deleteInvitation } from './service';
import { UserRole } from '@/modules/auth/types';

export async function inviteMemberAction(formData: FormData) {
    const orgId = formData.get('orgId') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as UserRole;

    try {
        await createInvitation({ orgId, email, role });
        revalidatePath(`/dashboard/${orgId}/settings`);
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send invitation';
        return { error: message };
    }
}

export async function revokeInvitationAction(formData: FormData) {
    const id = formData.get('id') as string;
    const orgId = formData.get('orgId') as string;

    try {
        await deleteInvitation(id);
        revalidatePath(`/dashboard/${orgId}/settings`);
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to revoke invitation';
        return { error: message };
    }
}

import { acceptInvitation } from './service';
import { getCurrentUser } from '@/modules/auth/service';
import { redirect } from 'next/navigation';

export async function acceptInvitationAction(formData: FormData) {
    const token = formData.get('token') as string;
    const user = await getCurrentUser();

    if (!user) {
        return { error: 'Please login to accept this invitation.' };
    }

    let orgId;
    try {
        orgId = await acceptInvitation(token, user.id);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to accept invitation';
        return { error: message };
    }

    redirect(`/dashboard/${orgId}`);
}
