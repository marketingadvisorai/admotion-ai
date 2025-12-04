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
                <TabsList>
                    <TabsTrigger value="kits">Brand Kits</TabsTrigger>
                    <TabsTrigger value="analyzer">Brand Analyzer</TabsTrigger>
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
