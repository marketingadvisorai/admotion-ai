'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { BrandKitWizard } from './brand-kit-wizard';

interface NewBrandKitDialogProps {
    orgId: string;
}

export function NewBrandKitDialog({ orgId }: NewBrandKitDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Brand Kit
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-5xl md:max-w-6xl max-h-[90vh] overflow-y-auto p-0">
                <BrandKitWizard
                    orgId={orgId}
                    onComplete={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
