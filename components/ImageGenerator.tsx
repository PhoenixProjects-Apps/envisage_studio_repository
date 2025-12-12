import React, { useState, useRef } from 'react';
import { generateMarketingImage } from '../services/geminiService';
import { GeneratedAsset, AspectRatio } from '../types';
import { Image as ImageIcon, Sparkles, Download, Upload } from 'lucide-react';

interface ImageGeneratorProps {
  onAssetCreated: (asset: GeneratedAsset) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onAssetCreated }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<string>(AspectRatio.SQUARE);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setGeneratedImage(null);
    try {
      const imageUrl = await generateMarketingImage(prompt, aspectRatio);
      setGeneratedImage(imageUrl);
      
      const newAsset: GeneratedAsset = {
        id: Date.now().toString(),
        type: 'image',
        content: imageUrl,
        createdAt: Date.now(),
        metadata: { prompt, aspectRatio }
      };
      onAssetCreated(newAsset);
    } catch (e) {
      console.error(e);
      alert('Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (typeof ev.target?.result === 'string') {
            const newAsset: GeneratedAsset = {
              id: `imported-gen-${Date.now()}`,
              type: 'image',
              content: ev.target.result,
              createdAt: Date.now(),
              metadata: { prompt: 'Imported via Image Gen' }
            };
            onAssetCreated(newAsset);
            alert("Image imported to Asset Library!");
          }
        };
        reader.readAsDataURL(file);
      }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Marketing Image Studio</h2>
        <div>
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-zinc-700"
            >
                <Upload size={16} /> Import to Library
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImport} 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp"
            />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-xl">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none h-32 resize-none"
                        placeholder="Describe your image... e.g. A futuristic workspace with neon lights"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-2">
                        {Object.entries(AspectRatio).map(([key, value]) => (
                            <button
                                key={key}
                                onClick={() => setAspectRatio(value)}
                                className={`p-2 text-xs rounded border transition-colors ${
                                    aspectRatio === value
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                }`}
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                        loading 
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                    }`}
                >
                    {loading ? <span className="animate-pulse">Rendering...</span> : <><Sparkles size={18} /> Generate</>}
                </button>
            </div>
            
            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 text-zinc-400 text-xs">
                <p><strong>Pro Tip:</strong> Be specific about lighting, style, and mood for best results.</p>
            </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center relative overflow-hidden min-h-[400px]">
            {generatedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                    <img 
                        src={generatedImage} 
                        alt="Generated" 
                        className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
                    />
                    <a 
                        href={generatedImage} 
                        download={`omni-generated-${Date.now()}.png`}
                        className="absolute bottom-6 right-6 bg-black/70 hover:bg-black text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                        <Download size={20} />
                    </a>
                </div>
            ) : (
                <div className="text-center text-zinc-600">
                    {loading ? (
                         <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                            <p className="animate-pulse">Gemini 3 Pro is dreaming...</p>
                         </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                             <ImageIcon size={48} className="opacity-20"/>
                             <p>Your masterpiece will appear here</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;