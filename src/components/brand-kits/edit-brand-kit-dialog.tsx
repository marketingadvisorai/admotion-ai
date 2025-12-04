'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Edit2 } from 'lucide-react';
import { BrandKitWizard } from './brand-kit-wizard';
import { BrandKit } from '@/modules/brand-kits/types';

interface EditBrandKitDialogProps {
    orgId: string;
    brandKit: BrandKit;
}

export function EditBrandKitDialog({ orgId, brandKit }: EditBrandKitDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                >
                    <Edit2 className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <BrandKitWizard
                    orgId={orgId}
                    existingKit={brandKit}
                    onComplete={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
