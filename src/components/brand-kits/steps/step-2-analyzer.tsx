'use client';

import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText } from 'lucide-react';

interface Step2AnalyzerProps {
    onBack: () => void;
    onNext: () => void;
}

export function Step2Analyzer({ onBack, onNext }: Step2AnalyzerProps) {
    const form = useFormContext();
    const strategy = form.watch('strategy') || {};
    const locations = form.watch('locations') || [];
    const offerings = form.watch('offerings') || [];

    const locationsText = (locations as string[]).join('\n');
    const valuesText = (strategy.values || []).join('\n');
    const differentiatorsText = (strategy.key_differentiators || []).join('\n');
    const offeringsText = (offerings as any[])
        .map((o) => `${o.name || ''} – ${o.description || ''}`.trim())
        .join('\n');

    const handleListBlur = (field: 'locations' | 'values' | 'differentiators' | 'offerings', value: string) => {
        const lines = value
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);

        if (field === 'locations') {
            form.setValue('locations', lines);
            return;
        }

        if (field === 'values') {
            form.setValue('strategy.values', lines);
            return;
        }

        if (field === 'differentiators') {
            form.setValue('strategy.key_differentiators', lines);
            return;
        }

        if (field === 'offerings') {
            const parsed = lines.map((line) => {
                let [name, ...rest] = line.split('–');
                if (!rest.length) {
                    [name, ...rest] = line.split('-');
                }
                const description = rest.join('–').trim();
                return { name: (name || '').trim(), description };
            }).filter((o) => o.name);

            form.setValue('offerings', parsed);
        }
    };

    return (
        <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/20 bg-white/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-100/50 text-indigo-600">
                        <ScrollText className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Brand Analyzer</h3>
                        <p className="text-sm text-gray-500">Review and refine the brand story, audience, and strategy we extracted from your site.</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Business Name</label>
                            <Input
                                {...form.register('business_name')}
                                placeholder="Acme Corp"
                                className="glass-input rounded-xl border-0 ring-1 ring-black/5"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Short Description</label>
                            <Textarea
                                {...form.register('description')}
                                placeholder="1–2 sentences describing what you do..."
                                className="glass-input rounded-xl border-0 ring-1 ring-black/5 min-h-[100px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Locations</label>
                            <Textarea
                                defaultValue={locationsText}
                                onBlur={(e) => handleListBlur('locations', e.target.value)}
                                placeholder="One location per line (e.g. Chicago, IL)"
                                className="glass-input rounded-xl border-0 ring-1 ring-black/5 min-h-[100px]"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Vision</label>
                            <Textarea
                                {...form.register('strategy.vision')}
                                placeholder="Where is this brand trying to go long-term?"
                                className="glass-input rounded-xl border-0 ring-1 ring-black/5 min-h-[80px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Mission</label>
                            <Textarea
                                {...form.register('strategy.mission')}
                                placeholder="What do you do day-to-day to achieve that vision?"
                                className="glass-input rounded-xl border-0 ring-1 ring-black/5 min-h-[80px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Target Audience</label>
                            <Textarea
                                {...form.register('strategy.target_audience')}
                                placeholder="Who are you primarily trying to reach?"
                                className="glass-input rounded-xl border-0 ring-1 ring-black/5 min-h-[80px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Core Values</label>
                        <Textarea
                            defaultValue={valuesText}
                            onBlur={(e) => handleListBlur('values', e.target.value)}
                            placeholder="One value per line (e.g. Quality, Innovation, Trust)"
                            className="glass-input rounded-xl border-0 ring-1 ring-black/5 min-h-[120px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Key Differentiators</label>
                        <Textarea
                            defaultValue={differentiatorsText}
                            onBlur={(e) => handleListBlur('differentiators', e.target.value)}
                            placeholder="One differentiator per line (e.g. 24/7 support, Same-day delivery)"
                            className="glass-input rounded-xl border-0 ring-1 ring-black/5 min-h-[120px]"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Offerings</label>
                    <Textarea
                        defaultValue={offeringsText}
                        onBlur={(e) => handleListBlur('offerings', e.target.value)}
                        placeholder="One per line, e.g. 'Birthday Parties – 90-minute escape room party package'"
                        className="glass-input rounded-xl border-0 ring-1 ring-black/5 min-h-[120px]"
                    />
                </div>
            </div>
            <div className="p-6 border-t border-white/20 bg-white/40 backdrop-blur-md flex justify-between">
                <Button variant="outline" onClick={onBack} className="glass-button bg-white/50 hover:bg-white/80 text-gray-700 border-gray-200 hover:border-gray-300 shadow-sm">Back</Button>
                <Button onClick={onNext} className="glass-button bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 border-0">Next: Preview</Button>
            </div>
        </div>
    );
}

