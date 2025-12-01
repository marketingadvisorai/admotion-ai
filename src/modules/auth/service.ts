import { createClient } from '@/lib/db/server';
import { OrganizationMembership, UserProfile } from './types';
import { cache } from 'react';

export const getCurrentUser = cache(async () => {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
});

export const getUserProfile = cache(async (userId: string): Promise<UserProfile | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data;
});

export const getUserOrganizations = cache(async (userId: string): Promise<OrganizationMembership[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('organization_memberships')
        .select('*, organization:organizations(*)')
        .eq('user_id', userId);

    if (error) return [];
    // @ts-ignore - Supabase types might need adjustment for joins
    return data as OrganizationMembership[];
});

export const getOrganizationBySlug = cache(async (slug: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) return null;
    return data;
});

export const checkOrgAccess = cache(async (userId: string, orgId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('organization_memberships')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .single();

    if (error || !data) return null;
    return data.role;
});
