'use client';

import { useState } from 'react';
import { Campaign } from '@/modules/campaigns/types';
import { ChatInterface } from '@/components/campaigns/chat-interface';
import { StrategyCard } from '@/components/campaigns/strategy-card';
import { VideoPlayer } from '@/components/campaigns/video-player';
import { VideoBlueprintEditor } from '@/components/campaigns/video-blueprint-editor';
import { ImageCopyEditor } from '@/components/campaigns/image-copy-editor';
import GenerationDialog from '@/components/campaigns/generation-dialog';
import ImageGenerationDialog from '@/components/campaigns/image-generation-dialog';
import GenerationList from '@/components/campaigns/generation-list';
import { ImageList } from '@/components/campaigns/image-list';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Clapperboard, ImageIcon, LayoutDashboard, MessageSquare, PanelRightClose, PanelRightOpen } from 'lucide-react';
import Link from 'next/link';
import { mapStrategyToVideoProps } from '@/modules/campaigns/video-service';
import { cn } from '@/lib/utils';
import { approveStrategyAction } from '@/modules/campaigns/agent-actions';

interface CampaignAgentWorkspaceProps {
    campaign: Campaign;
    orgId: string;
}

export function CampaignAgentWorkspace({ campaign, orgId }: CampaignAgentWorkspaceProps) {
    const [activeTab, setActiveTab] = useState<'strategy' | 'video' | 'image'>('strategy');
    const [isChatOpen, setIsChatOpen] = useState(true);

    // Determine initial tab based on campaign status
    // If strategy exists but no video, show strategy. If video exists, show video.
    // This logic can be refined.

    return (
        <div className="flex h-[calc(100dvh-64px)] bg-gray-50 overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Header */}
                <header className="h-16 border-b bg-white px-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/dashboard/${orgId}`}
                            className="text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="font-semibold text-gray-900 truncate max-w-[200px] md:max-w-md">
                                {campaign.name}
                            </h1>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full font-medium capitalize",
                                    campaign.status === 'completed' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                )}>
                                    {campaign.status.replace('_', ' ')}
                                </span>
                                <span>•</span>
                                <span>{campaign.platform?.replace('_', ' ') || 'Multi-Platform'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="hidden md:block">
                            <TabsList>
                                <TabsTrigger value="strategy">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Strategy
                                </TabsTrigger>
                                <TabsTrigger value="video">
                                    <Clapperboard className="w-4 h-4 mr-2" />
                                    Video
                                </TabsTrigger>
                                <TabsTrigger value="image">
                                    <ImageIcon className="w-4 h-4 mr-2" />
                                    Image
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className={cn("ml-2", isChatOpen && "bg-gray-100")}
                        >
                            {isChatOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
                        </Button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-5xl mx-auto h-full">
                        {activeTab === 'strategy' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {campaign.strategy ? (
                                    <StrategyCard
                                        campaignId={campaign.id}
                                        strategy={campaign.strategy}
                                        onApprove={async () => {
                                            await approveStrategyAction(campaign.id);
                                            setActiveTab('video');
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[400px] text-center p-8 border-2 border-dashed rounded-xl bg-white/50">
                                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Strategy Yet</h3>
                                        <p className="text-gray-500 max-w-sm mb-6">
                                            Use the chat on the right to generate a marketing strategy for your campaign.
                                        </p>
                                        <Button onClick={() => setIsChatOpen(true)}>
                                            Open Chat Assistant
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'video' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        {campaign.strategy && (
                                            <VideoBlueprintEditor
                                                campaignId={campaign.id}
                                                strategy={campaign.strategy}
                                                duration={campaign.duration}
                                                aspectRatio={campaign.aspect_ratio as any}
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-6">
                                        <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-black/5">
                                            <CardHeader className="bg-gray-900 text-white py-3 px-4 flex flex-row items-center justify-between">
                                                <CardTitle className="text-sm font-medium flex items-center">
                                                    <Clapperboard className="w-4 h-4 mr-2 text-blue-400" />
                                                    Preview
                                                </CardTitle>
                                                <GenerationDialog orgId={orgId} campaignId={campaign.id} />
                                            </CardHeader>
                                            <CardContent className="p-0 bg-black">
                                                {campaign.strategy ? (
                                                    <VideoPlayer
                                                        inputProps={mapStrategyToVideoProps(
                                                            campaign.strategy,
                                                            campaign.duration || '30',
                                                            (campaign.aspect_ratio as any) || '9:16'
                                                        )}
                                                    />
                                                ) : (
                                                    <div className="aspect-[9/16] flex items-center justify-center text-gray-500">
                                                        No preview available
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm font-medium">Recent Generations</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <GenerationList campaignId={campaign.id} />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'image' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-end">
                                    <ImageGenerationDialog orgId={orgId} campaignId={campaign.id} />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Image Ad Creator</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ImageCopyEditor
                                                    campaignId={campaign.id}
                                                    prompt="" // TODO: Fetch prompt from somewhere or state
                                                    onPromptChange={(p) => console.log(p)}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm font-medium">Generated Images</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ImageList campaignId={campaign.id} />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Right Sidebar (Chat) */}
            <div className={cn(
                "border-l bg-white transition-all duration-300 ease-in-out flex flex-col",
                isChatOpen ? "w-[400px] translate-x-0" : "w-0 translate-x-full opacity-0 overflow-hidden"
            )}>
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between shrink-0">
                        <h2 className="font-semibold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            Campaign Assistant
                        </h2>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsChatOpen(false)}>
                            <PanelRightClose className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <ChatInterface
                            campaignId={campaign.id}
                            initialHistory={campaign.chat_history || []}
                            onStrategyGenerated={(strategy) => {
                                // Refresh logic is handled by ChatInterface via router.refresh()
                                // But we can also switch tabs here
                                setActiveTab('strategy');
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
