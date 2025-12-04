'use client';

import { Campaign } from '@/modules/campaigns/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/campaigns/video-player';
import { mapStrategyToVideoProps } from '@/modules/campaigns/video-service';
import GenerationDialog from '@/components/campaigns/generation-dialog';
import ImageGenerationDialog from '@/components/campaigns/image-generation-dialog';
import StrategyGenerationDialog from '@/components/campaigns/strategy-generation-dialog';
import GenerationList from '@/components/campaigns/generation-list';
import { ImageList } from '@/components/campaigns/image-list';
import { CheckCircle, Clapperboard, ImageIcon, LayoutDashboard, Library } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { VideoBlueprintEditor } from '@/components/campaigns/video-blueprint-editor';
import { Separator } from '@/components/ui/separator';

interface CampaignStudioProps {
    campaign: Campaign;
    orgId: string;
}

export function CampaignStudio({ campaign, orgId }: CampaignStudioProps) {
    return (
        <div className="flex flex-col h-[calc(100dvh-64px)]">
            {/* Header */}
            <div className="border-b bg-white px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/dashboard/${orgId}`}
                        className="text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
                            <span className="truncate">{campaign.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium capitalize shrink-0">
                                {campaign.status.replace('_', ' ')}
                            </span>
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500 capitalize truncate">
                            {campaign.platform?.replace('_', ' ') || 'Multi-Platform'} • {campaign.duration || '30'}s • {campaign.aspect_ratio || '9:16'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Global Actions if any */}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden bg-gray-50">
                <Tabs defaultValue="studio" className="h-full flex flex-col">
                    <div className="px-4 md:px-6 border-b bg-white shrink-0 overflow-x-auto scrollbar-hide">
                        <TabsList className="h-12 w-full justify-start bg-transparent p-0 space-x-6 min-w-max">
                            <TabsTrigger
                                value="studio"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-medium"
                            >
                                <LayoutDashboard className="w-4 h-4 mr-2" />
                                Studio
                            </TabsTrigger>
                            <TabsTrigger
                                value="strategy"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-medium"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Strategy
                            </TabsTrigger>
                            <TabsTrigger
                                value="assets"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-medium"
                            >
                                <Library className="w-4 h-4 mr-2" />
                                Assets Library
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Studio Tab */}
                    <TabsContent value="studio" className="flex-1 overflow-y-auto p-4 md:p-6 m-0">
                        <div className="max-w-6xl mx-auto space-y-6">
                            <Tabs defaultValue="video" className="w-full">
                                <div className="flex items-center justify-between mb-6 overflow-x-auto">
                                    <TabsList>
                                        <TabsTrigger value="video">
                                            <Clapperboard className="w-4 h-4 mr-2" />
                                            Video Creator
                                        </TabsTrigger>
                                        <TabsTrigger value="image">
                                            <ImageIcon className="w-4 h-4 mr-2" />
                                            Image Creator
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="video" className="space-y-6 mt-0">
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
                                            <Card>
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <CardTitle className="text-lg font-medium">Video Preview</CardTitle>
                                                    <GenerationDialog orgId={orgId} campaignId={campaign.id} />
                                                </CardHeader>
                                                <CardContent>
                                                    {campaign.strategy ? (
                                                        <VideoPlayer
                                                            inputProps={mapStrategyToVideoProps(
                                                                campaign.strategy,
                                                                campaign.duration || '30',
                                                                (campaign.aspect_ratio as any) || '9:16'
                                                            )}
                                                        />
                                                    ) : (
                                                        <div className="h-[300px] md:h-[400px] flex items-center justify-center bg-gray-100 rounded-lg text-gray-400">
                                                            No strategy available
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                        <div className="space-y-6">
                                            <Card className="h-full">
                                                <CardHeader>
                                                    <CardTitle>Recent Generations</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <GenerationList campaignId={campaign.id} />
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="image" className="space-y-6 mt-0">
                                    <div className="flex justify-end">
                                        <ImageGenerationDialog orgId={orgId} campaignId={campaign.id} />
                                    </div>
                                    <ImageList campaignId={campaign.id} />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </TabsContent>

                    {/* Strategy Tab */}
                    <TabsContent value="strategy" className="flex-1 overflow-y-auto p-4 md:p-6 m-0">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="flex justify-end">
                                <StrategyGenerationDialog orgId={orgId} campaignId={campaign.id} />
                            </div>
                            {campaign.strategy ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Campaign Strategy</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="font-semibold text-sm mb-2 text-gray-500 uppercase">Target Audience</h4>
                                                <p className="text-gray-900">{campaign.strategy.target_audience}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm mb-2 text-gray-500 uppercase">Tone & Style</h4>
                                                <p className="text-gray-900">{campaign.strategy.tone} • {campaign.strategy.visual_style}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2 text-gray-500 uppercase">Marketing Hooks</h4>
                                            <div className="grid gap-2">
                                                {campaign.strategy.hooks.map((hook, i) => (
                                                    <div key={i} className="p-3 bg-indigo-50 text-indigo-900 rounded-md text-sm font-medium">
                                                        {hook}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2 text-gray-500 uppercase">Script Breakdown</h4>
                                            <div className="space-y-4">
                                                {campaign.strategy.script.map((scene, i) => (
                                                    <div key={i} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-gray-50">
                                                        <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white border font-bold text-gray-500">
                                                            {scene.scene}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-sm font-medium text-gray-900">{scene.description}</p>
                                                            <p className="text-sm text-gray-600 italic">"{scene.voiceover}"</p>
                                                            <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border inline-block">
                                                                Visual: {scene.visual_cue}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed">
                                    <p className="mb-4">No strategy generated yet.</p>
                                    <StrategyGenerationDialog orgId={orgId} campaignId={campaign.id} />
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Assets Tab */}
                    <TabsContent value="assets" className="flex-1 overflow-y-auto p-4 md:p-6 m-0">
                        <div className="max-w-6xl mx-auto space-y-8">
                            <div>
                                <h2 className="text-lg font-semibold mb-4">Video Library</h2>
                                <GenerationList campaignId={campaign.id} />
                            </div>
                            <Separator />
                            <div>
                                <h2 className="text-lg font-semibold mb-4">Image Library</h2>
                                <ImageList campaignId={campaign.id} />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}


