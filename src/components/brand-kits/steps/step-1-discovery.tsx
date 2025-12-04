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
        <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/20 bg-white/40 backdrop-blur-md">
                <h3 className="text-xl font-bold text-gray-900">Let's start with your website</h3>
                <p className="text-sm text-gray-500 mt-1">We'll use AI to analyze your website and extract your brand identity automatically.</p>
            </div>

            <div className="p-6 space-y-8">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Brand Kit Name</Label>
                    <Input
                        {...form.register('name')}
                        placeholder="e.g. Summer Campaign 2024"
                        className="glass-input rounded-xl border-0 ring-1 ring-black/5"
                    />
                    {form.formState.errors.name && (
                        <p className="text-sm text-red-500">{form.formState.errors.name?.message as string}</p>
                    )}
                </div>

                {/* Magic Analyze Section */}
                <div className="space-y-4 p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-2xl border border-indigo-100/50">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-indigo-900/70 uppercase tracking-wider ml-1">Website URL</Label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 group">
                                <Globe className="absolute left-4 top-3.5 h-4 w-4 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                                <Input
                                    {...form.register('website_url')}
                                    className="glass-input pl-11 h-11 rounded-xl border-0 ring-1 ring-indigo-200/50 focus:ring-indigo-500/30"
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
                                className="h-11 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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
                            <p className="text-sm text-red-500 mt-2 bg-red-50 p-3 rounded-lg border border-red-100">{analyzeError}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                            Enter your website URL (e.g., domain.com) and click "Magic Analyze" to automatically extract colors, fonts, and more.
                        </p>
                    </div>
                </div>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white/80 backdrop-blur-sm px-3 text-gray-400 font-medium rounded-full border border-gray-100">Or fill manually</span>
                    </div>
                </div>

                {/* Manual Entry Section with Auto-fill */}
                <div className="grid gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Business Name</Label>
                            {websiteUrl && !businessName && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full px-3"
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
                        <Input
                            {...form.register('business_name')}
                            placeholder="Acme Corp"
                            className="glass-input rounded-xl border-0 ring-1 ring-black/5"
                        />
                        {form.formState.errors.business_name && (
                            <p className="text-sm text-red-500">{form.formState.errors.business_name?.message as string}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Description</Label>
                        <Textarea
                            {...form.register('description')}
                            placeholder="Briefly describe your business..."
                            className="glass-input rounded-xl border-0 ring-1 ring-black/5 min-h-[100px]"
                        />
                    </div>
                </div>
            </div>
            <div className="p-6 border-t border-white/20 bg-white/40 backdrop-blur-md flex justify-end">
                <Button
                    onClick={onNext}
                    disabled={!businessName}
                    className="w-full sm:w-auto h-11 px-8 rounded-xl bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20 transition-all duration-300"
                >
                    Next: Identity
                </Button>
            </div>
        </div>
    );
}
