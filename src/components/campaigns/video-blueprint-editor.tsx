'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CampaignStrategy, VideoAspectRatio, VideoDuration } from '@/modules/campaigns/types';
import { updateVideoBlueprintAction } from '@/modules/campaigns/agent-actions';
import { useActionState } from 'react';

interface Props {
    campaignId: string;
    strategy: CampaignStrategy;
    duration: VideoDuration | null;
    aspectRatio: VideoAspectRatio | null;
}

interface FormState {
    error?: string;
    success?: boolean;
}

const initialState: FormState = {};

export function VideoBlueprintEditor({ campaignId, strategy, duration, aspectRatio }: Props) {
    const [localStrategy, setLocalStrategy] = useState<CampaignStrategy>(strategy);
    const [localDuration, setLocalDuration] = useState<VideoDuration | null>(duration || '30');
    const [localAspectRatio, setLocalAspectRatio] = useState<VideoAspectRatio | null>(aspectRatio || '9:16');

    const [state, formAction, isPending] = useActionState<FormState, FormData>(async (_prev, formData) => {
        const payload: CampaignStrategy = {
            ...localStrategy,
            hooks: localStrategy.hooks,
            script: localStrategy.script,
            visual_style: localStrategy.visual_style,
            target_audience: localStrategy.target_audience,
            tone: localStrategy.tone,
        };

        const result = await updateVideoBlueprintAction(campaignId, {
            strategy: payload,
            duration: localDuration || '30',
            aspectRatio: localAspectRatio || '9:16',
        });

        if (!result.success) {
            return { error: result.error || 'Failed to save blueprint', success: false };
        }

        return { error: undefined, success: true };
    }, initialState);

    const updateSceneField = (index: number, field: 'description' | 'visual_cue' | 'voiceover', value: string) => {
        const next = { ...localStrategy };
        next.script = next.script.map((scene, idx) =>
            idx === index ? { ...scene, [field]: value } : scene,
        );
        setLocalStrategy(next);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Video Blueprint</CardTitle>
                <CardDescription className="text-sm">
                    Edit the scenes, voiceover, and basic specs before rendering or sending to a video provider.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-medium">Duration (seconds)</Label>
                        <select
                            className="h-9 rounded-md border px-2 text-sm bg-background"
                            value={localDuration || '30'}
                            onChange={(e) => setLocalDuration(e.target.value as VideoDuration)}
                        >
                            <option value="15">15s</option>
                            <option value="30">30s</option>
                            <option value="60">60s</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-medium">Aspect Ratio</Label>
                        <select
                            className="h-9 rounded-md border px-2 text-sm bg-background"
                            value={localAspectRatio || '9:16'}
                            onChange={(e) => setLocalAspectRatio(e.target.value as VideoAspectRatio)}
                        >
                            <option value="9:16">9:16 (Vertical)</option>
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="1:1">1:1 (Square)</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-medium">Visual Style</Label>
                    <Input
                        value={localStrategy.visual_style}
                        onChange={(e) =>
                            setLocalStrategy({ ...localStrategy, visual_style: e.target.value })
                        }
                    />
                </div>

                <div className="space-y-3">
                    {localStrategy.script.map((scene, index) => (
                        <div
                            key={index}
                            className="rounded-lg border bg-muted/30 p-3 space-y-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Scene {scene.scene}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {Math.round(
                                        (parseInt(localDuration || '30') /
                                            localStrategy.script.length) *
                                            10,
                                    ) / 10}{' '}
                                    s
                                </span>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium">On-screen visual</Label>
                                <Textarea
                                    value={scene.visual_cue}
                                    onChange={(e) =>
                                        updateSceneField(index, 'visual_cue', e.target.value)
                                    }
                                    className="h-16 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium">Voiceover</Label>
                                <Textarea
                                    value={scene.voiceover}
                                    onChange={(e) =>
                                        updateSceneField(index, 'voiceover', e.target.value)
                                    }
                                    className="h-16 text-xs"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {state.error && (
                    <p className="text-xs text-red-500">{state.error}</p>
                )}

                {state.success && (
                    <p className="text-xs text-green-600">Blueprint saved.</p>
                )}

                <form action={formAction}>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? 'Saving…' : 'Save Blueprint'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

