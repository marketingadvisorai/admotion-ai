import { UserRole } from '@/modules/auth/types';

export interface Invitation {
    id: string;
    org_id: string;
    email: string;
    role: UserRole;
    token: string;
    status: 'pending' | 'accepted';
    created_at: string;
    expires_at: string;
}

export interface CreateInvitationInput {
    orgId: string;
    email: string;
    role: UserRole;
}
