'use client';

import { useState, useEffect } from 'react';
import { Loader2, Wand2, Globe, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analyzeBrandAction, createBrandKitAction, updateBrandKitAction } from '@/modules/brand-kits/actions';
import { toast } from 'sonner';
import { normalizeUrl, isValidUrl } from '@/lib/url-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrandKnowledgeBase } from './brand-knowledge-base';
import { ColorPicker } from '@/components/ui/color-picker';
import { BrandKit } from '@/modules/brand-kits/types';
import { useRouter } from 'next/navigation';

interface BrandAnalyzerToolProps {
    orgId: string;
    brandKits?: BrandKit[];
}

export function BrandAnalyzerTool({ orgId, brandKits = [] }: BrandAnalyzerToolProps) {
    const router = useRouter();
    const [selectedKitId, setSelectedKitId] = useState<string>('new');
    const [url, setUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);

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

        // If analyzing for a new kit, clear previous result temporarily
        if (selectedKitId === 'new') {
            setResult(null);
        }

        try {
            const response = await analyzeBrandAction(normalizedUrl, orgId);
            if (response.success && response.data) {
                setResult(response.data);
                toast.success('Analysis complete!');
            } else {
                setAnalyzeError(response.error || 'Analysis failed');
                toast.error(response.error || 'Analysis failed');
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
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="w-full md:w-1/3">
                    <Label className="mb-2 block text-xs font-medium text-gray-500 uppercase tracking-wider">Select Source</Label>
                    <Select value={selectedKitId} onValueChange={setSelectedKitId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a brand kit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="new">
                                <span className="flex items-center gap-2">
                                    <Wand2 className="h-4 w-4 text-indigo-500" />
                                    New Analysis
                                </span>
                            </SelectItem>
                            {brandKits.length > 0 && <div className="h-px bg-gray-100 my-1" />}
                            {brandKits.map((kit) => (
                                <SelectItem key={kit.id} value={kit.id}>
                                    {kit.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* URL Input - Always visible to allow re-analysis or new analysis */}
                <div className="flex-1 w-full flex gap-2 items-end">
                    <div className="relative flex-1">
                        <Label className="mb-2 block text-xs font-medium text-gray-500 uppercase tracking-wider">Website URL</Label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="pl-9"
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
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white mb-[2px]"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                {selectedKitId === 'new' ? <Wand2 className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
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
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                {selectedKitId === 'new' ? 'Analysis Results' : 'Brand Knowledge Base'}
                            </h3>
                            {selectedKitId === 'new' && result?.usage && (
                                <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full border">
                                    <span>{result.usage.totalTokens.toLocaleString()} tokens</span>
                                    <span className="w-px h-3 bg-gray-300" />
                                    <span>${result.usage.cost.toFixed(4)} est. cost</span>
                                </div>
                            )}
                        </div>

                        {selectedKitId === 'new' ? (
                            <Button onClick={handleSaveAsKit} disabled={isSaving} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save as Brand Kit
                            </Button>
                        ) : (
                            <Button onClick={handleUpdateKit} disabled={isSaving} variant="outline">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Update Brand Kit
                            </Button>
                        )}
                    </div>

                    <Tabs defaultValue="knowledge" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                            <TabsTrigger value="visuals">Visuals</TabsTrigger>
                            <TabsTrigger value="raw">Raw Data</TabsTrigger>
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
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed">
                    <Wand2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Ready to Analyze</h3>
                    <p className="text-gray-500 mt-1 max-w-md mx-auto">
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
