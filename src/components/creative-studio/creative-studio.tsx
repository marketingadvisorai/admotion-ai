'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Plus, 
    MessageSquare, 
    Grid3X3, 
    Settings2,
    Sparkles,
    Brain,
    ChevronLeft,
    Loader2
} from 'lucide-react';
import { CreativeChat } from './creative-chat';
import { CreativePackGrid } from './creative-pack-grid';
import { 
    CreativeBrief, 
    CreativePack, 
    Direction,
    BrandMemory
} from '@/modules/creative-studio/types';

interface CreativeStudioProps {
    orgId: string;
    brandMemory: BrandMemory | null;
}

export function CreativeStudio({ orgId, brandMemory }: CreativeStudioProps) {
    const [briefs, setBriefs] = useState<CreativeBrief[]>([]);
    const [selectedBrief, setSelectedBrief] = useState<CreativeBrief | null>(null);
    const [currentPack, setCurrentPack] = useState<CreativePack | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCreatingBrief, setIsCreatingBrief] = useState(false);
    const [view, setView] = useState<'list' | 'studio'>('list');
    const [newBriefName, setNewBriefName] = useState('');

    // Fetch briefs on mount
    useEffect(() => {
        fetchBriefs();
    }, [orgId]);

    const fetchBriefs = async () => {
        try {
            const res = await fetch(`/api/creative-studio/briefs?orgId=${orgId}`);
            const data = await res.json();
            if (data.success) {
                setBriefs(data.briefs);
            }
        } catch (err) {
            console.error('Failed to fetch briefs:', err);
        }
    };

    const handleCreateBrief = async () => {
        if (!newBriefName.trim()) return;
        
        setIsCreatingBrief(true);
        try {
            const res = await fetch('/api/creative-studio/briefs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orgId,
                    name: newBriefName,
                    brandMemoryId: brandMemory?.id,
                }),
            });
            const data = await res.json();
            
            if (data.success) {
                setBriefs(prev => [data.brief, ...prev]);
                setSelectedBrief(data.brief);
                setView('studio');
                setNewBriefName('');
            }
        } catch (err) {
            console.error('Failed to create brief:', err);
        } finally {
            setIsCreatingBrief(false);
        }
    };

    const handleSelectBrief = async (brief: CreativeBrief) => {
        setSelectedBrief(brief);
        setView('studio');
        
        // Fetch pack if brief is completed
        if (brief.status === 'completed' || brief.status === 'generating') {
            // TODO: Fetch packs for this brief
        }
    };

    const handleBriefUpdate = useCallback((updatedBrief: CreativeBrief) => {
        setSelectedBrief(updatedBrief);
        setBriefs(prev => prev.map(b => b.id === updatedBrief.id ? updatedBrief : b));
    }, []);

    const handleCopyConfirmed = async () => {
        if (!selectedBrief) return;
        
        // Auto-generate after copy confirmation
        setIsGenerating(true);
        try {
            const res = await fetch(`/api/creative-studio/briefs/${selectedBrief.id}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'openai' }),
            });
            const data = await res.json();
            
            if (data.success) {
                setCurrentPack(data.pack);
                // Update brief status
                const briefRes = await fetch(`/api/creative-studio/briefs/${selectedBrief.id}`);
                const briefData = await briefRes.json();
                if (briefData.success) {
                    handleBriefUpdate(briefData.brief);
                }
            }
        } catch (err) {
            console.error('Failed to generate pack:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateDirection = async (direction: Direction) => {
        // TODO: Implement direction regeneration
        console.log('Regenerate direction:', direction);
    };

    const handleRegenerateAsset = async (assetId: string) => {
        // TODO: Implement asset regeneration
        console.log('Regenerate asset:', assetId);
    };

    const handleDownload = async (assetId: string) => {
        // TODO: Implement download
        console.log('Download asset:', assetId);
    };

    if (view === 'studio' && selectedBrief) {
        return (
            <div className="flex h-[calc(100vh-200px)] gap-6">
                {/* Left Panel - Chat */}
                <div className="w-[400px] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setView('list')}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{selectedBrief.name}</h3>
                            <div className="flex items-center gap-2">
                                <StatusBadge status={selectedBrief.status} />
                                {brandMemory && (
                                    <Badge variant="outline" className="text-[10px]">
                                        <Brain className="w-3 h-3 mr-1" />
                                        v{brandMemory.version}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Chat */}
                    <CreativeChat
                        briefId={selectedBrief.id}
                        brief={selectedBrief}
                        onBriefUpdate={handleBriefUpdate}
                        onCopyConfirmed={handleCopyConfirmed}
                    />
                </div>

                {/* Right Panel - Creative Pack Grid */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-y-auto">
                    <CreativePackGrid
                        pack={currentPack}
                        isGenerating={isGenerating}
                        onRegenerateDirection={handleRegenerateDirection}
                        onRegenerateAsset={handleRegenerateAsset}
                        onDownload={handleDownload}
                    />
                </div>
            </div>
        );
    }

    // Brief List View
    return (
        <div className="space-y-6">
            {/* Create New Brief */}
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Start New Creative Brief</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Chat with AI to create copy, then generate a pack of 9 brand-aligned images.
                    </p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newBriefName}
                        onChange={(e) => setNewBriefName(e.target.value)}
                        placeholder="Brief name..."
                        className="px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateBrief()}
                    />
                    <Button 
                        onClick={handleCreateBrief}
                        disabled={!newBriefName.trim() || isCreatingBrief}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                    >
                        {isCreatingBrief ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Brief
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Brand Memory Status */}
            {!brandMemory && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                    <Brain className="w-5 h-5" />
                    <div className="flex-1">
                        <p className="font-medium">No Brand Memory configured</p>
                        <p className="text-sm text-amber-600">Go to Brand Kits to set up Brand Memory for consistent ad generation.</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-amber-700 border-amber-300 hover:bg-amber-100">
                        Set Up
                    </Button>
                </div>
            )}

            {/* Briefs List */}
            {briefs.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                        <MessageSquare className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No creative briefs yet</h3>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                        Create your first brief to start generating brand-aligned ad creatives.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {briefs.map((brief) => (
                        <BriefCard
                            key={brief.id}
                            brief={brief}
                            onClick={() => handleSelectBrief(brief)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function BriefCard({ brief, onClick }: { brief: CreativeBrief; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="text-left p-5 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all group"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-indigo-500" />
                </div>
                <StatusBadge status={brief.status} />
            </div>
            
            <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {brief.name}
            </h4>
            
            {brief.headline && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    &quot;{brief.headline}&quot;
                </p>
            )}
            
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                <span>{brief.chat_history?.length || 0} messages</span>
                <span>•</span>
                <span>{new Date(brief.created_at).toLocaleDateString()}</span>
            </div>
        </button>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string }> = {
        intake: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
        copy_pending: { label: 'Copy Pending', className: 'bg-amber-100 text-amber-700' },
        copy_confirmed: { label: 'Ready', className: 'bg-green-100 text-green-700' },
        generating: { label: 'Generating', className: 'bg-purple-100 text-purple-700' },
        completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
        failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
    };

    const { label, className } = config[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

    return (
        <Badge variant="secondary" className={className}>
            {label}
        </Badge>
    );
}
