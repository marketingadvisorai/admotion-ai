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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ScrollText className="h-5 w-5" />
                    Brand Analyzer
                </CardTitle>
                <CardDescription>
                    Review and refine the brand story, audience, and strategy we extracted from your site.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Business Name</label>
                            <Input
                                {...form.register('business_name')}
                                placeholder="Acme Corp"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Short Description</label>
                            <Textarea
                                {...form.register('description')}
                                placeholder="1–2 sentences describing what you do..."
                                className="h-24"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Locations</label>
                            <Textarea
                                defaultValue={locationsText}
                                onBlur={(e) => handleListBlur('locations', e.target.value)}
                                placeholder="One location per line (e.g. Chicago, IL)"
                                className="h-24"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Vision</label>
                            <Textarea
                                {...form.register('strategy.vision')}
                                placeholder="Where is this brand trying to go long-term?"
                                className="h-16"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Mission</label>
                            <Textarea
                                {...form.register('strategy.mission')}
                                placeholder="What do you do day-to-day to achieve that vision?"
                                className="h-16"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Target Audience</label>
                            <Textarea
                                {...form.register('strategy.target_audience')}
                                placeholder="Who are you primarily trying to reach?"
                                className="h-16"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Core Values</label>
                        <Textarea
                            defaultValue={valuesText}
                            onBlur={(e) => handleListBlur('values', e.target.value)}
                            placeholder="One value per line (e.g. Quality, Innovation, Trust)"
                            className="h-28"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Key Differentiators</label>
                        <Textarea
                            defaultValue={differentiatorsText}
                            onBlur={(e) => handleListBlur('differentiators', e.target.value)}
                            placeholder="One differentiator per line (e.g. 24/7 support, Same-day delivery)"
                            className="h-28"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Offerings</label>
                    <Textarea
                        defaultValue={offeringsText}
                        onBlur={(e) => handleListBlur('offerings', e.target.value)}
                        placeholder="One per line, e.g. 'Birthday Parties – 90-minute escape room party package'"
                        className="h-28"
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onNext}>Next: Preview</Button>
            </CardFooter>
        </Card>
    );
}

