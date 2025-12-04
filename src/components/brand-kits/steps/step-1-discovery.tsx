'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Loader2, Wand2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { analyzeBrandAction } from '@/modules/brand-kits/actions';
import { toast } from 'sonner';
import { normalizeUrl, isValidUrl } from '@/lib/url-utils';

interface Step1DiscoveryProps {
    onNext: () => void;
    orgId: string;
}

export function Step1Discovery({ onNext, orgId }: Step1DiscoveryProps) {
    const form = useFormContext();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState<'magic' | 'manual'>('magic');
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);

    // Watch values for conditional rendering/logic
    const websiteUrl = form.watch('website_url');
    const businessName = form.watch('business_name');

    const handleAnalyze = async (isAutoFill = false) => {
        const rawUrl = form.getValues('website_url');

        if (!rawUrl) {
            const message = 'Please enter a website URL first (e.g., example.com).';
            setAnalyzeError(message);
            toast.error(message);
            return;
        }

        if (!isValidUrl(rawUrl)) {
            const message = 'That URL looks invalid. Try something like "example.com" or paste the full URL from your browser.';
            setAnalyzeError(message);
            toast.error(message);
            return;
        }

        const url = normalizeUrl(rawUrl);
        // Update form with normalized URL
        form.setValue('website_url', url);

        setIsAnalyzing(true);
        const toastId = toast.loading(isAutoFill ? 'Auto-filling details...' : 'Analyzing website...');

        try {
            const result = await analyzeBrandAction(url, orgId);

            if (result.success && result.data) {
                const data = result.data;

                // Populate form fields
                form.setValue('business_name', data.business_name);
                form.setValue('description', data.description);
                form.setValue('colors', data.colors);
                form.setValue('fonts', data.fonts);
                form.setValue('social_links', data.social_links);
                form.setValue('locations', data.locations);
                form.setValue('logo_url', data.logo_url);
                form.setValue('offerings', data.offerings);
                form.setValue('strategy', data.strategy);

                // Auto-fill name if empty
                if (!form.getValues('name')) {
                    form.setValue('name', `${data.business_name} Brand Kit`);
                }

                setAnalyzeError(null);
                toast.success('Analysis complete!', { id: toastId });
            } else {
                const message = mapAnalyzeError(result.error);
                setAnalyzeError(message);
                toast.error(message, { id: toastId });
            }
        } catch (error: any) {
            const message = mapAnalyzeError(error?.message);
            setAnalyzeError(message);
            toast.error(message, { id: toastId });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const mapAnalyzeError = (raw?: string | null): string => {
        const msg = raw || '';

        if (msg.includes('OpenAI API Key')) {
            return 'AI analysis is not configured for this workspace. Ask an admin to add an OpenAI API key in settings.';
        }

        if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('resolve') || msg.toLowerCase().includes('url')) {
            return 'We could not reach that website. Make sure the URL is spelled correctly and publicly accessible (e.g., https://yourdomain.com).';
        }

        if (msg) return msg;
        return 'Something went wrong while analyzing your site. Please try again in a moment.';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Let's start with your website</CardTitle>
                <CardDescription>
                    We'll use AI to analyze your website and extract your brand identity automatically.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Brand Kit Name</Label>
                    <Input
                        {...form.register('name')}
                        placeholder="e.g. Summer Campaign 2024"
                    />
                    {form.formState.errors.name && (
                        <p className="text-sm text-red-500">{form.formState.errors.name.message as string}</p>
                    )}
                </div>

                {/* Magic Analyze Section */}
                <div className="space-y-2">
                    <Label>Website URL</Label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                {...form.register('website_url')}
                                className="pl-9"
                                placeholder="example.com"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAnalyze(false);
                                    }
                                }}
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={() => handleAnalyze(false)}
                            disabled={isAnalyzing || !websiteUrl}
                            className="min-w-[140px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transition-all duration-200"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Magic Analyze
                                </>
                            )}
                        </Button>
                    </div>
                    {analyzeError && (
                        <p className="text-sm text-red-500 mt-1">{analyzeError}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                        Enter your website URL (e.g., domain.com) and click "Magic Analyze" to automatically extract colors, fonts, and more.
                    </p>
                </div>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or fill manually</span>
                    </div>
                </div>

                {/* Manual Entry Section with Auto-fill */}
                <div className="grid gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Business Name</Label>
                            {websiteUrl && !businessName && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                    onClick={() => handleAnalyze(true)}
                                    disabled={isAnalyzing}
                                >
                                    {isAnalyzing ? (
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                        <Wand2 className="mr-1 h-3 w-3" />
                                    )}
                                    Auto-fill from URL
                                </Button>
                            )}
                        </div>
                        <Input {...form.register('business_name')} placeholder="Acme Corp" />
                        {form.formState.errors.business_name && (
                            <p className="text-sm text-red-500">{form.formState.errors.business_name.message as string}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            {...form.register('description')}
                            placeholder="Briefly describe your business..."
                            className="h-24"
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button
                    onClick={onNext}
                    disabled={!businessName}
                    className="w-full sm:w-auto"
                >
                    Next: Identity
                </Button>
            </CardFooter>
        </Card>
    );
}
