export type AiTool = 'video' | 'image' | 'assets' | 'storyboard';
export type GenerationMode = 'image' | 'video';

export interface GenerateOptions {
  apiKey: string;
  prompt: string;
  imageFile: File | null;
  aspectRatio: string;
  negativePrompt: string;
}

export interface GenerateImageFromTextOptions extends Omit<GenerateOptions, 'imageFile'> {
}

export interface EditImageOptions extends GenerateOptions {
  imageFile: File;
}

export interface GenerateVideoOptions extends GenerateOptions {
  generateImageFirst: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}

export interface GenerateParams extends GenerateOptions {
  onProgress: (message: string) => void;
}

export interface GenerateVideoParams extends GenerateVideoOptions {
  onProgress: (message: string) => void;
}
