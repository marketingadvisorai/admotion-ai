'use client';

import { Button } from '@/components/ui/button';
import { Invitation } from '@/modules/invitations/types';
import { revokeInvitationAction } from '@/modules/invitations/actions';
import { Trash2, Copy, Check } from 'lucide-react';
import { useActionState, useState } from 'react';

export default function InvitationList({ invitations, orgId }: { invitations: Invitation[], orgId: string }) {
    if (invitations.length === 0) return null;

    return (
        <div className="mt-6 border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Pending Invitations</h3>
            <div className="space-y-4">
                {invitations.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                            <p className="text-xs text-gray-500 capitalize">{invite.role} • Expires {new Date(invite.expires_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <CopyLinkButton token={invite.token} />
                            <RevokeButton id={invite.id} orgId={orgId} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CopyLinkButton({ token }: { token: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const url = `${window.location.origin}/invite/${token}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button size="icon" variant="ghost" onClick={handleCopy} className="h-8 w-8 text-gray-500 hover:text-gray-900">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
    );
}

function RevokeButton({ id, orgId }: { id: string, orgId: string }) {
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        return await revokeInvitationAction(formData);
    }, null);

    return (
        <form action={formAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="orgId" value={orgId} />
            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" disabled={isPending}>
                <Trash2 className="w-4 h-4" />
            </Button>
        </form>
    );
}
