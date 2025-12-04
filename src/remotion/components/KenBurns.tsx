import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface KenBurnsProps {
    src: string;
}

export const KenBurns: React.FC<KenBurnsProps> = ({ src }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const scale = interpolate(
        frame,
        [0, durationInFrames],
        [1, 1.15],
        {
            extrapolateRight: 'clamp',
        }
    );

    return (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
            <Img
                src={src}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${scale})`,
                }}
            />
        </AbsoluteFill>
    );
};
