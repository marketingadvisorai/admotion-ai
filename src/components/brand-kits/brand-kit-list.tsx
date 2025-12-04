'use client';

import { BrandKit } from '@/modules/brand-kits/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Palette } from 'lucide-react';
import { deleteBrandKitAction } from '@/modules/brand-kits/actions';
import { useActionState } from 'react';
import { EditBrandKitDialog } from './edit-brand-kit-dialog';

export default function BrandKitList({ brandKits, orgId }: { brandKits: BrandKit[], orgId: string }) {
    if (brandKits.length === 0) {
        return (
            <div className="text-center py-24 glass-panel rounded-3xl border-dashed border-2 border-white/30">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Palette className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No brand kits yet</h3>
                <p className="text-gray-500 mt-1 max-w-md mx-auto text-lg font-light">
                    Create a brand kit to start generating consistent videos.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {brandKits.map((kit) => {
                const primaryColor = kit.colors.find(c => c.type === 'primary')?.value || '#000000';
                const secondaryColor = kit.colors.find(c => c.type === 'secondary')?.value || '#ffffff';

                return (
                    <div key={kit.id} className="group relative overflow-hidden glass-panel rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-32 opacity-20" style={{ background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})` }} />
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-white/90 dark:to-black/90" />

                        <div className="relative p-6 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{kit.name}</h3>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                        <span className="px-2 py-1 rounded-lg bg-white/50 border border-white/20 backdrop-blur-sm">{kit.fonts.heading}</span>
                                        <span>+</span>
                                        <span className="px-2 py-1 rounded-lg bg-white/50 border border-white/20 backdrop-blur-sm">{kit.fonts.body}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-sm">
                                    <EditBrandKitDialog orgId={orgId} brandKit={kit} />
                                    <DeleteButton id={kit.id} orgId={orgId} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Colors</p>
                                <div className="flex gap-3 flex-wrap">
                                    {kit.colors.map((color, i) => (
                                        <ColorSwatch key={i} color={color.value} label={color.name} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
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
        const id = formData.get('id') as string;
        return await deleteBrandKitAction(id);
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
