import { getCurrentUser } from '@/modules/auth/service';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/db/server';
import { LlmProfilesSettings } from '@/components/settings/llm-profiles-settings';
import { LlmProfile } from '@/modules/llm/types';

async function requireSuperAdmin() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

    if (error || !data?.is_super_admin) {
        redirect('/dashboard');
    }
}

async function getProfiles(): Promise<LlmProfile[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('llm_profiles')
        .select('*')
        .order('created_at', { ascending: true });

    return (data as LlmProfile[]) || [];
}

export default async function AdminLlmPage() {
    await requireSuperAdmin();
    const profiles = await getProfiles();

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">LLM Control Center</h1>
                <p className="text-sm text-muted-foreground">
                    Tune prompts and models used by internal agents. Changes apply across all workspaces.
                </p>
            </div>
            <LlmProfilesSettings profiles={profiles} />
        </div>
    );
}

