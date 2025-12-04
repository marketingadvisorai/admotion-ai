export type AspectRatioVideo = '16:9' | '1:1' | '9:16';

export interface GeneratedVideo {
  id: string;
  cover: string;
  prompt: string;
  provider: string;
  duration: number;
  aspect: AspectRatioVideo;
  createdAt: Date;
}
