import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatRequest {
    messages: ChatMessage[];
    systemPrompt?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { messages, systemPrompt } = body;

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

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [systemMessage, ...messages],
            temperature: 0.8,
            max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content || '';

        return NextResponse.json({
            success: true,
            content,
            usage: response.usage,
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to process chat request' },
            { status: 500 }
        );
    }
}
