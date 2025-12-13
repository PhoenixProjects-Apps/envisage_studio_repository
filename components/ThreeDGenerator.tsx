import React, { useState } from 'react';
import { generateThreeDAnimation } from '../services/geminiService';
import { GeneratedAsset } from '../types';
import { Box, Cuboid, Loader2, Play } from 'lucide-react';

interface ThreeDGeneratorProps {
  onAssetCreated: (asset: GeneratedAsset) => void;
}

const ThreeDGenerator: React.FC<ThreeDGeneratorProps> = ({ onAssetCreated }) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Product Showcase');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setVideoUrl(null);
    try {
      const url = await generateThreeDAnimation(prompt, style);
      setVideoUrl(url);

      const newAsset: GeneratedAsset = {
        id: Date.now().toString(),
        type: 'video',
        content: url,
        createdAt: Date.now(),
        metadata: { prompt: `3D Animation: ${prompt}` }
      };
      onAssetCreated(newAsset);
    } catch (e) {
      console.error(e);
      alert('3D Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = [
      'Product Showcase',
      'Abstract Motion',
      'Character Animation',
      'Architectural Flythrough',
      'Cyberpunk City',
      'Low Poly'
  ];

  return (
    <div className="max-w-4xl mx-auto p-8 h-full flex flex-col">
       <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg">
                 <Box className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">3D Animation Studio</h2>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            <div className="space-y-6">
                 <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-xl">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">3D Concept</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none h-32 resize-none"
                            placeholder="Describe the 3D scene, e.g., A floating gold watch spinning in a void..."
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Render Style</label>
                        <div className="grid grid-cols-2 gap-2">
                            {styles.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStyle(s)}
                                    className={`py-2 px-3 text-xs rounded border transition-colors text-left ${
                                        style === s
                                        ? 'bg-orange-600 border-orange-600 text-white'
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                    }`}
                                >
                                    {s}
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
                            : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white'
                        }`}
                    >
                         {loading ? <span className="animate-pulse">Rendering 3D Scene...</span> : <><Cuboid size={18} /> Generate 3D Asset</>}
                    </button>
                 </div>
                 
                 {loading && (
                    <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-400 text-sm flex items-start gap-3">
                        <Loader2 className="animate-spin shrink-0 mt-0.5" size={16} />
                        <p>Our render farm is processing your request. This typically takes 60-90 seconds using Veo 3.</p>
                    </div>
                 )}
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden min-h-[300px] relative">
                {videoUrl ? (
                    <video 
                        src={videoUrl} 
                        controls 
                        autoPlay 
                        loop
                        playsInline
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="text-center text-zinc-600 p-8">
                         <Box className="mx-auto mb-4 opacity-20" size={48} />
                         <p>3D Preview will appear here</p>
                    </div>
                )}
                {/* Grid Overlay for 3D feel */}
                {!videoUrl && (
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                            backgroundSize: '40px 40px',
                            transform: 'perspective(500px) rotateX(60deg) translateY(100px) scale(2)'
                        }}
                    />
                )}
            </div>
       </div>
    </div>
  );
};

export default ThreeDGenerator;