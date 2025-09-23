export type AspectRatio = '16:9' | '9:16';
export type Resolution = '720p' | '1080p';

export interface VideoOptions {
  prompt: string;
  imageFile: File | null;
  aspectRatio: AspectRatio;
  resolution: Resolution;
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}

export interface GenerateVideoParams extends VideoOptions {
  apiKey: string;
  onProgress: (message: string) => void;
}