import { Composition } from 'remotion';
import { MasterTemplate } from './templates/MasterTemplate';
import { MasterTemplateSchema } from './types';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="MasterTemplate"
                component={MasterTemplate}
                durationInFrames={900} // Default 30s at 30fps
                fps={30}
                width={1080}
                height={1920}
                schema={MasterTemplateSchema}
                defaultProps={{
                    scenes: [
                        {
                            text: "Welcome to Admotion AI",
                            durationInSeconds: 5,
                            visualCue: "Intro scene"
                        }
                    ],
                    primaryColor: '#2563eb',
                    secondaryColor: '#ffffff',
                    fontFamily: 'Inter',
                    aspectRatio: '9:16'
                }}
            />
        </>
    );
};
