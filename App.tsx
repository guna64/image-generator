import React, { useState, useCallback, memo } from 'react';
import { generateImage } from './services/geminiService';
import type { LoadingState } from './types';
import Spinner from './components/Spinner';
import { UploadIcon, ImageIcon, DownloadIcon, LockIcon } from './components/icons';

interface ControlPanelProps {
  apiKey: string;
  setApiKey: (value: string) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  imageFile: File | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  imagePreview: string | null;
  loadingState: LoadingState;
}

const ControlPanel: React.FC<ControlPanelProps> = memo(({
  apiKey,
  setApiKey,
  prompt,
  setPrompt,
  imageFile,
  handleImageChange,
  handleSubmit,
  imagePreview,
  loadingState,
}) => (
  <form onSubmit={handleSubmit} className="w-full lg:w-1/3 xl:w-1/4 bg-white p-6 rounded-2xl border border-gray-200 shadow-lg space-y-6 flex flex-col">
    <h2 className="text-2xl font-bold text-gray-900">Controls</h2>

    <div className="space-y-2">
      <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">API Key</label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <LockIcon className="h-5 w-5 text-gray-400" />
        </span>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Gemini API Key"
          className="w-full pl-10 p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
          required
          aria-label="Gemini API Key"
        />
      </div>
    </div>

    <div className="space-y-2">
      <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">Prompt</label>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="A banana wearing sunglasses, photorealistic..."
        className="w-full h-32 p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
        required
        aria-label="Prompt for image generation"
      />
    </div>

    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Base Image (Optional)</label>
      <label htmlFor="image-upload" className="cursor-pointer flex items-center justify-center w-full p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition-colors">
        <div className="text-center">
          <UploadIcon className="mx-auto h-8 w-8 text-gray-400" />
          <span className="mt-2 block text-sm text-gray-500">{imageFile ? imageFile.name : 'Click to upload'}</span>
        </div>
      </label>
      <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
      {imagePreview && (
        <div className="mt-4">
          <img src={imagePreview} alt="Preview" className="w-full rounded-lg object-cover" />
        </div>
      )}
    </div>
    
    <div className="mt-auto pt-4">
      <button type="submit" disabled={loadingState.isLoading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all transform hover:scale-105">
        {loadingState.isLoading ? <Spinner /> : <ImageIcon className="h-5 w-5" />}
        <span>{loadingState.isLoading ? 'Generating...' : 'Generate Image'}</span>
      </button>
    </div>
  </form>
));

interface OutputDisplayProps {
  loadingState: LoadingState;
  error: string | null;
  imageUrl: string | null;
}

const OutputDisplay: React.FC<OutputDisplayProps> = memo(({ loadingState, error, imageUrl }) => (
  <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-2xl border border-gray-200 min-h-[400px] lg:min-h-0" role="status" aria-live="polite">
    {loadingState.isLoading && (
      <div className="text-center p-8">
        <Spinner />
        <p className="mt-4 text-lg font-semibold text-gray-800">{loadingState.message}</p>
        <p className="text-sm text-gray-500">Mohon tunggu, gambar sedang dibuat...</p>
      </div>
    )}
    {error && !loadingState.isLoading && (
      <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg max-w-md">
        <h3 className="text-lg font-bold text-red-800">Generation Failed</h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </div>
    )}
    {imageUrl && !loadingState.isLoading && (
      <div className="w-full h-full p-4 flex flex-col items-center justify-center gap-4">
        <img src={imageUrl} alt="Generated image" className="max-w-full max-h-[calc(100vh-250px)] rounded-lg shadow-2xl shadow-indigo-500/10"/>
        <a href={imageUrl} download="generated-image.png" className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">
          <DownloadIcon className="h-5 w-5" />
          Download Image
        </a>
      </div>
    )}
    {!loadingState.isLoading && !error && !imageUrl && (
      <div className="text-center p-8">
        <ImageIcon className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-xl font-semibold text-gray-600">Your image will appear here</h3>
        <p className="mt-1 text-gray-500">Use the controls to generate or edit an image.</p>
      </div>
    )}
  </div>
));

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false, message: '' });
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  }, []);

  const onProgress = useCallback((message: string) => {
    setLoadingState({ isLoading: true, message });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError('Please enter your API key.');
      return;
    }
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }

    setLoadingState({ isLoading: true, message: 'Memulai pembuatan gambar...' });
    setError(null);
    setImageUrl(null);

    try {
      const resultUrl = await generateImage({
        apiKey,
        prompt,
        imageFile,
        onProgress
      });
      setImageUrl(resultUrl);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoadingState({ isLoading: false, message: '' });
    }
  }, [apiKey, prompt, imageFile, onProgress]);
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
          Banana AI Image Generator
        </h1>
        <p className="mt-2 text-gray-600">Create and edit images with the 'nano-banana' model</p>
      </header>
      <main className="flex-1 flex flex-col lg:flex-row gap-8 w-full max-w-screen-2xl mx-auto">
          <ControlPanel
            apiKey={apiKey}
            setApiKey={setApiKey}
            prompt={prompt}
            setPrompt={setPrompt}
            imageFile={imageFile}
            handleImageChange={handleImageChange}
            handleSubmit={handleSubmit}
            imagePreview={imagePreview}
            loadingState={loadingState}
          />
          <OutputDisplay
            loadingState={loadingState}
            error={error}
            imageUrl={imageUrl}
          />
      </main>
    </div>
  );
};

export default App;
