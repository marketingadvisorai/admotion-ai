import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

interface PromptInputProps {
    value: string;
    onChange: (value: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
}

export function PromptInput({ value, onChange, onGenerate, isGenerating }: PromptInputProps) {
    return (
        <div className="space-y-4">
            <div className="relative">
                <Textarea
                    placeholder="Describe the ad image you want to generate... (e.g., 'A modern minimalist living room with a sleek sofa, natural lighting, high resolution')"
                    className="min-h-[120px] resize-none text-lg p-6 rounded-xl border-2 border-muted focus-visible:border-primary/50 focus-visible:ring-0 shadow-sm bg-card"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <div className="absolute bottom-4 right-4">
                    <Button
                        onClick={onGenerate}
                        disabled={!value.trim() || isGenerating}
                        size="lg"
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        {isGenerating ? (
                            <>
                                <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Generate Image
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
