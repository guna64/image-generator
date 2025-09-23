import { GoogleGenAI } from "@google/genai";
import type { GenerateVideoParams } from '../types';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('FileReader did not return a string.'));
      }
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });


export const generateVideo = async ({
  apiKey,
  prompt,
  imageFile,
  aspectRatio,
  onProgress,
}: GenerateVideoParams): Promise<string> => {
  if (!apiKey) {
    throw new Error("API key is missing. Please provide a valid Google AI API key.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  onProgress("Preparing assets...");
  
  const imagePayload = imageFile ? {
    imageBytes: await fileToBase64(imageFile),
    mimeType: imageFile.type,
  } : undefined;

  onProgress("Sending request to VEO model...");

  let operation = await ai.models.generateVideos({
    model: 'veo-3.0-generate-preview',
    prompt: prompt,
    image: imagePayload,
    config: {
      numberOfVideos: 1,
      aspectRatio: aspectRatio,
    }
  });

  const loadingMessages = [
    "Warming up the pixels...",
    "Composing your masterpiece...",
    "Rendering the final frames...",
    "This can take a few minutes...",
    "Almost there, adding the finishing touches..."
  ];
  let messageIndex = 0;

  while (!operation.done) {
    onProgress(loadingMessages[messageIndex % loadingMessages.length]);
    messageIndex++;
    await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
    try {
        operation = await ai.operations.getVideosOperation({ operation: operation });
    } catch (e) {
        console.error("Polling failed, retrying...", e);
        // Continue polling even if one check fails
    }
  }

  onProgress("Finalizing video...");

  if (!operation.response?.generatedVideos?.[0]?.video?.uri) {
    throw new Error("Video generation failed or returned no URI.");
  }
  
  const downloadLink = operation.response.generatedVideos[0].video.uri;
  
  onProgress("Downloading generated video...");

  const response = await fetch(`${downloadLink}&key=${apiKey}`);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }
  const videoBlob = await response.blob();
  return URL.createObjectURL(videoBlob);
};