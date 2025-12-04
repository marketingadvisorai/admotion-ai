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
        <Card>
            <CardHeader>
                <CardTitle>Preview Brand Kit</CardTitle>
                <CardDescription>
                    Review your brand assets before saving.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg p-8 space-y-8 bg-white/50 backdrop-blur-sm">
                    <div className="text-center space-y-4">
                        <h2
                            className="text-4xl font-bold"
                            style={{
                                fontFamily: fonts.heading,
                                color: primaryColor
                            }}
                        >
                            {businessName}
                        </h2>
                        <p
                            className="text-lg max-w-2xl mx-auto text-muted-foreground"
                            style={{
                                fontFamily: fonts.body,
                            }}
                        >
                            {description}
                        </p>
                    </div>

                    <div className="flex justify-center gap-6 flex-wrap">
                        {colors.map((color: any, i: number) => (
                            <div key={i} className="text-center group">
                                <div
                                    className="h-16 w-16 rounded-full shadow-lg mx-auto mb-2 ring-2 ring-offset-2 ring-transparent group-hover:ring-gray-200 transition-all"
                                    style={{ backgroundColor: color.value }}
                                />
                                <span className="text-xs font-medium text-muted-foreground">{color.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button
                    onClick={onSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Brand Kit
                </Button>
            </CardFooter>
        </Card>
    );
}
