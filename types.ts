export interface GenerateImageOptions {
  apiKey: string;
  prompt: string;
  imageFile: File | null;
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}

export interface GenerateImageParams extends GenerateImageOptions {
  onProgress: (message: string) => void;
}
