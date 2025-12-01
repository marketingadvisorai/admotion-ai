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
import { generateVideoAction } from '@/modules/generation/actions';
import { useState } from 'react';
import { useActionState } from 'react';

const initialState = {
    error: '',
    success: false,
};

export default function GenerationDialog({
    orgId,
    campaignId
}: {
    orgId: string,
    campaignId: string
}) {
    const [open, setOpen] = useState(false);
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await generateVideoAction(formData);
        if (result?.error) {
            return { error: result.error, success: false };
        }
        setOpen(false);
        return { error: '', success: true };
    }, initialState);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Generate Videos</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Generate Video Ad</DialogTitle>
                    <DialogDescription>
                        Configure your video generation settings.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction}>
                    <input type="hidden" name="orgId" value={orgId} />
                    <input type="hidden" name="campaignId" value={campaignId} />

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="provider" className="text-right">
                                Model
                            </Label>
                            <Select name="providerId" defaultValue="runway">
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="runway">Runway Gen-3</SelectItem>
                                    <SelectItem value="kling">Kling AI</SelectItem>
                                    <SelectItem value="sora">Sora</SelectItem>
                                    <SelectItem value="gemini">Gemini Veo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="aspectRatio" className="text-right">
                                Ratio
                            </Label>
                            <Select name="aspectRatio" defaultValue="9:16">
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select ratio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="prompt" className="text-right">
                                Prompt
                            </Label>
                            <Input
                                id="prompt"
                                name="prompt"
                                placeholder="A cinematic shot of..."
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>

                    {state?.error && (
                        <p className="text-sm text-red-500 mb-4">{state.error}</p>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Starting...' : 'Start Generation'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
