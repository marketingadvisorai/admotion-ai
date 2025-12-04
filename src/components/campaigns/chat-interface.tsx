'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage } from '@/modules/campaigns/types';
import { sendMessageAction, generateStrategyAction } from '@/modules/campaigns/agent-actions';

import { useRouter } from 'next/navigation';

interface ChatInterfaceProps {
    campaignId: string;
    initialHistory: ChatMessage[];
    onStrategyGenerated: (strategy: any) => void;
}

export function ChatInterface({ campaignId, initialHistory, onStrategyGenerated }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(initialHistory);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [modelSlug, setModelSlug] = useState('gpt-5.1');
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const result = await sendMessageAction(campaignId, input, modelSlug);

        if (result.success && result.response) {
            const aiMessage: ChatMessage = { role: 'assistant', content: result.response };
            setMessages((prev) => [...prev, aiMessage]);
        } else {
            // Handle error (maybe show a toast)
            console.error(result.error);
        }

        setIsLoading(false);
    };

    const handleGenerateStrategy = async () => {
        setIsLoading(true);
        const result = await generateStrategyAction(campaignId, modelSlug);
        if (result.success && result.strategy) {
            onStrategyGenerated(result.strategy);
            router.refresh();
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-[600px] border rounded-lg bg-background shadow-sm">
            <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">Admotion Strategist</span>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={modelSlug} onValueChange={setModelSlug}>
                        <SelectTrigger className="h-9 w-[170px]">
                            <SelectValue placeholder="Model" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gpt-5.1">GPT 5.1 (OpenAI)</SelectItem>
                            <SelectItem value="gemini-3">Gemini 3 (Google)</SelectItem>
                            <SelectItem value="claude-4.5">Claude 4.5 (Anthropic)</SelectItem>
                        </SelectContent>
                    </Select>

                    {messages.length > 2 && (
                        <Button
                            size="sm"
                            onClick={handleGenerateStrategy}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Strategy
                        </Button>
                    )}
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <Avatar className="w-8 h-8">
                                {msg.role === 'user' ? (
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        <User className="w-4 h-4" />
                                    </AvatarFallback>
                                ) : (
                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                        <Bot className="w-4 h-4" />
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div
                                className={`rounded-lg p-3 max-w-[80%] text-sm ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                    <Bot className="w-4 h-4" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-lg p-3">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-muted/30">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex gap-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
