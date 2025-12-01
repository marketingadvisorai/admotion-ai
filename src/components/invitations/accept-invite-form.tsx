'use client';

import { Button } from '@/components/ui/button';
import { acceptInvitationAction } from '@/modules/invitations/actions';
import { useActionState } from 'react';

const initialState = {
    error: '',
};

export default function AcceptInviteForm({ token }: { token: string }) {
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await acceptInvitationAction(formData);
        if (result?.error) {
            return { error: result.error };
        }
        return { error: '' };
    }, initialState);

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="token" value={token} />

            {state?.error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                    {state.error}
                </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Accepting...' : 'Accept Invitation'}
            </Button>
        </form>
    );
}
