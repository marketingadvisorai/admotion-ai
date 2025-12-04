import { CampaignStrategy } from './types';
import { MasterTemplateProps, Scene } from '@/remotion/types';

export function mapStrategyToVideoProps(
    strategy: CampaignStrategy,
    duration: string = '30',
    aspectRatio: '9:16' | '16:9' | '1:1' = '9:16'
): MasterTemplateProps {
    const totalDuration = parseInt(duration);
    const sceneCount = strategy.script.length;
    const durationPerScene = totalDuration / sceneCount;

    const scenes: Scene[] = strategy.script.map((segment) => ({
        text: segment.visual_cue, // Displaying visual cue as text for now
        durationInSeconds: durationPerScene,
        visualCue: segment.visual_cue,
        // In the future, we will map generated images here
    }));

    return {
        scenes,
        primaryColor: '#2563eb',
        secondaryColor: '#ffffff',
        fontFamily: 'Inter',
        aspectRatio,
    };
}
