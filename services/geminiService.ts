import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateImageParams } from '../types';

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


export const generateImage = async ({
  apiKey,
  prompt,
  imageFile,
  onProgress,
}: GenerateImageParams): Promise<string> => {
  if (!apiKey) {
    throw new Error("API key is missing. Please enter your API key.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  onProgress("Mempersiapkan aset...");
  
  const parts: any[] = [];
  
  if (imageFile) {
    const base64ImageData = await fileToBase64(imageFile);
    parts.push({
      inlineData: {
        data: base64ImageData,
        mimeType: imageFile.type,
      },
    });
  }
  
  parts.push({ text: prompt });

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