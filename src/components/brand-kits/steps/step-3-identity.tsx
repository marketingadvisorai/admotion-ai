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
            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/20 bg-white/40 backdrop-blur-md">
                    <h3 className="text-xl font-bold text-gray-900">Logo</h3>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-6">
                        {logoUrl && (
                            <div className="h-24 w-24 relative border border-white/20 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm p-4 flex items-center justify-center shadow-inner">
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
                        <div className="flex-1 space-y-2">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Logo URL</Label>
                            <Input
                                {...form.register('logo_url')}
                                placeholder="https://example.com/logo.png"
                                className="glass-input rounded-xl border-0 ring-1 ring-black/5"
                            />
                            <p className="text-xs text-gray-500 ml-1">
                                Enter a direct link to your logo image.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="glass-panel rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-white/20 bg-white/40 backdrop-blur-md flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-pink-100/50 text-pink-600">
                            <Palette className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Color Palette</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {colors.map((color: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-2 rounded-xl bg-white/30 border border-white/20 hover:bg-white/50 transition-colors">
                                <div className="relative group">
                                    <input
                                        type="color"
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                        value={color.value}
                                        onChange={(e) => {
                                            const newColors = [...colors];
                                            newColors[index].value = e.target.value;
                                            form.setValue('colors', newColors);
                                        }}
                                    />
                                    <div
                                        className="h-10 w-10 rounded-lg border border-black/5 shadow-sm"
                                        style={{ backgroundColor: color.value }}
                                    />
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <Input
                                        value={color.name}
                                        onChange={(e) => {
                                            const newColors = [...colors];
                                            newColors[index].name = e.target.value;
                                            form.setValue('colors', newColors);
                                        }}
                                        className="h-8 bg-transparent border-0 focus-visible:ring-0 p-0 font-medium text-gray-900 placeholder:text-gray-400"
                                        placeholder="Color Name"
                                    />
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            value={color.value}
                                            onChange={(e) => {
                                                const newColors = [...colors];
                                                newColors[index].value = e.target.value;
                                                form.setValue('colors', newColors);
                                            }}
                                            className="h-6 w-20 font-mono text-xs bg-white/50 border-0 rounded-md px-2 text-gray-500"
                                            placeholder="#000000"
                                        />
                                        <select
                                            className="h-6 rounded-md border-0 text-xs px-2 bg-white/50 text-gray-600 focus:ring-0 cursor-pointer"
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
                                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                    onClick={() => {
                                        const newColors = colors.filter((_: any, i: number) => i !== index);
                                        form.setValue('colors', newColors);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full glass-button border-dashed border-2 border-gray-300 bg-transparent hover:bg-white/50 hover:border-indigo-300 text-gray-500 hover:text-indigo-600"
                            onClick={() => {
                                form.setValue('colors', [...colors, { name: 'New Color', value: '#000000', type: 'accent' }]);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Color
                        </Button>
                    </div>
                </div>

                <div className="glass-panel rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-white/20 bg-white/40 backdrop-blur-md flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-100/50 text-blue-600">
                            <Type className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Typography</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Heading Font</Label>
                            <Input
                                {...form.register('fonts.heading')}
                                placeholder="e.g. Inter"
                                className="glass-input rounded-xl border-0 ring-1 ring-black/5"
                            />
                            <div className="p-4 bg-white/30 rounded-xl border border-white/20 backdrop-blur-sm">
                                <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: fonts.heading }}>
                                    The quick brown fox
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Body Font</Label>
                            <Input
                                {...form.register('fonts.body')}
                                placeholder="e.g. Roboto"
                                className="glass-input rounded-xl border-0 ring-1 ring-black/5"
                            />
                            <div className="p-4 bg-white/30 rounded-xl border border-white/20 backdrop-blur-sm">
                                <p className="text-base text-gray-700 leading-relaxed" style={{ fontFamily: fonts.body }}>
                                    Jumps over the lazy dog. This is how your body text will look in generated videos. It should be legible and clean.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-between mt-6 pt-6 border-t border-white/10">
                <Button variant="outline" onClick={onBack} className="glass-button bg-white/50 hover:bg-white/80 text-gray-700 border-gray-200 hover:border-gray-300 shadow-sm">Back</Button>
                <Button onClick={onNext} className="glass-button bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 border-0">Next: Brand Analyzer</Button>
            </div>
        </div>
    );
}
