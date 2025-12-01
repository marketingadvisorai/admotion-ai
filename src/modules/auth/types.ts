export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface UserProfile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    updated_at: string | null;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    billing_plan: string;
    credits_balance: number;
    created_at: string;
}

export interface OrganizationMembership {
    id: string;
    org_id: string;
    user_id: string;
    role: UserRole;
    created_at: string;
    organization?: Organization; // Joined data
}
