'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    RefreshCw, 
    Download, 
    Maximize2, 
    MoreHorizontal,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Sparkles,
    Wand2
} from 'lucide-react';
import { CreativePack, CreativeAsset, Direction, AspectRatio, DIRECTION_CONFIGS } from '@/modules/creative-studio/types';

interface CreativePackGridProps {
    pack: CreativePack | null;
    isGenerating: boolean;
    onRegenerateDirection: (direction: Direction) => void;
    onRegenerateAsset: (assetId: string) => void;
    onDownload: (assetId: string) => void;
}

const RATIO_LABELS: Record<AspectRatio, string> = {
    '1:1': 'Square',
    '4:5': 'Portrait',
    '9:16': 'Story/Reels',
};

export function CreativePackGrid({ 
    pack, 
    isGenerating, 
    onRegenerateDirection, 
    onRegenerateAsset,
    onDownload 
}: CreativePackGridProps) {
    const [selectedAsset, setSelectedAsset] = useState<CreativeAsset | null>(null);

    if (isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
                    <Loader2 className="w-10 h-10 text-white absolute inset-0 m-auto animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-6">Generating Creative Pack</h3>
                <p className="text-gray-500 mt-2">Creating 9 brand-aligned images (3 directions × 3 ratios)</p>
                <div className="flex gap-2 mt-4">
                    <Badge variant="outline">Direction A</Badge>
                    <Badge variant="outline">Direction B</Badge>
                    <Badge variant="outline">Direction C</Badge>
                </div>
            </div>
        );
    }

    if (!pack || !pack.assets || pack.assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6">
                    <Sparkles className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No Creative Pack Yet</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                    Complete the brief chat and confirm your copy to generate a creative pack with 9 brand-aligned images.
                </p>
            </div>
        );
    }

    // Group assets by direction
    const assetsByDirection = {
        A: pack.assets.filter(a => a.direction === 'A'),
        B: pack.assets.filter(a => a.direction === 'B'),
        C: pack.assets.filter(a => a.direction === 'C'),
    };

    return (
        <div className="space-y-8">
            {/* Pack Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Creative Pack</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{pack.assets.length} images</span>
                        <span>•</span>
                        <span>Model: {pack.model_used}</span>
                        <span>•</span>
                        <QualityBadge pack={pack} />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download All
                    </Button>
                </div>
            </div>

            {/* Directions Grid */}
            {(['A', 'B', 'C'] as Direction[]).map((direction) => (
                <DirectionSection
                    key={direction}
                    direction={direction}
                    assets={assetsByDirection[direction]}
                    onRegenerate={() => onRegenerateDirection(direction)}
                    onRegenerateAsset={onRegenerateAsset}
                    onDownload={onDownload}
                    onSelect={setSelectedAsset}
                />
            ))}

            {/* Fullscreen Preview Modal */}
            {selectedAsset && (
                <AssetPreviewModal 
                    asset={selectedAsset} 
                    onClose={() => setSelectedAsset(null)} 
                />
            )}
        </div>
    );
}

function DirectionSection({
    direction,
    assets,
    onRegenerate,
    onRegenerateAsset,
    onDownload,
    onSelect,
}: {
    direction: Direction;
    assets: CreativeAsset[];
    onRegenerate: () => void;
    onRegenerateAsset: (assetId: string) => void;
    onDownload: (assetId: string) => void;
    onSelect: (asset: CreativeAsset) => void;
}) {
    const config = DIRECTION_CONFIGS[direction];
    
    return (
        <div className="space-y-4">
            {/* Direction Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                        direction === 'A' ? 'bg-blue-500' :
                        direction === 'B' ? 'bg-purple-500' :
                        'bg-emerald-500'
                    }`}>
                        {direction}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">{config.name}</h4>
                        <p className="text-xs text-gray-500">{config.description}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onRegenerate}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Direction
                </Button>
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-3 gap-4">
                {(['1:1', '4:5', '9:16'] as AspectRatio[]).map((ratio) => {
                    const asset = assets.find(a => a.aspect_ratio === ratio);
                    return (
                        <AssetCard
                            key={`${direction}-${ratio}`}
                            asset={asset}
                            ratio={ratio}
                            onRegenerate={() => asset && onRegenerateAsset(asset.id)}
                            onDownload={() => asset && onDownload(asset.id)}
                            onSelect={() => asset && onSelect(asset)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function AssetCard({
    asset,
    ratio,
    onRegenerate,
    onDownload,
    onSelect,
}: {
    asset: CreativeAsset | undefined;
    ratio: AspectRatio;
    onRegenerate: () => void;
    onDownload: () => void;
    onSelect: () => void;
}) {
    const aspectClass = ratio === '1:1' ? 'aspect-square' :
                        ratio === '4:5' ? 'aspect-[4/5]' :
                        'aspect-[9/16]';

    if (!asset || !asset.result_url) {
        return (
            <div className={`${aspectClass} bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center`}>
                <div className="text-center text-gray-400">
                    <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                    <p className="text-xs">{RATIO_LABELS[ratio]}</p>
                </div>
            </div>
        );
    }

    const hasFlagged = asset.status === 'flagged' || asset.compliance_risk === 'high';

    return (
        <div className="group relative">
            <div className={`${aspectClass} relative rounded-xl overflow-hidden border ${hasFlagged ? 'border-amber-300' : 'border-gray-200'} bg-gray-100`}>
                <Image
                    src={asset.result_url}
                    alt={asset.headline_text || 'Generated ad'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 300px"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="rounded-full" onClick={onSelect}>
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="rounded-full" onClick={onDownload}>
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="rounded-full" onClick={onRegenerate}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                {/* Ratio Badge */}
                <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-[10px] bg-black/50 text-white backdrop-blur-sm">
                        {RATIO_LABELS[ratio]}
                    </Badge>
                </div>

                {/* Quality Indicators */}
                <div className="absolute top-2 right-2 flex gap-1">
                    {asset.readability_score && asset.readability_score >= 7 && (
                        <Badge className="bg-green-500/80 text-white text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                        </Badge>
                    )}
                    {hasFlagged && (
                        <Badge className="bg-amber-500/80 text-white text-[10px]">
                            <AlertTriangle className="w-3 h-3" />
                        </Badge>
                    )}
                </div>
            </div>

            {/* Scores */}
            {asset.brand_alignment_score && (
                <div className="mt-2 flex gap-2 text-[10px] text-gray-500">
                    <span>Brand: {asset.brand_alignment_score}/10</span>
                    <span>Read: {asset.readability_score}/10</span>
                </div>
            )}
        </div>
    );
}

function QualityBadge({ pack }: { pack: CreativePack }) {
    if (pack.compliance_status === 'flagged') {
        return (
            <Badge variant="outline" className="text-amber-600 border-amber-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Needs Review
            </Badge>
        );
    }
    
    if (pack.avg_readability && pack.avg_readability >= 7) {
        return (
            <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Quality Passed
            </Badge>
        );
    }

    return null;
}

function AssetPreviewModal({ 
    asset, 
    onClose 
}: { 
    asset: CreativeAsset; 
    onClose: () => void;
}) {
    return (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                >
                    ×
                </button>
                
                <div className="relative h-[70vh]">
                    <Image
                        src={asset.result_url || ''}
                        alt={asset.headline_text || 'Generated ad'}
                        fill
                        className="object-contain"
                    />
                </div>
                
                <div className="p-4 border-t">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{asset.direction_name}</p>
                            <p className="text-sm text-gray-500">{RATIO_LABELS[asset.aspect_ratio]} • {asset.model_used}</p>
                        </div>
                        <div className="flex gap-2">
                            <Badge>Brand: {asset.brand_alignment_score}/10</Badge>
                            <Badge>Readability: {asset.readability_score}/10</Badge>
                            <Badge variant={asset.compliance_risk === 'low' ? 'default' : 'destructive'}>
                                Risk: {asset.compliance_risk}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
