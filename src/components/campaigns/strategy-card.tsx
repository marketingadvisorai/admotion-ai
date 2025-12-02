'use client';

import { useState } from 'react';
import { CampaignStrategy } from '@/modules/campaigns/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateStrategyAction } from '@/modules/campaigns/agent-actions';
import { Check, Edit2, Save, Video } from 'lucide-react';

interface StrategyCardProps {
    campaignId: string;
    strategy: CampaignStrategy;
    onApprove: () => void;
}

export function StrategyCard({ campaignId, strategy, onApprove }: StrategyCardProps) {
    const [editedStrategy, setEditedStrategy] = useState<CampaignStrategy>(strategy);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateStrategyAction(campaignId, editedStrategy);
        if (result.success) {
            setIsEditing(false);
        } else {
            console.error(result.error);
        }
        setIsSaving(false);
    };

    const updateHook = (index: number, value: string) => {
        const newHooks = [...editedStrategy.hooks];
        newHooks[index] = value;
        setEditedStrategy({ ...editedStrategy, hooks: newHooks });
    };

    const updateScript = (index: number, field: keyof typeof editedStrategy.script[0], value: string) => {
        const newScript = [...editedStrategy.script];
        newScript[index] = { ...newScript[index], [field]: value };
        setEditedStrategy({ ...editedStrategy, script: newScript });
    };

    return (
        <Card className="w-full border-2 border-blue-100 dark:border-blue-900">
            <CardHeader className="bg-muted/30">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl text-blue-700 dark:text-blue-400">Campaign Strategy</CardTitle>
                        <CardDescription>Review and approve the AI-generated strategy before video creation.</CardDescription>
                    </div>
                    {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Strategy
                        </Button>
                    ) : (
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <Tabs defaultValue="hooks" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="hooks">Hooks & Angle</TabsTrigger>
                        <TabsTrigger value="script">Video Script</TabsTrigger>
                        <TabsTrigger value="style">Visual Style</TabsTrigger>
                    </TabsList>

                    <TabsContent value="hooks" className="space-y-4">
                        <div className="space-y-4">
                            <Label>Marketing Hooks (3 Options)</Label>
                            {editedStrategy.hooks.map((hook, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0 mt-2">
                                        {idx + 1}
                                    </span>
                                    <Input
                                        value={hook}
                                        onChange={(e) => updateHook(idx, e.target.value)}
                                        disabled={!isEditing}
                                        className="font-medium"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <Label>Target Audience</Label>
                                <Input
                                    value={editedStrategy.target_audience}
                                    onChange={(e) => setEditedStrategy({ ...editedStrategy, target_audience: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tone</Label>
                                <Input
                                    value={editedStrategy.tone}
                                    onChange={(e) => setEditedStrategy({ ...editedStrategy, tone: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="script" className="space-y-6">
                        {editedStrategy.script.map((scene, idx) => (
                            <div key={idx} className="border rounded-lg p-4 bg-card">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                        Scene {scene.scene}
                                    </span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Visual</Label>
                                        <Textarea
                                            value={scene.visual_cue}
                                            onChange={(e) => updateScript(idx, 'visual_cue', e.target.value)}
                                            disabled={!isEditing}
                                            className="min-h-[80px] text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Voiceover / Text</Label>
                                        <Textarea
                                            value={scene.voiceover}
                                            onChange={(e) => updateScript(idx, 'voiceover', e.target.value)}
                                            disabled={!isEditing}
                                            className="min-h-[80px] text-sm bg-blue-50/50 dark:bg-blue-900/10"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </TabsContent>

                    <TabsContent value="style" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Visual Direction</Label>
                            <Textarea
                                value={editedStrategy.visual_style}
                                onChange={(e) => setEditedStrategy({ ...editedStrategy, visual_style: e.target.value })}
                                disabled={!isEditing}
                                className="min-h-[150px]"
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
            <CardFooter className="bg-muted/30 flex justify-end p-4">
                <Button
                    onClick={onApprove}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={isEditing}
                >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Strategy & Continue
                </Button>
            </CardFooter>
        </Card>
    );
}
