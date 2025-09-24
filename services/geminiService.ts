import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateVideoParams, GenerateImageFromTextOptions, EditImageOptions } from '../types';

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

export const generateImageFromText = async ({
  apiKey,
  prompt,
  aspectRatio,
  negativePrompt,
  onProgress,
}: GenerateImageFromTextOptions & { onProgress: (message: string) => void }): Promise<string> => {
  if (!apiKey) {
    throw new Error("API key is missing. Please provide your API key.");
  }
  const ai = new GoogleGenAI({ apiKey });

  onProgress("Mengirim permintaan ke model Imagen...");

  const fullPrompt = negativePrompt ? `${prompt}, negative prompt: ${negativePrompt}` : prompt;

  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: fullPrompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: aspectRatio as any,
    },
  });

  onProgress("Menyelesaikan gambar...");
  
  const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
  return `data:image/png;base64,${base64ImageBytes}`;
};


export const editImage = async ({
  apiKey,
  prompt,
  imageFile,
  negativePrompt,
  onProgress,
}: EditImageOptions & { onProgress: (message: string) => void }): Promise<string> => {
  if (!apiKey) {
    throw new Error("API key is missing. Please provide your API key.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  onProgress("Mempersiapkan aset...");
  
  const parts: any[] = [];
  
  const base64ImageData = await fileToBase64(imageFile);
  parts.push({
    inlineData: {
      data: base64ImageData,
      mimeType: imageFile.type,
    },
  });
  
  const fullPrompt = negativePrompt ? `${prompt}, negative prompt: ${negativePrompt}` : prompt;
  parts.push({ text: fullPrompt });

  onProgress("Mengirim permintaan ke model Banana...");

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: parts,
    },
    config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });
  
  onProgress("Menyelesaikan gambar...");

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes = part.inlineData.data;
      const mimeType = part.inlineData.mimeType;
      return `data:${mimeType};base64,${base64ImageBytes}`;
    }
  }
  
  const textResponse = response.text;
  if (textResponse) {
    throw new Error(`Image generation failed: ${textResponse}`);
  }

  throw new Error("Image generation failed. No image data found in response.");
};

export const generateVideo = async ({
  apiKey,
  prompt,
  imageFile,
  negativePrompt,
  onProgress,
}: GenerateVideoParams): Promise<string> => {
  if (!apiKey) {
    throw new Error("API key is missing. Please provide your API key.");
  }

  const ai = new GoogleGenAI({ apiKey });

  onProgress("Mempersiapkan permintaan video...");

  const fullPrompt = negativePrompt ? `${prompt}, negative prompt: ${negativePrompt}` : prompt;

  const generateVideosParams: any = {
    model: 'veo-2.0-generate-001',
    prompt: fullPrompt,
    config: {
      numberOfVideos: 1,
    }
  };

  if (imageFile) {
    onProgress("Mengonversi gambar untuk video...");
    const base64ImageData = await fileToBase64(imageFile);
    generateVideosParams.image = {
      imageBytes: base64ImageData,
      mimeType: imageFile.type,
    };
  }

  onProgress("Mengirim permintaan pembuatan video... Ini mungkin memakan waktu beberapa menit.");
  let operation = await ai.models.generateVideos(generateVideosParams);

  const loadingMessages = [
    "AI sedang memimpikan videomu...",
    "Merender piksel demi piksel...",
    "Hampir selesai, menyatukan adegan...",
    "Menyusun frame terakhir...",
    "Proses ini memakan waktu lebih lama dari biasanya. Mohon tetap bersabar.",
  ];
  let messageIndex = 0;

  while (!operation.done) {
    onProgress(loadingMessages[messageIndex % loadingMessages.length]);
    messageIndex++;
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  if (!operation.response?.generatedVideos?.[0]?.video?.uri) {
      const errorText = operation.error ? `${operation.error.code}: ${operation.error.message}` : "No video data found in response.";
      throw new Error(`Video generation failed. ${errorText}`);
  }

  onProgress("Mengunduh video yang telah selesai...");
  const downloadLink = operation.response.generatedVideos[0].video.uri;
  const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);

  if (!videoResponse.ok) {
    throw new Error(`Failed to download video: ${videoResponse.statusText}`);
  }

  const videoBlob = await videoResponse.blob();
  const videoUrl = URL.createObjectURL(videoBlob);
  
  onProgress("Video siap!");
  return videoUrl;
};