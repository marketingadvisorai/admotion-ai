import { AbsoluteFill, Sequence, useVideoConfig, Audio } from 'remotion';
import { MasterTemplateProps } from '../types';
import { DynamicText } from '../components/DynamicText';
import { KenBurns } from '../components/KenBurns';

export const MasterTemplate: React.FC<MasterTemplateProps> = ({ scenes, primaryColor, secondaryColor, fontFamily, music }) => {
    const { fps } = useVideoConfig();

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            {music && <Audio src={music} loop />}

            {scenes.map((scene, index) => {
                const durationInFrames = Math.round(scene.durationInSeconds * fps);
                // Calculate start frame based on previous scenes
                const from = scenes.slice(0, index).reduce((acc, s) => acc + Math.round(s.durationInSeconds * fps), 0);

                return (
                    <Sequence key={index} from={from} durationInFrames={durationInFrames}>
                        <AbsoluteFill>
                            {scene.image ? (
                                <KenBurns src={scene.image} />
                            ) : (
                                <AbsoluteFill className="bg-gradient-to-br from-slate-900 to-slate-800" />
                            )}
                            <DynamicText
                                text={scene.text}
                                primaryColor={primaryColor}
                                secondaryColor={secondaryColor}
                                fontFamily={fontFamily}
                            />
                        </AbsoluteFill>
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};
