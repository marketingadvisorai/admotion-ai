'use client';

import { BrandKit } from '@/modules/brand-kits/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Palette } from 'lucide-react';
import { deleteBrandKitAction } from '@/modules/brand-kits/actions';
import { useActionState } from 'react';

export default function BrandKitList({ brandKits, orgId }: { brandKits: BrandKit[], orgId: string }) {
    if (brandKits.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <Palette className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No brand kits yet</h3>
                <p className="text-gray-500 mt-1">Create a brand kit to start generating consistent videos.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {brandKits.map((kit) => (
                <Card key={kit.id} className="group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2" style={{ background: `linear-gradient(to right, ${kit.colors.primary}, ${kit.colors.secondary})` }} />
                    <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{kit.name}</CardTitle>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DeleteButton id={kit.id} orgId={orgId} />
                            </div>
                        </div>
                        <CardDescription className="flex items-center gap-2 text-xs">
                            <span className="font-mono bg-gray-100 px-1 rounded">{kit.fonts.heading}</span>
                            <span>+</span>
                            <span className="font-mono bg-gray-100 px-1 rounded">{kit.fonts.body}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <ColorSwatch color={kit.colors.primary} label="Primary" />
                            <ColorSwatch color={kit.colors.secondary} label="Secondary" />
                            {kit.colors.accent && <ColorSwatch color={kit.colors.accent} label="Accent" />}
                            {kit.colors.background && <ColorSwatch color={kit.colors.background} label="Bg" />}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ColorSwatch({ color, label }: { color: string, label: string }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div
                className="w-8 h-8 rounded-full border shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
            />
            <span className="text-[10px] text-gray-500">{label}</span>
        </div>
    );
}

function DeleteButton({ id, orgId }: { id: string, orgId: string }) {
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        return await deleteBrandKitAction(formData);
    }, null);

    return (
        <form action={formAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="orgId" value={orgId} />
            <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                disabled={isPending}
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </form>
    );
}
