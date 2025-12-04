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
                <Button variant="outline">Generate Images</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Generate Image</DialogTitle>
                    <DialogDescription>
                        Create high-quality images for this campaign using your OpenAI image model.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction}>
                    <input type="hidden" name="orgId" value={orgId} />
                    <input type="hidden" name="campaignId" value={campaignId} />

                    <div className="grid gap-4 py-4">
                        <ImageCopyEditor
                            campaignId={campaignId}
                            prompt={prompt}
                            onPromptChange={setPrompt}
                        />
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="size" className="text-right">
                                Size
                            </Label>
                            <Select name="size" defaultValue="1024x1024">
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                                    <SelectItem value="1024x576">Landscape (1024×576)</SelectItem>
                                    <SelectItem value="576x1024">Vertical (576×1024)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="prompt" className="text-right">
                                Prompt
                            </Label>
                            <div className="col-span-3 space-y-2">
                                <Input
                                    id="prompt"
                                    name="prompt"
                                    placeholder="A high-contrast product shot..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    required
                                />
                                <div className="flex justify-between items-center" />
                            </div>
                        </div>
                    </div>

                    {state?.error && (
                        <p className="text-sm text-red-500 mb-4">{state.error}</p>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Generating...' : 'Generate Image'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
