'use client';

import { Player } from '@remotion/player';
import { MasterTemplate } from '@/remotion/templates/MasterTemplate';
import { MasterTemplateProps } from '@/remotion/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle } from 'lucide-react';

interface VideoPlayerProps {
    inputProps: MasterTemplateProps;
}

export function VideoPlayer({ inputProps }: VideoPlayerProps) {
    // Calculate dimensions based on aspect ratio
    let width = 360;
    let height = 640;

    if (inputProps.aspectRatio === '16:9') {
        width = 640;
        height = 360;
    } else if (inputProps.aspectRatio === '1:1') {
        width = 480;
        height = 480;
    }

    return (
        <Card className="overflow-hidden border-2 border-blue-100 dark:border-blue-900">
            <CardHeader className="bg-muted/50 pb-4">
                <CardTitle className="flex items-center text-lg">
                    <PlayCircle className="w-5 h-5 mr-2 text-blue-600" />
                    Video Preview
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex justify-center bg-black/5">
                <div className="p-4">
                    <Player
                        component={MasterTemplate}
                        inputProps={inputProps}
                        durationInFrames={Math.ceil(inputProps.scenes.reduce((acc, s) => acc + s.durationInSeconds, 0) * 30)}
                        compositionWidth={1080}
                        compositionHeight={inputProps.aspectRatio === '9:16' ? 1920 : inputProps.aspectRatio === '16:9' ? 608 : 1080}
                        fps={30}
                        style={{
                            width,
                            height,
                        }}
                        controls
                    />
                </div>
            </CardContent>
        </Card>
    );
}
