import React, { useState, useCallback, memo, useEffect } from 'react';
import { generateImageFromText, editImage, generateVideo } from './services/geminiService';
import type { LoadingState, AiTool } from './types';
import Spinner from './components/Spinner';
import {
  UploadIcon,
  ImageIcon,
  DownloadIcon,
  KeyIcon,
  VideoIcon,
  AutoAssetsIcon,
  StoryboardIcon,
  EnhanceIcon,
  SunIcon,
  MoonIcon,
} from './components/icons';

type Theme = 'light' | 'dark';

const tools = [
  { id: 'video', name: 'Video', description: 'Text/Image to Video', icon: VideoIcon },
  { id: 'image', name: 'Image', description: 'AI Image Generator', icon: ImageIcon },
  { id: 'assets', name: 'Auto Assets', description: 'Bulk Image Generator', icon: AutoAssetsIcon },
  { id: 'storyboard', name: 'Storyboard', description: 'Detailed Video Storyboard', icon: StoryboardIcon },
];

const base64toFile = (base64: string, filename: string): File => {
  const [header, data] = base64.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const byteCharacters = atob(data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mime });
  return new File([blob], filename, { type: mime });
};

const ToolButton = memo(({ icon: Icon, name, description, isActive, onClick }: { icon: React.FC<{className?: string}>, name: string, description: string, isActive: boolean, onClick: () => void}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center w-full text-left p-3 rounded-lg transition-colors ${
      isActive ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    <Icon className="h-6 w-6 mr-3 flex-shrink-0" />
    <div>
      <p className="font-semibold">{name}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  </button>
));

const Sidebar = memo(({ activeTool, setActiveTool, apiKey, setApiKey, theme, setTheme }: { activeTool: AiTool, setActiveTool: (tool: AiTool) => void, apiKey: string, setApiKey: (key: string) => void, theme: Theme, setTheme: React.Dispatch<React.SetStateAction<Theme>> }) => (
  <aside className="w-[280px] bg-gray-100 dark:bg-black p-4 flex flex-col border-r border-gray-200 dark:border-gray-800">
    <h1 className="text-xl font-bold px-3 pt-2 pb-4 text-gray-900 dark:text-white">AI Tools</h1>
    <nav className="flex flex-col space-y-1">
      {tools.map(tool => (
        <ToolButton
          key={tool.id}
          icon={tool.icon}
          name={tool.name}
          description={tool.description}
          isActive={activeTool === tool.id}
          onClick={() => setActiveTool(tool.id as AiTool)}
        />
      ))}
    </nav>
    <div className="mt-auto space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="api-key" className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 px-3">
          <KeyIcon className="h-4 w-4" />
          <span>API Key</span>
        </label>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>
      </div>
      <div className="relative">
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="Enter API Key"
          className="w-full p-2 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-500"
          required
          aria-label="API Key"
        />
      </div>
    </div>
  </aside>
));

const SettingsPanel = memo(({ activeTool, settings, setSettings }: { activeTool: AiTool, settings: any, setSettings: (s: any) => void }) => (
  <div className="space-y-6">
    {activeTool === 'video' && (
      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.generateImageFirst}
          onChange={e => setSettings({ ...settings, generateImageFirst: e.target.checked })}
          className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Generate image first, then create video</span>
      </label>
    )}
    <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Model</label>
        <select id="model" value={settings.model} disabled className="w-full p-2 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg cursor-not-allowed">
            <option value="veo-2.0-generate-001">Veo 2.0 Fast Generate</option>
        </select>
    </div>
    <div>
        <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Aspect Ratio</label>
        <select 
            id="aspectRatio" 
            value={settings.aspectRatio} 
            onChange={e => setSettings({...settings, aspectRatio: e.target.value})}
            className="w-full p-2 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="4:3">4:3 (Classic TV)</option>
            <option value="3:4">3:4 (Classic Portrait)</option>
        </select>
    </div>
     <div>
        <label htmlFor="personGen" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Person Generation</label>
        <select id="personGen" disabled className="w-full p-2 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg cursor-not-allowed">
            <option>Allow All Ages</option>
        </select>
    </div>
    <div>
        <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Negative Prompt (Optional)</label>
        <textarea
            id="negative-prompt"
            value={settings.negativePrompt}
            onChange={e => setSettings({...settings, negativePrompt: e.target.value})}
            placeholder="What you don't want in the content"
            className="w-full h-24 p-3 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-500"
        />
    </div>
  </div>
));

const GeneratorControls = memo(({
    activeTool,
    prompt, setPrompt,
    handleImageChange, imagePreview,
    handleSubmit, loadingState,
    settings, setSettings,
  }: {
    activeTool: AiTool;
    prompt: string; setPrompt: (p: string) => void;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    imagePreview: string | null;
    handleSubmit: (e: React.FormEvent) => void;
    loadingState: LoadingState;
    settings: any; setSettings: (s: any) => void;
}) => {
  const activeToolData = tools.find(t => t.id === activeTool);
  const isImplemented = activeTool === 'video' || activeTool === 'image';
  const promptPlaceholder = activeTool === 'video' ? 'Describe the video you want to create...' : 'Describe the image you want to create...';

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <header className="flex items-center gap-4 mb-8">
        {activeToolData && <activeToolData.icon className="h-10 w-10 text-gray-400 dark:text-gray-500" />}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{activeToolData?.name} Generator</h2>
          <p className="text-gray-500 dark:text-gray-400">{activeToolData?.description}</p>
        </div>
      </header>

      {isImplemented ? (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{activeToolData?.name} Prompt</label>
                        <textarea
                        id="prompt"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder={promptPlaceholder}
                        className="w-full h-36 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors placeholder:text-gray-500"
                        required
                        />
                    </div>
                     <button type="button" className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                        <EnhanceIcon className="h-4 w-4" /> Enhance with AI
                    </button>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Input Image (Optional)</label>
                        <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-48 bg-white dark:bg-black border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-indigo-500 transition-colors">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-1 rounded-lg" />
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <UploadIcon className="mx-auto h-8 w-8" />
                                <span className="mt-2 block text-sm">Drag & drop or click to upload</span>
                            </div>
                        )}
                        </label>
                        <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <SettingsPanel activeTool={activeTool} settings={settings} setSettings={setSettings} />
                </div>
            </div>
          <div className="pt-4">
            <button type="submit" disabled={loadingState.isLoading} className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all">
              {loadingState.isLoading ? <Spinner /> : (activeToolData && <activeToolData.icon className="h-5 w-5" />)}
              <span>{loadingState.isLoading ? 'Generating...' : `Generate ${activeToolData?.name}`}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-center h-full text-center text-gray-500">
          <p className="text-lg">{activeToolData?.name} tool is coming soon!</p>
        </div>
      )}
    </div>
  );
});

const OutputDisplay = memo(({ loadingState, error, outputUrl, outputType }: { loadingState: LoadingState, error: string | null, outputUrl: string | null, outputType: 'image' | 'video' | null }) => (
    <aside className="w-[480px] bg-gray-100 dark:bg-black flex items-center justify-center p-6 border-l border-gray-200 dark:border-gray-800" role="status" aria-live="polite">
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200/50 dark:bg-gray-900/50 rounded-lg">
        {loadingState.isLoading && (
          <div className="text-center p-8">
            <Spinner />
            <p className="mt-4 text-lg font-semibold">{loadingState.message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Harap tunggu sementara AI melakukan keajaibannya...</p>
          </div>
        )}
        {error && !loadingState.isLoading && (
          <div className="text-center p-8 bg-red-900/30 border border-red-500/50 rounded-lg max-w-md">
            <h3 className="text-lg font-bold text-red-400">Pembuatan Gagal</h3>
            <p className="mt-2 text-sm text-red-300">{error}</p>
          </div>
        )}
        {outputUrl && !loadingState.isLoading && (
          <div className="w-full h-full p-4 flex flex-col items-center justify-center gap-4">
            {outputType === 'image' ? (
              <img src={outputUrl} alt="Generated content" className="max-w-full max-h-[calc(100vh-200px)] rounded-lg shadow-2xl shadow-indigo-900/20" />
            ) : (
              <video src={outputUrl} controls autoPlay loop className="max-w-full max-h-[calc(100vh-200px)] rounded-lg shadow-2xl shadow-indigo-900/20" />
            )}
            <a href={outputUrl} download={`generated-${outputType}.${outputType === 'image' ? 'png' : 'mp4'}`} className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">
              <DownloadIcon className="h-5 w-5" />
              Unduh {outputType === 'image' ? 'Gambar' : 'Video'}
            </a>
          </div>
        )}
        {!loadingState.isLoading && !error && !outputUrl && (
          <div className="text-center p-8">
            <VideoIcon className="mx-auto h-16 w-16 text-gray-500 dark:text-gray-600" />
            <h3 className="mt-4 text-xl font-semibold">Siap untuk Menghasilkan</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Pilih alat dan mulailah membuat konten luar biasa dengan AI.</p>
          </div>
        )}
      </div>
    </aside>
));

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<AiTool>('video');
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false, message: '' });
  const [error, setError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputType, setOutputType] = useState<'image' | 'video' | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [settings, setSettings] = useState({
    generateImageFirst: false,
    model: 'veo-2.0-generate-001',
    aspectRatio: '16:9',
    negativePrompt: '',
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

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

  const handleSetActiveTool = useCallback((tool: AiTool) => {
    setActiveTool(tool);
    setError(null);
    setOutputUrl(null);
    setOutputType(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError('Silakan masukkan kunci API Anda.');
      return;
    }
    if (!prompt) {
      setError('Silakan masukkan prompt.');
      return;
    }

    if (activeTool !== 'image' && activeTool !== 'video') {
      setError(`Alat '${activeTool}' belum diimplementasikan.`);
      return;
    }

    setLoadingState({ isLoading: true, message: 'Memulai pembuatan...' });
    setError(null);
    setOutputUrl(null);
    setOutputType(null);

    try {
      let resultUrl: string;
      const { aspectRatio, negativePrompt } = settings;
      
      if (activeTool === 'image') {
        if (imageFile) {
          resultUrl = await editImage({ apiKey, prompt, imageFile, onProgress, aspectRatio, negativePrompt });
        } else {
          resultUrl = await generateImageFromText({ apiKey, prompt, onProgress, aspectRatio, negativePrompt });
        }
        setOutputType('image');
      } else { // video
        let finalImageFile = imageFile;
        if (settings.generateImageFirst) {
          onProgress("Membuat gambar awal untuk video...");
          const imageBase64 = await generateImageFromText({ apiKey, prompt, onProgress, aspectRatio, negativePrompt });
          finalImageFile = base64toFile(imageBase64, 'generated-for-video.png');
        }
        resultUrl = await generateVideo({ apiKey, prompt, imageFile: finalImageFile, onProgress, generateImageFirst: settings.generateImageFirst, aspectRatio, negativePrompt });
        setOutputType('video');
      }
      setOutputUrl(resultUrl);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.');
    } finally {
      setLoadingState({ isLoading: false, message: '' });
    }
  }, [apiKey, prompt, imageFile, onProgress, activeTool, settings]);
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-200 flex w-full h-screen overflow-hidden">
      <Sidebar 
        activeTool={activeTool}
        setActiveTool={handleSetActiveTool}
        apiKey={apiKey}
        setApiKey={setApiKey}
        theme={theme}
        setTheme={setTheme}
      />
      <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        <GeneratorControls 
          activeTool={activeTool}
          prompt={prompt}
          setPrompt={setPrompt}
          handleImageChange={handleImageChange}
          imagePreview={imagePreview}
          handleSubmit={handleSubmit}
          loadingState={loadingState}
          settings={settings}
          setSettings={setSettings}
        />
      </main>
      <OutputDisplay 
        loadingState={loadingState}
        error={error}
        outputUrl={outputUrl}
        outputType={outputType}
      />
    </div>
  );
};

export default App;