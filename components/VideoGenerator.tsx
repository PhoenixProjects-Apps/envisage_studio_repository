import React, { useState, useEffect, useRef } from 'react';
import { generateMarketingVideo } from '../services/geminiService';
import { GeneratedAsset } from '../types';
import { Video, Key, Loader2, Play, Upload, Image as ImageIcon } from 'lucide-react';

interface VideoGeneratorProps {
  onAssetCreated: (asset: GeneratedAsset) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onAssetCreated }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  
  // Image Input for Video
  const [inputImage, setInputImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for API key on mount
  useEffect(() => {
    const checkKey = async () => {
      // Access via any to avoid type conflicts with global AIStudio definition
      const aistudio = (window as any).aistudio;
      if (aistudio && aistudio.hasSelectedApiKey) {
        const has = await aistudio.hasSelectedApiKey();
        setHasKey(has);
      } else {
        // Fallback for standard hosting environments using env vars
        // If window.aistudio is missing, we assume the developer has set process.env.API_KEY correctly.
        setHasKey(true);
      }
      setCheckingKey(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio?.openSelectKey) {
        try {
            await aistudio.openSelectKey();
            // Race condition mitigation as per instructions: assume success
            setHasKey(true);
        } catch (e) {
            console.error("Key selection failed", e);
        }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          setInputImage(ev.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    // Prompt is optional if image is present
    if (!prompt && !inputImage) return;
    setLoading(true);
    setVideoUrl(null);
    try {
      const url = await generateMarketingVideo(prompt, aspectRatio, inputImage || undefined);
      setVideoUrl(url);

      const newAsset: GeneratedAsset = {
        id: Date.now().toString(),
        type: 'video',
        content: url,
        createdAt: Date.now(),
        metadata: { prompt: prompt || "Image Animation", aspectRatio }
      };
      onAssetCreated(newAsset);

    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes("Requested entity was not found")) {
        // Only force re-selection if we are in an environment that supports it
        if ((window as any).aistudio) {
            setHasKey(false); 
            alert("Session expired or key invalid. Please select your API Key again.");
        } else {
            alert("API Error: Please check your API_KEY environment variable.");
        }
      } else {
        alert("Video generation failed. It can take a few minutes.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingKey) {
      return <div className="flex h-full items-center justify-center text-zinc-500">Initializing Veo...</div>
  }

  if (!hasKey) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center space-y-6">
        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 max-w-md w-full">
            <Video size={48} className="text-indigo-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Enable Veo Video Generation</h2>
            <p className="text-zinc-400 mb-6">
                To use the high-quality Veo model, you need to select a paid API key from a Google Cloud Project with billing enabled.
            </p>
            <button 
                onClick={handleSelectKey}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
            >
                <Key size={18} /> Select Paid API Key
            </button>
            <p className="mt-4 text-xs text-zinc-500">
                See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Billing Documentation</a> for more info.
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 h-full flex flex-col">
       <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
         <Video className="text-pink-500" /> Veo Studio
       </h2>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            <div className="space-y-6">
                 <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-xl">
                    
                    {/* Image Input Section */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Starting Image (Optional)</label>
                        <div 
                            className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${inputImage ? 'border-zinc-700 bg-zinc-950' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                             {inputImage ? (
                                 <div className="relative w-full h-32">
                                    <img src={inputImage} alt="Input" className="w-full h-full object-contain" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setInputImage(null); }}
                                        className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full hover:bg-red-600"
                                    >
                                        <Upload size={12} className="rotate-45" />
                                    </button>
                                 </div>
                             ) : (
                                 <div className="text-center py-4">
                                    <ImageIcon className="mx-auto text-zinc-500 mb-2" size={24} />
                                    <p className="text-xs text-zinc-400">Click to upload reference image</p>
                                 </div>
                             )}
                             <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                                accept="image/png, image/jpeg"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Video Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none h-24 resize-none"
                            placeholder={inputImage ? "Describe how to animate the image..." : "Describe the video..."}
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Format</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setAspectRatio('16:9')}
                                className={`flex-1 py-2 rounded border text-sm transition-colors ${
                                    aspectRatio === '16:9'
                                    ? 'bg-pink-600 border-pink-600 text-white'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                }`}
                            >
                                Landscape (16:9)
                            </button>
                            <button
                                onClick={() => setAspectRatio('9:16')}
                                className={`flex-1 py-2 rounded border text-sm transition-colors ${
                                    aspectRatio === '9:16'
                                    ? 'bg-pink-600 border-pink-600 text-white'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                }`}
                            >
                                Portrait (9:16)
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || (!prompt && !inputImage)}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                            loading 
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white'
                        }`}
                    >
                         {loading ? <span className="animate-pulse">Generating (this takes a while)...</span> : <><Video size={18} /> Generate Video</>}
                    </button>
                 </div>
                 {loading && (
                    <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-400 text-sm flex items-start gap-3">
                        <Loader2 className="animate-spin shrink-0 mt-0.5" size={16} />
                        <p>Video generation can take 1-2 minutes. Feel free to use other tools while you wait, but keep this tab open.</p>
                    </div>
                 )}
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden min-h-[300px]">
                {videoUrl ? (
                    <video 
                        src={videoUrl} 
                        controls 
                        autoPlay 
                        loop
                        className="w-full h-full object-contain max-h-[500px]"
                    />
                ) : (
                    <div className="text-center text-zinc-600 p-8">
                         <div className="w-16 h-16 rounded-full bg-zinc-800 mx-auto mb-4 flex items-center justify-center">
                            <Play className="ml-1 opacity-20" size={32} />
                         </div>
                         <p>Generated video preview</p>
                    </div>
                )}
            </div>
       </div>
    </div>
  );
};

export default VideoGenerator;