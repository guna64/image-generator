import React, { useState, useCallback, useEffect } from 'react';
import { generateVideo } from './services/geminiService';
import type { AspectRatio, Resolution, LoadingState } from './types';
import Spinner from './components/Spinner';
import { UploadIcon, VideoIcon, DownloadIcon } from './components/icons';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini-api-key') || '');
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [generateAudio, setGenerateAudio] = useState<boolean>(true);
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false, message: '' });
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('gemini-api-key', apiKey);
  }, [apiKey]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const onProgress = useCallback((message: string) => {
    setLoadingState({ isLoading: true, message });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError('Please enter your Google AI API key.');
      return;
    }
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }

    setLoadingState({ isLoading: true, message: 'Initiating video generation...' });
    setError(null);
    setVideoUrl(null);

    try {
      const resultUrl = await generateVideo({
        apiKey,
        prompt,
        imageFile,
        aspectRatio,
        generateAudio,
        resolution,
        onProgress
      });
      setVideoUrl(resultUrl);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoadingState({ isLoading: false, message: '' });
    }
  };
  
  const ControlPanel = () => (
     <div className="w-full lg:w-1/3 xl:w-1/4 bg-white p-6 rounded-2xl border border-gray-200 shadow-lg space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Generation Controls</h2>

        <div className="space-y-2">
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">Google AI API Key</label>
            <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
                required
            />
        </div>
        
        <div className="space-y-2">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">Prompt</label>
            <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A neon hologram of a cat driving a sports car..."
                className="w-full h-32 p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
                required
            />
        </div>

        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Reference Image (Optional)</label>
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
        
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Aspect Ratio</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Resolution</label>
                 <select value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)} className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                </select>
                <p className="text-xs text-gray-500">Note: Model may override resolution.</p>
            </div>
        </div>

        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Sound</span>
            <button type='button' onClick={() => setGenerateAudio(!generateAudio)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${generateAudio ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${generateAudio ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
        </div>
        
        <button type="submit" disabled={loadingState.isLoading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all transform hover:scale-105">
            {loadingState.isLoading ? <Spinner /> : <VideoIcon className="h-5 w-5" />}
            <span>{loadingState.isLoading ? 'Generating...' : 'Generate Video'}</span>
        </button>
    </div>
  );

  const OutputDisplay = () => (
    <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-2xl border border-gray-200 min-h-[400px] lg:min-h-0">
        {loadingState.isLoading && (
            <div className="text-center p-8">
                <Spinner />
                <p className="mt-4 text-lg font-semibold text-gray-800">{loadingState.message}</p>
                <p className="text-sm text-gray-500">Video generation can take several minutes. Please be patient.</p>
            </div>
        )}
        {error && !loadingState.isLoading && (
            <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg max-w-md">
                <h3 className="text-lg font-bold text-red-800">Generation Failed</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
            </div>
        )}
        {videoUrl && !loadingState.isLoading && (
            <div className="w-full h-full p-4 flex flex-col items-center justify-center gap-4">
                <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-[calc(100vh-250px)] rounded-lg shadow-2xl shadow-indigo-500/10"></video>
                <a href={videoUrl} download="generated-video.mp4" className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">
                    <DownloadIcon className="h-5 w-5" />
                    Download Video
                </a>
            </div>
        )}
        {!loadingState.isLoading && !error && !videoUrl && (
            <div className="text-center p-8">
                <VideoIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold text-gray-600">Your video will appear here</h3>
                <p className="mt-1 text-gray-500">Fill out the controls and click generate.</p>
            </div>
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">
          VEO AI Video Generator
        </h1>
        <p className="mt-2 text-gray-600">Bring your ideas to life with generative video</p>
      </header>
      <main className="flex-1">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 w-full max-w-screen-2xl mx-auto">
            <ControlPanel />
            <OutputDisplay />
        </form>
      </main>
    </div>
  );
};

export default App;