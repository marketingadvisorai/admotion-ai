'use client';

import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, Palette, Sparkles } from 'lucide-react';
import BrandKitList from './brand-kit-list';
import { NewBrandKitDialog } from './new-brand-kit-dialog';
import { BrandAnalyzerTool } from './brand-analyzer-tool';
import { BrandMemoryPanel } from './brand-memory-panel';
import { BrandKit } from '@/modules/brand-kits/types';
import { BrandMemory } from '@/modules/creative-studio/types';

interface BrandKitsManagerProps {
    brandKits: BrandKit[];
    orgId: string;
    initialBrandMemory?: BrandMemory | null;
}

export function BrandKitsManager({ brandKits, orgId, initialBrandMemory = null }: BrandKitsManagerProps) {
    const [brandMemory, setBrandMemory] = useState<BrandMemory | null>(initialBrandMemory);
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState('kits');

    // Fetch brand memory on mount
    useEffect(() => {
        const fetchBrandMemory = async () => {
            try {
                const res = await fetch(`/api/brand-memory?orgId=${orgId}`);
                const data = await res.json();
                if (data.success && data.brandMemory) {
                    setBrandMemory(data.brandMemory);
                }
            } catch (err) {
                console.error('Failed to fetch brand memory:', err);
            }
        };
        if (!initialBrandMemory) {
            fetchBrandMemory();
        }
    }, [orgId, initialBrandMemory]);

    const handleSyncBrandMemory = useCallback(async () => {
        if (brandKits.length === 0) {
            alert('Please create a brand kit first before syncing to Brand Memory.');
            return;
        }

        setIsSyncing(true);
        try {
            const res = await fetch('/api/brand-memory/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    orgId, 
                    brandKitId: brandKits[0].id // Use first brand kit
                }),
            });
            const data = await res.json();
            if (data.success) {
                setBrandMemory(data.brandMemory);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Sync failed:', err);
            alert('Failed to sync brand memory. Please try again.');
        } finally {
            setIsSyncing(false);
        }
    }, [orgId, brandKits]);

    const handleSaveBrandMemory = useCallback(async (updates: Partial<BrandMemory>) => {
        try {
            const res = await fetch('/api/brand-memory', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId, updates }),
            });
            const data = await res.json();
            if (data.success) {
                setBrandMemory(data.brandMemory);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save brand memory. Please try again.');
        }
    }, [orgId]);

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-8">
                <TabsList className="p-1 bg-gray-100/50 backdrop-blur-md rounded-2xl border border-white/20 h-auto">
                    <TabsTrigger 
                        value="kits" 
                        className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-300 flex items-center gap-2"
                    >
                        <Palette className="w-4 h-4" />
                        Brand Kits
                    </TabsTrigger>
                    <TabsTrigger 
                        value="memory" 
                        className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 transition-all duration-300 flex items-center gap-2"
                    >
                        <Brain className="w-4 h-4" />
                        Brand Memory
                        {brandMemory && (
                            <Badge variant="secondary" className="ml-1 text-[10px] bg-purple-100 text-purple-600">
                                v{brandMemory.version}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger 
                        value="analyzer" 
                        className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-300 flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Analyzer
                    </TabsTrigger>
                </TabsList>
                {activeTab === 'kits' && <NewBrandKitDialog orgId={orgId} />}
            </div>

            <TabsContent value="kits" className="mt-0">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Brand Kits</h1>
                    <p className="text-gray-500">Manage your brand assets, colors, and fonts.</p>
                </div>
                <BrandKitList brandKits={brandKits} orgId={orgId} />
            </TabsContent>

            <TabsContent value="memory" className="mt-0">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Brand Memory</h1>
                    <p className="text-gray-500">
                        AI-powered brand context for consistent ad generation. Updates create new versions - old campaigns keep their original settings.
                    </p>
                </div>
                <BrandMemoryPanel
                    orgId={orgId}
                    brandMemory={brandMemory}
                    onSave={handleSaveBrandMemory}
                    onSync={handleSyncBrandMemory}
                    isSyncing={isSyncing}
                />
            </TabsContent>

            <TabsContent value="analyzer" className="mt-0">
                <BrandAnalyzerTool orgId={orgId} brandKits={brandKits} />
            </TabsContent>
        </Tabs>
    );
}
