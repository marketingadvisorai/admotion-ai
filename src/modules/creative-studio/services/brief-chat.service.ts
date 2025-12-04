/**
 * Brief Chat Service
 * AI-powered chat for creative brief intake and copy proposal
 */

import OpenAI from 'openai';
import { ChatMessage, ConfirmedCopy, CreativeBrief, BrandMemory } from '../types';

const SYSTEM_PROMPT = `You are a senior creative strategist at a top advertising agency. Your job is to help clients create compelling ad copy.

Your workflow:
1. INTAKE: Collect information about the product/service, target audience, campaign objective, and key message
2. ANALYZE: Understand the brand context and what makes this offering unique
3. PROPOSE: Generate headline, primary text, and CTA options
4. REFINE: Adjust based on feedback until the client confirms

RULES:
- Ask clarifying questions if information is missing
- Keep headlines SHORT (5-8 words max) and punchy
- Primary text should be 1-2 sentences for social ads
- CTAs should be 2-4 words and action-oriented
- Match the brand voice and tone
- Consider the target audience in your language

When you have enough information, propose copy in this EXACT format:
---COPY_PROPOSAL---
HEADLINE: [Your headline here]
PRIMARY_TEXT: [Your primary text here]
CTA: [Your call-to-action here]
---END_PROPOSAL---

After proposing, ask if they want to confirm or request changes.`;

export interface ChatResponse {
    message: string;
    proposedCopy?: ConfirmedCopy;
    shouldConfirm?: boolean;
}

/**
 * Generate AI response for brief chat
 */
export async function generateBriefChatResponse(
    chatHistory: ChatMessage[],
    userMessage: string,
    brandMemory: BrandMemory | null,
    briefContext: Partial<CreativeBrief>,
    apiKey: string
): Promise<ChatResponse> {
    const openai = new OpenAI({ apiKey });

    // Build context from brand memory
    const brandContext = brandMemory ? `
BRAND CONTEXT:
- Brand: ${brandMemory.brand_name || 'Unknown'}
- Tagline: ${brandMemory.tagline || 'Not set'}
- Voice Tone: ${brandMemory.voice_rules?.tone || 'Professional'}
- Style: ${brandMemory.layout_style || 'Modern'}
- DO use: ${brandMemory.do_list?.join(', ') || 'No specific requirements'}
- DON'T use: ${brandMemory.dont_list?.join(', ') || 'No restrictions'}
` : '';

    // Build brief context
    const briefContextStr = `
BRIEF INFO:
- Name: ${briefContext.name || 'Not set'}
- Objective: ${briefContext.objective || 'Not set'}
- Target Audience: ${briefContext.target_audience || 'Not set'}
- Product/Service: ${briefContext.product_service || 'Not set'}
- Key Message: ${briefContext.key_message || 'Not set'}
`;

    // Convert chat history to OpenAI format
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT + brandContext + briefContextStr },
        ...chatHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
        })),
        { role: 'user', content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // Parse for copy proposal
    const proposedCopy = parseCopyProposal(responseContent);
    const shouldConfirm = responseContent.includes('---COPY_PROPOSAL---') || 
                          responseContent.toLowerCase().includes('confirm') ||
                          responseContent.toLowerCase().includes('approve');

    return {
        message: responseContent,
        proposedCopy,
        shouldConfirm,
    };
}

/**
 * Parse copy proposal from AI response
 */
function parseCopyProposal(content: string): ConfirmedCopy | undefined {
    const proposalMatch = content.match(/---COPY_PROPOSAL---([\s\S]*?)---END_PROPOSAL---/);
    if (!proposalMatch) return undefined;

    const proposalText = proposalMatch[1];
    
    const headlineMatch = proposalText.match(/HEADLINE:\s*(.+)/i);
    const primaryTextMatch = proposalText.match(/PRIMARY_TEXT:\s*(.+)/i);
    const ctaMatch = proposalText.match(/CTA:\s*(.+)/i);

    if (!headlineMatch || !primaryTextMatch || !ctaMatch) return undefined;

    return {
        headline: headlineMatch[1].trim(),
        primary_text: primaryTextMatch[1].trim(),
        cta_text: ctaMatch[1].trim(),
    };
}

/**
 * Generate initial greeting based on brand context
 */
export function generateGreeting(brandMemory: BrandMemory | null): string {
    if (brandMemory) {
        return `Hi! I'm here to help you create compelling ad copy for ${brandMemory.brand_name || 'your brand'}.

Let's start with a few questions:
1. What product or service are we promoting?
2. Who is your target audience?
3. What's the main message you want to convey?

Feel free to share any details that will help me understand your campaign goals!`;
    }

    return `Hi! I'm here to help you create compelling ad copy.

To get started, please tell me:
1. What product or service are you promoting?
2. Who is your target audience?
3. What's the main goal of this campaign?

The more details you share, the better I can tailor the copy to your needs!`;
}

/**
 * Generate variation suggestions for approved copy
 */
export async function generateCopyVariations(
    confirmedCopy: ConfirmedCopy,
    brandMemory: BrandMemory | null,
    variationType: 'more_premium' | 'more_playful' | 'more_urgent' | 'more_casual',
    apiKey: string
): Promise<ConfirmedCopy[]> {
    const openai = new OpenAI({ apiKey });

    const prompt = `Given this approved ad copy:
HEADLINE: ${confirmedCopy.headline}
PRIMARY_TEXT: ${confirmedCopy.primary_text}
CTA: ${confirmedCopy.cta_text}

Create 3 variations that are "${variationType.replace('more_', 'more ')}" while keeping the same core message.
${brandMemory ? `Brand voice: ${brandMemory.voice_rules?.tone || 'Professional'}` : ''}

Return in this format for each variation:
VARIATION 1:
HEADLINE: ...
PRIMARY_TEXT: ...
CTA: ...

VARIATION 2:
HEADLINE: ...
PRIMARY_TEXT: ...
CTA: ...

VARIATION 3:
HEADLINE: ...
PRIMARY_TEXT: ...
CTA: ...`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content || '';
    const variations: ConfirmedCopy[] = [];

    // Parse all variations
    const variationMatches = content.matchAll(/VARIATION \d+:\s*\nHEADLINE:\s*(.+)\s*\nPRIMARY_TEXT:\s*(.+)\s*\nCTA:\s*(.+)/gi);
    
    for (const match of variationMatches) {
        variations.push({
            headline: match[1].trim(),
            primary_text: match[2].trim(),
            cta_text: match[3].trim(),
        });
    }

    return variations;
}
