import { z } from 'zod';

export const SceneSchema = z.object({
    text: z.string(),
    image: z.string().optional(),
    durationInSeconds: z.number(),
    visualCue: z.string().optional(),
});

export const MasterTemplateSchema = z.object({
    scenes: z.array(SceneSchema),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    fontFamily: z.string(),
    music: z.string().optional(),
    aspectRatio: z.enum(['9:16', '16:9', '1:1']),
});

export type Scene = z.infer<typeof SceneSchema>;
export type MasterTemplateProps = z.infer<typeof MasterTemplateSchema>;
