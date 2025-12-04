export type LlmProvider = 'openai' | 'gemini';

export interface LlmProfile {
    id: string;
    slug: string;
    provider: LlmProvider | string;
    model: string;
    system_prompt: string;
    user_template: string | null;
    temperature: number | null;
    max_tokens: number | null;
    response_format: string | null;
    is_active: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

