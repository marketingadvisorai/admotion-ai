'use client';

import { useState, useEffect } from 'react';
import { Loader2, Wand2, Globe, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analyzeBrandAction, createBrandKitAction, updateBrandKitAction, createBrandKitAndMemoryFromUrlAction, updateBrandKitAndMemoryFromUrlAction, deleteBrandKitAction } from '@/modules/brand-kits/actions';
import { toast } from 'sonner';
import { normalizeUrl, isValidUrl } from '@/lib/url-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrandKnowledgeBase } from './brand-knowledge-base';
import { ColorPicker } from '@/components/ui/color-picker';
import { BrandKit } from '@/modules/brand-kits/types';
import { BrandMemory } from '@/modules/creative-studio/types';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';

interface BrandAnalyzerToolProps {
    orgId: string;
    brandKits?: BrandKit[];
}

function DeleteAnalysisButton({ kitId, onDeleted }: { kitId: string; onDeleted?: () => void }) {
    const [state, formAction, pending] = useActionState(async (_prev: any, formData: FormData) => {
        const id = formData.get('kitId') as string;
        const res = await deleteBrandKitAction(id);
        if (res.success && onDeleted) onDeleted();
        return res;
    }, null);

    return (
        <form action={formAction}>
            <input type="hidden" name="kitId" value={kitId} />
            <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                disabled={pending}
            >
                <RefreshCw className={`w-4 h-4 ${pending ? 'animate-spin' : ''}`} />
            </Button>
        </form>
    );
}

export function BrandAnalyzerTool({ orgId, brandKits = [] }: BrandAnalyzerToolProps) {
    const router = useRouter();
    const [selectedKitId, setSelectedKitId] = useState<string>('new');
    const [url, setUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);
    const [savedKit, setSavedKit] = useState<BrandKit | null>(null);
    const [savedMemory, setSavedMemory] = useState<BrandMemory | null>(null);
    const [syncKitId, setSyncKitId] = useState<string>('new');
    const [isSyncingMemory, setIsSyncingMemory] = useState(false);

    // Reset state when selection changes
    useEffect(() => {
        if (selectedKitId === 'new') {
            setResult(null);
            setUrl('');
        } else {
            const kit = brandKits.find(k => k.id === selectedKitId);
            if (kit) {
                setResult(kit);
                setUrl(kit.website_url || '');
            }
        }
        setAnalyzeError(null);
    }, [selectedKitId, brandKits]);

    const handleAnalyze = async () => {
        if (!url) {
            toast.error('Please enter a website URL first.');
            return;
        }

        if (!isValidUrl(url)) {
            toast.error('Invalid URL format.');
            return;
        }

        const normalizedUrl = normalizeUrl(url);
        setUrl(normalizedUrl);
        setIsAnalyzing(true);
        setAnalyzeError(null);

        try {
            // Run full flow:
            // - New selection: analyze -> create brand kit -> create brand memory
            // - Existing selection: analyze -> update brand kit -> refresh brand memory
            const response =
                selectedKitId === 'new'
                    ? await createBrandKitAndMemoryFromUrlAction(normalizedUrl, orgId)
                    : await updateBrandKitAndMemoryFromUrlAction(selectedKitId, normalizedUrl, orgId);

            if (response.success && response.data) {
                const analysis = response.data.analysis || response.data;
                setResult(analysis);
                setSavedKit((response.data as any).kit || null);
                setSavedMemory((response.data as any).brandMemory || null);
                setSyncKitId(((response.data as any).kit?.id as string) || selectedKitId || 'new');
                toast.success(
                    selectedKitId === 'new'
                        ? 'Analysis complete. Brand kit and memory saved.'
                        : 'Analysis updated. Brand kit and memory refreshed.'
                );
                router.refresh();
            } else {
                const errMsg = !response.success && (response as any)?.error ? (response as any).error : 'Analysis failed';
                setAnalyzeError(errMsg);
                toast.error(errMsg);
            }
        } catch (error: any) {
            setAnalyzeError(error.message || 'An unexpected error occurred');
            toast.error('An unexpected error occurred');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveAsKit = async () => {
        if (!result) return;
        setIsSaving(true);
        try {
            const payload = {
                ...result,
                org_id: orgId,
                name: result.business_name ? `${result.business_name} Brand Kit` : 'New Brand Kit'
            };

            const response = await createBrandKitAction(payload);
            if (response.success) {
                toast.success('Brand kit saved successfully!');
                router.refresh();
                // Switch to the new kit
                if (response.data?.id) {
                    setSelectedKitId(response.data.id);
                }
            } else {
                toast.error(response.error || 'Failed to save brand kit');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSyncBrandMemory = async () => {
        if (!syncKitId || syncKitId === 'new') {
            toast.error('Select a brand kit to sync into Brand Memory.');
            return;
        }
        setIsSyncingMemory(true);
        try {
            const res = await fetch('/api/brand-memory/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId, brandKitId: syncKitId }),
            });
            const data = await res.json();
            if (data.success) {
                setSavedMemory(data.brandMemory);
                toast.success('Brand memory synced to selected kit.');
            } else {
                throw new Error(data.error || 'Sync failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to sync brand memory');
        } finally {
            setIsSyncingMemory(false);
        }
    };

    const handleUpdateKit = async () => {
        if (!result || selectedKitId === 'new') return;
        setIsSaving(true);
        try {
            // We only update the analysis fields, keeping the name intact unless empty
            const payload = {
                ...result,
                // Ensure we don't overwrite the name if it's not in the result (though it should be)
                name: result.name || result.business_name
            };

            const response = await updateBrandKitAction(selectedKitId, payload);
            if (response.success) {
                toast.success('Brand kit updated with new analysis!');
                router.refresh();
            } else {
                toast.error(response.error || 'Failed to update brand kit');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 w-full">
            {/* Saved analyses grid */}
            {brandKits.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">Saved Analyses</h3>
                        <p className="text-xs text-gray-500">Select to load into the analyzer or delete.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {brandKits.map((kit) => {
                            const primaryColor = kit.colors.find(c => c.type === 'primary')?.value || '#111827';
                            const secondaryColor = kit.colors.find(c => c.type === 'secondary')?.value || '#f3f4f6';
                            return (
                                <div
                                    key={kit.id}
                                    className="relative rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                >
                                    <div className="absolute inset-x-0 top-0 h-20 opacity-70" style={{ background: `linear-gradient(120deg, ${primaryColor}, ${secondaryColor})` }} />
                                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-white" />
                                    <div className="relative p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-xs uppercase text-gray-400">Analysis</p>
                                                <h4 className="text-lg font-semibold text-gray-900 line-clamp-1">{kit.business_name || kit.name}</h4>
                                                <p className="text-xs text-gray-500 line-clamp-2">{kit.description}</p>
                                            </div>
                                            <DeleteAnalysisButton kitId={kit.id} onDeleted={() => router.refresh()} />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <span className="px-2 py-1 rounded-lg bg-gray-100">{kit.fonts.heading}</span>
                                            <span className="px-2 py-1 rounded-lg bg-gray-100">{kit.fonts.body}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {kit.colors.slice(0, 3).map((c, idx) => (
                                                <div key={idx} className="flex items-center gap-1">
                                                    <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: c.value }} />
                                                    <span className="text-[11px] text-gray-500">{c.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => {
                                                    setSelectedKitId(kit.id);
                                                    setResult(kit);
                                                    setUrl(kit.website_url || '');
                                                }}
                                            >
                                                Load
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => {
                                                    setSelectedKitId(kit.id);
                                                    setResult(kit);
                                                    setUrl(kit.website_url || '');
                                                    handleAnalyze();
                                                }}
                                            >
                                                Re-Analyze
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-4 space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Select Source</Label>
                    <Select value={selectedKitId} onValueChange={setSelectedKitId}>
                        <SelectTrigger className="glass-input h-12 rounded-2xl border-0 ring-1 ring-black/5 shadow-sm">
                            <SelectValue placeholder="Select a brand kit" />
                        </SelectTrigger>
                        <SelectContent className="glass-panel border-0 rounded-xl">
                            <SelectItem value="new" className="focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer rounded-lg my-1">
                                <span className="flex items-center gap-2">
                                    <Wand2 className="h-4 w-4 text-indigo-500" />
                                    New Analysis
                                </span>
                            </SelectItem>
                            {brandKits.length > 0 && <div className="h-px bg-gray-200/50 my-1" />}
                            {brandKits.map((kit) => (
                                <SelectItem key={kit.id} value={kit.id} className="focus:bg-gray-50 cursor-pointer rounded-lg my-1">
                                    {kit.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* URL Input - Always visible to allow re-analysis or new analysis */}
                <div className="md:col-span-8 flex flex-col sm:flex-row gap-3 items-end">
                    <div className="relative flex-1 w-full space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Website URL</Label>
                        <div className="relative group">
                            <Globe className="absolute left-4 top-4 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="glass-input pl-11 h-12 rounded-2xl border-0 ring-1 ring-black/5 shadow-sm text-base"
                                placeholder="example.com"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAnalyze();
                                }}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !url}
                        className="h-12 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                {selectedKitId === 'new' ? <Wand2 className="mr-2 h-5 w-5" /> : <RefreshCw className="mr-2 h-5 w-5" />}
                                {selectedKitId === 'new' ? 'Analyze' : 'Re-Analyze'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {analyzeError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">
                    {analyzeError}
                </div>
            )}

            {result ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/20">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                {selectedKitId === 'new' ? 'Analysis Results' : 'Brand Knowledge Base'}
                                {selectedKitId === 'new' && result?.usage && (
                                    <span className="inline-flex items-center gap-2 text-[10px] font-medium text-indigo-600 bg-indigo-50/80 px-2 py-1 rounded-full border border-indigo-100">
                                        <span>{result.usage.totalTokens.toLocaleString()} tokens</span>
                                        <span className="w-px h-2 bg-indigo-200" />
                                        <span>${result.usage.cost.toFixed(4)}</span>
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {selectedKitId === 'new' ? 'Review the AI analysis below before saving.' : 'View and manage your brand assets.'}
                            </p>
                        </div>

                        {selectedKitId === 'new' ? (
                            <Button
                                onClick={handleSaveAsKit}
                                disabled={isSaving}
                                variant="outline"
                                className="glass-button bg-white/50 hover:bg-white/80 text-indigo-700 border-indigo-100 hover:border-indigo-200 shadow-sm"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save as Brand Kit
                            </Button>
                        ) : (
                            <Button
                                onClick={handleUpdateKit}
                                disabled={isSaving}
                                variant="outline"
                                className="glass-button bg-white/50 hover:bg-white/80 text-gray-700 border-gray-200 hover:border-gray-300 shadow-sm"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Update Brand Kit
                            </Button>
                        )}
                    </div>

                    <Tabs defaultValue="knowledge" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8 p-1 bg-gray-100/50 backdrop-blur-md rounded-2xl border border-white/20">
                            <TabsTrigger value="knowledge" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-300">Knowledge Base</TabsTrigger>
                            <TabsTrigger value="visuals" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-300">Visuals</TabsTrigger>
                            <TabsTrigger value="raw" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-300">Raw Data</TabsTrigger>
                        </TabsList>

                        <TabsContent value="knowledge">
                            <BrandKnowledgeBase brandKit={result} />
                        </TabsContent>

                        <TabsContent value="visuals" className="space-y-6">
                            <Card>
                                <CardContent className="pt-6 space-y-8">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <Label className="text-lg font-medium">Colors</Label>
                                            <p className="text-sm text-gray-500">Click a color to edit or pick from screen.</p>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {result.colors?.map((c: any, i: number) => (
                                                <div key={i} className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50/50">
                                                    <ColorPicker
                                                        color={c.value}
                                                        onChange={(newColor: string) => {
                                                            const newColors = [...(result.colors || [])];
                                                            newColors[i] = { ...newColors[i], value: newColor };
                                                            setResult({ ...result, colors: newColors });
                                                        }}
                                                        label={c.name}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <Label className="mb-4 block text-lg font-medium">Typography</Label>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-6 border rounded-xl bg-gray-50">
                                                <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Heading Font</span>
                                                <span className="text-2xl font-bold text-gray-900">{result.fonts?.heading}</span>
                                                <p className="mt-2 text-sm text-gray-600">Used for headlines and titles.</p>
                                            </div>
                                            <div className="p-6 border rounded-xl bg-gray-50">
                                                <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Body Font</span>
                                                <span className="text-xl text-gray-900">{result.fonts?.body}</span>
                                                <p className="mt-2 text-sm text-gray-600">Used for paragraphs and general text.</p>
                                            </div>
                                        </div>
                                    </div>
                                    {result.logo_url && (
                                        <>
                                            <Separator />
                                            <div>
                                                <Label className="mb-4 block text-lg font-medium">Logo</Label>
                                                <div className="p-6 border rounded-xl bg-gray-50 inline-block">
                                                    <img src={result.logo_url} alt="Brand Logo" className="h-24 object-contain" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="raw">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Raw JSON Data</CardTitle>
                                    <CardDescription>Useful for debugging or API usage.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-[500px] text-xs font-mono">
                                        {JSON.stringify(result, null, 2)}
                                    </pre>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            ) : (
                <div className="text-center py-24 bg-white/20 backdrop-blur-sm rounded-3xl border border-white/20 shadow-inner">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <Wand2 className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Analyze</h3>
                    <p className="text-gray-500 mt-1 max-w-md mx-auto text-lg font-light leading-relaxed">
                        Enter a website URL above to extract brand identity, or select an existing brand kit to view its details.
                    </p>
                </div>
            )}
        </div>
    );
}

function Separator() {
    return <div className="h-px bg-gray-200 w-full" />;
}
