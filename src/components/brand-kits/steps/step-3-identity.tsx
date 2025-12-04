'use client';

import { useFormContext } from 'react-hook-form';
import { Palette, Type, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

interface Step3IdentityProps {
    onBack: () => void;
    onNext: () => void;
}

export function Step3Identity({ onBack, onNext }: Step3IdentityProps) {
    const form = useFormContext();
    const colors = form.watch('colors') || [];
    const fonts = form.watch('fonts') || { heading: 'Inter', body: 'Inter' };
    const logoUrl = form.watch('logo_url');

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Logo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        {logoUrl && (
                            <div className="h-20 w-20 relative border rounded-lg overflow-hidden bg-white p-2 flex items-center justify-center">
                                <img
                                    src={logoUrl}
                                    alt="Brand Logo"
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <Label>Logo URL</Label>
                            <Input {...form.register('logo_url')} placeholder="https://example.com/logo.png" />
                            <p className="text-xs text-muted-foreground mt-1">
                                Enter a direct link to your logo image.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            Color Palette
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {colors.map((color: any, index: number) => (
                            <div key={index} className="flex items-center gap-3">
                                <input
                                    type="color"
                                    className="h-10 w-10 rounded-md border shadow-sm shrink-0 cursor-pointer p-0"
                                    value={color.value}
                                    onChange={(e) => {
                                        const newColors = [...colors];
                                        newColors[index].value = e.target.value;
                                        form.setValue('colors', newColors);
                                    }}
                                />
                                <div className="flex-1 space-y-1 min-w-0">
                                    <Input
                                        value={color.name}
                                        onChange={(e) => {
                                            const newColors = [...colors];
                                            newColors[index].name = e.target.value;
                                            form.setValue('colors', newColors);
                                        }}
                                        className="h-8"
                                        placeholder="Color Name"
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            value={color.value}
                                            onChange={(e) => {
                                                const newColors = [...colors];
                                                newColors[index].value = e.target.value;
                                                form.setValue('colors', newColors);
                                            }}
                                            className="h-8 font-mono text-xs"
                                            placeholder="#000000"
                                        />
                                        <select
                                            className="h-8 rounded-md border text-xs px-2 bg-background"
                                            value={color.type}
                                            onChange={(e) => {
                                                const newColors = [...colors];
                                                newColors[index].type = e.target.value;
                                                form.setValue('colors', newColors);
                                            }}
                                        >
                                            <option value="primary">Primary</option>
                                            <option value="secondary">Secondary</option>
                                            <option value="accent">Accent</option>
                                        </select>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        const newColors = colors.filter((_: any, i: number) => i !== index);
                                        form.setValue('colors', newColors);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                                form.setValue('colors', [...colors, { name: 'New Color', value: '#000000', type: 'accent' }]);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Color
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Type className="h-5 w-5" />
                            Typography
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Heading Font</Label>
                            <Input {...form.register('fonts.heading')} placeholder="e.g. Inter" />
                            <div className="p-3 bg-muted/30 rounded-md border">
                                <p className="text-2xl font-bold" style={{ fontFamily: fonts.heading }}>
                                    The quick brown fox
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Body Font</Label>
                            <Input {...form.register('fonts.body')} placeholder="e.g. Roboto" />
                            <div className="p-3 bg-muted/30 rounded-md border">
                                <p className="text-sm" style={{ fontFamily: fonts.body }}>
                                    Jumps over the lazy dog. This is how your body text will look in generated videos.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onNext}>Next: Preview</Button>
            </div>
        </div>
    );
}
