import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { getBrief, addChatMessage, proposeCopy } from '@/modules/creative-studio/services/brief.service';
import { getActiveBrandMemory } from '@/modules/creative-studio/services/brand-memory.service';
import { generateBriefChatResponse, generateGreeting } from '@/modules/creative-studio/services/brief-chat.service';

/**
 * POST /api/creative-studio/briefs/[briefId]/chat - Send a chat message
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ briefId: string }> }
) {
    try {
        const { briefId } = await params;
        const supabase = await createClient();
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { message, isInitial } = body;

        // Get brief
        const brief = await getBrief(briefId);
        if (!brief) {
            return NextResponse.json({ success: false, error: 'Brief not found' }, { status: 404 });
        }

        // Get brand memory
        const brandMemory = await getActiveBrandMemory(brief.org_id);

        // If initial, just return greeting
        if (isInitial) {
            const greeting = generateGreeting(brandMemory);
            
            // Add greeting as assistant message
            const updatedBrief = await addChatMessage(briefId, {
                role: 'assistant',
                content: greeting,
            });

            return NextResponse.json({
                success: true,
                brief: updatedBrief,
                response: {
                    message: greeting,
                    proposedCopy: null,
                    shouldConfirm: false,
                },
            });
        }

        if (!message) {
            return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
        }

        // Add user message
        await addChatMessage(briefId, {
            role: 'user',
            content: message,
        });

        // Get API key
        const { data: secret } = await supabase
            .from('organization_secrets')
            .select('value')
            .eq('org_id', brief.org_id)
            .eq('name', 'OPENAI_API_KEY')
            .single();

        const apiKey = secret?.value || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'OpenAI API key not configured' }, { status: 500 });
        }

        // Get updated brief with user message
        const currentBrief = await getBrief(briefId);
        if (!currentBrief) {
            return NextResponse.json({ success: false, error: 'Brief not found' }, { status: 404 });
        }

        // Generate AI response
        const aiResponse = await generateBriefChatResponse(
            currentBrief.chat_history,
            message,
            brandMemory,
            {
                name: currentBrief.name,
                objective: currentBrief.objective,
                target_audience: currentBrief.target_audience,
                product_service: currentBrief.product_service,
                key_message: currentBrief.key_message,
            },
            apiKey
        );

        // Add assistant response
        const updatedBrief = await addChatMessage(briefId, {
            role: 'assistant',
            content: aiResponse.message,
        });

        // If copy was proposed, update the brief
        if (aiResponse.proposedCopy) {
            await proposeCopy(briefId, aiResponse.proposedCopy);
        }

        return NextResponse.json({
            success: true,
            brief: updatedBrief,
            response: aiResponse,
        });

    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
}
