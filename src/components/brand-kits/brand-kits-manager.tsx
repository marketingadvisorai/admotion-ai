'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BrandKitList from './brand-kit-list';
import { NewBrandKitDialog } from './new-brand-kit-dialog';
import { BrandAnalyzerTool } from './brand-analyzer-tool';
import { BrandKit } from '@/modules/brand-kits/types';

interface BrandKitsManagerProps {
    brandKits: BrandKit[];
    orgId: string;
}

export function BrandKitsManager({ brandKits, orgId }: BrandKitsManagerProps) {
    return (
        <Tabs defaultValue="kits" className="w-full">
            <div className="flex items-center justify-between mb-8">
                <TabsList className="p-1 bg-gray-100/50 backdrop-blur-md rounded-2xl border border-white/20 h-auto">
                    <TabsTrigger value="kits" className="px-6 py-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-300">Brand Kits</TabsTrigger>
                    <TabsTrigger value="analyzer" className="px-6 py-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-300">Brand Analyzer</TabsTrigger>
                </TabsList>
                <NewBrandKitDialog orgId={orgId} />
            </div>

            <TabsContent value="kits">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Brand Kits</h1>
                    <p className="text-gray-500">Manage your brand assets, colors, and fonts.</p>
                </div>
                <BrandKitList brandKits={brandKits} orgId={orgId} />
            </TabsContent>

            <TabsContent value="analyzer">
                <BrandAnalyzerTool orgId={orgId} brandKits={brandKits} />
            </TabsContent>
        </Tabs>
    );
}
