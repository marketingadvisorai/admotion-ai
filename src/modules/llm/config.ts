import { createClient } from '@/lib/db/server';
import { getLlmProfile } from './service';
import { LlmProfile } from './types';

export type SupportedProvider = 'openai' | 'gemini' | 'anthropic';

export interface LlmResolvedConfig {
    slug: string;
    provider: SupportedProvider;
    model: string;
}

const BUILT_IN_MODELS: Record<string, LlmResolvedConfig> = {
    'gpt-5.1': { slug: 'gpt-5.1', provider: 'openai', model: 'gpt-4o' }, // map to available OpenAI model
    'gemini-3': { slug: 'gemini-3', provider: 'gemini', model: 'gemini-1.5-pro-latest' },
    'claude-4.5': { slug: 'claude-4.5', provider: 'anthropic', model: 'claude-3-opus-20240229' },
};

const PROVIDER_SECRET_NAME: Record<SupportedProvider, string> = {
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
};

export async function resolveLlmConfig(slug: string): Promise<LlmResolvedConfig> {
    const profile = await getLlmProfile(slug);
    if (profile) {
        const provider = (profile.provider || '').toLowerCase() as SupportedProvider;
        if (!['openai', 'gemini', 'anthropic'].includes(provider)) {
            throw new Error(`Unsupported provider on profile ${slug}: ${profile.provider}`);
        }
        return {
            slug,
            provider,
            model: profile.model,
        };
    }

    if (BUILT_IN_MODELS[slug]) return BUILT_IN_MODELS[slug];

    // default to OpenAI if unknown slug
    return BUILT_IN_MODELS['gpt-5.1'];
}

export async function getProviderApiKey(provider: SupportedProvider, orgId?: string): Promise<string> {
    const envKey = process.env[PROVIDER_SECRET_NAME[provider]];
    if (!orgId) {
        if (!envKey) throw new Error(`Missing ${PROVIDER_SECRET_NAME[provider]} for provider ${provider}`);
        return envKey;
    }

    const supabase = await createClient();
    const { data } = await supabase
        .from('organization_secrets')
        .select('value')
        .eq('org_id', orgId)
        .eq('name', PROVIDER_SECRET_NAME[provider])
        .single();

    const key = data?.value || envKey;
    if (!key) {
        throw new Error(`Missing ${PROVIDER_SECRET_NAME[provider]} for org ${orgId}`);
    }
    return key;
}
