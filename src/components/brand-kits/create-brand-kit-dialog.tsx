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
import { createBrandKitAction } from '@/modules/brand-kits/actions';
import { useState } from 'react';
import { useActionState } from 'react';
import { Plus } from 'lucide-react';

const initialState = {
    error: '',
    success: false,
};

export default function CreateBrandKitDialog({ orgId }: { orgId: string }) {
    const [open, setOpen] = useState(false);
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await createBrandKitAction(formData);
        if (result?.error) {
            return { error: result.error, success: false };
        }
        setOpen(false);
        return { error: '', success: true };
    }, initialState);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Brand Kit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Brand Kit</DialogTitle>
                    <DialogDescription>
                        Define your brand's visual identity for consistent video generation.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} className="space-y-6 py-4">
                    <input type="hidden" name="orgId" value={orgId} />

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Brand Name</Label>
                            <Input id="name" name="name" placeholder="e.g. Acme Corp Summer Campaign" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="logo_url">Logo URL</Label>
                            <Input id="logo_url" name="logo_url" placeholder="https://..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="color_primary">Primary Color</Label>
                                <div className="flex gap-2">
                                    <Input id="color_primary" name="color_primary" type="color" className="w-12 p-1 h-10" defaultValue="#000000" />
                                    <Input name="color_primary_text" placeholder="#000000" className="flex-1" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="color_secondary">Secondary Color</Label>
                                <div className="flex gap-2">
                                    <Input id="color_secondary" name="color_secondary" type="color" className="w-12 p-1 h-10" defaultValue="#ffffff" />
                                    <Input name="color_secondary_text" placeholder="#ffffff" className="flex-1" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="font_heading">Heading Font</Label>
                                <Input id="font_heading" name="font_heading" placeholder="e.g. Inter" defaultValue="Inter" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="font_body">Body Font</Label>
                                <Input id="font_body" name="font_body" placeholder="e.g. Roboto" defaultValue="Roboto" />
                            </div>
                        </div>
                    </div>

                    {state?.error && (
                        <p className="text-sm text-red-500">{state.error}</p>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Creating...' : 'Create Brand Kit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
