'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateStrategyFromPromptAction } from '@/modules/campaigns/agent-actions';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { Sparkles, Lightbulb, BrainCircuit } from 'lucide-react';

const initialState = {
    error: '',
    success: false,
};

export default function StrategyGenerationDialog({
    orgId,
    campaignId,
}: {
    orgId: string;
    campaignId: string;
}) {
    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-5.1');
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const result = await generateStrategyFromPromptAction(formData);
            if (result?.error) {
                return { error: result.error, success: false };
            }
            setOpen(false);
            return { error: '', success: true };
        },
        initialState,
    );

    useEffect(() => {
        if (!open) {
            setPrompt('');
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="glass-button border-0">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Strategy
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] glass-panel border-white/20 dark:border-white/10 p-0 overflow-hidden gap-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />

                <DialogHeader className="p-6 pb-2 relative z-10">
                    <DialogTitle className="text-2xl font-light text-center flex items-center justify-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-indigo-500" />
                        AI Strategy Director
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground/80">
                        Describe your product and goals to generate a comprehensive video strategy.
                    </DialogDescription>
                </DialogHeader>

                <form action={formAction} className="relative z-10">
                    <input type="hidden" name="orgId" value={orgId} />
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="modelSlug" value={selectedModel} />

                    <div className="p-6 space-y-6">
                        {/* Main Input Area */}
                        <div className="space-y-4">
                            <div className="relative">
                                <textarea
                                    name="prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full min-h-[150px] text-lg p-4 glass-input rounded-xl resize-none border-0 shadow-inner placeholder:text-muted-foreground/50 focus-visible:ring-0"
                                    placeholder="Describe your campaign goals, target audience, key selling points, and desired tone..."
                                    required
                                />
                                <div className="absolute bottom-3 right-3">
                                    <span className="text-xs text-muted-foreground bg-white/50 dark:bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                                        {prompt.length} chars
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">
                                    Model
                                </Label>
                                <Select value={selectedModel} onValueChange={setSelectedModel}>
                                    <SelectTrigger className="h-[52px] glass-input border-0 rounded-xl">
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent className="glass-panel border-white/20">
                                        <SelectItem value="gpt-5.1">GPT 5.1 (recommended)</SelectItem>
                                        <SelectItem value="gemini-3">Gemini 3 (creative)</SelectItem>
                                        <SelectItem value="claude-4.5">Claude 4.5 (analytical)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground">
                                    GPT 5.1 is fully supported. Others require provider setup.
                                </p>
                            </div>
                        </div>
                    </div>

                    {state?.error && (
                        <div className="px-6 pb-2">
                            <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">
                                {state.error}
                            </p>
                        </div>
                    )}

                    <DialogFooter className="p-6 pt-2">
                        <Button
                            type="submit"
                            disabled={isPending || !prompt}
                            className="w-full h-12 text-lg font-medium glass-button rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0"
                        >
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 animate-spin" />
                                    Developing Strategy...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5" />
                                    Generate Strategy
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
