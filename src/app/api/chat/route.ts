import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/db/server';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatRequest {
    messages: ChatMessage[];
    systemPrompt?: string;
    model?: string;
    orgId?: string;
}

/**
 * Get the appropriate API key for the model
 */
async function getApiKey(model: string, orgId?: string): Promise<{ key: string; provider: 'openai' | 'gemini' | 'anthropic' }> {
    const provider = model.includes('claude') ? 'anthropic' : 
                     model.includes('gemini') ? 'gemini' : 'openai';
    
    const secretName = provider === 'openai' ? 'OPENAI_API_KEY' :
                       provider === 'gemini' ? 'GOOGLE_GEMINI_API_KEY' : 'ANTHROPIC_API_KEY';
    
    if (orgId) {
        const supabase = await createClient();
        const { data } = await supabase
            .from('organization_secrets')
            .select('value')
            .eq('org_id', orgId)
            .eq('name', secretName)
            .single();
        
        if (data?.value) {
            return { key: data.value, provider };
        }
    }
    
    // Fallback to environment variables
    const envKey = provider === 'openai' ? process.env.OPENAI_API_KEY :
                   provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY;
    
    if (!envKey) {
        throw new Error(`Missing API key for ${provider}`);
    }
    
    return { key: envKey, provider };
}

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { messages, systemPrompt, model = 'gpt-4o-mini', orgId } = body;

        if (!messages || messages.length === 0) {
            return NextResponse.json(
                { error: 'Messages are required' },
                { status: 400 }
            );
        }

        const systemMessage: ChatMessage = {
            role: 'system',
            content: systemPrompt || `You are a creative advertising expert and marketing strategist. 
Help users brainstorm ad concepts, headlines, taglines, and visual ideas. 
Be specific, actionable, and creative. 
When you have a solid concept ready, suggest they switch to "Make" mode to generate the images.
Keep responses concise but impactful.`,
        };

        const { key, provider } = await getApiKey(model, orgId);

        if (provider === 'openai') {
            const openai = new OpenAI({ apiKey: key });
            
            const response = await openai.chat.completions.create({
                model: model.includes('gpt') ? model : 'gpt-4o-mini',
                messages: [systemMessage, ...messages],
                temperature: 0.8,
                max_tokens: 1000,
            });

            return NextResponse.json({
                success: true,
                content: response.choices[0]?.message?.content || '',
                usage: response.usage,
            });
        } else if (provider === 'gemini') {
            // Use Gemini API
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: 'user', parts: [{ text: systemMessage.content }] },
                            ...messages.map(m => ({
                                role: m.role === 'assistant' ? 'model' : 'user',
                                parts: [{ text: m.content }]
                            }))
                        ],
                        generationConfig: {
                            temperature: 0.8,
                            maxOutputTokens: 1000,
                        }
                    })
                }
            );

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            return NextResponse.json({
                success: true,
                content,
            });
        } else if (provider === 'anthropic') {
            // Use Anthropic API
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': key,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: model.includes('claude') ? 'claude-3-5-sonnet-20241022' : 'claude-3-5-sonnet-20241022',
                    max_tokens: 1000,
                    system: systemMessage.content,
                    messages: messages.map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            const data = await response.json();
            const content = data.content?.[0]?.text || '';

            return NextResponse.json({
                success: true,
                content,
            });
        }

        return NextResponse.json(
            { error: 'Unsupported model provider' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to process chat request' },
            { status: 500 }
        );
    }
}
