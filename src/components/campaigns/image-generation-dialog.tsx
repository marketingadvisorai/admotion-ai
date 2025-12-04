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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateImageAction } from '@/modules/image-generation/actions';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { ImageCopyEditor } from '@/components/campaigns/image-copy-editor';
import { Sparkles, Wand2, Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';

const initialState = {
    error: '',
    success: false,
};

export default function ImageGenerationDialog({
    orgId,
    campaignId,
}: {
    orgId: string;
    campaignId: string;
}) {
    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [selectedSize, setSelectedSize] = useState('1024x1024');
    const [selectedModel, setSelectedModel] = useState('gpt-5.1');
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const result = await generateImageAction(formData);
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
                    Generate Images
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] glass-panel border-white/20 dark:border-white/10 p-0 overflow-hidden gap-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />

                <DialogHeader className="p-6 pb-2 relative z-10">
                    <DialogTitle className="text-2xl font-light text-center flex items-center justify-center gap-2">
                        <Wand2 className="w-5 h-5 text-blue-500" />
                        AI Image Studio
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground/80">
                        Describe your vision and let AI craft the perfect ad creative.
                    </DialogDescription>
                </DialogHeader>

                <form action={formAction} className="relative z-10">
                    <input type="hidden" name="orgId" value={orgId} />
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="size" value={selectedSize} />
                    <input type="hidden" name="modelSlug" value={selectedModel} />

                    <div className="p-6 space-y-6">
                        {/* Main Input Area */}
                        <div className="space-y-4">
                            <div className="relative">
                                <textarea
                                    name="prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full min-h-[120px] text-lg p-4 glass-input rounded-xl resize-none border-0 shadow-inner placeholder:text-muted-foreground/50 focus-visible:ring-0"
                                    placeholder="Describe your ad creative in detail..."
                                    required
                                />
                                <div className="absolute bottom-3 right-3">
                                    <span className="text-xs text-muted-foreground bg-white/50 dark:bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                                        {prompt.length} chars
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 block">
                                    Text Overlay & Content
                                </Label>
                                <ImageCopyEditor
                                    campaignId={campaignId}
                                    prompt={prompt}
                                    onPromptChange={setPrompt}
                                />
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">
                                    Aspect Ratio
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: '1024x1024', label: '1:1', icon: ImageIcon },
                                        { value: '1024x576', label: '16:9', icon: LayoutTemplate },
                                        { value: '576x1024', label: '9:16', icon: LayoutTemplate, className: 'rotate-90' },
                                    ].map((size) => (
                                        <button
                                            key={size.value}
                                            type="button"
                                            onClick={() => setSelectedSize(size.value)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 border",
                                                selectedSize === size.value
                                                    ? "bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-sm"
                                                    : "bg-white/5 border-transparent hover:bg-white/10 text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <size.icon className={cn("w-5 h-5 mb-1", size.className)} />
                                            <span className="text-[10px] font-medium">{size.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">
                                    Style Preset
                                </Label>
                                <Select name="style" defaultValue="photorealistic">
                                    <SelectTrigger className="h-[52px] glass-input border-0 rounded-xl">
                                        <SelectValue placeholder="Select style" />
                                    </SelectTrigger>
                                    <SelectContent className="glass-panel border-white/20">
                                        <SelectItem value="photorealistic">Photorealistic</SelectItem>
                                        <SelectItem value="minimalist">Minimalist</SelectItem>
                                        <SelectItem value="abstract">Abstract</SelectItem>
                                        <SelectItem value="3d-render">3D Render</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

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
                                        <SelectItem value="gemini-3">Gemini 3 (vision-heavy)</SelectItem>
                                        <SelectItem value="claude-4.5">Claude 4.5 (long-form)</SelectItem>
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
                            className="w-full h-12 text-lg font-medium glass-button rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0"
                        >
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 animate-spin" />
                                    Creating Magic...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5" />
                                    Generate Creative
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
