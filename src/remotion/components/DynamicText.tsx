import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

interface DynamicTextProps {
    text: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
}

export const DynamicText: React.FC<DynamicTextProps> = ({ text, primaryColor, secondaryColor, fontFamily }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const opacity = interpolate(frame, [0, 20], [0, 1], {
        extrapolateRight: 'clamp',
    });

    const moveUp = spring({
        frame,
        fps,
        config: {
            damping: 200,
        },
    });

    const translateY = interpolate(moveUp, [0, 1], [50, 0]);

    return (
        <AbsoluteFill
            style={{
                justifyContent: 'center',
                alignItems: 'center',
                padding: 60,
            }}
        >
            <h1
                style={{
                    fontFamily,
                    color: secondaryColor,
                    fontSize: 80,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    opacity,
                    transform: `translateY(${translateY}px)`,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    padding: '20px 40px',
                    borderRadius: 20,
                    backdropFilter: 'blur(10px)',
                }}
            >
                {text}
            </h1>
        </AbsoluteFill>
    );
};
