'use client';

import { useFormContext } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Step4PreviewProps {
    onBack: () => void;
    onSave: () => void;
    isSaving: boolean;
}

export function Step4Preview({ onBack, onSave, isSaving }: Step4PreviewProps) {
    const form = useFormContext();
    const businessName = form.watch('business_name');
    const description = form.watch('description');
    const colors = form.watch('colors') || [];
    const fonts = form.watch('fonts') || { heading: 'Inter', body: 'Inter' };
    const primaryColor = colors.find((c: any) => c.type === 'primary')?.value || '#000000';

    return (
        <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/20 bg-white/40 backdrop-blur-md">
                <h3 className="text-xl font-bold text-gray-900">Preview Brand Kit</h3>
                <p className="text-sm text-gray-500 mt-1">Review your brand assets before saving.</p>
            </div>

            <div className="p-8">
                <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/30 backdrop-blur-md shadow-inner">
                    {/* Ambient background for preview */}
                    <div className="absolute inset-0 opacity-10" style={{
                        background: `radial-gradient(circle at 50% 50%, ${primaryColor}, transparent 70%)`
                    }} />

                    <div className="relative p-12 space-y-12">
                        <div className="text-center space-y-6">
                            <h2
                                className="text-5xl font-bold tracking-tight drop-shadow-sm"
                                style={{
                                    fontFamily: fonts.heading,
                                    color: primaryColor
                                }}
                            >
                                {businessName}
                            </h2>
                            <p
                                className="text-xl max-w-2xl mx-auto text-gray-700 leading-relaxed"
                                style={{
                                    fontFamily: fonts.body,
                                }}
                            >
                                {description}
                            </p>
                        </div>

                        <div className="flex justify-center gap-8 flex-wrap">
                            {colors.map((color: any, i: number) => (
                                <div key={i} className="text-center group">
                                    <div
                                        className="h-20 w-20 rounded-2xl shadow-lg mx-auto mb-3 ring-4 ring-white/50 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                                        style={{ backgroundColor: color.value }}
                                    />
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">{color.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-white/20 bg-white/40 backdrop-blur-md flex justify-between">
                <Button variant="outline" onClick={onBack} className="glass-button bg-white/50 hover:bg-white/80 text-gray-700 border-gray-200 hover:border-gray-300 shadow-sm">Back</Button>
                <Button
                    onClick={onSave}
                    disabled={isSaving}
                    className="glass-button bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/20 border-0 px-8"
                >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Brand Kit
                </Button>
            </div>
        </div>
    );
}
